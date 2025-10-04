import { message } from 'antd';

export class Rtc {
  constraints: MediaStreamConstraints;
  private currentStream: MediaStream | null = null;
  audioState = false;
  videoState = false;
  isLive = false;
  // 连接的映射
  private connectorInfoMap = new Map();
  videoElement: HTMLVideoElement | null = null;
  constructor(options: Options) {
    this.constraints = options.constraints;
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
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioStream.getAudioTracks().forEach((track) => {
          this.currentStream!.addTrack(track);
        });
      }
      message.success('开启麦克风成功');
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
}

interface Options {
  constraints: MediaStreamConstraints;
}
