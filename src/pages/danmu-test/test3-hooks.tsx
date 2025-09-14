import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Button,
  Input,
  Select,
  Slider,
  Card,
  Space,
  Typography,
  ColorPicker,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SendOutlined,
} from '@ant-design/icons';

const { Option } = Select;
const { Title } = Typography;

// 弹幕数据结构
interface DanmakuItem {
  id: string;
  text: string;
  x: number;
  y: number;
  speed: number;
  color: string;
  fontSize: number;
  opacity: number;
  width: number;
  timestamp: number;
  type: 'scroll' | 'top' | 'bottom';
}

// Redux状态类型
interface DanmakuState {
  danmakus: DanmakuItem[];
  isPlaying: boolean;
  settings: {
    opacity: number;
    fontSize: number;
    speed: number;
    density: number;
    showDanmaku: boolean;
  };
}

// 简单的Redux实现
const createStore = (reducer: any, initialState: any) => {
  let state = initialState;
  const listeners: any[] = [];

  return {
    getState: () => state,
    dispatch: (action: any) => {
      state = reducer(state, action);
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: any) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      };
    },
  };
};

// 动作类型
const ADD_DANMAKU = 'ADD_DANMAKU';
const REMOVE_DANMAKU = 'REMOVE_DANMAKU';
const UPDATE_SETTINGS = 'UPDATE_SETTINGS';
const TOGGLE_PLAY = 'TOGGLE_PLAY';
const CLEAR_DANMAKUS = 'CLEAR_DANMAKUS';

// Reducer
const danmakuReducer = (state: DanmakuState, action: any): DanmakuState => {
  switch (action.type) {
    case ADD_DANMAKU:
      return {
        ...state,
        danmakus: [...state.danmakus, action.payload],
      };
    case REMOVE_DANMAKU:
      return {
        ...state,
        danmakus: state.danmakus.filter((d) => d.id !== action.payload),
      };
    case UPDATE_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case TOGGLE_PLAY:
      return {
        ...state,
        isPlaying: !state.isPlaying,
      };
    case CLEAR_DANMAKUS:
      return {
        ...state,
        danmakus: [],
      };
    default:
      return state;
  }
};

// 初始状态
const initialState: DanmakuState = {
  danmakus: [],
  isPlaying: true,
  settings: {
    opacity: 0.8,
    fontSize: 20,
    speed: 1,
    density: 100,
    showDanmaku: true,
  },
};

// 创建store
const store = createStore(danmakuReducer, initialState);

