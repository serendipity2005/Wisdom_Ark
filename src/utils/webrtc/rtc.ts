import { message } from 'antd';

export class Rtc {
  constraints: MediaStreamConstraints;
  private currentStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null; // 屏幕共享流
  audioState = false;
  videoState = false;
  isLive = false;
  _isScreenSharing = false;

  videoElement: HTMLVideoElement | null = null;
  screenVideoElement: HTMLVideoElement | null = null; // 屏幕共享视频元素
  private listeners: Record<string, any[]> = {};
  // 连接的映射
  private connectorInfoMap = new Map();

  // Rtc 类内新增字段
  private audioCtx?: AudioContext;
  private analyser?: AnalyserNode;
  private monitorSrc?: MediaStreamAudioSourceNode;
  private monitorRafId?: number;
  private lastAboveTs = 0;

  constructor(options: Options) {
    this.constraints = options.constraints;
  }

  get isScreenSharing() {
    return this._isScreenSharing;
  }

  set isScreenSharing(value: boolean) {
    this._isScreenSharing = value;
    this.emit('screenSharingChange', value);
  }
  // 开始音量监测：默认监测 this.currentStream，也可传入任意带音频的 stream（如屏幕共享带音频）
  public startAudioLevelMonitor(
    stream: MediaStream | null = this.getCurrentStream(),
    onLevel?: (level: number, isSpeaking: boolean) => void,
    options: { threshold?: number; holdMs?: number; smoothing?: number } = {},
  ) {
    if (!stream) throw new Error('没有可用的音频流用于监测');
    const audioTrack = stream.getAudioTracks()[0];
    console.log(stream.getTracks(), 'stream.getAudioTracks');

    if (!audioTrack) throw new Error('流中没有音频轨道');
    console.log(audioTrack, 'audioTrack');

    const threshold = options.threshold ?? 0.02; // 说话阈值（0~1，经验值）
    const holdMs = options.holdMs ?? 250; // 松弛时间：离开阈值后仍判定“说话中”的时间
    const smoothing = options.smoothing ?? 0.8; // 平滑

    this.audioCtx ??= new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    this.monitorSrc?.disconnect();
    this.analyser?.disconnect();

    this.monitorSrc = this.audioCtx.createMediaStreamSource(stream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = smoothing;
    this.monitorSrc.connect(this.analyser);

    const buffer = new Uint8Array(this.analyser.fftSize);

    const tick = () => {
      if (!this.analyser) return;
      this.analyser.getByteTimeDomainData(buffer);

      // 计算 RMS（0~1）
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] - 128) / 128; // 归一化到 -1~1
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buffer.length);

      const now = performance.now();
      if (rms >= threshold) this.lastAboveTs = now;
      const isSpeaking = now - this.lastAboveTs <= holdMs;

