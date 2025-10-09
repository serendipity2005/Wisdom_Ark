// 音量检测
export class Audio {
  // Rtc 类内新增字段
  private audioCtx?: AudioContext;
  private analyser?: AnalyserNode;
  private monitorSrc?: MediaStreamAudioSourceNode;
  private monitorRafId?: number;
  private lastAboveTs = 0;

  // 开始音量监测：默认监测 this.currentStream，也可传入任意带音频的 stream（如屏幕共享带音频）
  public startAudioLevelMonitor(
    stream: MediaStream | null,
    onLevel?: (level: number, isSpeaking: boolean) => void,
    options: { threshold?: number; holdMs?: number; smoothing?: number } = {},
  ) {
    if (!stream) throw new Error('没有可用的音频流用于监测');
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) throw new Error('流中没有音频轨道');

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
    } catch (error) {
      console.log(error);
    }
    this.monitorSrc = undefined;
    this.analyser = undefined;
  }
}