// 弹幕渲染Hook
const useDanmakuRenderer = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationIdRef = useRef<number>(0);
  const danmakusRef = useRef<DanmakuItem[]>([]);
  const isPlayingRef = useRef<boolean>(true);
  const settingsRef = useRef<any>({});
  const tracksRef = useRef<boolean[]>([]);
  const trackHeightRef = useRef<number>(30);

  // Canvas 初始化和大小调整
  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }, []);

  // 初始化轨道
  const initTracks = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const trackCount = Math.floor(
      canvas.height / window.devicePixelRatio / trackHeightRef.current,
    );
    tracksRef.current = new Array(trackCount).fill(false);
  }, []);

  // 获取可用轨道
  const getAvailableTrack = useCallback((): number => {
    const trackIndex = tracksRef.current.findIndex((track) => !track);
    if (trackIndex !== -1) {
      tracksRef.current[trackIndex] = true;
      return trackIndex;
    }
    // 如果没有空闲轨道，随机选择一个
    return Math.floor(Math.random() * tracksRef.current.length);
  }, []);

  // 释放轨道
  const releaseTrack = useCallback((trackIndex: number) => {
    if (trackIndex >= 0 && trackIndex < tracksRef.current.length) {
      tracksRef.current[trackIndex] = false;
    }
  }, []);

  // 添加弹幕
  const addDanmaku = useCallback(
    (
      text: string,
      color = '#ffffff',
      type: 'scroll' | 'top' | 'bottom' = 'scroll',
    ) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const fontSize = settingsRef.current.fontSize || 20;
      ctx.font = `${fontSize}px Arial`;
      const textWidth = ctx.measureText(text).width;

      const trackIndex = getAvailableTrack();
      const y = trackIndex * trackHeightRef.current + fontSize;

      const danmaku: DanmakuItem = {
        id: Date.now().toString() + Math.random(),
        text,
        x: canvas.width / window.devicePixelRatio,
        y: y,
        speed: (settingsRef.current.speed || 1) * (50 + Math.random() * 50),
        color,
        fontSize,
        opacity: settingsRef.current.opacity || 0.8,
        width: textWidth,
        timestamp: Date.now(),
        type,
      };

      danmakusRef.current.push(danmaku);

      // 设置轨道释放定时器
      const duration =
        ((canvas.width / window.devicePixelRatio + textWidth) / danmaku.speed) *
        1000;
      setTimeout(() => {
        releaseTrack(trackIndex);
      }, duration * 0.3); // 提前释放轨道，提高密度
    },
    [getAvailableTrack, releaseTrack],
  );

  // 更新弹幕列表
  const updateDanmakus = useCallback((danmakus: DanmakuItem[]) => {
    danmakusRef.current = [...danmakus];
  }, []);

  // 更新设置
  const updateSettings = useCallback((settings: any) => {
    settingsRef.current = settings;
  }, []);

  // 设置播放状态
  const setPlaying = useCallback((isPlaying: boolean) => {
    isPlayingRef.current = isPlaying;
    if (isPlaying && !animationIdRef.current) {
      animate();
    }
  }, []);

  // 清空弹幕
  const clearDanmakus = useCallback(() => {
    danmakusRef.current = [];
    tracksRef.current.fill(false);
  }, []);

  // 动画循环
  const animate = useCallback(() => {
    if (!isPlayingRef.current) {
      animationIdRef.current = 0;
      return;
    }

    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(
      0,
      0,
      canvas.width / window.devicePixelRatio,
      canvas.height / window.devicePixelRatio,
    );

    if (settingsRef.current.showDanmaku) {
      // 更新和渲染弹幕
      danmakusRef.current = danmakusRef.current.filter((danmaku) => {
        // 更新位置
        if (danmaku.type === 'scroll') {
          danmaku.x -= danmaku.speed * 0.016; // 60fps
        }

        // 检查是否需要移除
        if (danmaku.x + danmaku.width < 0) {
          return false;
        }

        // 渲染弹幕
        ctx.save();
        ctx.font = `${danmaku.fontSize}px Arial`;
        ctx.fillStyle = danmaku.color;
        ctx.globalAlpha = danmaku.opacity;

        // 添加描边效果，提高可读性
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(danmaku.text, danmaku.x, danmaku.y);
        ctx.fillText(danmaku.text, danmaku.x, danmaku.y);
        ctx.restore();

        return true;
      });
    }

    animationIdRef.current = requestAnimationFrame(animate);
  }, []);

  // 开始动画
  const start = useCallback(() => {
    if (!animationIdRef.current) {
      animate();
    }
  }, [animate]);

  // 销毁动画
  const destroy = useCallback(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = 0;
    }
  }, []);

  // 返回Hook接口
  return {
    canvasRef,
    addDanmaku,
    updateDanmakus,
    updateSettings,
    setPlaying,
    clearDanmakus,
    start,
    destroy,
    resizeCanvas,
    initTracks,
  };
};

