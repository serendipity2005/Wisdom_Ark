import { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Settings,
  Radio,
  Square,
  Users,
  Camera,
  Volume2,
  Wifi,
  Clock,
  Activity,
  Maximize2,
  ListTree,
} from 'lucide-react';
// import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as bodySegmentation from '@tensorflow-models/body-segmentation';
import DanmakuPlayer from './danmu-mq';

interface DanmakuItem {
  id: number;
  text: string;
  color?: string;
  fontSize?: number;
  speed?: number;
  avatar?: string;
  user?: string;
}

export default function WebRTCDesktopStudio() {
  const [isStreaming, setIsStreaming] = useState(false); // 是否正在直播
  const [isCameraOn, setIsCameraOn] = useState(false); // 是否打开摄像头
  const [isMicOn, setIsMicOn] = useState(false); // 是否打开麦克风
  const [isScreenSharing, setIsScreenSharing] = useState(false); // 是否正在共享屏幕
  const [viewerCount, setViewerCount] = useState(0); // 当前直播的观众数
  const [streamDuration, setStreamDuration] = useState(0); // 当前直播时长
  const [devices, setDevices] = useState<{
    cameras: MediaDeviceInfo[];

    microphones: MediaDeviceInfo[];
  }>({ cameras: [], microphones: [] }); // 设备列表
  const [selectedCamera, setSelectedCamera] = useState(''); // 当前使用的摄像头
  const [selectedMicrophone, setSelectedMicrophone] = useState(''); // 当前使用的麦克风
  const [streamQuality, setStreamQuality] = useState('1080p'); // 当前选择的视频质量

  const [bitrate, setBitrate] = useState(3500); // 当前选择的视频码率
  const [fps, setFps] = useState(30); // 当前选择的帧率
  const [audioLevel, setAudioLevel] = useState(0); // 当前音频电平
  const [networkQuality] = useState('excellent'); // 当前网络质量
  const [cpuUsage, setCpuUsage] = useState(0); // 当前CPU使用率
  const [isSidebar, setIsSidebar] = useState(true); // 是否显示右侧边栏
  const [isDanmu, setIsDanmu] = useState(false); // 是否显示弹幕
  const [personMask, setPersonMask] = useState<ImageData | null>(null);

  const [publisher, setPublisher] = useState<WebRTCPublisher | null>(null);
  const [streamStats, setStreamStats] = useState<any>(null);

  const [segmenter, setSegmenter] =
    useState<bodySegmentation.BodySegmenter | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null); // 视频元素
  const screenRef = useRef<HTMLVideoElement>(null); // 屏幕元素
  const pipVideoRef = useRef<HTMLVideoElement>(null); // 画中画元素
  const cameraStreamRef = useRef<MediaStream | null>(null); // 摄像头流
  const screenStreamRef = useRef<MediaStream | null>(null); // 屏幕流
  const audioStreamRef = useRef<MediaStream | null>(null); // 音频流
  const audioContextRef = useRef<AudioContext | null>(null); // 音频上下文
  const analyserRef = useRef<AnalyserNode | null>(null); // 音频分析器
  const canvasRef = useRef<HTMLCanvasElement>(null); // 画布元素
  // 在组件顶部添加 state 来缓存背景图
  const [backgroundImg, setBackgroundImg] = useState<HTMLImageElement | null>(
    null,
  );
  const [personBounds, setPersonBounds] = useState<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  } | null>(null);

  // WebRTC 推流管理类
  class WebRTCPublisher {
    private pc: RTCPeerConnection | null = null;
    private ws: WebSocket | null = null;
    private streamKey: string;

    constructor(streamKey: string) {
      this.streamKey = streamKey;
    }

    // 初始化 WebRTC 连接
    async connect(signalingServerUrl: string) {
      // 1. 建立信令服务器 WebSocket 连接
      this.ws = new WebSocket(signalingServerUrl);

      this.ws.onopen = () => {
        console.log('✅ 信令服务器连接成功');
        this.authenticate();
      };

      this.ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        await this.handleSignalingMessage(message);
      };

      this.ws.onerror = (error) => {
        console.error('❌ 信令服务器错误:', error);
      };

      // 2. 创建 RTCPeerConnection
      this.pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          // 生产环境需要配置 TURN 服务器
          // {
          //   urls: 'turn:your-turn-server.com:3478',
          //   username: 'user',
          //   credential: 'pass'
          // }
        ],
      });

      // 监听 ICE 候选
      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendMessage({
            type: 'ice-candidate',
            candidate: event.candidate,
            streamKey: this.streamKey,
          });
        }
      };

      // 监听连接状态
      this.pc.onconnectionstatechange = () => {
        console.log('连接状态:', this.pc?.connectionState);
      };

      // 监听 ICE 连接状态
      this.pc.oniceconnectionstatechange = () => {
        console.log('ICE 状态:', this.pc?.iceConnectionState);
      };
    }

    // 身份验证
    private authenticate() {
      this.sendMessage({
        type: 'auth',
        streamKey: this.streamKey,
        protocol: 'webrtc',
      });
    }

    // 添加媒体流
    async addTracks(streams: {
      video?: MediaStream;
      audio?: MediaStream;
      screen?: MediaStream;
    }) {
      if (!this.pc) throw new Error('PeerConnection 未初始化');

      // 添加视频轨道
      if (streams.video) {
        streams.video.getVideoTracks().forEach((track) => {
          this.pc!.addTrack(track, streams.video!);
          console.log('✅ 视频轨道已添加');
        });
      }

      // 添加屏幕共享轨道
      if (streams.screen) {
        streams.screen.getVideoTracks().forEach((track) => {
          this.pc!.addTrack(track, streams.screen!);
          console.log('✅ 屏幕轨道已添加');
        });
      }

      // 添加音频轨道
      if (streams.audio) {
        streams.audio.getAudioTracks().forEach((track) => {
          this.pc!.addTrack(track, streams.audio!);
          console.log('✅ 音频轨道已添加');
        });
      }

      // 创建 Offer
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });

      await this.pc.setLocalDescription(offer);

      // 发送 SDP Offer 到服务器
      this.sendMessage({
        type: 'offer',
        sdp: offer,
        streamKey: this.streamKey,
      });
    }

    // 处理信令消息
    private async handleSignalingMessage(message: any) {
      if (!this.pc) return;

      switch (message.type) {
        case 'answer':
          // 收到 SDP Answer
          await this.pc.setRemoteDescription(
            new RTCSessionDescription({
              type: message.type,
              sdp: message.sdp,
            }),
          );
          console.log('✅ SDP Answer 已设置');
          break;

        case 'ice-candidate':
          // 收到 ICE 候选
          if (message.candidate) {
            await this.pc.addIceCandidate(
              new RTCIceCandidate(message.candidate),
            );
            console.log('✅ ICE 候选已添加');
          }
          break;

        case 'error':
          console.error('❌ 服务器错误:', message.error);
          break;
      }
    }

    // 发送信令消息
    private sendMessage(message: any) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }

    // 获取统计信息
    async getStats() {
      if (!this.pc) return null;

      const stats = await this.pc.getStats();
      const result: any = {
        video: {},
        audio: {},
        network: {},
      };

      stats.forEach((report) => {
        if (report.type === 'outbound-rtp') {
          if (report.kind === 'video') {
            result.video = {
              bytesSent: report.bytesSent,
              packetsSent: report.packetsSent,
              framesEncoded: report.framesEncoded,
              framesSent: report.framesSent,
              keyFramesEncoded: report.keyFramesEncoded,
              totalEncodeTime: report.totalEncodeTime,
              qualityLimitationReason: report.qualityLimitationReason,
            };
          } else if (report.kind === 'audio') {
            result.audio = {
              bytesSent: report.bytesSent,
              packetsSent: report.packetsSent,
            };
          }
        }

        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          result.network = {
            currentRoundTripTime: report.currentRoundTripTime,
            availableOutgoingBitrate: report.availableOutgoingBitrate,
            bytesSent: report.bytesSent,
            bytesReceived: report.bytesReceived,
          };
        }
      });

      return result;
    }

    // 断开连接
    disconnect() {
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }

      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      console.log('🔌 WebRTC 连接已断开');
    }
  }

  // 同步视频流到视频元素
  useEffect(() => {
    if (isScreenSharing) {
      // 屏幕共享时：屏幕显示在主窗口，摄像头显示在画中画
      if (screenRef.current && screenStreamRef.current) {
        screenRef.current.srcObject = screenStreamRef.current;
        console.log('屏幕流已设置到主窗口');
      }
      if (isCameraOn && pipVideoRef.current && cameraStreamRef.current) {
        pipVideoRef.current.srcObject = cameraStreamRef.current;
        console.log('摄像头流已设置到画中画');
      }
    } else if (isCameraOn) {
      // 只有摄像头时：摄像头显示在主窗口
      if (videoRef.current && cameraStreamRef.current) {
        videoRef.current.srcObject = cameraStreamRef.current;
        console.log('摄像头流已设置到主窗口');
      }
    }
  }, [isScreenSharing, isCameraOn]);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const cameras = deviceList.filter(
          (device) => device.kind === 'videoinput',
        );
        const microphones = deviceList.filter(
          (device) => device.kind === 'audioinput',
        );

        setDevices({ cameras, microphones });
        if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
        if (microphones.length > 0)
          setSelectedMicrophone(microphones[0].deviceId);
      } catch (error) {
        console.error('获取设备列表失败:', error);
      }
    };

    getDevices();
  }, []);

  useEffect(() => {
    let interval: string | number | NodeJS.Timeout | undefined;
    if (isStreaming) {
      interval = setInterval(() => {
        setStreamDuration((prev) => prev + 1);
        setViewerCount((prev) =>
          Math.max(0, prev + Math.floor(Math.random() * 5 - 1)),
        );
        setCpuUsage(Math.floor(Math.random() * 30 + 40));
      }, 1000);
    } else {
      setStreamDuration(0);
      setViewerCount(0);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  // 加载模型
  useEffect(() => {
    const loadSegmenter = async () => {
      const model =
        bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
      const segmenterConfig = {
        runtime: 'mediapipe' as const,
        solutionPath:
          'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
        modelType: 'general' as const,
      };
      const loadedSegmenter = await bodySegmentation.createSegmenter(
        model,
        segmenterConfig,
      );
      setSegmenter(loadedSegmenter);
    };
    loadSegmenter();
  }, []);

  // 音频电平监测
  useEffect(() => {
    if (isMicOn && audioStreamRef.current) {
      try {
        const audioContext = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(
          audioStreamRef.current,
        );

        analyser.fftSize = 256;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkLevel = () => {
          if (analyserRef.current && isMicOn) {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(Math.min(100, (average / 255) * 100));
            requestAnimationFrame(checkLevel);
          }
        };

        checkLevel();
      } catch (error) {
        console.error('音频分析器初始化失败:', error);
      }

      return () => {
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
    } else {
      setAudioLevel(0);
    }
  }, [isMicOn]);

  useEffect(() => {
    console.log('主组件 personBounds 更新:', personBounds);
  }, [personBounds]);

  // 在组件加载时预加载背景图
  useEffect(() => {
    const img = new Image();
    img.src = '/tjc.jpg';
    img.onload = () => setBackgroundImg(img);
    img.onerror = () => console.error('背景图加载失败');
  }, []);

  // 实时处理人像分割
  const processSegmentation = async () => {
    if (!segmenter || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      requestAnimationFrame(processSegmentation);
      return;
    }

    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const segmentation = await segmenter.segmentPeople(video);

    // 生成掩码
    const maskImageData = await bodySegmentation.toBinaryMask(
      segmentation,
      { r: 255, g: 255, b: 255, a: 255 }, // 人像区域
      { r: 0, g: 0, b: 0, a: 0 }, // 背景区域
    );

    // 弹幕掩码
    setPersonMask(maskImageData);

    // 🎯 计算人像边界框
    const data = maskImageData.data;
    let minX = canvas.width,
      maxX = 0,
      minY = canvas.height,
      maxY = 0;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        if (data[index] === 255) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // 更新人像边界
    if (maxX > minX && maxY > minY) {
      const newBounds = {
        left: (minX / canvas.width) * 100,
        right: (maxX / canvas.width) * 100,
        top: (minY / canvas.height) * 100,
        bottom: (maxY / canvas.height) * 100,
      };

      // 只有当边界有明显变化时才更新，避免频繁更新
      if (
        !personBounds ||
        Math.abs(newBounds.top - personBounds.top) > 1 ||
        Math.abs(newBounds.bottom - personBounds.bottom) > 1 ||
        Math.abs(newBounds.left - personBounds.left) > 1 ||
        Math.abs(newBounds.right - personBounds.right) > 1
      ) {
        setPersonBounds(newBounds);
      }
    } else {
      // 如果没有检测到人像，清除边界
      if (personBounds) {
        setPersonBounds(null);
      }
    }

    // === 关键修改：创建掩码画布 ===
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // 把掩码放到单独的画布
    maskCtx.putImageData(maskImageData, 0, 0);

    // === 创建人像画布 ===
    const personCanvas = document.createElement('canvas');
    personCanvas.width = canvas.width;
    personCanvas.height = canvas.height;
    const personCtx = personCanvas.getContext('2d');
    if (!personCtx) return;

    // 1. 先画视频原图
    personCtx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 2. 用掩码裁剪（只保留白色区域，即人像）
    personCtx.globalCompositeOperation = 'destination-in';
    personCtx.drawImage(maskCanvas, 0, 0); // 用掩码画布，不是 putImageData
    personCtx.globalCompositeOperation = 'source-over';

    // ============ 关键修改：清除主画布 ============
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景（使用预加载的图片）
    if (backgroundImg) {
      ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    } else {
      // 降级方案：纯色背景
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 叠加人像
    ctx.drawImage(personCanvas, 0, 0);

    // 继续下一帧
    requestAnimationFrame(processSegmentation);

    // 在 processSegmentation 函数的最后添加
    if (personBounds) {
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 3;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 摄像头状态
  const isProcessing = useRef(false);
  const toggleCamera = async () => {
    if (!isCameraOn) {
      try {
        const constraints = {
          video: {
            deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
            width: {
              ideal:
                streamQuality === '1080p'
                  ? 1920
                  : streamQuality === '720p'
                    ? 1280
                    : 854,
            },
            height: {
              ideal:
                streamQuality === '1080p'
                  ? 1080
                  : streamQuality === '720p'
                    ? 720
                    : 480,
            },
            frameRate: { ideal: fps },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        cameraStreamRef.current = stream;
        setIsCameraOn(true);

        console.log('摄像头已开启', stream);

        // ✅ 启动人像分割
        if (segmenter) {
          setTimeout(() => requestAnimationFrame(processSegmentation), 500);
        }
      } catch (error) {
        console.error('无法访问摄像头:', error);
        alert('无法访问摄像头，请检查权限设置');
      }
    } else {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log('停止摄像头轨道');
        });
        cameraStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (pipVideoRef.current) {
        pipVideoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
      console.log('摄像头已关闭');

      // 关闭摄像头
      isProcessing.current = false;
    }
  };

  // 麦克风状态
  const toggleMicrophone = async () => {
    if (!isMicOn) {
      try {
        const constraints = {
          audio: {
            deviceId: selectedMicrophone
              ? { exact: selectedMicrophone }
              : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
          },
          video: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        audioStreamRef.current = stream;

        setIsMicOn(true);
        console.log('麦克风已开启');
      } catch (error) {
        console.error('无法访问麦克风:', error);
        alert('无法访问麦克风，请检查权限设置');
      }
    } else {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log('停止音频轨道');
        });
        audioStreamRef.current = null;
      }
      setIsMicOn(false);
      console.log('麦克风已关闭');
    }
  };

  // 屏幕共享状态
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: { ideal: fps },
          },
          audio: true,
        });

        screenStreamRef.current = stream;
        setIsScreenSharing(true);

        // 监听用户停止共享
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
          console.log('屏幕共享已停止（用户操作）');
        };

        console.log('屏幕共享已开启', stream);
      } catch (error) {
        console.error('无法共享屏幕:', error);
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log('停止屏幕共享轨道');
        });
        screenStreamRef.current = null;
      }
      if (screenRef.current) {
        screenRef.current.srcObject = null;
      }

      setIsScreenSharing(false);
      console.log('屏幕共享已关闭');
    }
  };

  // 直播状态
  const toggleStreaming = async () => {
    if (!isStreaming) {
      if (!isCameraOn && !isScreenSharing) {
        alert('请先开启摄像头或屏幕共享');
        return;
      }
      setIsStreaming(true);
      console.log('直播已开始');
      try {
        // 创建发布器
        const streamKey = 'your-stream-key'; // 从服务器获取
        const pub = new WebRTCPublisher(streamKey);

        // 连接到信令服务器
        await pub.connect('ws://localhost:8080');

        // 添加媒体轨道
        await pub.addTracks({
          video: cameraStreamRef.current || undefined,
          audio: audioStreamRef.current || undefined,
          screen: screenStreamRef.current || undefined,
        });

        setPublisher(pub);
        setIsStreaming(true);

        // 定时获取统计信息
        const statsInterval = setInterval(async () => {
          const stats = await pub.getStats();
          setStreamStats(stats);
          console.log('📊 推流统计:', stats);
        }, 1000);

        // 保存 interval ID 用于清理
        (pub as any).statsInterval = statsInterval;
      } catch (error) {
        console.error('❌ 推流启动失败:', error);
        alert('推流启动失败: ' + error);
      }
    } else {
      // 停止直播
      if (publisher) {
        clearInterval((publisher as any).statsInterval);
        publisher.disconnect();
        setPublisher(null);
      }

      // 停止所有媒体流
      [cameraStreamRef, screenStreamRef, audioStreamRef].forEach((ref) => {
        ref.current?.getTracks().forEach((track) => track.stop());
        ref.current = null;
      });

      setIsStreaming(false);
      setIsCameraOn(false);
      setIsMicOn(false);
      setIsScreenSharing(false);
      console.log('直播已停止');
    }
  };

  // 弹幕状态
  const toggleDanmu = () => {
    setIsDanmu(!isDanmu);
  };

  const [danmakuList, setDanmakuList] = useState<DanmakuItem[]>([]);

  // 模拟接收弹幕
  useEffect(() => {
    const mockMessages = [
      '欢迎来到直播间！',
      '主播好厉害！',
      '666666',
      '关注主播了',
      '这个游戏好玩吗？',
      '第一次来',
      '游戏真好玩',
      '老铁们点点关注',
      '大家点点赞',
      '大家送送礼物',
      '大家加油加油',
      '111111',
      '檀健次生日快乐',
      '孙颖莎王楚钦健康涨球',
    ];

    const interval = setInterval(() => {
      const randomMsg =
        mockMessages[Math.floor(Math.random() * mockMessages.length)];
      setDanmakuList((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: randomMsg,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          user: `用户${Math.floor(Math.random() * 1000)}`,
        },
      ]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSendDanmaku = (text: string) => {
    console.log('发送弹幕:', text);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 顶部导航栏 */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Radio className="w-18 h-18 text-purple-500" />
              <h1 className="text-xl font-bold">直播工作台</h1>
            </div>

            {isStreaming && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-lg animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm font-semibold">直播中</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-mono">
                    {formatDuration(streamDuration)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-mono">{viewerCount}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg">
              <Wifi
                className={`w-4 h-4 ${networkQuality === 'excellent' ? 'text-green-500' : 'text-yellow-500'}`}
              />
              <span className="text-xs text-gray-400">网络优秀</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-400">CPU {cpuUsage}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-42px)]">
        {/* 左侧预览区 */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {/* 主预览窗口 */}
          <div className="relative p-x-10 bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
            {/* 直播屏幕区 */}
            <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
              <button className="absolute right-0 p-1.5 hover:bg-gray-700 rounded transition">
                <Maximize2 className="w-18 h-18 text-gray-400" />
              </button>
              {/* 屏幕共享优先显示 */}
              {isScreenSharing ? (
                <video
                  ref={screenRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : isCameraOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ opacity: 0 }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <Video className="w-32 h-32 text-gray-700" />
                  <p className="text-gray-500 text-lg">未开启任何视频源</p>
                </div>
              )}
              {/* 新增：Canvas 层，用于绘制抠图后的视频 */}
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full object-cover"
              />

              {/* 画中画 - 摄像头 */}
              {isScreenSharing && isCameraOn && (
                <div className="absolute bottom-4 right-4 w-64 aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700 shadow-2xl">
                  <video
                    ref={pipVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* 状态指示器 */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {isCameraOn && (
                  <div className="flex items-center gap-2 bg-green-600 bg-opacity-90 px-3 py-1.5 rounded-lg backdrop-blur">
                    <Camera className="w-14 h-14" />
                    <span className="text-sm font-semibold">摄像头</span>
                  </div>
                )}
                {isScreenSharing && (
                  <div className="flex items-center gap-2 bg-blue-600 bg-opacity-90 px-3 py-1.5 rounded-lg backdrop-blur">
                    <Monitor className="w-14 h-14" />
                    <span className="text-sm font-semibold">屏幕共享</span>
                  </div>
                )}
              </div>

              {/* 音频电平指示 */}
              {isMicOn && (
                <div className="absolute bottom-4 left-4 flex items-center gap-3 bg-gray-900 bg-opacity-90 px-4 py-2 rounded-lg backdrop-blur">
                  <Volume2 className="w-5 h-5 text-blue-400" />
                  <div className="w-40 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
                      style={{ width: `${audioLevel}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            {/* 弹幕层 */}
            <DanmakuPlayer
              danmakuList={danmakuList}
              onSend={handleSendDanmaku}
              showInput={true}
              config={{
                fontSize: 24,
                speed: 8,
                opacity: 90,
                area: 75,
              }}
              personBounds={personBounds}
              personMask={personMask} // 新增：传递掩码数据用于精确检测
            />
          </div>

          {/* 底部控制栏 */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleCamera}
                disabled={isStreaming}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition ${
                  isCameraOn
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-800 hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isCameraOn ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
                摄像头
              </button>

              <button
                onClick={toggleMicrophone}
                disabled={isStreaming}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition ${
                  isMicOn
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-800 hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isMicOn ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
                麦克风
              </button>

              <button
                onClick={toggleScreenShare}
                disabled={isStreaming}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition ${
                  isScreenSharing
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-gray-800 hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isScreenSharing ? (
                  <Monitor className="w-5 h-5" />
                ) : (
                  <MonitorOff className="w-5 h-5" />
                )}
                屏幕共享
              </button>

              <div className="flex-1"></div>

              <button
                onClick={toggleDanmu}
                className={`flex items-center gap-3 px-8 py-3 rounded-xl font-bold text-lg transition ${
                  isDanmu ? 'bg-orange-4 hover:bg-orange-5' : ''
                }`}
              >
                {isDanmu ? (
                  <>
                    <Square className="w-6 h-6" />
                    关闭弹幕
                  </>
                ) : (
                  <>
                    <Radio className="w-6 h-6" />
                    开启弹幕
                  </>
                )}
              </button>

              <button
                onClick={toggleStreaming}
                className={`flex items-center gap-3 px-8 py-3 rounded-xl font-bold text-lg transition ${
                  isStreaming
                    ? 'bg-red-400 hover:bg-red-500'
                    : 'bg-blue-5 hover:bg-blue-6'
                }`}
              >
                {isStreaming ? (
                  <>
                    <Square className="w-6 h-6" />
                    停止直播
                  </>
                ) : (
                  <>
                    <Radio className="w-6 h-6" />
                    开始直播
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 右侧设置面板 */}
        <div className=" w-m-50 bg-gray-900 border-l border-gray-800 overflow-y-auto">
          <div
            className="float-right m-8"
            onClick={() => setIsSidebar(!isSidebar)}
          >
            <ListTree />
          </div>
          <div
            className="p-6 space-y-6"
            style={{ display: isSidebar ? 'block' : 'none' }}
          >
            {/* 设备设置 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-lg">设备设置</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    摄像头
                  </label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    disabled={isCameraOn || isStreaming}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    {devices.cameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label ||
                          `摄像头 ${camera.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    麦克风
                  </label>
                  <select
                    value={selectedMicrophone}
                    onChange={(e) => setSelectedMicrophone(e.target.value)}
                    disabled={isMicOn || isStreaming}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    {devices.microphones.map((mic) => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `麦克风 ${mic.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 画质设置 */}
            <div className="pt-6 border-t border-gray-800">
              <h3 className="font-bold text-lg mb-4">视频设置</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    分辨率
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['480p', '720p', '1080p'].map((quality) => (
                      <button
                        key={quality}
                        onClick={() => setStreamQuality(quality)}
                        disabled={isCameraOn || isStreaming}
                        className={`py-2 px-4 rounded-lg font-semibold transition ${
                          streamQuality === quality
                            ? 'bg-purple-600'
                            : 'bg-gray-800 hover:bg-gray-700'
                        } disabled:opacity-50`}
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    帧率: {fps} FPS
                  </label>
                  <input
                    type="range"
                    min="24"
                    max="60"
                    step="6"
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value))}
                    disabled={isCameraOn || isStreaming}
                    className="w-full accent-purple-600 disabled:opacity-50"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>24</span>
                    <span>60</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    码率: {bitrate} kbps
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="8000"
                    step="500"
                    value={bitrate}
                    onChange={(e) => setBitrate(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1000</span>
                    <span>8000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 推流信息 */}
            <div className="pt-6 border-t border-gray-800">
              <h3 className="font-bold text-lg mb-4">推流信息</h3>

              <div className="bg-gray-800 rounded-lg p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">视频编码</span>
                  <span className="font-mono">H.264</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">音频编码</span>
                  <span className="font-mono">Opus 48kHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">传输协议</span>
                  <span className="font-mono">WebRTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">当前分辨率</span>
                  <span className="font-mono">{streamQuality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">当前帧率</span>
                  <span className="font-mono">{fps} FPS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">当前码率</span>
                  <span className="font-mono">{bitrate} kbps</span>
                </div>
              </div>
            </div>

            {/* 状态指示 */}
            {isStreaming && (
              <div className="pt-6 border-t border-gray-800">
                <h3 className="font-bold text-lg mb-4">直播状态</h3>

                <div className="space-y-3">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">观看人数</span>
                      <span className="text-2xl font-bold text-purple-400">
                        {viewerCount}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">直播时长</span>
                      <span className="text-xl font-mono text-blue-400">
                        {formatDuration(streamDuration)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
