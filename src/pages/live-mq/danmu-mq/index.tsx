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
  personBounds = null,
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
  const danmakuIdRef = useRef(0);
  const tracksRef = useRef<boolean[]>([]);

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

  // 【核心修复】判断轨道是否与人像区域重叠（像素级检测）
  const isTrackOverlappingPerson = useCallback(
    (trackIndex: number): boolean => {
      if (!personMask || !containerRef.current) return false;

      const trackHeight = (localConfig.fontSize || 24) + 10;
      const trackTop = trackIndex * trackHeight;
      const trackBottom = trackTop + trackHeight;

      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;

      // 🔑 关键修复：计算缩放比例
      const scaleX = personMask.width / containerWidth;
      const scaleY = personMask.height / containerHeight;

      // 采样检测（每隔几个像素检测一次，提高性能）
      const sampleStep = 5;
      let detectedPixels = 0;

      for (
        let y = trackTop;
        y < trackBottom && y < containerHeight;
        y += sampleStep
      ) {
        for (let x = 0; x < containerWidth; x += sampleStep) {
          // 映射到 mask 坐标系
          const maskX = Math.floor(x * scaleX);
          const maskY = Math.floor(y * scaleY);

          // 确保不越界
          if (maskX >= personMask.width || maskY >= personMask.height) continue;

          // 🔑 关键修复：使用正确的索引计算
          const maskIndex = (maskY * personMask.width + maskX) * 4;

          // 检查 R 通道（人像区域为 255）
          if (personMask.data[maskIndex] === 255) {
            detectedPixels++;
            // 如果检测到足够的人像像素，直接返回 true
            if (detectedPixels > 3) {
              return true;
            }
          }
        }
      }

      return false;
    },
    [personMask, localConfig.fontSize],
  );

  // 获取可用轨道(避开人像区域)
  const getAvailableTrack = useCallback((): number => {
    const blockedTracks = new Set<number>();

    // 矩形模式：使用 personBounds 进行矩形检测（推荐，性能好）
    if (personBounds && containerRef.current) {
      const containerHeight = containerRef.current.offsetHeight;
      const trackHeight = (localConfig.fontSize || 24) + 10;

      // 将百分比转换为像素
      const personTopPx = (personBounds.top / 100) * containerHeight;
      const personBottomPx = (personBounds.bottom / 100) * containerHeight;

      // 计算被占用的轨道
      const startTrack = Math.floor(personTopPx / trackHeight);
      const endTrack = Math.floor(personBottomPx / trackHeight);

      console.log(`🎯 人像占据轨道: ${startTrack} - ${endTrack}`);

      // 添加边距，避免弹幕贴边
      const margin = 2; // 增加边距
      for (
        let i = Math.max(0, startTrack - margin);
        i <= Math.min(tracksRef.current.length - 1, endTrack + margin);
        i++
      ) {
        blockedTracks.add(i);
      }
    }
    // 精确模式：使用 personMask 进行像素级检测（可选）
    else if (personMask && containerRef.current) {
      console.log('✅ 使用精准模式');

      for (let i = 0; i < tracksRef.current.length; i++) {
        if (isTrackOverlappingPerson(i)) {
          blockedTracks.add(i);
          // 添加上下边距
          if (i > 0) blockedTracks.add(i - 1);
          if (i < tracksRef.current.length - 1) blockedTracks.add(i + 1);
        }
      }
    }

    // 获取所有不在人像区域的轨道
    const availableTracks = Array.from(
      { length: tracksRef.current.length },
      (_, i) => i,
    ).filter((i) => !blockedTracks.has(i));

    // 如果无限模式，从可用轨道中随机选择
    if (localConfig.unlimited) {
      if (availableTracks.length > 0) {
        const track =
          availableTracks[Math.floor(Math.random() * availableTracks.length)];
        return track;
      } else {
        // 如果没有可用轨道，强制选择第一个轨道
        return 0;
      }
    }

    // 优先选择未被占用且不在人像区域的轨道
    for (let i = 0; i < tracksRef.current.length; i++) {
      if (!tracksRef.current[i] && !blockedTracks.has(i)) {
        return i;
      }
    }

    // 如果没有完全空闲的轨道，选择不在人像区域的轨道
    if (localConfig.dense) {
      if (availableTracks.length > 0) {
        const track =
          availableTracks[Math.floor(Math.random() * availableTracks.length)];
        console.log(`⚠️ 密集模式选择轨道 ${track}`);
        return track;
      }
    }

    // 最后的降级方案：如果所有轨道都被占用，强制选择不在人像区域的轨道
    if (availableTracks.length > 0) {
      const track =
        availableTracks[Math.floor(Math.random() * availableTracks.length)];
      return track;
    }

    return 0; // 最后的降级方案
  }, [
    personBounds,
    personMask,
    localConfig.unlimited,
    localConfig.fontSize,
    localConfig.dense,
    isTrackOverlappingPerson,
  ]);

  // 添加弹幕
  const addDanmaku = useCallback(
    (item: Partial<DanmakuItem>) => {
      if (isPaused) {
        return;
      }

      const track = getAvailableTrack();

      const id = danmakuIdRef.current++;
      const speed = item.speed || localConfig.speed || 5;

      const newDanmaku: DanmakuItem = {
        id,
        text: item.text || '',
        color: item.color || '#FFFFFF',
        fontSize: item.fontSize || localConfig.fontSize || 24,
        speed,
        avatar: item.avatar,
        user: item.user,
        track,
      };

      setDanmakus((prev) => [...prev, newDanmaku]);

      // 标记轨道占用（只在非无限模式下）
      if (!localConfig.unlimited) {
        tracksRef.current[track] = true;

        const duration = speed * 1000;
        setTimeout(() => {
          tracksRef.current[track] = false;
          //   console.log(`🔄 释放轨道 ${track}`);
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

  // 发送弹幕
  const handleSend = () => {
    if (!inputText.trim()) return;

    const newDanmaku = {
      text: inputText,
      color: '#00b3ff',
      user: '我',
    };

    addDanmaku(newDanmaku);

    if (onSend) {
      onSend(inputText);
    }

    setInputText('');
  };

  // 键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // 清空弹幕
  const clearDanmakus = () => {
    setDanmakus([]);
    tracksRef.current = tracksRef.current.map(() => false);
  };

  // 添加外部弹幕
  useEffect(() => {
    if (danmakuList.length > 0) {
      const newDanmaku = danmakuList[danmakuList.length - 1];
      addDanmaku(newDanmaku);
    }
  }, [danmakuList, addDanmaku]); // 使用 addDanmaku 作为依赖

  // 调试：监听数据变化
  useEffect(() => {
    // if (personBounds) {
    // }
    if (personMask && containerRef.current) {
      // 检查 mask 数据是否有效
      let whitePixels = 0;
      for (let i = 0; i < personMask.data.length; i += 4) {
        if (personMask.data[i] === 255) whitePixels++;
      }

      // 检查轨道数量
      //   const trackCount = Math.floor(
      //     (containerRef.current.offsetHeight * (localConfig.area || 100)) /
      //       100 /
      //       ((localConfig.fontSize || 24) + 10),
      //   );
    }
  }, [personBounds, personMask, localConfig.area, localConfig.fontSize]);

  return (
    <div className={`${className}`} style={style}>
      {/* 弹幕显示区域 */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ opacity: (localConfig.opacity || 100) / 100 }}
      >
        {/* 调试：显示人像区域和轨道 */}
        {personBounds && containerRef.current && (
          <div
            className="absolute border-2 border-red-500 bg-red-500 bg-opacity-20"
            style={{
              left: `${personBounds.left}%`,
              top: `${personBounds.top}%`,
              width: `${personBounds.right - personBounds.left}%`,
              height: `${personBounds.bottom - personBounds.top}%`,
            }}
          >
            <div className="absolute -top-6 left-0 text-red-500 text-xs font-bold bg-black bg-opacity-50 px-1 rounded">
              人像区域
            </div>
          </div>
        )}

        {/* 调试：显示轨道线 */}
        {containerRef.current && (
          <>
            {Array.from({
              length: Math.floor(
                (containerRef.current.offsetHeight *
                  (localConfig.area || 100)) /
                  100 /
                  ((localConfig.fontSize || 24) + 10),
              ),
            }).map((_, i) => {
              // 检查轨道是否被阻挡
              const isBlocked =
                personBounds && containerRef.current
                  ? (() => {
                      const containerHeight =
                        containerRef.current?.offsetHeight || 0;
                      const trackHeight = (localConfig.fontSize || 24) + 10;
                      const personTopPx =
                        (personBounds.top / 100) * containerHeight;
                      const personBottomPx =
                        (personBounds.bottom / 100) * containerHeight;
                      const startTrack = Math.floor(personTopPx / trackHeight);
                      const endTrack = Math.floor(personBottomPx / trackHeight);
                      const margin = 2;
                      return (
                        i >= Math.max(0, startTrack - margin) &&
                        i <=
                          Math.min(
                            tracksRef.current.length - 1,
                            endTrack + margin,
                          )
                      );
                    })()
                  : false;

              return (
                <div
                  key={i}
                  className={`absolute w-full border-t ${isBlocked ? 'border-red-500 border-opacity-60' : 'border-blue-500 border-opacity-30'}`}
                  style={{
                    top: `${i * ((localConfig.fontSize || 24) + 10)}px`,
                  }}
                >
                  <span
                    className={`absolute -left-8 -top-1 text-xs bg-black bg-opacity-50 px-1 rounded ${isBlocked ? 'text-red-400' : 'text-blue-400'}`}
                  >
                    {i}
                    {isBlocked ? '🚫' : ''}
                  </span>
                </div>
              );
            })}
          </>
        )}
        {danmakus.map((danmaku) => (
          <div
            key={danmaku.id}
            className="absolute whitespace-nowrap font-bold"
            style={{
              top: `${(danmaku.track || 0) * ((localConfig.fontSize || 24) + 10)}px`,
              color: danmaku.color,
              fontSize: `${danmaku.fontSize}px`,
              textShadow:
                '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)',
              animation: `danmaku-move ${danmaku.speed}s linear`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {danmaku.avatar && (
              <img
                src={danmaku.avatar}
                alt=""
                className="inline-block w-8 h-8 rounded-full mr-2"
              />
            )}
            {danmaku.user && <span className="mr-2">[{danmaku.user}]</span>}
            {danmaku.text}
          </div>
        ))}
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

      <style>{`
        @keyframes danmaku-move {
          from {
            transform: translateX(100vw);
          }
          to {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
