import React, { useState, useRef } from 'react';
import {
  Upload,
  Pause,
  Play,
  X,
  FileText,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

// 类型定义
interface FileItem {
  id: number;
  name: string;
  size: number;
  md5: string;
  progress: number;
  status: 'preparing' | 'uploading' | 'paused' | 'completed' | 'error';
  uploadedChunks: number;
  totalChunks: number;
  error: string | null;
}

interface UploadTask {
  file: File;
  fileId: number;
  md5: string;
  paused: boolean;
  currentChunk: number;
  uploadId: string;
  urlList: string[];
}

interface InitUploadResponse {
  code: number;
  message: string;
  data: {
    uploadId: string;
    urlList: string[];
  };
}

// 生成文件MD5（简化版，基于文件元信息）
const generateFileMD5 = (file: File): string => {
  const str = `${file.name}-${file.size}-${file.lastModified}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
};

const ChunkedUpload: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTasksRef = useRef<Record<number, UploadTask>>({});

  const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB per chunk

  // 检查文件是否已存在
  const checkFileExists = async (md5: string): Promise<boolean> => {
    try {
      const response = await fetch(`/minio/check/${md5}`);
      return response.ok;
    } catch (error) {
      console.error('Check file error:', error);
      return false;
    }
  };

  // 初始化上传任务
  const initUpload = async (
    file: File,
    md5: string,
  ): Promise<InitUploadResponse> => {
    const response = await fetch('/minio/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalName: file.name,
        md5: md5,
        chunkSize: CHUNK_SIZE,
        chunkNum: Math.ceil(file.size / CHUNK_SIZE),
        contentType: file.type || 'application/octet-stream',
      }),
    });

    if (!response.ok) {
      throw new Error('初始化上传失败');
    }

    const result: InitUploadResponse = await response.json();
    if (result.code !== 705) {
      throw new Error(result.message || '初始化上传失败');
    }

    return result;
  };

  // 上传单个分片（使用预签名URL）
  const uploadChunk = async (url: string, chunk: Blob): Promise<void> => {
    const response = await fetch(url, {
      method: 'PUT',
      body: chunk,
    });

    if (!response.ok) {
      throw new Error(`分片上传失败`);
    }
  };

  // 合并分片
  const mergeChunks = async (md5: string): Promise<void> => {
    const response = await fetch(`/minio/merge/${md5}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('合并文件失败');
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file: File): Promise<void> => {
    const fileId = Date.now() + Math.random();
    const md5 = generateFileMD5(file);

    // 添加到文件列表
    const newFile: FileItem = {
      id: fileId,
      name: file.name,
      size: file.size,
      md5: md5,
      progress: 0,
      status: 'preparing',
      uploadedChunks: 0,
      totalChunks: Math.ceil(file.size / CHUNK_SIZE),
      error: null,
    };

    setFiles((prev) => [...prev, newFile]);
    console.log(`[上传] 准备: ${file.name}`, {
      md5,
      分片数: newFile.totalChunks,
      大小: file.size,
    });

    try {
      const exists = await checkFileExists(md5);
      if (exists) {
        console.log(`[上传] 秒传命中: ${file.name}`);
        updateFileStatus(fileId, { status: 'completed', progress: 100 });
        return;
      }

      const initResult = await initUpload(file, md5);
      updateFileStatus(fileId, { status: 'uploading' });
      console.log(`[上传] 开始: ${file.name}`);

      const task: UploadTask = {
        file,
        fileId,
        md5,
        paused: false,
        currentChunk: 0,
        uploadId: initResult.data.uploadId,
        urlList: initResult.data.urlList,
      };
      uploadTasksRef.current[fileId] = task;

      await uploadFileChunks(task);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败';
      console.error(`[上传] 出错: ${file.name}`, errorMessage);
      updateFileStatus(fileId, {
        status: 'error',
        error: errorMessage,
      });
    }
  };

  // 上传文件分片
  const uploadFileChunks = async (task: UploadTask): Promise<void> => {
    const { file, fileId, urlList } = task;
    const totalChunks = urlList.length;

    for (let i = task.currentChunk; i < totalChunks; i++) {
      // 检查是否暂停
      if (uploadTasksRef.current[fileId]?.paused) {
        updateFileStatus(fileId, { status: 'paused' });
        return;
      }

      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      try {
        // 使用预签名URL上传分片
        await uploadChunk(urlList[i], chunk);

        task.currentChunk = i + 1;
        const progress = Math.round(((i + 1) / totalChunks) * 100);

        updateFileStatus(fileId, {
          uploadedChunks: i + 1,
          progress: progress,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : `分片 ${i + 1} 上传失败`;
        updateFileStatus(fileId, {
          status: 'error',
          error: errorMessage,
        });
        return;
      }
    }

    // 所有分片上传完成后，调用合并接口
    try {
      await mergeChunks(task.md5);
      updateFileStatus(fileId, {
        status: 'completed',
        progress: 100,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '合并文件失败';
      updateFileStatus(fileId, {
        status: 'error',
        error: errorMessage,
      });
    }
  };

  // 更新文件状态
  const updateFileStatus = (
    fileId: number,
    updates: Partial<FileItem>,
  ): void => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, ...updates } : f)),
    );
  };

  // 暂停上传
  const pauseUpload = (fileId: number): void => {
    if (uploadTasksRef.current[fileId]) {
      uploadTasksRef.current[fileId].paused = true;
    }
  };

  // 恢复上传
  const resumeUpload = async (fileId: number): Promise<void> => {
    const task = uploadTasksRef.current[fileId];
    if (task) {
      task.paused = false;
      updateFileStatus(fileId, { status: 'uploading' });
      await uploadFileChunks(task);
    }
  };

  // 取消上传
  const cancelUpload = (fileId: number): void => {
    delete uploadTasksRef.current[fileId];
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  // 文件选择处理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      Array.from(selectedFiles).forEach((file) => {
        handleFileUpload(file);
      });
    }
    e.target.value = ''; // 重置input
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // 状态图标和颜色
  const getStatusDisplay = (file: FileItem) => {
    switch (file.status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-500', text: '完成' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-500', text: '错误' };
      case 'uploading':
        return { icon: Upload, color: 'text-blue-500', text: '上传中' };
      case 'paused':
        return { icon: Pause, color: 'text-yellow-500', text: '已暂停' };
      default:
        return { icon: FileText, color: 'text-gray-500', text: '准备中' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">文件分片上传</h2>

        {/* 上传按钮 */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <Upload size={20} />
            选择文件上传
          </button>
        </div>

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="space-y-4">
            {files.map((file) => {
              const statusDisplay = getStatusDisplay(file);
              const StatusIcon = statusDisplay.icon;

              return (
                <div
                  key={file.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  {/* 文件信息 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText
                        size={24}
                        className="text-gray-400 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-800 truncate">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>

                    {/* 状态和操作 */}
                    <div className="flex items-center gap-2 ml-4">
                      <StatusIcon size={20} className={statusDisplay.color} />
                      <span
                        className={`text-sm font-medium ${statusDisplay.color}`}
                      >
                        {statusDisplay.text}
                      </span>

                      {/* 控制按钮 */}
                      {file.status === 'uploading' && (
                        <button
                          onClick={() => pauseUpload(file.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="暂停"
                        >
                          <Pause size={18} className="text-gray-600" />
                        </button>
                      )}

                      {file.status === 'paused' && (
                        <button
                          onClick={() => resumeUpload(file.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="继续"
                        >
                          <Play size={18} className="text-gray-600" />
                        </button>
                      )}

                      {file.status !== 'completed' && (
                        <button
                          onClick={() => cancelUpload(file.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="取消"
                        >
                          <X size={18} className="text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 进度条 */}
                  {file.status !== 'completed' && file.status !== 'error' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>
                          分片: {file.uploadedChunks}/{file.totalChunks}
                        </span>
                        <span>{file.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all duration-300 ease-out"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 错误信息 */}
                  {file.error && (
                    <div className="mt-2 text-sm text-red-500 bg-red-50 p-2 rounded">
                      {file.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 空状态 */}
        {files.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Upload size={48} className="mx-auto mb-3 opacity-50" />
            <p>点击上方按钮选择文件上传</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChunkedUpload;
