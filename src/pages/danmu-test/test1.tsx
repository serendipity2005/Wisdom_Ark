import React, { useState, useRef, useEffect, useCallback, use } from 'react';
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
import { SendOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title } = Typography;
import store, { type RootState } from '@/store';
import { useDispatch, useSelector } from 'react-redux';
import type { DanmakuItem, DanmakuState } from '@/store/modules/danmakuSlice';
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

// 创建hook 统一管理
const useDanmakuRenderer = () => {
  // 创建渲染器
  const canvasRef = useRef<HTMLCanvasElement>(null);
  //  弹幕数组
  const danmakuRef = useRef<DanmakuItem[]>([]);
  //初始化canvas
  const initCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    // 创建上下文
    const ctx = canvas.getContext('2d');
    //  获取canvas 元素相对于视口的位置和尺寸信息 包括width 和height
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    // 乘以devicePixelRatio是为了在高分辨率屏幕（如Retina显示屏）上获得更清晰的图像。
    ctx?.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  };

  // 添加弹幕
  const addDanmaku = (
    text: string,
    color = '#ffffff',
    type: 'scroll' | 'top' | 'bottom' = 'scroll',
  ) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const fontSize = '16px';
    ctx.font = `${fontSize} Arial`;
    const textWidth = ctx.measureText(text).width;

    // 创建弹幕对象
    const danmaku: DanmakuItem = {
      id: Math.random().toString(),
      text,
      x: canvas.width / window.devicePixelRatio,
      y: 50,
      speed: 100,
      color,
      fontSize: parseInt(fontSize),
      opacity: 1,
      width: textWidth,
      timestamp: Date.now(),
      type,
    };
    danmakuRef.current.push(danmaku);
  };
};
export default function Test1() {
  // 使用 RTK 的 useSelector 替代原来的 useState

  const state = useSelector(
    (state: RootState) => state.danmaku,
  ) as DanmakuState;

  const [danmakuList, setDanmakuList] = useState<DanmakuItem>();
  const dispatch = useDispatch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const rendererRef = useRef<HTMLCanvasElement>(null);
  // 发送弹幕
  useEffect(() => {
    if (state.isPlaying) {
      console.log('发送弹幕');
      const text = demoTexts[Math.floor(Math.random() * demoTexts.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
    }
  });

  //  创建上下文
  console.log(555);

  const ctx = canvasRef.current?.getContext('2d');
  // 设置canvas尺寸
  useEffect(() => {
    console.log(5554);

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
  }, []);
  const draw = () => {
    console.log('2555');
    console.log(ctx);

    if (!ctx || !canvasRef.current) return;

    // 清除画布
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    console.log('draw');

    // 先设置字体再绘制文本
    ctx.font = '30px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Hello World!', 200, 100);
  };

  const sendDanmaku = useCallback(() => {
    // 创建弹幕对象
    const danmaku: DanmakuItem = {
      id: Date.now().toString() + Math.random(),
      text: '测试弹幕',
      x: 600,
      y: Math.random() * 300 + 50,
      speed: 100,
    };
    // setDanmakuList((prevList: DanmakuItem[]) => [...prevList, danmaku]);
    draw();
  }, []);
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
            ref={canvasRef}
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
            <Input placeholder="输入弹幕内容..." maxLength={50} />
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
            <ColorPicker showText />

            <div>类型:</div>
            <Select style={{ width: 120 }}>
              <Option value="scroll">滚动</Option>
              <Option value="top">顶部</Option>
              <Option value="bottom">底部</Option>
            </Select>
          </Space>
        </Card>

        {/* 控制面板 */}
        <Card title="控制面板">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button block>暂停</Button>

            <Button block>清空弹幕</Button>

            <div>
              <div>透明度: 0%</div>
              <Slider min={0} max={1} step={0.1} />
            </div>

            <div>
              <div>字体大小: px</div>
              <Slider min={12} max={36} />
            </div>

            <div>
              <div>弹幕速度: 1x</div>
              <Slider min={0.5} max={3} step={0.1} />
            </div>

            <Button
              type="primary"
              // onClick={() =>
              //   updateSettings('showDanmaku', !state.settings.showDanmaku)
              // }
              block
            ></Button>
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
              {/* {state.danmakus.length} */}
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
              {/* {state.isPlaying ? '运行中' : '已暂停'} */}
            </div>
            <div>系统状态</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
