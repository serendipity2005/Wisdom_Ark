import React, { useState, useRef } from 'react';
import { Upload, X, Pause, Play, CheckCircle, AlertCircle } from 'lucide-react';
import SparkMD5 from 'spark-md5';
import { checkFile, initFile, mergeChunks as mergeFile } from '@/api/file';

interface UploadTask {
  file: File;
  md5: string;
  progress: number;
  status:
    | 'calculating'
    | 'waiting'
    | 'uploading'
    | 'paused'
    | 'success'
    | 'error';
  uploadedChunks: number[];
  totalChunks: number;
  uploadUrls?: string[]; // 后端返回的预签名URL列表
  error?: string;
}

const ChunkedUploadComponent: React.FC = () => {
  const [tasks, setTasks] = useState<Map<string, UploadTask>>(new Map());
  const tasksRef = useRef(tasks);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

  // 日志打印函数
  const log = (step: string, data?: unknown) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${step}`, data || '');
  };

  // 检查是否为中断错误
  const isAbortError = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: string }).name === 'AbortError';

  // 获取错误信息
  const getErrorMessage = (error: unknown, fallback = '上传失败'): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return fallback;
  };

  // 计算文件MD5
  const calculateMD5 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      log('🔄 开始计算文件MD5', { fileName: file.name, fileSize: file.size });
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();
      const chunks = Math.ceil(file.size / CHUNK_SIZE);
      let currentChunk = 0;

      fileReader.onload = (e) => {
        spark.append(e.target?.result as ArrayBuffer);
        currentChunk++;

        if (currentChunk < chunks) {
          loadNext();
        } else {
          const md5 = spark.end();
          log('✅ MD5计算完成', { md5, fileName: file.name });
          resolve(md5);
        }
      };

      fileReader.onerror = () => {
        log('❌ MD5计算失败', { fileName: file.name });
        reject(new Error('文件读取失败'));
      };

      const loadNext = () => {
        const start = currentChunk * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        fileReader.readAsArrayBuffer(file.slice(start, end));
      };

      loadNext();
    });
  };

  // 检查文件是否已存在
  const checkFileExists = async (md5: string): Promise<boolean> => {
    log('🔍 检查文件是否存在', { md5 });
    try {
      const resp = await checkFile(md5);
      const exists = resp?.code === 700;
      log(exists ? '✅ 文件已存在,秒传' : '📝 文件不存在,需要上传', {
        md5,
        code: resp?.code,
      });
      return exists;
    } catch (error) {
      log('📝 文件不存在或检查失败', { md5, error });
      return false;
    }
  };

  // 初始化上传
  const initUpload = async (file: File, md5: string) => {
    log('🚀 调用后端初始化接口', {
      fileName: file.name,
      md5,
      fileSize: file.size,
      chunkSize: CHUNK_SIZE,
      totalChunks: Math.ceil(file.size / CHUNK_SIZE),
    });

    const requestBody = {
      originalName: file.name,
      md5: md5,
      chunkSize: CHUNK_SIZE,
      chunkNum: Math.ceil(file.size / CHUNK_SIZE),
      contentType: file.type || 'application/octet-stream',
    };

    log('📤 请求参数', requestBody);

    const resp = await initFile(requestBody);
    if (!resp || !(resp.code === 200 || resp.code >= 700)) {
      log('❌ 初始化失败', { code: resp?.code, message: resp?.message });
      throw new Error(resp?.message || '初始化上传失败');
    }
    const result = resp.data;
    log('✅ 后端初始化成功,返回数据:', result);

    // 后端应该返回预签名的上传URL列表
    // 根据实际返回格式调整,可能是 result.data 或 result.uploadUrls
    return result;
  };

  const extractUploadUrls = (payload: unknown): string[] => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (typeof payload !== 'object') return [];
    const payloadRecord = payload as Record<string, unknown>;
    const candidateKeys = [
      'uploadUrls',
      'urlList',
      'urls',
      'preSignedUrls',
      'preSignedUrlList',
      'presignedUrls',
      'presignedUrlList',
      'uploadUrlList',
    ];
    for (const key of candidateKeys) {
      const value = payloadRecord[key];
      if (Array.isArray(value)) {
        return value;
      }
    }
    const nestedData = payloadRecord.data;
    if (Array.isArray(nestedData)) {
      return nestedData;
    }
    return [];
  };

  // 上传单个分片到MinIO
  const uploadChunk = async (
    file: File,
    chunkIndex: number,
    uploadUrl: string,
    signal: AbortSignal,
  ): Promise<boolean> => {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    log(`📦 上传分片 ${chunkIndex + 1} 到 MinIO`, {
      chunkIndex,
      size: chunk.size,
      start,
      end,
      uploadUrl: uploadUrl.substring(0, 100) + '...', // 只显示URL前100字符
    });

    try {
      // 直接PUT上传到MinIO的预签名URL
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: chunk,
        signal,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      if (response.ok) {
        log(`✅ 分片 ${chunkIndex + 1} 上传到MinIO成功`);
        return true;
      }

      const errorText = await response.text();
      log(`❌ 分片 ${chunkIndex + 1} 上传失败`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`分片 ${chunkIndex + 1} 上传失败`);
    } catch (error: unknown) {
      if (isAbortError(error)) {
        log(`⏸️ 分片 ${chunkIndex + 1} 上传被暂停`);
        return false;
      }
      log(`❌ 分片 ${chunkIndex + 1} 上传异常`, error);
      throw error instanceof Error ? error : new Error(getErrorMessage(error));
    }
  };

  // 合并分片
  const mergeChunks = async (md5: string) => {
    log('🔗 调用后端合并接口', { md5 });

    const resp = await mergeFile(md5);
    if (!resp || !(resp.code === 200 || resp.code >= 700)) {
      log('❌ 合并失败', { code: resp?.code, message: resp?.message });
      throw new Error(resp?.message || '合并文件失败');
    }
    const result = resp.data;
    log('✅ 后端合并成功', result);
    return result;
  };

  // 更新任务状态
  const updateTask = (
    md5: string,
    updates: Partial<UploadTask> | ((task: UploadTask) => UploadTask),
  ) => {
    setTasks((prev) => {
      const newTasks = new Map(prev);
      const task = newTasks.get(md5);
      if (task) {
        const nextTask =
          typeof updates === 'function'
            ? updates(task)
            : { ...task, ...updates };
        newTasks.set(md5, nextTask);
      }
      tasksRef.current = newTasks;
      return newTasks;
    });
  };

  // 执行上传
  const performUpload = async (md5: string) => {
    const initialTask = tasksRef.current.get(md5);
    if (!initialTask) return;

    let uploadUrls = initialTask.uploadUrls ?? [];
    const uploadedChunkSet = new Set(initialTask.uploadedChunks);
    const abortController = new AbortController();
    abortControllersRef.current.set(md5, abortController);

    updateTask(md5, { status: 'uploading' });

    try {
      log('========== 开始上传流程 ==========', {
        fileName: initialTask.file.name,
        md5,
      });

      // 步骤1: 检查文件是否已存在(秒传)
      log('步骤1: 检查文件是否已存在');
      const exists = await checkFileExists(md5);
      if (exists) {
        log('🎉 文件已存在,秒传成功!', { fileName: initialTask.file.name });
        updateTask(md5, { status: 'success', progress: 100 });
        return;
      }

      // 步骤2: 调用后端初始化接口,获取预签名上传URL
      if (!uploadUrls.length) {
        log('步骤2: 调用后端初始化接口');
        const initResult = await initUpload(initialTask.file, md5);
        if (!initResult) {
          throw new Error('初始化上传失败,未获取到返回数据');
        }
        uploadUrls = extractUploadUrls(initResult);
        if (!Array.isArray(uploadUrls) || uploadUrls.length === 0) {
          log('⚠️ 未获取到上传地址列表，尝试直接合并', { md5 });
          const mergeResult = await mergeChunks(md5);
          updateTask(md5, { status: 'success', progress: 100 });
          log('🎉 直接合并成功（复用已上传分片）', { md5, mergeResult });
          return;
        }
        updateTask(md5, { uploadUrls });
      } else {
        log('♻️ 复用已有上传地址', { count: uploadUrls.length });
      }

      // 构建分片到URL的映射,支持带 partNumber 的URL
      const partUrlMap = new Map<number, string>();
      uploadUrls.forEach((item, idx) => {
        const u =
          typeof item === 'string'
            ? item
            : (item as any)?.url || (item as any)?.uploadUrl;
        if (!u) return;
        let partIndex = idx;
        try {
          const parsed = new URL(u);
          const pn = parsed.searchParams.get('partNumber');
          if (pn) {
            const n = parseInt(pn, 10);
            if (!Number.isNaN(n) && n > 0) partIndex = n - 1;
          }
        } catch {
          // ignore parse error, fallback to index-based
        }
        partUrlMap.set(partIndex, u);
      });

      if (partUrlMap.size === 0) {
        log('❌ 未获取到上传地址列表', { md5 });
        throw new Error('未获取到上传地址列表');
      }

      if (uploadUrls.length !== initialTask.totalChunks) {
        log('⚠️ 上传URL数量与分片数不匹配', {
          urlCount: uploadUrls.length,
          chunkCount: initialTask.totalChunks,
        });
      }

      log('📋 获取到上传地址列表', {
        count: uploadUrls.length,
        mappedCount: partUrlMap.size,
      });

      // 步骤3: 上传所有分片到MinIO
      log('步骤3: 开始上传分片到MinIO');
      for (let i = 0; i < initialTask.totalChunks; i++) {
        if (uploadedChunkSet.has(i)) {
          log(`⏭️ 跳过已上传的分片 ${i + 1}/${initialTask.totalChunks}`);
          continue;
        }

        const currentTask = tasksRef.current.get(md5);
        if (!currentTask) {
          log('⚠️ 未找到上传任务,终止上传', { md5 });
          return;
        }

        const uploadUrl = partUrlMap.get(i) || uploadUrls[i];
        if (!uploadUrl) {
          throw new Error(`分片 ${i + 1} 的上传地址不存在`);
        }

        const success = await uploadChunk(
          currentTask.file,
          i,
          uploadUrl,
          abortController.signal,
        );

        if (!success) {
          if (abortController.signal.aborted) {
            log('⏸️ 用户暂停上传', {
              uploadedChunks: uploadedChunkSet.size,
            });
            updateTask(md5, { status: 'paused' });
          }
          return;
        }

        uploadedChunkSet.add(i);
        const progress = Math.round(
          (uploadedChunkSet.size / currentTask.totalChunks) * 100,
        );

        updateTask(md5, (task) => ({
          ...task,
          uploadedChunks: Array.from(uploadedChunkSet).sort((a, b) => a - b),
          progress,
        }));

        if (progress % 25 === 0 || progress === 100) {
          log(`📊 上传进度: ${progress}%`, {
            uploadedChunks: uploadedChunkSet.size,
            totalChunks: currentTask.totalChunks,
          });
        }
      }

      // 步骤4: 调用后端合并接口
      log('步骤4: 所有分片已上传到MinIO,调用后端合并接口');
      const mergeResult = await mergeChunks(md5);

      updateTask(md5, { status: 'success', progress: 100 });
      log('🎉 文件上传成功!', {
        fileName: initialTask.file.name,
        md5,
        mergeResult,
      });
      log('========== 上传流程结束 ==========');
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      const stack = error instanceof Error ? error.stack : undefined;
      log('❌ 上传流程出错', { error: message, stack });
      updateTask(md5, {
        status: 'error',
        error: message || '上传失败',
      });
    } finally {
      abortControllersRef.current.delete(md5);
    }
  };

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    log('📁 选择文件', { count: files.length });

    for (const file of Array.from(files)) {
      try {
        log('========== 处理新文件 ==========', {
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          fileType: file.type,
        });

        const md5 = await calculateMD5(file);
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        const task: UploadTask = {
          file,
          md5,
          progress: 0,
          status: 'calculating',
          uploadedChunks: [],
          totalChunks,
        };

        const nextTasks = new Map(tasksRef.current);
        nextTasks.set(md5, task);
        tasksRef.current = nextTasks;
        setTasks(nextTasks);
        log('📝 任务已创建', { md5, totalChunks });

        updateTask(md5, { status: 'waiting' });
        performUpload(md5);
      } catch (error: unknown) {
        const message = getErrorMessage(error, '处理文件失败');
        log('❌ 处理文件失败', { fileName: file.name, error: message });
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 暂停上传
  const pauseUpload = (md5: string) => {
    log('⏸️ 暂停上传', { md5 });
    const controller = abortControllersRef.current.get(md5);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(md5);
    }
  };

  // 恢复上传
  const resumeUpload = (md5: string) => {
    log('▶️ 恢复上传', { md5 });
    performUpload(md5);
  };

  // 删除任务
  const removeTask = (md5: string) => {
    log('🗑️ 删除任务', { md5 });
    pauseUpload(md5);
    setTasks((prev) => {
      const newTasks = new Map(prev);
      newTasks.delete(md5);
      tasksRef.current = newTasks;
      return newTasks;
    });
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">文件分片上传</h2>

        {/* 上传区域 */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">点击选择文件或拖拽文件到此处</p>
          <p className="text-sm text-gray-500">支持断点续传,自动秒传</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* 任务列表 */}
        {tasks.size > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">上传列表</h3>
            {Array.from(tasks.values()).map((task) => (
              <div
                key={task.md5}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(task.file.size)} • {task.totalChunks}{' '}
                      个分片
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {task.status === 'calculating' && (
                      <span className="text-xs text-blue-600">
                        计算MD5中...
                      </span>
                    )}
                    {task.status === 'uploading' && (
                      <button
                        onClick={() => pauseUpload(task.md5)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="暂停"
                      >
                        <Pause className="h-5 w-5 text-gray-600" />
                      </button>
                    )}
                    {task.status === 'paused' && (
                      <button
                        onClick={() => resumeUpload(task.md5)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="继续"
                      >
                        <Play className="h-5 w-5 text-blue-600" />
                      </button>
                    )}
                    {task.status === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {task.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <button
                      onClick={() => removeTask(task.md5)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="删除"
                    >
                      <X className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                      task.status === 'success'
                        ? 'bg-green-500'
                        : task.status === 'error'
                          ? 'bg-red-500'
                          : task.status === 'paused'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>

                {/* 状态信息 */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    {task.status === 'calculating' && '正在计算文件MD5...'}
                    {task.status === 'waiting' && '等待上传...'}
                    {task.status === 'uploading' && `上传中 ${task.progress}%`}
                    {task.status === 'paused' && `已暂停 ${task.progress}%`}
                    {task.status === 'success' && '上传完成'}
                    {task.status === 'error' && `上传失败: ${task.error}`}
                  </span>
                  <span className="text-gray-500">
                    {task.uploadedChunks.length}/{task.totalChunks} 分片
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChunkedUploadComponent;