      onLevel?.(rms, isSpeaking);
      this.monitorRafId = requestAnimationFrame(tick);
    };

    cancelAnimationFrame(this.monitorRafId!);
    this.monitorRafId = requestAnimationFrame(tick);
  }

  // 停止音量监测
  public stopAudioLevelMonitor() {
    if (this.monitorRafId) cancelAnimationFrame(this.monitorRafId);
    this.monitorRafId = undefined;
    try {
      this.monitorSrc?.disconnect();
      this.analyser?.disconnect();
    } catch (err) {
      console.log(err);
    }
    this.monitorSrc = undefined;
    this.analyser = undefined;
  }
  // 获取所有设备信息
  public async getDevicesInfoList() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices;
  }
  // 开启摄像头
  public async startCamera() {
    // if (!this.isLive) return message.error('请先开启直播');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false, // 只开启视频
      });

      this.currentStream = stream;
      this.isLive = true;
      console.log('111111');

      if (this.videoElement) {
        this.videoElement.srcObject = stream;
      }

      return stream;
    } catch (error) {
      console.error('开启摄像头失败:', error);
      throw error;
    }
  }

  // 开启麦克风
  public async startMicrophone() {
    try {
      if (!this.currentStream) {
        // 如果没有视频流，创建只有音频的流
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        this.currentStream = audioStream;
      } else {
        // 如果已有视频流，添加音频轨道
        const videoTracks = this.currentStream.getVideoTracks();
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const audioTrack = audioStream.getAudioTracks()[0];
        // 3. 关键：重新创建流，合并“旧视频轨道”和“新音频轨道”
        // （替代 addTrack，避免浏览器兼容性问题）
        this.currentStream = new MediaStream([...videoTracks, audioTrack]);
        audioStream.getAudioTracks().forEach((track) => {
          this.currentStream!.addTrack(track);
        });
        // 4. 同步更新视频元素（确保画面不中断）
        if (this.videoElement) {
          this.videoElement.srcObject = this.currentStream;
        }
      }
      message.success('开启麦克风成功');
      this.emit('microphoneStarted', this.currentStream); // 新增：通知外部麦克风已开启
      return this.currentStream;
    } catch (error) {
      console.error('开启麦克风失败:', error);
      throw error;
    }
  }

  // 停止摄像头
  public stopCamera() {
    if (this.currentStream) {
      const videoTracks = this.currentStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.stop();
      });

      // 如果只有视频轨道，清空整个流
      if (this.currentStream.getAudioTracks().length === 0) {
        this.currentStream = null;
      }
    }
  }

  // 停止麦克风
  public stopMicrophone() {
    if (this.currentStream) {
      const audioTracks = this.currentStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.stop();
      });

      // 如果只有音频轨道，清空整个流
      if (this.currentStream.getVideoTracks().length === 0) {
        this.currentStream = null;
      }
    }
  }

  // 获取当前流
  public getCurrentStream() {
    return this.currentStream;
  }

  // 切换设备状态
  async deviceSwitch(state: boolean, kind: 'audio' | 'video') {
    if (kind === 'video') {
      this.videoState = state || false;
      if (state) {
        await this.startCamera();
      } else {
        this.stopCamera();
      }
    } else if (kind === 'audio') {
      this.audioState = state;
      if (state) {
        await this.startMicrophone();
      } else {
        this.stopMicrophone();
      }
    }
  }

  // 切换音频输入设备(如麦克风 耳机  输入进电脑的)

  async switchAudioInput(deviceId: string) {
    try {
      if (!this.currentStream) {
        message.error('没有活动的媒体流');
      }

      // 停止当前音频轨道
      const audioTracks = this.currentStream.getAudioTracks();
      audioTracks.forEach((track) => track.stop());
      // 获取新的音频流
      const newAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false,
      });

      // 添加新的音频轨道到当前流
      newAudioStream.getAudioTracks().forEach((track) => {
        this.currentStream!.addTrack(track);
      });

      // 更新视频元素
      if (this.videoElement) {
        this.videoElement.srcObject = this.currentStream;
      }

      return this.currentStream;
    } catch (error) {
      console.error('切换音频输入设备失败:', error);
      throw error;
    }
  }

  // 切换视频输入设备
  async switchVideoInput(deviceId: string) {
    try {
      if (!this.currentStream) {
        throw new Error('没有活动的媒体流');
      }

      // 停止当前视频轨道
      const videoTracks = this.currentStream.getVideoTracks();
      videoTracks.forEach((track) => track.stop());

      // 获取新的视频流
      const newVideoStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      });

      // 添加新的视频轨道到当前流
      newVideoStream.getVideoTracks().forEach((track) => {
        this.currentStream!.addTrack(track);
      });

      // 更新视频元素
      if (this.videoElement) {
        this.videoElement.srcObject = this.currentStream;
      }

      return this.currentStream;
    } catch (error) {
      console.error('切换视频输入设备失败:', error);
      throw error;
    }
  }

  // 开启屏幕共享
  public async startScreenShare(options: {
    preferCurrentTab?: boolean;
    preferDisplaySurface?: 'monitor' | 'window' | 'browser';
  }) {
    console.log('屏幕共享 videoState', this.videoState);

    try {
      const constraints = {
        video: {
          displaySurface: options?.preferDisplaySurface || 'monitor',
          cursor: 'always',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      };
      if (options?.preferCurrentTab) {
        constraints.video = {
          ...constraints.video,
          displaySurface: 'browser',
        };
      }

      const screenStream =
        await navigator.mediaDevices.getDisplayMedia(constraints);
      this.screenStream = screenStream;
      this.isScreenSharing = true; //屏幕共享状态
      if (!this.videoState && this.videoElement) {
        this.videoElement.srcObject = screenStream;
      } else if (this.videoState && this.screenVideoElement) {
        this.screenVideoElement.srcObject = screenStream;
      }

      // 监听屏幕共享结束
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopScreenShare();
        message.info('屏幕共享已结束');
      });

      return screenStream;
    } catch (error) {
      console.error('开启屏幕共享失败:', error);
      throw error;
    }
  }

  // 停止屏幕共享
  public stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
      this.screenStream = null;
    }
    this.isScreenSharing = false;

    if (this.screenVideoElement) {
      this.screenVideoElement.srcObject = null;
    }
  }

  // 获取屏幕共享流
  public getScreenStream() {
    return this.screenStream;
  }

  // 设置屏幕共享视频元素
  public setScreenVideoElement(element: HTMLVideoElement | null) {
    this.screenVideoElement = element;
    if (element && this.screenStream) {
      element.srcObject = this.screenStream;
    }
  }

  on(event: string, callback: any) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: any) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(
      (cb) => cb !== callback,
    );
  }

  private emit(event: string, data: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => callback(data));
  }
}

interface Options {
  constraints: MediaStreamConstraints;
}
