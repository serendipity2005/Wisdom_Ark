import './index.scss';
import {
  Button,
  Modal,
  DatePicker,
  Form,
  Input,
  Select,
  Upload,
  message,
} from 'antd';
import type { GetProp, UploadFile, UploadProps } from 'antd';
import ImgCrop from 'antd-img-crop';
import {
  Plus,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  Monitor,
  Volume2,
  VolumeX,
} from 'lucide-react';
import giftUrl from '@/assets/img/Social.gif';
import { useState, useRef, useEffect } from 'react';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
const { RangePicker } = DatePicker;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 14 },
  },
};

// 直播类型选项
const liveTypeOptions = [
  { label: '技术分享', value: 'tech' },
  { label: '产品演示', value: 'demo' },
  { label: '在线教学', value: 'teaching' },
  { label: '娱乐互动', value: 'entertainment' },
  { label: '其他', value: 'other' },
];

interface LiveStreamData {
  title: string;
  description: string;
  hostName: string;
  liveType: string;
  coverImage: UploadFile[];
  liveTime: [Date, Date];
}

export default function CreateLive() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiveStarted, setIsLiveStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamStatus, setStreamStatus] = useState<
    'idle' | 'connecting' | 'live' | 'error'
  >('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    [],
  );
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [form] = Form.useForm();

  // WebRTC相关ref
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const viewerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      setIsLoading(true);

      if (fileList.length === 0) {
        message.error('请上传直播封面！');
        setIsLoading(false);
        return;
      }

      const values = await form.validateFields();
      const liveData: LiveStreamData = {
        ...values,
        coverImage: fileList,
      };

      console.log('直播数据:', liveData);
      message.success('直播创建成功！');
      setIsModalOpen(false);
      form.resetFields();
      setFileList([]);

      // 创建直播成功后开始直播流
      await startLiveStream();
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('请完善直播信息！');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setFileList([]);
  };

  // 上传组件逻辑
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const onChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    const validFileList = newFileList.slice(-1);
    setFileList(validFileList);
    form.setFieldsValue({
      coverImage: validFileList.length > 0 ? validFileList : undefined,
    });
  };

  const validateCoverImage = (_: any, value: any) => {
    if (fileList.length === 0) {
      return Promise.reject(new Error('请上传直播封面！'));
    }
    return Promise.resolve();
  };

  const onPreview = async (file: UploadFile) => {
    let src = file.url as string;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as FileType);
        reader.onload = () => resolve(reader.result as string);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };

  const beforeUpload = (file: FileType) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片!');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过 5MB!');
      return false;
    }
    return false;
  };

  const onRemove = (file: UploadFile) => {
    const newFileList = fileList.filter((item) => item.uid !== file.uid);
    setFileList(newFileList);
    form.setFieldsValue({
      coverImage: newFileList.length > 0 ? newFileList : undefined,
    });
  };

  // 获取所有摄像头设备 - 只在需要时调用
  const getCameraDevices = async (): Promise<MediaDeviceInfo[]> => {
    try {
      // 先获取权限，然后重新枚举设备
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput',
      );
      setAvailableCameras(videoDevices);
      return videoDevices;
    } catch (error) {
      console.error('获取摄像头设备失败:', error);
      return [];
    }
  };

  // 初始化音频分析器
  const initializeAudioAnalyzer = (stream: MediaStream) => {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);

      // 开始监测音频电平
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }

      audioIntervalRef.current = setInterval(() => {
        if (analyserRef.current && localStreamRef.current) {
          const audioTrack = localStreamRef.current.getAudioTracks()[0];
          if (
            audioTrack &&
            audioTrack.enabled &&
            audioTrack.readyState === 'live'
          ) {
            const dataArray = new Uint8Array(
              analyserRef.current.frequencyBinCount,
            );
            analyserRef.current.getByteFrequencyData(dataArray);

            // 计算平均音量
            let sum = 0;
            for (const value of dataArray) {
              sum += value;
            }
            const average = sum / dataArray.length;
            setAudioLevel(Math.min(average / 128, 1));
          } else {
            setAudioLevel(0);
          }
        }
      }, 100);
    } catch (error) {
      console.warn('音频分析器初始化失败:', error);
    }
  };

  // 检查媒体流状态
  const checkStreamHealth = (stream: MediaStream) => {
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    const videoActive = videoTracks.length > 0;
    const audioActive = audioTracks.length > 0;

    console.log(
      '视频轨道状态:',
      videoTracks[0]?.readyState,
      '音频轨道状态:',
      audioTracks[0]?.readyState,
    );

    return { videoActive, audioActive };
  };

  // 设置视频流到video元素
  const setupVideoElement = (stream: MediaStream): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!localVideoRef.current) {
          console.error('Video element not found, retrying...');
          setTimeout(() => {
            if (!localVideoRef.current) {
              reject(new Error('Video element not found after retry'));
              return;
            }
            setupVideoElementDirect(stream, resolve, reject);
          }, 100);
          return;
        }
        setupVideoElementDirect(stream, resolve, reject);
      }, 50);
    });
  };

  // 直接设置视频元素的辅助函数
  const setupVideoElementDirect = (
    stream: MediaStream,
    resolve: () => void,
    reject: (error: any) => void,
  ) => {
    if (!localVideoRef.current) {
      reject(new Error('Video element is null'));
      return;
    }

    const videoElement = localVideoRef.current;
    videoElement.srcObject = stream;

    const handleLoadedMetadata = () => {
      console.log('视频元数据加载完成');
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('error', handleError);
      resolve();
    };

    const handleError = (error: any) => {
      console.error('视频播放错误:', error);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('error', handleError);
      reject(error);
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('error', handleError);

    videoElement.play().catch((error) => {
      console.warn('自动播放失败:', error);
    });

    setTimeout(() => {
      if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
        handleLoadedMetadata();
      }
    }, 3000);
  };

  // 初始化WebRTC和媒体流 - 只在创建直播后调用
  const initializeWebRTC = async (): Promise<boolean> => {
    try {
      setStreamStatus('connecting');

      // 确保视频元素存在
      if (!localVideoRef.current) {
        console.warn('Video element not ready, waiting for DOM...');
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!localVideoRef.current) {
          throw new Error('Video element not found in DOM');
        }
      }

      // 获取摄像头列表
      const cameras = await getCameraDevices();
      if (cameras.length === 0) {
        throw new Error('未找到可用的摄像头');
      }

      // 使用更简单的约束提高兼容性
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          deviceId: cameras[currentCameraIndex]?.deviceId
            ? { exact: cameras[currentCameraIndex].deviceId }
            : undefined,
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      console.log('正在请求媒体权限...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('媒体流获取成功:', stream);
      localStreamRef.current = stream;

      // 设置视频元素
      await setupVideoElement(stream);

      // 检查流健康状态
      const { videoActive, audioActive } = checkStreamHealth(stream);
      if (!videoActive && !audioActive) {
        throw new Error('媒体流初始化失败');
      }

      // 初始化音频分析器
      if (audioActive) {
        initializeAudioAnalyzer(stream);
      }

      // 创建媒体录制
      try {
        recordedChunksRef.current = [];
        const options = { mimeType: 'video/webm;codecs=vp9,opus' };

        if (MediaRecorder.isTypeSupported(options.mimeType)) {
          mediaRecorderRef.current = new MediaRecorder(stream, options);
        } else {
          mediaRecorderRef.current = new MediaRecorder(stream);
        }

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.start(1000);
        console.log('媒体录制开始');
      } catch (recordingError) {
        console.warn('媒体录制不支持:', recordingError);
      }

      // 创建Peer Connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };

      peerConnectionRef.current = new RTCPeerConnection(configuration);

      // 添加轨道到连接
      stream.getTracks().forEach((track) => {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.addTrack(track, stream);
        }
      });

      // 监听连接状态
      peerConnectionRef.current.onconnectionstatechange = () => {
        const state = peerConnectionRef.current?.connectionState;
        console.log('PeerConnection 状态:', state);
      };

      // 立即设置为直播状态
      setStreamStatus('live');
      console.log('WebRTC初始化完成');

      return true;
    } catch (error) {
      console.error('初始化WebRTC失败:', error);
      setStreamStatus('error');

      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            message.error('请允许摄像头和麦克风权限');
            break;
          case 'NotFoundError':
            message.error('未找到可用的摄像头或麦克风');
            break;
          case 'NotReadableError':
            message.error('摄像头或麦克风被其他应用占用');
            break;
          case 'OverconstrainedError':
            message.error('无法满足视频参数要求，尝试使用默认设置');
            try {
              const defaultStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
              });
              if (localVideoRef.current) {
                await setupVideoElement(defaultStream);
                localStreamRef.current = defaultStream;
                setStreamStatus('live');
                return true;
              }
            } catch (fallbackError) {
              console.error('回退方案也失败了:', fallbackError);
            }
            break;
          default:
            message.error('无法访问媒体设备: ' + error.message);
        }
      } else {
        message.error('初始化直播失败: ' + (error as Error).message);
      }
      return false;
    }
  };

  // 模拟观看者连接
  const simulateViewerConnection = () => {
    if (viewerIntervalRef.current) {
      clearInterval(viewerIntervalRef.current);
    }

    let count = 0;
    viewerIntervalRef.current = setInterval(() => {
      if (!isLiveStarted) {
        clearInterval(viewerIntervalRef.current!);
        return;
      }

      const increment = Math.floor(Math.random() * 10) + 1;
      count += increment;
      setViewerCount(count);

      if (Math.random() < 0.1 && count > 10) {
        count -= Math.floor(Math.random() * 3) + 1;
        setViewerCount(Math.max(0, count));
      }
    }, 3000);
  };

  // 开始直播流 - 只在创建直播后调用
  const startLiveStream = async () => {
    try {
      setIsLoading(true);
      setStreamStatus('connecting');
      setViewerCount(0);
      setIsVideoEnabled(true);
      setIsAudioEnabled(true);

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        message.error('您的浏览器不支持媒体设备访问');
        setIsLoading(false);
        return;
      }

      // 设置直播状态，这会触发直播模态框的渲染
      setIsLiveStarted(true);

      // 给DOM一些时间渲染视频元素
      await new Promise((resolve) => setTimeout(resolve, 200));

      const initialized = await initializeWebRTC();
      if (!initialized) {
        setIsLiveStarted(false);
        setIsLoading(false);
        return;
      }

      message.success('直播开始！');

      // 开始模拟观众
      simulateViewerConnection();
    } catch (error) {
      console.error('开始直播失败:', error);
      message.error('开始直播失败，请重试');
      setStreamStatus('error');
      setIsLiveStarted(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 停止直播
  const stopLiveStream = () => {
    setStreamStatus('idle');
    setViewerCount(0);
    setAudioLevel(0);
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);

    // 清理定时器
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }

    if (viewerIntervalRef.current) {
      clearInterval(viewerIntervalRef.current);
      viewerIntervalRef.current = null;
    }

    // 清理音频分析器
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    // 停止媒体录制
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }

    // 停止所有媒体轨道
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    // 关闭Peer Connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // 清理视频元素
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
      localVideoRef.current.pause();
    }

    setIsLiveStarted(false);
    message.info('直播已结束');
  };

  // 切换摄像头/麦克风状态
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const newState = !isVideoEnabled;
        videoTracks.forEach((track) => {
          track.enabled = newState;
        });
        setIsVideoEnabled(newState);
        message.info(newState ? '视频已开启' : '视频已关闭');
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newState = !isAudioEnabled;
        audioTracks.forEach((track) => {
          track.enabled = newState;
        });
        setIsAudioEnabled(newState);
        message.info(newState ? '音频已开启' : '音频已关闭');

        if (!newState) {
          setAudioLevel(0);
        }
      }
    }
  };

  // 切换摄像头
  const switchCamera = async () => {
    if (!localStreamRef.current || availableCameras.length <= 1) {
      message.info('只有一个摄像头可用');
      return;
    }

    try {
      setStreamStatus('connecting');

      const nextCameraIndex =
        (currentCameraIndex + 1) % availableCameras.length;
      const nextCamera = availableCameras[nextCameraIndex];

      // 停止当前视频轨道（保留音频）
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => track.stop());

      // 获取新摄像头流（只获取视频）
      const constraints = {
        video: {
          deviceId: { exact: nextCamera.deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const newVideoStream =
        await navigator.mediaDevices.getUserMedia(constraints);
      const newVideoTrack = newVideoStream.getVideoTracks()[0];

      // 将新视频轨道添加到现有流中
      if (localStreamRef.current) {
        // 移除旧的视频轨道
        videoTracks.forEach((track) => {
          localStreamRef.current?.removeTrack(track);
        });

        // 添加新的视频轨道
        localStreamRef.current.addTrack(newVideoTrack);

        // 更新Peer Connection的轨道
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find(
            (sender) => sender.track && sender.track.kind === 'video',
          );

          if (videoSender) {
            await videoSender.replaceTrack(newVideoTrack);
          }
        }

        // 更新视频元素
        if (localVideoRef.current) {
          await setupVideoElement(localStreamRef.current);
        }
      }

      setCurrentCameraIndex(nextCameraIndex);
      setStreamStatus('live');

      message.success(
        `已切换到: ${nextCamera.label || '摄像头' + (nextCameraIndex + 1)}`,
      );
    } catch (error) {
      console.error('切换摄像头失败:', error);
      message.error('切换摄像头失败');
      setStreamStatus('error');

      // 尝试恢复直播状态
      setTimeout(() => {
        if (
          localStreamRef.current &&
          checkStreamHealth(localStreamRef.current).videoActive
        ) {
          setStreamStatus('live');
        }
      }, 1000);
    }
  };

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      // 只有在直播进行中时才清理资源
      if (isLiveStarted) {
        stopLiveStream();
      }
    };
  }, [isLiveStarted]);

  return (
    <>
      <div className="createCon w-300 h-100 bg-white mt-15 flex justify-center items-center">
        <div className="giftCon w-50% h-100%">
          <img src={giftUrl} className="w-full h-160%" alt="直播礼物" />
        </div>
        <Button
          type="primary"
          className="w-55% ml-auto create-live-btn"
          onClick={showModal}
          icon={<Plus className="w-20 h-20" />}
        >
          开启直播之旅
        </Button>
      </div>

      {/* 创建直播模态框 */}
      <Modal
        title="创建直播"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={isLoading}
        okText="创建并开始直播"
        cancelText="取消"
        width={700}
        className="create-live-modal"
      >
        <Form
          {...formItemLayout}
          form={form}
          style={{ maxWidth: 600 }}
          initialValues={{ liveType: 'tech' }}
        >
          <Form.Item
            label="直播标题"
            name="title"
            rules={[{ required: true, message: '请输入直播标题!' }]}
          >
            <Input placeholder="请输入直播标题，如：A编程社 共学计划Vol.3" />
          </Form.Item>

          <Form.Item
            label="直播介绍"
            name="description"
            rules={[{ required: true, message: '请输入直播介绍!' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入直播内容介绍" />
          </Form.Item>

          <Form.Item
            label="主持人姓名"
            name="hostName"
            rules={[{ required: true, message: '请输入主持人姓名!' }]}
          >
            <Input placeholder="请输入主持人姓名" />
          </Form.Item>

          <Form.Item
            label="直播类型"
            name="liveType"
            rules={[{ required: true, message: '请选择直播类型!' }]}
          >
            <Select options={liveTypeOptions} placeholder="请选择直播类型" />
          </Form.Item>

          <Form.Item
            label="直播封面"
            name="coverImage"
            rules={[{ required: true, validator: validateCoverImage }]}
          >
            <ImgCrop rotationSlider aspect={16 / 9}>
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={onChange}
                onPreview={onPreview}
                onRemove={onRemove}
                beforeUpload={beforeUpload}
                maxCount={1}
                accept="image/jpeg,image/png"
              >
                {fileList.length < 1 && (
                  <div>
                    <Plus style={{ fontSize: '20px' }} />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </ImgCrop>
          </Form.Item>

          <Form.Item
            label="直播时间"
            name="liveTime"
            rules={[{ required: true, message: '请选择直播时间!' }]}
          >
            <RangePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              placeholder={['开始时间', '结束时间']}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 直播界面 - 只在创建直播后才渲染 */}
      {isLiveStarted && (
        <Modal
          title={`直播中 - ${streamStatus === 'live' ? '推流正常' : streamStatus === 'connecting' ? '连接中...' : '连接异常'}`}
          open={isLiveStarted}
          onCancel={stopLiveStream}
          footer={[
            <Button
              key="switch"
              icon={<Monitor />}
              onClick={switchCamera}
              disabled={
                availableCameras.length <= 1 || streamStatus === 'connecting'
              }
            >
              切换摄像头 ({availableCameras.length})
            </Button>,
            <Button
              key="video"
              icon={isVideoEnabled ? <Video /> : <VideoOff />}
              onClick={toggleVideo}
              disabled={streamStatus === 'connecting'}
            >
              {isVideoEnabled ? '关闭视频' : '开启视频'}
            </Button>,
            <Button
              key="audio"
              icon={isAudioEnabled ? <Mic /> : <MicOff />}
              onClick={toggleAudio}
              disabled={streamStatus === 'connecting'}
            >
              {isAudioEnabled ? '静音' : '取消静音'}
            </Button>,
            <Button key="stop" type="primary" danger onClick={stopLiveStream}>
              结束直播
            </Button>,
          ]}
          width={900}
          closable={false}
          className="live-modal"
        >
          <div className="live-container">
            <div className="video-wrapper">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="live-video"
                style={{
                  width: '100%',
                  height: '400px',
                  backgroundColor:
                    streamStatus === 'connecting' ? '#000' : 'transparent',
                  display: isVideoEnabled ? 'block' : 'none',
                }}
              />
              {!isVideoEnabled && (
                <div className="video-disabled-overlay">
                  <VideoOff size={64} />
                  <div>视频已关闭</div>
                </div>
              )}
              {streamStatus === 'connecting' && (
                <div className="stream-status-overlay">
                  <div className="status-message">
                    正在连接摄像头和麦克风...
                  </div>
                </div>
              )}
              {streamStatus === 'error' && (
                <div className="stream-status-overlay error">
                  <div className="status-message">
                    设备连接失败，请检查权限
                    <br />
                    <Button type="link" onClick={startLiveStream}>
                      重试连接
                    </Button>
                  </div>
                </div>
              )}

              {/* 音频电平指示器 */}
              {isAudioEnabled && (
                <div className="audio-level-indicator">
                  <div className="audio-icon">
                    <Volume2 size={16} />
                  </div>
                  <div className="audio-bar">
                    <div
                      className="audio-level"
                      style={{ width: `${audioLevel * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="live-stats">
              <div className="stat-item">
                <Users className="stat-icon" />
                <span className="stat-label">观看人数:</span>
                <span className="stat-value">{viewerCount}</span>
              </div>
              <div className="stat-item">
                <div className={`status-indicator ${streamStatus}`}></div>
                <span className="stat-label">直播状态:</span>
                <span className={`stat-value ${streamStatus}`}>
                  {streamStatus === 'live'
                    ? '推流正常'
                    : streamStatus === 'connecting'
                      ? '连接中...'
                      : '连接异常'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">摄像头:</span>
                <span className="stat-value">
                  {availableCameras[currentCameraIndex]?.label ||
                    `摄像头 ${currentCameraIndex + 1}`}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">视频状态:</span>
                <span className="stat-value">
                  {isVideoEnabled ? '开启' : '关闭'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">音频状态:</span>
                <span className="stat-value">
                  {isAudioEnabled ? '开启' : '关闭'}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
