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

import { useDispatch, useSelector } from 'react-redux';
import type { DanmakuItem, DanmakuState } from '@/store/modules/danmakuSlice';
import { add } from '@tensorflow/tfjs';
import videoSrc from '@/assets/video/play.mp4';
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
  // 存储worker 实例
  const workerRef = useRef<Worker | null>(null);
  // ------------------性能监控
  // 渲染性能状态
  const [renderStats, setRenderStats] = useState({
    fps: 60,
    avgDrawTime: '0.00',
    maxDrawTime: '0.00',
    danmakuCount: 0,
    timestamp: 0,
  });

  //  弹幕数组
  const danmakuRef = useRef<DanmakuItem[]>([]);
  //初始化canvas(只执行一次)
  const initCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    // 创建webworker
    workerRef.current = new Worker(
      new URL('./danmaku.worker.ts', import.meta.url),
    );

    // ----------------性能----------------------

    // 监听Worker发送的渲染性能数据
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;

      if (type === 'RENDER_STATS') {
        setRenderStats({
          fps: payload.fps,
          avgDrawTime: payload.avgDrawTime,
          maxDrawTime: payload.maxDrawTime,
          danmakuCount: payload.danmakuCount,
          timestamp: payload.timestamp,
        });
      }
    };
    // ---------------------------------------------

    const canvas = canvasRef.current;
    // // 创建上下文
    // const ctx = canvas.getContext('2d');
    // //  获取canvas 元素相对于视口的位置和尺寸信息 包括width 和height
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    // // 乘以devicePixelRatio是为了在高分辨率屏幕（如Retina显示屏）上获得更清晰的图像。
    // ctx?.scale(window.devicePixelRatio, window.devicePixelRatio);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    const offscreenCanvas = canvas.transferControlToOffscreen();

    // 向worker 发送初始消息
    workerRef.current.postMessage(
      {
        type: 'INIT',
        payload: {
          offscreenCanvas,
          devicePixelRatio: window.devicePixelRatio || 1,
        },
      },
      [offscreenCanvas],
    );
  }, []);

  // 添加弹幕
  const addDanmakuToWorker = useCallback((danmaku: DanmakuItem) => {
    // if (!canvasRef.current) return;
    // const canvas = canvasRef.current;
    // const ctx = canvas.getContext('2d');
    // const fontSize = '16px';
    // ctx.font = `${fontSize} Arial`;
    // const textWidth = ctx.measureText(text).width;
    console.log(workerRef);

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'ADD_DANMAKU',
        payload: danmaku,
      });
    }
  }, []);
  // 批量添加弹幕
  const addDanmakusToWorker = useCallback((danmakus: DanmakuItem[]) => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'ADD_DANMAKUS',
        payload: danmakus,
      });
    }
  }, []);
  return {
    canvasRef,
    initCanvas,
    addDanmakuToWorker,
    addDanmakusToWorker,
    renderStats, // 导出渲染性能数据
  };
};
// 定义弹幕内容库
const demoTexts = [
  '666666',
  '233333',
  '哈哈哈',
  '好厉害',
  '支持UP主',
  '前方高能',
  '弹幕护体',
  '一键三连',
  '来了来了',
  '打卡打卡',
  '每日一刷',
  '已阅',
  '路过',
  '太强了',
  '牛逼牛逼',
  '精彩',
  '好看',
  '给力',
  'awsl',
  'tql',
];

// 定义颜色库
const danmakuColors = [
  '#ffffff',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
  '#ff7f00',
  '#ff1493',
  '#00bfff',
];

