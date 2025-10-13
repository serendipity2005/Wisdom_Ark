import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Settings, Pause, Play, Trash2 } from 'lucide-react';

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
  startTime?: number; // 新增：记录开始时间
}

// 弹幕配置接口
interface DanmakuConfig {
  fontSize?: number;
  speed?: number;
  opacity?: number;
  area?: number;
  unlimited?: boolean;
  dense?: boolean;
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
  const [danmakus, setDanmakus] = useState<DanmakuItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [localConfig, setLocalConfig] = useState<DanmakuConfig>({
    fontSize: 24,
    speed: 5,
    opacity: 100,
    area: 100,
    unlimited: false,
    dense: false,
    ...config,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const danmakuIdRef = useRef(0);
  const tracksRef = useRef<boolean[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // 初始化轨道
  useEffect(() => {
    if (!containerRef.current) return;
    const trackCount = Math.floor(
      (containerRef.current.offsetHeight * (localConfig.area || 100)) /
        100 /
        ((localConfig.fontSize || 24) + 10),
    );
    tracksRef.current = new Array(trackCount).fill(false);
  }, [localConfig.fontSize, localConfig.area]);

  // 🎨 Canvas 实时绘制弹幕（带人像遮挡）
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 设置 Canvas 尺寸
    const resizeCanvas = () => {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 渲染循环
    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx || isPaused) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentTime = Date.now();

      // 绘制所有弹幕
      danmakus.forEach((danmaku) => {
        const elapsed =
          (currentTime - (danmaku.startTime || danmaku.id)) / 1000;
        const progress = elapsed / (danmaku.speed || 5);

        if (progress >= 1 || progress < 0) return;

        // 计算位置
        const startX = canvas.width;
        const endX = -500; // 留足够空间让文字完全移出
        const x = startX + (endX - startX) * progress;
        const y =
          (danmaku.track || 0) * ((danmaku.fontSize || 24) + 10) +
          (danmaku.fontSize || 24);

        // 设置字体样式
        ctx.font = `bold ${danmaku.fontSize || 24}px Arial, sans-serif`;
        ctx.fillStyle = danmaku.color || '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        // 构建完整文本
        const fullText = `${danmaku.user ? `[${danmaku.user}] ` : ''}${danmaku.text}`;
        const textWidth = ctx.measureText(fullText).width;

        // 🎯 关键：应用人像遮罩
        if (personMask && canvas.width > 0 && canvas.height > 0) {
          const scaleX = personMask.width / canvas.width;
          const scaleY = personMask.height / canvas.height;

          // 分段检测并绘制
          const segments: { start: number; end: number }[] = [];
          let segmentStart = 0;
          let inPerson = false;

          const checkStep = 8; // 检测步长，越小越精确但性能越低

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
              // 进入人像区域，保存前一段
              if (offset > segmentStart) {
                segments.push({ start: segmentStart, end: offset });
              }
              inPerson = true;
              segmentStart = offset;
            } else if (!isPerson && inPerson) {
              // 离开人像区域
              inPerson = false;
              segmentStart = offset;
            }
          }

          // 添加最后一段
          if (!inPerson && segmentStart < textWidth) {
            segments.push({ start: segmentStart, end: textWidth });
          }

          // 绘制所有可见段
          segments.forEach((segment) => {
            ctx.save();
            ctx.beginPath();
            ctx.rect(
              x + segment.start,
              y - (danmaku.fontSize || 24),
              segment.end - segment.start,
              (danmaku.fontSize || 24) + 5,
            );
            ctx.clip();
            ctx.fillText(fullText, x, y);
            ctx.restore();
          });
        } else {
          // 无遮罩时直接绘制
          ctx.fillText(fullText, x, y);
        }
      });

      // 继续下一帧
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [danmakus, personMask, isPaused, localConfig.fontSize]);

  const getAvailableTrack = useCallback((): number => {
    if (localConfig.unlimited) {
      return Math.floor(Math.random() * tracksRef.current.length);
    }

    for (let i = 0; i < tracksRef.current.length; i++) {
      if (!tracksRef.current[i]) {
        return i;
      }
    }

    if (localConfig.dense) {
      return Math.floor(Math.random() * tracksRef.current.length);
    }

    return 0;
  }, [localConfig.unlimited, localConfig.dense]);

  const addDanmaku = useCallback(
    (item: Partial<DanmakuItem>) => {
      if (isPaused) return;

      const track = getAvailableTrack();
      const id = danmakuIdRef.current++;
      const speed = item.speed || localConfig.speed || 5;
      const startTime = Date.now();

      const newDanmaku: DanmakuItem = {
        id,
        text: item.text || '',
        color: item.color || '#FFFFFF',
        fontSize: item.fontSize || localConfig.fontSize || 24,
        speed,
        avatar: item.avatar,
        user: item.user,
        track,
        startTime,
      };

      setDanmakus((prev) => [...prev, newDanmaku]);

      if (!localConfig.unlimited) {
        tracksRef.current[track] = true;
        const duration = speed * 1000;
        setTimeout(() => {
          tracksRef.current[track] = false;
        }, duration * 0.3);
      }

      setTimeout(() => {
        setDanmakus((prev) => prev.filter((d) => d.id !== id));
      }, speed * 1000);
    },
    [
      isPaused,
      getAvailableTrack,
      localConfig.unlimited,
      localConfig.speed,
      localConfig.fontSize,
    ],
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
    setDanmakus([]);
    tracksRef.current = tracksRef.current.map(() => false);
  };

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
        {/* 🎯 Canvas 弹幕层 */}
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
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="absolute top-4 right-4 bg-gray-900 bg-opacity-95 backdrop-blur rounded-xl p-4 w-80 z-20 border border-gray-700 pointer-events-auto">
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
          </div>
        </div>
      )}
    </div>
  );
}
