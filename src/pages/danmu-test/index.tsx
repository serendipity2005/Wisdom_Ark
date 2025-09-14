import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './index.scss';
import {
  sendDanmaku,
  clearDanmakus,
  toggleDanmakuVisible,
  setDanmakuSpeed,
  addMockDanmakus,
} from '@/store/modules/danmakuSlice';
import {
  Input,
  Button,
  ColorPicker,
  Select,
  Slider,
  Space,
  message,
} from 'antd';
import {
  SendOutlined,
  ClearOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  FireOutlined,
} from '@ant-design/icons';
// import './DanmakuPlayer.css';
import videosrc from '@/assets/video/play.mp4';

const { Option } = Select;

// 弹幕字体大小选项
const FONT_SIZE_OPTIONS = [
  { label: '小', value: 'small', size: 16 },
  { label: '中', value: 'medium', size: 24 },
  { label: '大', value: 'large', size: 32 },
];

// 弹幕模式选项
const MODE_OPTIONS = [
  { label: '滚动', value: 'scroll' },
  { label: '顶部', value: 'top' },
  { label: '底部', value: 'bottom' },
];

// 预设颜色
const PREDEFINED_COLORS = [
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#00FFFF',
  '#FF00FF',
  '#000000',
];

const DanmakuPlayer: React.FC = () => {
  const dispatch = useDispatch();
  const { danmakus, isVisible, speed } = useSelector((state) => state.danmaku);

  // 视频和Canvas引用
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 状态管理
  const [inputContent, setInputContent] = useState('');
  const [currentColor, setCurrentColor] = useState('#FFFFFF');
  const [currentSize, setCurrentSize] = useState<'small' | 'medium' | 'large'>(
    'medium',
  );
  const [currentMode, setCurrentMode] = useState<'scroll' | 'top' | 'bottom'>(
    'scroll',
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Canvas上下文
  let ctx: CanvasRenderingContext2D | null = null;
  let animationFrameId = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;

  // 初始化Canvas
  const initCanvas = () => {
    if (!canvasRef.current || !videoRef.current) return;

    // 设置Canvas尺寸与视频一致
    const video = videoRef.current;
    canvasWidth = video.clientWidth;
    canvasHeight = video.clientHeight;

    const canvas = canvasRef.current;
    // 考虑设备像素比，避免模糊
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    // 获取上下文并设置缩放
    ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    clearCanvas();
  };

  // 清除画布
  const clearCanvas = () => {
    if (ctx) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    }
  };

  // 计算弹幕宽度
  const calculateDanmakuWidth = (content: string, size: string) => {
    if (!ctx) return 0;

    const fontSize =
      FONT_SIZE_OPTIONS.find((opt) => opt.value === size)?.size || 24;
    ctx.font = `${fontSize}px sans-serif`;
    return ctx.measureText(content).width;
  };

  // 渲染弹幕
  // const renderDanmakus = () => {
  //   if (!ctx || !isVisible || !videoRef.current) {
  //     clearCanvas();
  //     return;
  //   }

  //   clearCanvas();
  //   const currentTime = videoRef.current.currentTime;
  //   const activeDanmakus = [...danmakus];

  //   // 过滤和更新弹幕
  //   const filteredDanmakus = activeDanmakus.filter((danmaku) => {
  //     // 非滚动弹幕只显示5秒
  //     if (danmaku.mode !== 'scroll' && currentTime - danmaku.timestamp > 5) {
  //       return false;
  //     }

  //     // 更新滚动弹幕位置
  //     if (danmaku.mode === 'scroll') {
  //       danmaku.x -= (danmaku.speed || speed) * 0.5;
  //       // 检查是否已滚动出屏幕
  //       if (danmaku.x + danmaku.width < 0) {
  //         return false;
  //       }
  //     }

  //     return true;
  //   });

  // 渲染弹幕
  //   filteredDanmakus.forEach((danmaku) => {
  //     const fontSize =
  //       FONT_SIZE_OPTIONS.find((opt) => opt.value === danmaku.size)?.size || 24;

  //     ctx!.font = `${fontSize}px sans-serif`;
  //     ctx!.fillStyle = danmaku.color;

  //     // 添加黑色描边提高可读性
  //     ctx!.strokeStyle = '#000000';
  //     ctx!.lineWidth = 2;
  //     ctx!.strokeText(danmaku.content, danmaku.x, danmaku.y);
  //     ctx!.fillText(danmaku.content, danmaku.x, danmaku.y);
  //   });

  //   // 继续动画循环
  //   if (isPlaying) {
  //     animationFrameId = requestAnimationFrame(renderDanmakus);
  //   }
  // };
  // 渲染弹幕
  const renderDanmakus = () => {
    if (!ctx || !isVisible || !videoRef.current) {
      clearCanvas();
      return;
    }

    clearCanvas();
    const currentTime = videoRef.current.currentTime;
    const activeDanmakus = danmakus.map((danmaku) => ({ ...danmaku }));

    // 过滤和更新弹幕
    const filteredDanmakus = activeDanmakus.filter((danmaku) => {
      // 非滚动弹幕只显示5秒
      if (danmaku.mode !== 'scroll' && currentTime - danmaku.timestamp > 5) {
        return false;
      }

      // 更新滚动弹幕位置
      if (danmaku.mode === 'scroll') {
        danmaku.x -= (danmaku.speed || speed) * 0.5;
        // 检查是否已滚动出屏幕
        if (danmaku.x + danmaku.width < 0) {
          return false;
        }
      }

      return true;
    });

    //渲染弹幕
    filteredDanmakus.forEach((danmaku) => {
      const fontSize =
        FONT_SIZE_OPTIONS.find((opt) => opt.value === danmaku.size)?.size || 24;

      ctx!.font = `${fontSize}px sans-serif`;
      ctx!.fillStyle = danmaku.color;

      // 添加黑色描边提高可读性
      ctx!.strokeStyle = '#000000';
      ctx!.lineWidth = 2;
      ctx!.strokeText(danmaku.content, danmaku.x, danmaku.y);
      ctx!.fillText(danmaku.content, danmaku.x, danmaku.y);
    });

    // 继续动画循环
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(renderDanmakus);
    }
  };
  // 开始动画
  const startAnimation = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      animationFrameId = requestAnimationFrame(renderDanmakus);
    }
  };

  // 停止动画
  const stopAnimation = () => {
    setIsPlaying(false);
    cancelAnimationFrame(animationFrameId);
  };

  // 发送弹幕
  const handleSendDanmaku = () => {
    if (!inputContent.trim()) {
      message.warning('请输入弹幕内容');
      return;
    }

    if (!videoRef.current) return;

    const fontSizeInfo = FONT_SIZE_OPTIONS.find(
      (opt) => opt.value === currentSize,
    );
    if (!fontSizeInfo) return;

    const width = calculateDanmakuWidth(inputContent, currentSize);
    const video = videoRef.current;

    // 计算初始位置
    let x = 0;
    let y = 0;

    switch (currentMode) {
      case 'scroll':
        x = canvasWidth;
        y =
          Math.floor(Math.random() * (canvasHeight - fontSizeInfo.size * 2)) +
          fontSizeInfo.size;
        break;
      case 'top':
        x = (canvasWidth - width) / 2;
        y = fontSizeInfo.size * 2;
        break;
      case 'bottom':
        x = (canvasWidth - width) / 2;
        y = canvasHeight - fontSizeInfo.size * 2;
        break;
    }

    // 发送弹幕到Redux
    dispatch(
      sendDanmaku({
        content: inputContent,
        color: currentColor,
        size: currentSize,
        mode: currentMode,
        x,
        y,
        width,
        height: fontSizeInfo.size,
        timestamp: video.currentTime,
        speed,
      }),
    );

    setInputContent('');
  };

  // 处理视频播放
  const handleVideoPlay = () => {
    startAnimation();
  };

  // 处理视频暂停
  const handleVideoPause = () => {
    stopAnimation();
  };

  // 切换弹幕显示
  const handleToggleDanmaku = () => {
    dispatch(toggleDanmakuVisible());
  };

  // 清空弹幕
  const handleClearDanmakus = () => {
    dispatch(clearDanmakus());
    clearCanvas();
  };

  // 模拟高并发弹幕
  const handleSimulateHighTraffic = () => {
    if (!videoRef.current) return;

    dispatch(
      addMockDanmakus({
        count: 100,
        canvasWidth,
        canvasHeight,
        currentTime: videoRef.current.currentTime,
        speed,
      }),
    );

    message.success('已添加100条模拟弹幕');
  };

  // 处理速度变化
  const handleSpeedChange = (value: number) => {
    dispatch(setDanmakuSpeed(value));
  };

  // 窗口大小变化时重新初始化Canvas
  const handleResize = () => {
    initCanvas();
  };

  // 初始化
  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', handleResize);

    // 视频加载完成后自动播放
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', initCanvas);
      video.addEventListener('play', handleVideoPlay);
      video.addEventListener('pause', handleVideoPause);
    }

    // 组件卸载时清理
    return () => {
      stopAnimation();
      window.removeEventListener('resize', handleResize);

      if (video) {
        video.removeEventListener('loadedmetadata', initCanvas);
        video.removeEventListener('play', handleVideoPlay);
        video.removeEventListener('pause', handleVideoPause);
      }
    };
  }, []);

  // 当弹幕列表、可见性或速度变化时重新渲染
  useEffect(() => {
    if (isPlaying) {
      renderDanmakus();
    }
  }, [danmakus, isVisible, speed]);

  return (
    <div className="danmaku-player">
      {/* 视频和弹幕容器 */}
      <div className="video-container">
        <video
          ref={videoRef}
          src={videosrc}
          className="video-player"
          controls
          // poster="https://picsum.photos/1280/720?random=1"
        />
        <canvas ref={canvasRef} className="danmaku-canvas" />
      </div>

      {/* 弹幕控制区 */}
      <div className="danmaku-controls">
        <Space size="middle" wrap>
          <Input
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            placeholder="输入弹幕内容"
            onPressEnter={handleSendDanmaku}
            maxLength={50}
            style={{ width: 300 }}
          />

          <ColorPicker
            value={currentColor}
            onChange={(color) => color && setCurrentColor(color.toHexString())}
            presetColors={PREDEFINED_COLORS}
            placement="bottom"
          />

          <Select
            value={currentSize}
            onChange={(value) =>
              setCurrentSize(value as 'small' | 'medium' | 'large')
            }
            style={{ width: 100 }}
          >
            {FONT_SIZE_OPTIONS.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>

          <Select
            value={currentMode}
            onChange={(value) =>
              setCurrentMode(value as 'scroll' | 'top' | 'bottom')
            }
            style={{ width: 100 }}
          >
            {MODE_OPTIONS.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendDanmaku}
          >
            发送
          </Button>
        </Space>

        <div className="danmaku-tools" style={{ marginTop: 16 }}>
          <Space size="middle">
            <Button
              onClick={handleToggleDanmaku}
              icon={
                isVisible ? <PauseCircleOutlined /> : <PlayCircleOutlined />
              }
            >
              {isVisible ? '关闭弹幕' : '开启弹幕'}
            </Button>

            <Button onClick={handleClearDanmakus} icon={<ClearOutlined />}>
              清空弹幕
            </Button>

            <Button
              onClick={handleSimulateHighTraffic}
              icon={<FireOutlined />}
              type="primary"
              danger
            >
              模拟高并发
            </Button>

            <div className="speed-control">
              <span>弹幕速度: </span>
              <Slider
                value={speed}
                min={1}
                max={10}
                step={1}
                onChange={handleSpeedChange}
                style={{ width: 200, marginLeft: 8 }}
              />
            </div>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default DanmakuPlayer;