export default function Test1() {
  // 使用 RTK 的 useSelector 替代原来的 useState
  const state = useSelector(
    (state: RootState) => state.danmaku,
  ) as DanmakuState;
  const {
    canvasRef,
    initCanvas,
    renderStats,
    addDanmakuToWorker,
    addDanmakusToWorker,
  } = useDanmakuRenderer();
  // const [danmakuList, setDanmakuList] = useState<DanmakuItem>();
  // const dispatch = useDispatch();

  // const canvasRef = useRef<HTMLCanvasElement>(null);
  // const rendererRef = useRef<HTMLCanvasElement>(null);
  // 发送弹幕
  // useEffect(() => {
  //   if (state.isPlaying) {
  //     console.log('发送弹幕');
  //     const text = demoTexts[Math.floor(Math.random() * demoTexts.length)];
  //     const color = colors[Math.floor(Math.random() * colors.length)];
  //   }
  // });

  // 组件挂载时初始化离屏渲染
  useEffect(() => {
    initCanvas();
  }, []);

  //  创建上下文

  // const ctx = canvasRef.current?.getContext('2d');
  // 设置canvas尺寸
  // useEffect(() => {
  //   console.log(5554);
  //   initCanvas();

  //   if (canvasRef.current) {
  //     const canvas = canvasRef.current;
  //     canvas.width = canvas.clientWidth;
  //     canvas.height = canvas.clientHeight;
  //   }
  // }, []);
  // const draw = () => {
  //   console.log('2555');
  //   console.log(ctx);

  //   if (!ctx || !canvasRef.current) return;

  //   // 清除画布
  //   ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  //   console.log('draw');

  //   // 先设置字体再绘制文本
  //   ctx.font = '30px Arial';
  //   ctx.fillStyle = '#ffffff';
  //   ctx.fillText('Hello World!', 200, 100);
  // };

  const sendDanmaku = useCallback(() => {
    // 创建弹幕对象
    const danmaku: DanmakuItem = {
      id: Date.now().toString() + Math.random(),
      text: '测试弹幕',
      x: canvasRef.current.width / window.devicePixelRatio,
      y: 0,
      speed: 100,
      fontSize: 16,
      timestamp: Date.now(),
      type: 'scroll',
      color: 'white',
    };
    // setDanmakuList((prevList: DanmakuItem[]) => [...prevList, danmaku]);
    addDanmakuToWorker(danmaku);
  }, []);

  // 高并发弹幕测试函数
  const simulateHighTraffic = useCallback(
    (userCount = 1000) => {
      console.log(`开始模拟 ${userCount} 个用户同时发送弹幕`);

      const danmakus: DanmakuItem[] = [];

      for (let i = 0; i < userCount; i++) {
        // 随机选择弹幕内容
        const text = demoTexts[Math.floor(Math.random() * demoTexts.length)];

        // 随机选择颜色
        const color =
          danmakuColors[Math.floor(Math.random() * danmakuColors.length)];

        // 随机生成字体大小 (14-28px)
        const fontSize = 14 + Math.floor(Math.random() * 15);

        // 随机生成速度 (50-200)
        // const speed = 50 + Math.floor(Math.random() * 151);

        // 随机选择弹幕类型
        const types: ('scroll' | 'top' | 'bottom')[] = [
          'scroll',
          'top',
          'bottom',
        ];
        const type = types[Math.floor(Math.random() * types.length)];

        const danmaku: DanmakuItem = {
          id: `user_${i}_${Date.now()}`,
          text: text,
          x: canvasRef.current
            ? canvasRef.current.width / window.devicePixelRatio
            : 800,
          y: 0, // 将在Worker中设置
          // speed: speed,
          speed: 100,
          color: color,
          fontSize: fontSize,
          opacity: 0.8 + Math.random() * 0.2, // 随机透明度 0.8-1.0
          width: 0, // 将在Worker中计算
          timestamp: Date.now(),
          type: 'scroll',
        };

        danmakus.push(danmaku);
      }

      // 批量发送弹幕
      addDanmakusToWorker(danmakus);
      console.log(`已发送 ${userCount} 条弹幕`);
    },
    [addDanmakusToWorker],
  );

  return (
    <div style={{ padding: '20px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={2}>高并发视频弹幕系统</Title>

      {/* 视频区域 */}
      <Card style={{ marginBottom: '20px', position: 'relative' }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '600px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div id="container" style={{ width: '100%', height: '100%' }}>
            <video
              id="video"
              controls
              autoPlay
              src={videoSrc}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            ></video>
          </div>

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
            {/* <video src={videoSrc}></video> */}
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
          {/* 高并发测试按钮 */}
          <Space style={{ marginTop: '16px', width: '100%' }}>
            <Button onClick={() => simulateHighTraffic(100)}>
              发送100条弹幕
            </Button>
            <Button onClick={() => simulateHighTraffic(500)}>
              发送500条弹幕
            </Button>
            <Button onClick={() => simulateHighTraffic(1000)}>
              发送1000条弹幕
            </Button>
            <Button
              type="primary"
              danger
              onClick={() => simulateHighTraffic(5000)}
            >
              发送5000条弹幕(压力测试)
            </Button>
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
    </div>
  );
}
