import React, { useState, useEffect, useRef } from 'react';
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

  // 添加外部弹幕
  useEffect(() => {
    if (danmakuList.length > 0) {
      const newDanmaku = danmakuList[danmakuList.length - 1];
      addDanmaku(newDanmaku);
    }
  }, [danmakuList]);

  // 调试：监听数据变化
  //   useEffect(() => {
  //     if (personBounds) {
  //       console.log('🎯 personBounds:', personBounds);
  //     }
  //     if (personMask) {
  //       console.log(
  //         '🎭 personMask 尺寸:',
  //         personMask.width,
  //         'x',
  //         personMask.height,
  //       );
  //     }
  //   }, [personBounds, personMask]);

  //   useEffect(() => {
  //     if (personMask) {
  //       console.log(
  //         '主组件 personMask:',
  //         personMask.width,
  //         'x',
  //         personMask.height,
  //       );
  //       console.log('第一个像素 R值:', personMask.data[0]);
  //     }
  //   }, [personMask]);

  // 【核心修复】判断轨道是否与人像区域重叠（像素级检测）
  const isTrackOverlappingPerson = (trackIndex: number): boolean => {
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
          return true;
        }
      }
    }

    return false;
  };

  // 获取可用轨道(避开人像区域)
  const getAvailableTrack = (): number => {
    if (localConfig.unlimited) {
      return Math.floor(Math.random() * tracksRef.current.length);
    }

    const blockedTracks = new Set<number>();

    // 精确模式：使用 personMask 进行像素级检测
    if (personMask && containerRef.current) {
      console.log('✅ 使用精准模式');

      for (let i = 0; i < tracksRef.current.length; i++) {
        if (isTrackOverlappingPerson(i)) {
          blockedTracks.add(i);
          // 添加上下边距
          if (i > 0) blockedTracks.add(i - 1);
          if (i < tracksRef.current.length - 1) blockedTracks.add(i + 1);
        }
      }

      console.log(`🚫 阻挡的轨道: ${Array.from(blockedTracks).join(', ')}`);
    }
    // 矩形模式：使用 personBounds 进行矩形检测
    else if (personBounds && containerRef.current) {
      console.log('📦 使用矩形模式');

      const containerHeight = containerRef.current.offsetHeight;
      const trackHeight = (localConfig.fontSize || 24) + 10;

      const displayAreaHeight =
        containerHeight * ((localConfig.area || 100) / 100);
      const personTopPx = (personBounds.top / 100) * containerHeight;
      const personBottomPx = (personBounds.bottom / 100) * containerHeight;

      if (personTopPx < displayAreaHeight) {
        const startTrack = Math.floor(personTopPx / trackHeight);
        const endTrack = Math.min(
          Math.ceil(personBottomPx / trackHeight),
          Math.floor(displayAreaHeight / trackHeight),
        );

        const margin = 1;
        for (
          let i = Math.max(0, startTrack - margin);
          i <= Math.min(tracksRef.current.length - 1, endTrack + margin);
          i++
        ) {
          blockedTracks.add(i);
        }
      }

      console.log(`🚫 阻挡的轨道: ${Array.from(blockedTracks).join(', ')}`);
    }

    // 优先选择未被占用且不在人像区域的轨道
    for (let i = 0; i < tracksRef.current.length; i++) {
      if (!tracksRef.current[i] && !blockedTracks.has(i)) {
        console.log(`✅ 选择轨道 ${i}`);
        return i;
      }
    }

    // 如果没有完全空闲的轨道，选择不在人像区域的轨道
    if (localConfig.dense) {
      const availableTracks = Array.from(
        { length: tracksRef.current.length },
        (_, i) => i,
      ).filter((i) => !blockedTracks.has(i));

      if (availableTracks.length > 0) {
        const track =
          availableTracks[Math.floor(Math.random() * availableTracks.length)];
        console.log(`⚠️ 密集模式选择轨道 ${track}`);
        return track;
      }
    }

    console.log('❌ 无可用轨道');
    return -1;
  };

  // 添加弹幕
  const addDanmaku = (item: Partial<DanmakuItem>) => {
    if (isPaused) return;

    const track = getAvailableTrack();
    if (track === -1 && !localConfig.unlimited) {
      console.log('⏭️ 弹幕被跳过（无可用轨道）');
      return;
    }

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

    // 标记轨道占用
    if (track !== -1) {
      tracksRef.current[track] = true;

      const duration = speed * 1000;
      setTimeout(() => {
        tracksRef.current[track] = false;
      }, duration * 0.3);
    }

    setTimeout(() => {
      setDanmakus((prev) => prev.filter((d) => d.id !== id));
    }, speed * 1000);
  };

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

  return (
    <div className={`${className}`} style={style}>
      {/* 弹幕显示区域 */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ opacity: (localConfig.opacity || 100) / 100 }}
      >
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
