import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Settings, Pause, Play, Trash2, Zap } from 'lucide-react';

// 弹幕项接口
interface DanmakuItem {
  id: number;
  text: string;
  color?: string;
  fontSize?: number;
  speed?: number;
  avatar?: string;
  user?: string;
  track?: number;
  startTime: number;
  width?: number; // 用于碰撞检测
}

// 弹幕配置接口
interface DanmakuConfig {
  fontSize?: number;
  speed?: number;
  opacity?: number;
  area?: number;
  unlimited?: boolean;
  dense?: boolean;
  antiOverlap?: boolean; // 新增：防止弹幕重叠
}

// 弹幕组件 Props
interface DanmakuPlayerProps {
  danmakuList?: DanmakuItem[];
  config?: DanmakuConfig;
  onSend?: (text: string) => void;
  showInput?: boolean;
  className?: string;
  style?: React.CSSProperties;
  personBounds?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  } | null;
  personMask?: ImageData | null;
}

export default function DanmakuPlayer({
  danmakuList = [],
  config = {},
  onSend,
  showInput = true,
  className = '',
  style = {},
  personMask = null,
}: DanmakuPlayerProps) {
  const [inputText, setInputText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStressTest, setShowStressTest] = useState(false);
  const [stressTestRunning, setStressTestRunning] = useState(false);
  const [danmakuCount, setDanmakuCount] = useState(0);
  const [stressTestConfig, setStressTestConfig] = useState({
    rate: 10,
    duration: 10,
    randomColor: true,
    randomSpeed: true,
  });

  const stressTestIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [localConfig, setLocalConfig] = useState<DanmakuConfig>({
    fontSize: 24,
    speed: 5,
    opacity: 100,
    area: 100,
    unlimited: false,
    dense: false,
    antiOverlap: true, // 默认开启防重叠
    ...config,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const danmakuIdRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // 🚀 性能优化：使用 ref 存储弹幕，避免频繁 setState
  const danmakusRef = useRef<DanmakuItem[]>([]);
  const lastCleanupTimeRef = useRef(Date.now());

  // 🎯 轨道信息：存储每个轨道最后一个弹幕的信息
  const trackInfoRef = useRef<
    {
      lastDanmaku: DanmakuItem | null;
      lastStartTime: number;
    }[]
  >([]);

  // 初始化轨道
  useEffect(() => {
    if (!containerRef.current) return;
    const trackCount = Math.floor(
      (containerRef.current.offsetHeight * (localConfig.area || 100)) /
        100 /
        ((localConfig.fontSize || 24) + 10),
    );
    trackInfoRef.current = new Array(trackCount).fill(null).map(() => ({
      lastDanmaku: null,
      lastStartTime: 0,
    }));
  }, [localConfig.fontSize, localConfig.area]);

  // 🚀 优化：Canvas 渲染使用 ref，减少重渲染
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let lastFrameTime = Date.now();
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const render = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastFrameTime;

      // 🚀 帧率控制：跳过过快的帧
      if (deltaTime < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      lastFrameTime = currentTime - (deltaTime % frameInterval);

      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx || isPaused) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 🚀 性能优化：批量清理过期弹幕（每秒一次）
      if (currentTime - lastCleanupTimeRef.current > 1000) {
        danmakusRef.current = danmakusRef.current.filter((d) => {
          const elapsed = (currentTime - d.startTime) / 1000;
          return elapsed < (d.speed ?? localConfig.speed ?? 5);
        });
        lastCleanupTimeRef.current = currentTime;
      }

      const activeDanmakus = danmakusRef.current;

      // 🚀 优化：预计算遮罩比例
      const scaleX = personMask ? personMask.width / canvas.width : 0;
      const scaleY = personMask ? personMask.height / canvas.height : 0;

      // 绘制所有弹幕
      for (let i = 0; i < activeDanmakus.length; i++) {
        const danmaku = activeDanmakus[i];
        const elapsed = (currentTime - danmaku.startTime) / 1000;
        const progress = elapsed / (danmaku.speed ?? localConfig.speed ?? 5);

        if (progress >= 1 || progress < 0) continue;

        // 计算位置
        const startX = canvas.width;
        const endX = -500;
        const x = startX + (endX - startX) * progress;
        const y = danmaku.track * (danmaku.fontSize + 10) + danmaku.fontSize;

        // 🚀 优化：提前跳过屏幕外的弹幕
        if (x > canvas.width || x < endX) continue;

        // 设置字体样式
        ctx.font = `bold ${danmaku.fontSize}px Arial, sans-serif`;
        ctx.fillStyle = danmaku.color;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        const fullText = `${danmaku.user ? `[${danmaku.user}] ` : ''}${danmaku.text}`;

        // 缓存文本宽度
        if (!danmaku.width) {
          danmaku.width = ctx.measureText(fullText).width;
        }
        const textWidth = danmaku.width;

        // 🚀 优化：人像遮罩检测
        if (personMask && canvas.width > 0 && canvas.height > 0) {
          const segments: { start: number; end: number }[] = [];
          let segmentStart = 0;
          let inPerson = false;

          // 🚀 优化：动态调整检测步长（根据速度）
          const checkStep = progress < 0.1 || progress > 0.9 ? 16 : 12;

          for (let offset = 0; offset <= textWidth; offset += checkStep) {
            const checkX = Math.floor((x + offset) * scaleX);
            const checkY = Math.floor(y * scaleY);

            let isPerson = false;

            if (
              checkX >= 0 &&
              checkX < personMask.width &&
              checkY >= 0 &&
              checkY < personMask.height
            ) {
              const maskIndex = (checkY * personMask.width + checkX) * 4;
              isPerson = personMask.data[maskIndex] === 255;
            }

            if (isPerson && !inPerson) {
              if (offset > segmentStart) {
                segments.push({ start: segmentStart, end: offset });
              }
              inPerson = true;
              segmentStart = offset;
            } else if (!isPerson && inPerson) {
              inPerson = false;
              segmentStart = offset;
            }
          }

          if (!inPerson && segmentStart < textWidth) {
            segments.push({ start: segmentStart, end: textWidth });
          }

          // 🚀 优化：减少 save/restore 调用
          for (let j = 0; j < segments.length; j++) {
            const segment = segments[j];
            ctx.save();
            ctx.beginPath();
            ctx.rect(
              x + segment.start,
              y - danmaku.fontSize,
              segment.end - segment.start,
              danmaku.fontSize + 5,
            );
            ctx.clip();
            ctx.fillText(fullText, x, y);
            ctx.restore();
          }
        } else {
          ctx.fillText(fullText, x, y);
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [personMask, isPaused, localConfig.fontSize]);

  // 🎯 改进的轨道选择算法
  const getAvailableTrack = useCallback(
    (textWidth: number, speed: number): number => {
      const canvas = canvasRef.current;
      if (!canvas) return 0;

      const trackCount = trackInfoRef.current.length;

      // 无限模式：随机分配
      if (localConfig.unlimited) {
        return Math.floor(Math.random() * trackCount);
      }

      const currentTime = Date.now();

      // 🎯 查找可用轨道
      for (let i = 0; i < trackCount; i++) {
        const trackInfo = trackInfoRef.current[i];

        // 轨道为空，直接使用
        if (!trackInfo.lastDanmaku) {
          return i;
        }

        // 🎯 防碰撞检测
        if (localConfig.antiOverlap) {
          const lastDanmaku = trackInfo.lastDanmaku;
          const elapsed = (currentTime - lastDanmaku.startTime) / 1000;
          const lastSpeed = lastDanmaku.speed ?? localConfig.speed ?? 5;
          const lastProgress = elapsed / lastSpeed;

          // 计算上一个弹幕当前位置
          const lastX = canvas.width + (-500 - canvas.width) * lastProgress;
          const lastWidth = lastDanmaku.width || 200;
          const baseGap = lastWidth + textWidth + 50; // 同时考虑两条的宽度
          const speedRatio = Math.max(1, (speed || 5) / lastSpeed);
          // 新弹幕更快时，放大所需初始间距，避免追尾
          const safeDistance = baseGap * speedRatio;
          const canvasSafeZone = canvas.width - safeDistance;

          if (lastX < canvasSafeZone) {
            return i;
          }
        } else {
          // 不防碰撞模式：简单的时间间隔检查
          const timeSinceLastDanmaku = currentTime - trackInfo.lastStartTime;
          const minInterval = 300; // 最小间隔 300ms

          if (timeSinceLastDanmaku > minInterval) {
            return i;
          }
        }
      }

      // 密集模式：所有轨道都占用时随机选择
      if (localConfig.dense) {
        return Math.floor(Math.random() * trackCount);
      }

      // 默认：返回最久未使用的轨道
      let oldestTrack = 0;
      let oldestTime = trackInfoRef.current[0].lastStartTime;

      for (let i = 1; i < trackCount; i++) {
        if (trackInfoRef.current[i].lastStartTime < oldestTime) {
          oldestTime = trackInfoRef.current[i].lastStartTime;
          oldestTrack = i;
        }
      }

      return oldestTrack;
    },
    [localConfig.unlimited, localConfig.dense, localConfig.antiOverlap],
  );

  // 🚀 优化：使用 ref 直接操作，避免频繁 setState
  const addDanmaku = useCallback(
    (item: Partial<DanmakuItem>) => {
      if (isPaused) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const id = danmakuIdRef.current++;
      const speed = item.speed || localConfig.speed || 5;
      const startTime = Date.now();
      const fontSize = item.fontSize || localConfig.fontSize || 24;

      // 预计算文本宽度
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        const fullText = `${item.user ? `[${item.user}] ` : ''}${item.text || ''}`;
        const textWidth = ctx.measureText(fullText).width;

        // 根据文本宽度和速度选择轨道
        const track = getAvailableTrack(textWidth, speed);

        const newDanmaku: DanmakuItem = {
          id,
          text: item.text || '',
          color: item.color || '#FFFFFF',
          fontSize,
          speed,
          avatar: item.avatar,
          user: item.user,
          track,
          startTime,
          width: textWidth,
        };

        // 🚀 直接操作 ref，不触发重渲染
        danmakusRef.current.push(newDanmaku);
        setDanmakuCount((prev) => prev + 1);

        // 更新轨道信息
        if (track < trackInfoRef.current.length) {
          trackInfoRef.current[track] = {
            lastDanmaku: newDanmaku,
            lastStartTime: startTime,
          };
        }
      }
    },
    [isPaused, getAvailableTrack, localConfig.speed, localConfig.fontSize],
  );

  const handleSend = () => {
    if (!inputText.trim()) return;

    addDanmaku({
      text: inputText,
      color: '#00b3ff',
      user: '我',
    });

    if (onSend) {
      onSend(inputText);
    }

    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const clearDanmakus = () => {
    danmakusRef.current = [];
    setDanmakuCount(0);
    trackInfoRef.current = trackInfoRef.current.map(() => ({
      lastDanmaku: null,
      lastStartTime: 0,
    }));
  };

  // 🚀 优化：批量添加弹幕
  const startStressTest = () => {
    setStressTestRunning(true);
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E2',
    ];
    const testTexts = [
      '压力测试中...',
      '弹幕性能测试',
      '这是一条测试弹幕',
      '看看能承受多少弹幕',
      '666666',
      '测试测试',
      '性能优化很重要',
      '流畅度如何？',
    ];

    let sentCount = 0;
    const totalToSend = stressTestConfig.rate * stressTestConfig.duration;

    stressTestIntervalRef.current = setInterval(() => {
      if (sentCount >= totalToSend) {
        stopStressTest();
        return;
      }

      // 🚀 批量添加，减少函数调用
      const batchSize = Math.min(
        stressTestConfig.rate,
        totalToSend - sentCount,
      );
      for (let i = 0; i < batchSize; i++) {
        addDanmaku({
          text: testTexts[Math.floor(Math.random() * testTexts.length)],
          color: stressTestConfig.randomColor
            ? colors[Math.floor(Math.random() * colors.length)]
            : '#FFFFFF',
          speed: stressTestConfig.randomSpeed
            ? 3 + Math.random() * 7
            : localConfig.speed,
          user: `测试${sentCount + i + 1}`,
        });
      }

      sentCount += batchSize;
    }, 1000);
  };

  const stopStressTest = () => {
    setStressTestRunning(false);
    if (stressTestIntervalRef.current) {
      clearInterval(stressTestIntervalRef.current);
      stressTestIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (stressTestIntervalRef.current) {
        clearInterval(stressTestIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (danmakuList.length > 0) {
      const newDanmaku = danmakuList[danmakuList.length - 1];
      addDanmaku(newDanmaku);
    }
  }, [danmakuList, addDanmaku]);

  return (
    <div className={`${className}`} style={style}>
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ opacity: (localConfig.opacity || 100) / 100 }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: 'block' }}
        />
      </div>

      {/* 控制栏 */}
      <div className="absolute bottom-1 left-4 right-4 flex gap-2 z-10 pointer-events-auto">
        {showInput && (
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="发送弹幕..."
              className="flex-1 bg-black bg-opacity-50 backdrop-blur text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
              maxLength={50}
            />
            <button
              onClick={handleSend}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              发送
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="bg-black bg-opacity-50 backdrop-blur hover:bg-opacity-70 text-white p-2 rounded-lg transition"
            title={isPaused ? '播放弹幕' : '暂停弹幕'}
          >
            {isPaused ? (
              <Play className="w-5 h-5" />
            ) : (
              <Pause className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={clearDanmakus}
            className="bg-black bg-opacity-50 backdrop-blur hover:bg-opacity-70 text-white p-2 rounded-lg transition"
            title="清空弹幕"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-black bg-opacity-50 backdrop-blur hover:bg-opacity-70 text-white p-2 rounded-lg transition"
            title="弹幕设置"
          >
            <Settings className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowStressTest(!showStressTest)}
            className={`bg-black bg-opacity-50 backdrop-blur hover:bg-opacity-70 text-white p-2 rounded-lg transition ${
              stressTestRunning ? 'ring-2 ring-yellow-400' : ''
            }`}
            title="压力测试"
          >
            <Zap className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 性能统计 */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 backdrop-blur rounded-lg px-3 py-2 text-white text-sm pointer-events-none">
        当前弹幕: {danmakuCount}
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="absolute top-16 right-4 bg-gray-900 bg-opacity-95 backdrop-blur rounded-xl p-4 w-80 z-20 border border-gray-700 pointer-events-auto max-h-[80vh] overflow-y-auto">
          <h3 className="text-white font-bold text-lg mb-4">弹幕设置</h3>

          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm block mb-2">
                字体大小: {localConfig.fontSize}px
              </label>
              <input
                type="range"
                min="16"
                max="48"
                value={localConfig.fontSize}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    fontSize: Number(e.target.value),
                  })
                }
                className="w-full accent-purple-600"
              />
            </div>

            <div>
              <label className="text-gray-300 text-sm block mb-2">
                滚动速度: {localConfig.speed}s
              </label>
              <input
                type="range"
                min="3"
                max="15"
                step="0.5"
                value={localConfig.speed}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    speed: Number(e.target.value),
                  })
                }
                className="w-full accent-purple-600"
              />
            </div>

            <div>
              <label className="text-gray-300 text-sm block mb-2">
                不透明度: {localConfig.opacity}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={localConfig.opacity}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    opacity: Number(e.target.value),
                  })
                }
                className="w-full accent-blue-400"
              />
            </div>

            <div>
              <label className="text-gray-300 text-sm block mb-2">
                显示区域: {localConfig.area}%
              </label>
              <input
                type="range"
                min="25"
                max="100"
                step="25"
                value={localConfig.area}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    area: Number(e.target.value),
                  })
                }
                className="w-full accent-purple-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-300 text-sm">防止重叠 ⭐</label>
              <button
                onClick={() =>
                  setLocalConfig({
                    ...localConfig,
                    antiOverlap: !localConfig.antiOverlap,
                  })
                }
                className={`w-12 h-6 rounded-full transition ${
                  localConfig.antiOverlap ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    localConfig.antiOverlap ? 'translate-x-6' : 'translate-x-1'
                  }`}
                ></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-300 text-sm">无限弹幕</label>
              <button
                onClick={() =>
                  setLocalConfig({
                    ...localConfig,
                    unlimited: !localConfig.unlimited,
                  })
                }
                className={`w-12 h-6 rounded-full transition ${
                  localConfig.unlimited ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    localConfig.unlimited ? 'translate-x-6' : 'translate-x-1'
                  }`}
                ></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-300 text-sm">密集显示</label>
              <button
                onClick={() =>
                  setLocalConfig({ ...localConfig, dense: !localConfig.dense })
                }
                className={`w-12 h-6 rounded-full transition ${
                  localConfig.dense ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    localConfig.dense ? 'translate-x-6' : 'translate-x-1'
                  }`}
                ></div>
              </button>
            </div>

            <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
              💡 提示：「防止重叠」可避免弹幕相互遮挡，提供更好的观看体验
            </div>
          </div>
        </div>
      )}

      {/* 压力测试面板 */}
      {showStressTest && (
        <div className="absolute top-16 left-4 bg-gray-900 bg-opacity-95 backdrop-blur rounded-xl p-4 w-80 z-20 border border-gray-700 pointer-events-auto">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            压力测试
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm block mb-2">
                发送频率: {stressTestConfig.rate} 条/秒
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={stressTestConfig.rate}
                onChange={(e) =>
                  setStressTestConfig({
                    ...stressTestConfig,
                    rate: Number(e.target.value),
                  })
                }
                className="w-full accent-yellow-400"
                disabled={stressTestRunning}
              />
            </div>

            <div>
              <label className="text-gray-300 text-sm block mb-2">
                持续时间: {stressTestConfig.duration} 秒
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={stressTestConfig.duration}
                onChange={(e) =>
                  setStressTestConfig({
                    ...stressTestConfig,
                    duration: Number(e.target.value),
                  })
                }
                className="w-full accent-yellow-400"
                disabled={stressTestRunning}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-300 text-sm">随机颜色</label>
              <button
                onClick={() =>
                  setStressTestConfig({
                    ...stressTestConfig,
                    randomColor: !stressTestConfig.randomColor,
                  })
                }
                className={`w-12 h-6 rounded-full transition ${
                  stressTestConfig.randomColor ? 'bg-yellow-500' : 'bg-gray-600'
                }`}
                disabled={stressTestRunning}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    stressTestConfig.randomColor
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                ></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-300 text-sm">随机速度</label>
              <button
                onClick={() =>
                  setStressTestConfig({
                    ...stressTestConfig,
                    randomSpeed: !stressTestConfig.randomSpeed,
                  })
                }
                className={`w-12 h-6 rounded-full transition ${
                  stressTestConfig.randomSpeed ? 'bg-yellow-500' : 'bg-gray-600'
                }`}
                disabled={stressTestRunning}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    stressTestConfig.randomSpeed
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                ></div>
              </button>
            </div>

            <div className="pt-2 border-t border-gray-700">
              <div className="text-sm text-gray-400 mb-3">
                总计: {stressTestConfig.rate * stressTestConfig.duration} 条弹幕
              </div>
              {!stressTestRunning ? (
                <button
                  onClick={startStressTest}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  开始测试
                </button>
              ) : (
                <button
                  onClick={stopStressTest}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  停止测试
                </button>
              )}
            </div>

            <div className="text-xs text-gray-500">
              💡 优化建议：
              <br />
              • 关闭「防止重叠」可提升性能
              <br />• 关闭「人像遮罩」可大幅提升流畅度
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
