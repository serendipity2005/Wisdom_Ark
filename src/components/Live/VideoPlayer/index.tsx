import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import './index.scss';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  MessageSquare,
  PictureInPicture,
} from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
}

interface Danmaku {
  id: string;
  text: string;
  time: number;
  color: string;
  type: number; // 0: 滚动, 1: 顶部, 2: 底部
  fontSize: number;
  opacity: number;
  speed: number;
  paused?: boolean;
  top?: number;
}

const VideoPlayer = ({ videoUrl, thumbnailUrl }: VideoPlayerProps) => {
  // 状态管理
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [lastVolume, setLastVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [danmakuEnabled, setDanmakuEnabled] = useState(true);
  const [danmakuOpacity, setDanmakuOpacity] = useState(1);
  const [danmakuArea, setDanmakuArea] = useState('全屏');
  const [danmakuSpeed, setDanmakuSpeed] = useState('正常');
  const [danmakuFontSize, setDanmakuFontSize] = useState('适中');
  const [isPipMode, setIsPipMode] = useState(false);
  const [showPlaybackRate, setShowPlaybackRate] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [activeDanmakus, setActiveDanmakus] = useState<Danmaku[]>([]);
  const [showDanmakuSettings, setShowDanmakuSettings] = useState(false);

  // 引用DOM元素
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const playbackRateRef = useRef<HTMLDivElement>(null);
  const volumeControlRef = useRef<HTMLDivElement>(null);
  const danmakuContainerRef = useRef<HTMLDivElement>(null);
  const danmakuPoolRef = useRef<Danmaku[]>([]);
  const animationFrameRef = useRef<number>(0);
  const danmakuStartTimesRef = useRef<Map<string, number>>(new Map());
  const danmakuPausedRef = useRef<Map<string, boolean>>(new Map());
  const danmakuSettingsRef = useRef<HTMLDivElement>(null);

  // 弹幕数据生成
  const generateDanmakus = (count: number): Danmaku[] => {
    const texts = [
      '前方高能预警！',
      '这个教程太棒了！',
      '学到了学到了',
      '感谢分享！',
      '666666',
      '这个功能太实用了',
      'mark一下',
      '期待下一期',
      '太强了！',
      '已三连',
      '干货满满',
      '老师讲得真好',
      '收藏了',
      '慢慢学习',
      '受益匪浅',
      '支持支持',
      '继续更新啊',
      '讲得很详细',
      '代码写得漂亮',
      '思路清晰',
    ];

    const colors = [
      '#ff4d4f',
      '#1890ff',
      '#52c41a',
      '#faad14',
      '#722ed1',
      '#13c2c2',
      '#eb2f96',
      '#fa8c16',
      '#a0d911',
      '#f5222d',
    ];

    const danmakus: Danmaku[] = [];

    for (let i = 0; i < count; i++) {
      const text = texts[Math.floor(Math.random() * texts.length)];
      const time = Math.random() * (duration || 60);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const type = 0; // 只使用滚动弹幕
      const fontSize = 16 + Math.floor(Math.random() * 12);
      const opacity = 0.7 + Math.random() * 0.3;
      const speed = 1.5 + Math.random() * 0.5; // 提高速度范围到1.5-2.0
      const top = Math.random() * 80;

      danmakus.push({
        id: `danmaku-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        time,
        color,
        type,
        fontSize,
        opacity,
        speed,
        top,
      });
    }

    return danmakus;
  };

  // 格式化时间显示
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 初始化弹幕池
  useEffect(() => {
    if (duration > 0) {
      const danmakus = generateDanmakus(50);
      danmakuPoolRef.current = danmakus;
      console.log('弹幕池初始化完成，共生成', danmakus.length, '条弹幕');
    }
  }, [duration]);

  // 弹幕动画 - 修复弹幕运动逻辑
  useEffect(() => {
    if (!danmakuContainerRef.current) return;

    const animateDanmakus = () => {
      const now = Date.now();

      setActiveDanmakus((prev) => {
        return prev.filter((danmaku) => {
          const element = document.getElementById(danmaku.id);
          if (!element) return false;

          // 处理暂停状态（视频暂停或弹幕被鼠标悬停）
          const isPausedByUser = danmakuPausedRef.current.get(danmaku.id);
          const shouldPause = !isPlaying || isPausedByUser;

          if (shouldPause) {
            return true; // 保持暂停的弹幕
          }

          const startTime = danmakuStartTimesRef.current.get(danmaku.id);
          if (!startTime) return false;

          const elapsed = now - startTime;
          const speedMultiplier =
            danmakuSpeed === '慢' ? 0.8 : danmakuSpeed === '快' ? 1.5 : 1.2;

          // 滚动弹幕
          const baseDuration = 10000 / danmaku.speed / speedMultiplier; // 减少基础时间到5秒，提高速度
          const containerWidth = containerRef.current?.offsetWidth || 1000;
          const elementWidth = element.offsetWidth;
          const duration = baseDuration * (1 + elementWidth / containerWidth);

          if (elapsed > duration) {
            danmakuStartTimesRef.current.delete(danmaku.id);
            return false;
          }

          // 更新位置 - 从右侧滑入，直到完全滑出左侧边界
          const progress = elapsed / duration;
          const translateX =
            containerWidth - progress * (containerWidth + elementWidth);
          element.style.transform = `translateX(${translateX}px)`;

          return true;
        });
      });

      animationFrameRef.current = requestAnimationFrame(animateDanmakus);
    };

    animationFrameRef.current = requestAnimationFrame(animateDanmakus);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [danmakuSpeed, isPlaying]); // 添加isPlaying依赖

  // 检查并发射弹幕
  useEffect(() => {
    if (!videoRef.current) return;

    const checkDanmakus = () => {
      if (!danmakuEnabled) return;

      const currentTime = videoRef.current?.currentTime || 0;

      // 查找所有应该在这个时间点显示的弹幕
      const newDanmakus = danmakuPoolRef.current.filter(
        (danmaku) =>
          Math.abs(danmaku.time - currentTime) < 0.1 &&
          !danmakuStartTimesRef.current.has(danmaku.id),
      );

      if (newDanmakus.length > 0) {
        const now = Date.now();
        newDanmakus.forEach((danmaku) => {
          danmakuStartTimesRef.current.set(danmaku.id, now);
          console.log(
            `弹幕出现: ${danmaku.text} (时间: ${currentTime.toFixed(2)})`,
          );
        });

        setActiveDanmakus((prev) => {
          return [...prev, ...newDanmakus];
        });
      }
    };

    const interval = setInterval(checkDanmakus, 100);
    return () => clearInterval(interval);
  }, [danmakuEnabled, isPlaying]);

  // 处理弹幕鼠标事件
  const handleDanmakuMouseEnter = (danmaku: Danmaku) => {
    danmakuPausedRef.current.set(danmaku.id, true);
    setActiveDanmakus((prev) =>
      prev.map((d) => (d.id === danmaku.id ? { ...d, paused: true } : d)),
    );
    console.log('暂停弹幕:', danmaku.text);
  };

  const handleDanmakuMouseLeave = (danmaku: Danmaku) => {
    danmakuPausedRef.current.delete(danmaku.id);
    setActiveDanmakus((prev) =>
      prev.map((d) => (d.id === danmaku.id ? { ...d, paused: false } : d)),
    );
    console.log('恢复弹幕:', danmaku.text);
  };

  // 播放/暂停切换
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        console.log('视频暂停');
      } else {
        videoRef.current.play();
        console.log('视频播放');
      }
      setIsPlaying(!isPlaying);
    }
  };

  // 静音切换
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        const newVolume = lastVolume || 1;
        videoRef.current.volume = newVolume;
        videoRef.current.muted = false;
        setVolume(newVolume);
        setIsMuted(false);
        console.log('取消静音，音量:', newVolume);
      } else {
        setLastVolume(volume);
        videoRef.current.volume = 0;
        videoRef.current.muted = true;
        setVolume(0);
        setIsMuted(true);
        console.log('开启静音');
      }
    }
  };

  // 全屏切换
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
        setIsFullscreen(true);
        console.log('进入全屏模式');
      } catch (error) {
        console.error('进入全屏失败:', error);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
        console.log('退出全屏模式');
      } catch (error) {
        console.error('退出全屏失败:', error);
      }
    }
  };

  // 小窗播放切换
  const togglePipMode = () => {
    setIsPipMode(!isPipMode);
    console.log('画中画模式:', !isPipMode);
  };

  // 弹幕开关
  const toggleDanmaku = () => {
    setDanmakuEnabled(!danmakuEnabled);
    console.log('弹幕开关:', !danmakuEnabled);
  };

  // 设置播放速度
  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowPlaybackRate(false);
      console.log('播放速度设置为:', rate);
    }
  };

  // 设置音量
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setLastVolume(newVolume);

    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      const newMutedState = newVolume === 0;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
    }

    console.log('音量调整:', newVolume);
  };

  // 点击音量按钮
  const handleVolumeButtonClick = () => {
    toggleMute();
    setShowVolumeControl(true);
  };

  // 进度条点击处理
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && progressBarRef.current) {
      const progressBar = progressBarRef.current;
      const rect = progressBar.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = clickPosition * duration;
      console.log('跳转到:', (clickPosition * duration).toFixed(2), '秒');
    }
  };

  // 进度条拖动处理
  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSeeking && videoRef.current && progressBarRef.current) {
      const progressBar = progressBarRef.current;
      const rect = progressBar.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = clickPosition * duration;
    }
  };

  // 点击外部关闭弹出面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        playbackRateRef.current &&
        !playbackRateRef.current.contains(event.target as Node)
      ) {
        setShowPlaybackRate(false);
      }

      if (
        volumeControlRef.current &&
        !volumeControlRef.current.contains(event.target as Node)
      ) {
        setShowVolumeControl(false);
      }

      if (
        danmakuSettingsRef.current &&
        !danmakuSettingsRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.danmaku-control')
      ) {
        setShowDanmakuSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'p':
          togglePipMode();
          break;
        case 'd':
          toggleDanmaku();
          break;
        case 'ArrowRight':
          videoRef.current.currentTime += 5;
          console.log('快进5秒');
          break;
        case 'ArrowLeft':
          videoRef.current.currentTime -= 5;
          console.log('后退5秒');
          break;
        case 'ArrowUp':
          setVolume((prev) => {
            const newVolume = Math.min(prev + 0.1, 1);
            setLastVolume(newVolume);
            if (videoRef.current) {
              videoRef.current.volume = newVolume;
              videoRef.current.muted = false;
              setIsMuted(false);
            }
            console.log('音量增加:', newVolume);
            return newVolume;
          });
          setShowVolumeControl(true);
          break;
        case 'ArrowDown':
          setVolume((prev) => {
            const newVolume = Math.max(prev - 0.1, 0);
            setLastVolume(newVolume);
            if (videoRef.current) {
              videoRef.current.volume = newVolume;
              videoRef.current.muted = newVolume === 0;
              setIsMuted(newVolume === 0);
            }
            console.log('音量减少:', newVolume);
            return newVolume;
          });
          setShowVolumeControl(true);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isPlaying, isPipMode, danmakuEnabled]);

  // 控制条自动隐藏
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
          setShowPlaybackRate(false);
          setShowVolumeControl(false);
        }
      }, 3000);
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isPlaying]);

  // 视频加载处理
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      console.log('视频加载完成，时长:', formatTime(video.duration));

      // 视频加载完成后初始化弹幕池
      const danmakus = generateDanmakus(50);
      danmakuPoolRef.current = danmakus;
      console.log('弹幕池初始化完成，共生成', danmakus.length, '条弹幕');
    };

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(video.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      console.log('视频播放结束');
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isSeeking, volume]);

  // 弹幕设置选项
  const opacityOptions = [0.2, 0.4, 0.6, 0.8, 1];
  const areaOptions = ['顶部', '底部', '全屏'];
  const speedOptions = ['慢', '正常', '快'];
  const fontSizeOptions = ['小', '适中', '大'];

  // 根据设置获取弹幕样式
  const getDanmakuStyle = (danmaku: Danmaku): React.CSSProperties => {
    const speedMultiplier =
      danmakuSpeed === '慢' ? 0.8 : danmakuSpeed === '快' ? 1.5 : 1.2;
    const fontSizeMultiplier =
      danmakuFontSize === '小' ? 0.8 : danmakuFontSize === '大' ? 1.2 : 1;

    return {
      color: danmaku.color,
      fontSize: `${danmaku.fontSize * fontSizeMultiplier}px`,
      opacity: danmaku.opacity * danmakuOpacity,
      transition: 'transform 0.1s linear',
      padding: '4px 12px',
      borderRadius: '16px',
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(6px)',
      pointerEvents: 'auto',
      zIndex: 5,
      textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)',
      cursor: 'pointer',
      willChange: 'transform',
      position: 'absolute',
      whiteSpace: 'nowrap',
      top: `${danmaku.top || Math.random() * 80}%`,
      right: '0',
      transform: 'translateX(100%)',
    };
  };

  // 添加CSS动画
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .danmaku-item:hover {
        background: rgba(0, 0, 0, 0.7);
        transform: scale(1.05) translateX(var(--current-pos)) !important;
        z-index: 10;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`video-player-container ${isFullscreen ? 'fullscreen' : ''} ${isPipMode ? 'pip-mode' : ''}`}
      onDoubleClick={toggleFullscreen}
    >
      {/* 视频元素 */}
      <video
        ref={videoRef}
        className="video-element"
        src={videoUrl}
        poster={thumbnailUrl}
        onClick={togglePlay}
      />

      {/* 弹幕容器 */}
      <div
        ref={danmakuContainerRef}
        className="danmaku-container"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'visible',
          pointerEvents: danmakuEnabled ? 'auto' : 'none',
          zIndex: 10,
        }}
      >
        {activeDanmakus.map((danmaku) => (
          <div
            key={danmaku.id}
            id={danmaku.id}
            className="danmaku-item"
            style={getDanmakuStyle(danmaku)}
            onMouseEnter={() => handleDanmakuMouseEnter(danmaku)}
            onMouseLeave={() => handleDanmakuMouseLeave(danmaku)}
          >
            {danmaku.text}
          </div>
        ))}
      </div>

      {/* 控制条覆盖层 */}
      <div
        className={`video-overlay ${showControls ? 'controls-visible' : 'controls-hidden'}`}
        style={{ zIndex: 20 }}
      >
        {/* 中央播放按钮 */}
        {!isPlaying && (
          <button className="center-play-button" onClick={togglePlay}>
            <Play size={64} />
          </button>
        )}

        {/* 横向进度条 */}
        <div
          className="horizontal-progress-container"
          ref={progressBarRef}
          onClick={handleProgressClick}
          onMouseDown={() => setIsSeeking(true)}
          onMouseUp={() => setIsSeeking(false)}
          onMouseMove={handleProgressDrag}
          onMouseLeave={() => setIsSeeking(false)}
        >
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              }}
            >
              <div className="progress-handle"></div>
            </div>
          </div>
          <div className="progress-time">{formatTime(currentTime)}</div>
        </div>

        {/* 底部控制条 */}
        <div className="video-controls">
          <div className="controls-wrapper">
            <div className="left-controls">
              <button className="control-btn" onClick={togglePlay}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="right-controls">
              <div className="playback-rate-control" ref={playbackRateRef}>
                <button
                  className="control-text rate-btn"
                  onClick={() => setShowPlaybackRate(!showPlaybackRate)}
                  onMouseEnter={() => setShowPlaybackRate(true)}
                >
                  {playbackRate}x
                </button>
                {showPlaybackRate && (
                  <div className="rate-options">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        className={playbackRate === rate ? 'active' : ''}
                        onClick={() => changePlaybackRate(rate)}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="volume-control"
                ref={volumeControlRef}
                onMouseEnter={() => setShowVolumeControl(true)}
                onMouseLeave={() => setShowVolumeControl(false)}
              >
                <div className="volume-btn">
                  <button
                    className="control-btn"
                    onClick={handleVolumeButtonClick}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX size={20} />
                    ) : (
                      <Volume2 size={20} />
                    )}
                  </button>
                </div>
                {showVolumeControl && (
                  <div className="volume-slider-container">
                    <input
                      type="range"
                      className="volume-slider"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                    />
                    <div className="volume-value">
                      {Math.round(volume * 100)}%
                    </div>
                  </div>
                )}
              </div>

              <div className="danmaku-control">
                <button
                  className={`control-btn ${danmakuEnabled ? 'active' : ''}`}
                  onMouseEnter={() => setShowDanmakuSettings(true)}
                >
                  <MessageSquare size={20} />
                </button>

                {showDanmakuSettings && (
                  <div
                    className="danmaku-settings-panel"
                    ref={danmakuSettingsRef}
                    onMouseEnter={() => setShowDanmakuSettings(true)}
                    onMouseLeave={() => setShowDanmakuSettings(false)}
                  >
                    <div className="panel-header">
                      <h3>弹幕设置</h3>
                      <button
                        className="reset-btn"
                        onClick={() => {
                          setDanmakuOpacity(1);
                          setDanmakuArea('全屏');
                          setDanmakuSpeed('正常');
                          setDanmakuFontSize('适中');
                          console.log('弹幕设置已重置');
                        }}
                      >
                        重置
                      </button>
                    </div>

                    <div className="setting-group">
                      <div className="setting-item">
                        <label>不透明度</label>
                        <div className="option-buttons">
                          {opacityOptions.map((opacity) => (
                            <button
                              key={opacity}
                              className={
                                danmakuOpacity === opacity ? 'active' : ''
                              }
                              onClick={() => {
                                setDanmakuOpacity(opacity);
                                console.log('弹幕不透明度设置为:', opacity);
                              }}
                            >
                              {opacity}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="setting-item">
                        <label>显示区域</label>
                        <div className="option-buttons">
                          {areaOptions.map((area) => (
                            <button
                              key={area}
                              className={danmakuArea === area ? 'active' : ''}
                              onClick={() => {
                                setDanmakuArea(area);
                                console.log('弹幕显示区域设置为:', area);
                              }}
                            >
                              {area}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="setting-item">
                        <label>弹幕速度</label>
                        <div className="option-buttons">
                          {speedOptions.map((speed) => (
                            <button
                              key={speed}
                              className={danmakuSpeed === speed ? 'active' : ''}
                              onClick={() => {
                                setDanmakuSpeed(speed);
                                console.log('弹幕速度设置为:', speed);
                              }}
                            >
                              {speed}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="setting-item">
                        <label>字体大小</label>
                        <div className="option-buttons">
                          {fontSizeOptions.map((size) => (
                            <button
                              key={size}
                              className={
                                danmakuFontSize === size ? 'active' : ''
                              }
                              onClick={() => {
                                setDanmakuFontSize(size);
                                console.log('弹幕字体大小设置为:', size);
                              }}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="danmaku-toggle">
                      <label>显示弹幕</label>
                      <div className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={danmakuEnabled}
                          onChange={toggleDanmaku}
                        />
                        <span className="slider"></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pip-control">
                <button className="control-btn" onClick={togglePipMode}>
                  <PictureInPicture size={20} />
                </button>
              </div>

              <button className="control-btn" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <Minimize2 size={20} />
                ) : (
                  <Maximize2 size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