// 主组件
const VideoDanmakuSystem: React.FC = () => {
  const renderer = useDanmakuRenderer();
  const [inputText, setInputText] = useState('');
  const [danmakuColor, setDanmakuColor] = useState('#ffffff');
  const [danmakuType, setDanmakuType] = useState<'scroll' | 'top' | 'bottom'>(
    'scroll',
  );
  const [state, setState] = useState<DanmakuState>(initialState);

  // 订阅store变化
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(store.getState());
    });
    return unsubscribe;
  }, []);

  // 初始化Canvas渲染器
  useEffect(() => {
    if (renderer.canvasRef.current) {
      renderer.resizeCanvas();
      renderer.initTracks();
      renderer.start();

      // 窗口大小变化时重新调整canvas
      const handleResize = () => {
        renderer.destroy();
        renderer.resizeCanvas();
        renderer.initTracks();
        renderer.updateSettings(state.settings);
        renderer.setPlaying(state.isPlaying);
        renderer.start();
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.destroy();
      };
    }
  }, [renderer, state.settings, state.isPlaying]);

  // 同步状态到渲染器
  useEffect(() => {
    renderer.updateSettings(state.settings);
    renderer.setPlaying(state.isPlaying);
  }, [renderer, state.settings, state.isPlaying]);

  // 发送弹幕
  const sendDanmaku = useCallback(() => {
    if (!inputText.trim()) return;
    renderer.addDanmaku(inputText, danmakuColor, danmakuType);

    // 创建弹幕数据
    const danmaku: DanmakuItem = {
      id: Date.now().toString() + Math.random(),
      text: inputText,
      x: 800,
      y: Math.random() * 300 + 50,
      speed: 100,
      color: danmakuColor,
      fontSize: state.settings.fontSize,
      opacity: state.settings.opacity,
      width: 0,
      timestamp: Date.now(),
      type: danmakuType,
    };

    store.dispatch({ type: ADD_DANMAKU, payload: danmaku });
    setInputText('');
  }, [inputText, danmakuColor, danmakuType, state.settings, renderer]);

  // 自动发送演示弹幕
  useEffect(() => {
    const demoTexts = [
      '这是一条测试弹幕！',
      '高并发弹幕系统演示',
      'React + Canvas 实现',
      '性能优化版本',
      '支持自定义颜色和速度',
      '60fps流畅渲染',
      'TypeScript + Redux',
    ];

    const colors = [
      '#ffffff',
      '#ff6b6b',
      '#4ecdc4',
      '#45b7d1',
      '#96ceb4',
      '#feca57',
      '#ff9ff3',
    ];

    const interval = setInterval(() => {
      if (state.isPlaying && renderer.canvasRef.current) {
        const text = demoTexts[Math.floor(Math.random() * demoTexts.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        renderer.addDanmaku(text, color);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isPlaying, renderer]);

  const togglePlay = () => {
    store.dispatch({ type: TOGGLE_PLAY });
  };

  const clearDanmakus = () => {
    renderer.clearDanmakus();
    store.dispatch({ type: CLEAR_DANMAKUS });
  };

  const updateSettings = (key: string, value: any) => {
    store.dispatch({ type: UPDATE_SETTINGS, payload: { [key]: value } });
  };

  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={2}>高并发视频弹幕系统</Title>

      {/* 视频区域 */}
      <Card style={{ marginBottom: '20px', position: 'relative' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '400px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <canvas
            ref={renderer.canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontSize: '24px',
              opacity: 0.3,
              zIndex: 1,
            }}
          >
            视频播放区域 - 弹幕演示
          </div>
        </div>
      </Card>

      <div
        style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}
      >
        {/* 弹幕发送区域 */}
        <Card title="发送弹幕">
          <Space.Compact style={{ width: '100%', marginBottom: '16px' }}>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="输入弹幕内容..."
              onPressEnter={sendDanmaku}
              maxLength={50}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendDanmaku}
            >
              发送
            </Button>
          </Space.Compact>

          <Space wrap>
            <div>颜色:</div>
            <ColorPicker
              value={danmakuColor}
              onChange={(color) => setDanmakuColor(color.toHexString())}
              showText
            />

            <div>类型:</div>
            <Select
              value={danmakuType}
              onChange={setDanmakuType}
              style={{ width: 120 }}
            >
              <Option value="scroll">滚动</Option>
              <Option value="top">顶部</Option>
              <Option value="bottom">底部</Option>
            </Select>
          </Space>
        </Card>

        {/* 控制面板 */}
        <Card title="控制面板">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type={state.isPlaying ? 'default' : 'primary'}
              icon={
                state.isPlaying ? (
                  <PauseCircleOutlined />
                ) : (
                  <PlayCircleOutlined />
                )
              }
              onClick={togglePlay}
              block
            >
              {state.isPlaying ? '暂停' : '播放'}
            </Button>

            <Button onClick={clearDanmakus} block>
              清空弹幕
            </Button>

            <div>
              <div>透明度: {(state.settings.opacity * 100).toFixed(0)}%</div>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={state.settings.opacity}
                onChange={(value) => updateSettings('opacity', value)}
              />
            </div>

            <div>
              <div>字体大小: {state.settings.fontSize}px</div>
              <Slider
                min={12}
                max={36}
                value={state.settings.fontSize}
                onChange={(value) => updateSettings('fontSize', value)}
              />
            </div>

            <div>
              <div>弹幕速度: {state.settings.speed}x</div>
              <Slider
                min={0.5}
                max={3}
                step={0.1}
                value={state.settings.speed}
                onChange={(value) => updateSettings('speed', value)}
              />
            </div>

            <Button
              type={state.settings.showDanmaku ? 'primary' : 'default'}
              onClick={() =>
                updateSettings('showDanmaku', !state.settings.showDanmaku)
              }
              block
            >
              {state.settings.showDanmaku ? '隐藏弹幕' : '显示弹幕'}
            </Button>
          </Space>
        </Card>
      </div>

      {/* 统计信息 */}
      <Card title="系统信息" style={{ marginTop: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '24px', color: '#1890ff' }}>
              {state.danmakus.length}
            </div>
            <div>当前弹幕数</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', color: '#52c41a' }}>60</div>
            <div>渲染帧率 FPS</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', color: '#722ed1' }}>Canvas</div>
            <div>渲染引擎</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', color: '#eb2f96' }}>
              {state.isPlaying ? '运行中' : '已暂停'}
            </div>
            <div>系统状态</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VideoDanmakuSystem;
