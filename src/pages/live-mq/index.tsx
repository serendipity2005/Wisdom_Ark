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
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);
  const [devices, setDevices] = useState<{
    cameras: MediaDeviceInfo[];
    microphones: MediaDeviceInfo[];
  }>({ cameras: [], microphones: [] });
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');
  const [streamQuality, setStreamQuality] = useState('1080p');
  const [bitrate, setBitrate] = useState(3500);
  const [fps, setFps] = useState(30);
  const [audioLevel, setAudioLevel] = useState(0);
  const [networkQuality] = useState('excellent');
  const [cpuUsage, setCpuUsage] = useState(0);
  const [isSidebar, setIsSidebar] = useState(true);
  const [isDanmu, setIsDanmu] = useState(true);
  const [personMask, setPersonMask] = useState<ImageData | null>(null);
  const [segmenter, setSegmenter] =
    useState<bodySegmentation.BodySegmenter | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [backgroundImg, setBackgroundImg] = useState<HTMLImageElement | null>(
    null,
  );

  // WebRTC 推流管理类
  class WebRTCPublisher {
    private pc: RTCPeerConnection | null = null;
    private ws: WebSocket | null = null;
    private streamKey: string;

    constructor(streamKey: string) {
      this.streamKey = streamKey;
    }

    async connect(signalingServerUrl: string) {
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

      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      this.pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendMessage({
            type: 'ice-candidate',
            candidate: event.candidate,
            streamKey: this.streamKey,
          });
        }
      };

      this.pc.onconnectionstatechange = () => {
        console.log('连接状态:', this.pc?.connectionState);
      };

      this.pc.oniceconnectionstatechange = () => {
        console.log('ICE 状态:', this.pc?.iceConnectionState);
      };
    }

    private authenticate() {
      this.sendMessage({
        type: 'auth',
        streamKey: this.streamKey,
        protocol: 'webrtc',
      });
    }

    async addTracks(streams: {
      video?: MediaStream;
      audio?: MediaStream;
      screen?: MediaStream;
    }) {
      if (!this.pc) throw new Error('PeerConnection 未初始化');

      if (streams.video) {
        streams.video.getVideoTracks().forEach((track) => {
          this.pc!.addTrack(track, streams.video!);
        });
      }

      if (streams.screen) {
        streams.screen.getVideoTracks().forEach((track) => {
          this.pc!.addTrack(track, streams.screen!);
        });
      }

      if (streams.audio) {
        streams.audio.getAudioTracks().forEach((track) => {
          this.pc!.addTrack(track, streams.audio!);
        });
      }

      const offer = await this.pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });

      await this.pc.setLocalDescription(offer);

      this.sendMessage({
        type: 'offer',
        sdp: offer,
        streamKey: this.streamKey,
      });
    }

    private async handleSignalingMessage(message: any) {
      if (!this.pc) return;

      switch (message.type) {
        case 'answer':
          await this.pc.setRemoteDescription(
            new RTCSessionDescription({
              type: message.type,
              sdp: message.sdp,
            }),
          );
          break;

        case 'ice-candidate':
          if (message.candidate) {
            await this.pc.addIceCandidate(
              new RTCIceCandidate(message.candidate),
            );
          }
          break;

        case 'error':
          console.error('❌ 服务器错误:', message.error);
          break;
      }
    }

    private sendMessage(message: any) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }

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
          };
        }
      });

      return result;
    }

    disconnect() {
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }

      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
    }
  }

  useEffect(() => {
    if (isScreenSharing) {
      if (screenRef.current && screenStreamRef.current) {
        screenRef.current.srcObject = screenStreamRef.current;
      }
      if (isCameraOn && pipVideoRef.current && cameraStreamRef.current) {
        pipVideoRef.current.srcObject = cameraStreamRef.current;
      }
    } else if (isCameraOn) {
      if (videoRef.current && cameraStreamRef.current) {
        videoRef.current.srcObject = cameraStreamRef.current;
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
    let interval: any;
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

  useEffect(() => {
    if (isMicOn && audioStreamRef.current) {
      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
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
    const img = new Image();
    img.src = '/tjc.jpg';
    img.onload = () => setBackgroundImg(img);
    img.onerror = () => console.error('背景图加载失败');
  }, []);

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

    const maskImageData = await bodySegmentation.toBinaryMask(
      segmentation,
      { r: 255, g: 255, b: 255, a: 255 },
      { r: 0, g: 0, b: 0, a: 0 },
    );

    // 🎯 更新弹幕遮罩数据
    setPersonMask(maskImageData);

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    maskCtx.putImageData(maskImageData, 0, 0);

    const personCanvas = document.createElement('canvas');
    personCanvas.width = canvas.width;
    personCanvas.height = canvas.height;
    const personCtx = personCanvas.getContext('2d');
    if (!personCtx) return;

    personCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
    personCtx.globalCompositeOperation = 'destination-in';
    personCtx.drawImage(maskCanvas, 0, 0);
    personCtx.globalCompositeOperation = 'source-over';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundImg) {
      ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(personCanvas, 0, 0);

    requestAnimationFrame(processSegmentation);
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
    }
  };

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
      } catch (error) {
        console.error('无法访问麦克风:', error);
        alert('无法访问麦克风，请检查权限设置');
      }
    } else {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        audioStreamRef.current = null;
      }
      setIsMicOn(false);
    }
  };

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

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };
      } catch (error) {
        console.error('无法共享屏幕:', error);
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        screenStreamRef.current = null;
      }
      if (screenRef.current) {
        screenRef.current.srcObject = null;
      }

      setIsScreenSharing(false);
    }
  };

  const toggleStreaming = async () => {
    if (!isStreaming) {
      if (!isCameraOn && !isScreenSharing) {
        alert('请先开启摄像头或屏幕共享');
        return;
      }
      setIsStreaming(true);
    } else {
      [cameraStreamRef, screenStreamRef, audioStreamRef].forEach((ref) => {
        ref.current?.getTracks().forEach((track) => track.stop());
        ref.current = null;
      });

      setIsStreaming(false);
      setIsCameraOn(false);
      setIsMicOn(false);
      setIsScreenSharing(false);
    }
  };

  const toggleDanmu = () => {
    setIsDanmu(!isDanmu);
  };

  const [danmakuList, setDanmakuList] = useState<DanmakuItem[]>([]);

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
            {/* 🎯 弹幕层（支持人像遮挡） */}
            {isDanmu && (
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
                personMask={personMask}
              />
            )}
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
