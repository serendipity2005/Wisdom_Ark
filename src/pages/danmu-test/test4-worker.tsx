import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Slider,
  Space,
  Typography,
  Upload,
  Switch,
  Badge,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  UploadOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import * as tf from '@tensorflow/tfjs';
import videoSrc from '@/assets/video/play.mp4';

const { Title, Text } = Typography;
const { Option } = Select;

// 弹幕数据接口
interface BarrageItem {
  id: string;
  text: string;
  x: number;
  y: number;
  speed: number;
  color: string;
  fontSize: number;
  width: number;
  height: number;
  lane: number;
  timestamp: number;
  isBlocked?: boolean;
}

// 人物检测结果
interface PersonDetection {
  bbox: [number, number, number, number]; // x, y, width, height
  confidence: number;
}

// Web Worker 消息类型
interface WorkerMessage {
  type: 'RENDER_BARRAGE' | 'GENERATE_MASK' | 'DETECT_COLLISION';
  payload: any;
}

const IntelligentBarrageSystem: React.FC = () => {
  // 基础状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [barrages, setBarrages] = useState<BarrageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentLanes, setCurrentLanes] = useState<Map<number, BarrageItem[]>>(
    new Map(),
  );

  // 配置状态
  const [maxBarrages, setMaxBarrages] = useState(100);
  const [speed, setSpeed] = useState(2);
  const [fontSize, setFontSize] = useState(24);
  const [enablePersonDetection, setEnablePersonDetection] = useState(false);
  const [enableCollisionDetection, setEnableCollisionDetection] =
    useState(true);

  // 技术相关状态
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [personDetections, setPersonDetections] = useState<PersonDetection[]>(
    [],
  );
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);

  // 引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const animationRef = useRef<number>(0);
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(null);

  // 性能统计
  const [fps, setFps] = useState(0);
  const [barrageCount, setBarrageCount] = useState(0);
  const fpsRef = useRef(0);
  const lastTimeRef = useRef(0);

  // Web Worker 初始化
  useEffect(() => {
    // 创建 Web Worker (内联方式)
    const workerCode = `
      let offscreenCanvas = null;
      let ctx = null;
      let maskImageData = null;
      
      self.onmessage = function(e) {
        const { type, payload } = e.data;
        
        switch(type) {
          case 'INIT_CANVAS':
            offscreenCanvas = payload.canvas;
            ctx = offscreenCanvas.getContext('2d');
            break;
            
          case 'RENDER_BARRAGE':
            renderBarrages(payload.barrages, payload.width, payload.height);
            break;
            
          case 'GENERATE_MASK':
            generateMask(payload.detections, payload.width, payload.height);
            break;
            
          case 'DETECT_COLLISION':
            const result = detectCollisions(payload.barrages, payload.newBarrage);
            self.postMessage({ type: 'COLLISION_RESULT', payload: result });
            break;
        }
      };
      
      function renderBarrages(barrages, width, height) {
        if (!ctx) return;
        
        ctx.clearRect(0, 0, width, height);
        
        // 应用蒙版
        if (maskImageData) {
          ctx.putImageData(maskImageData, 0, 0);
          ctx.globalCompositeOperation = 'source-atop';
        }
        
        barrages.forEach(barrage => {
          if (barrage.isBlocked) return;
          
          ctx.fillStyle = barrage.color;
          ctx.font = \`\${barrage.fontSize}px Arial\`;
          ctx.fillText(barrage.text, barrage.x, barrage.y);
        });
        
        ctx.globalCompositeOperation = 'source-over';
        
        // 传回渲染结果
        const imageData = ctx.getImageData(0, 0, width, height);
        self.postMessage({ 
          type: 'RENDER_COMPLETE', 
          payload: { imageData } 
        });
      }
      
      function generateMask(detections, width, height) {
        if (!ctx) return;
        
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // 人物区域设为黑色（遮挡弹幕）
        ctx.fillStyle = 'black';
        detections.forEach(detection => {
          const [x, y, w, h] = detection.bbox;
          ctx.fillRect(x, y, w, h);
        });
        
        maskImageData = ctx.getImageData(0, 0, width, height);
        
        self.postMessage({ 
          type: 'MASK_COMPLETE', 
          payload: { maskImageData } 
        });
      }
      
      function detectCollisions(existingBarrages, newBarrage) {
        const collisions = existingBarrages.filter(existing => {
          if (existing.lane !== newBarrage.lane) return false;
          
          const distance = existing.x - newBarrage.x;
          const minDistance = existing.width + 50; // 最小间距
          
          return distance < minDistance && distance > -newBarrage.width;
        });
        
        return { hasCollision: collisions.length > 0, collisions };
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    workerRef.current = new Worker(URL.createObjectURL(blob));

    // 监听 Worker 消息
    workerRef.current.onmessage = (e) => {
      const { type, payload } = e.data;

      switch (type) {
        case 'RENDER_COMPLETE':
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.putImageData(payload.imageData, 0, 0);
          }
          break;

        case 'MASK_COMPLETE':
          // 蒙版生成完成
          break;

        case 'COLLISION_RESULT':
          // 处理碰撞检测结果
          break;
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // 加载 TensorFlow 模型
  const loadModel = useCallback(async () => {
    setIsModelLoading(true);
    try {
      // 加载 MobileNet 或 COCO-SSD 模型用于人物检测
      const loadedModel = await tf.loadGraphModel(
        'https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1',
        {
          fromTFHub: true,
        },
      );
      setModel(loadedModel);
    } catch (error) {
      console.error('模型加载失败:', error);
      // 使用简化的检测逻辑作为后备
    }
    setIsModelLoading(false);
  }, []);

  // 人物检测
  const detectPersons = useCallback(
    async (videoElement: HTMLVideoElement) => {
      if (!model || !videoElement) return [];

      try {
        const tensor = tf.browser.fromPixels(videoElement);
        const resized = tf.image.resizeBilinear(tensor, [320, 320]);
        const expanded = resized.expandDims(0);

        const predictions = (await model.executeAsync(expanded)) as tf.Tensor[];

        // 解析预测结果
        const boxes = await predictions[0].data();
        const scores = await predictions[1].data();
        const classes = await predictions[2].data();

        const detections: PersonDetection[] = [];

        for (let i = 0; i < scores.length; i++) {
          if (scores[i] > 0.5 && classes[i] === 1) {
            // 类别1通常是人
            const [y1, x1, y2, x2] = [
              boxes[i * 4] * videoElement.videoHeight,
              boxes[i * 4 + 1] * videoElement.videoWidth,
              boxes[i * 4 + 2] * videoElement.videoHeight,
              boxes[i * 4 + 3] * videoElement.videoWidth,
            ];

            detections.push({
              bbox: [x1, y1, x2 - x1, y2 - y1],
              confidence: scores[i],
            });
          }
        }

        tensor.dispose();
        resized.dispose();
        expanded.dispose();
        predictions.forEach((p) => p.dispose());

        return detections;
      } catch (error) {
        console.error('人物检测失败:', error);
        return [];
      }
    },
    [model],
  );

  // 弹幕碰撞检测
  const checkCollision = useCallback(
    (newBarrage: BarrageItem): boolean => {
      if (!enableCollisionDetection) return false;

      const laneBarrages = currentLanes.get(newBarrage.lane) || [];

      return laneBarrages.some((existing) => {
        const distance = existing.x - newBarrage.x;
        const minDistance = existing.width + 50;
        return distance < minDistance && distance > -newBarrage.width;
      });
    },
    [currentLanes, enableCollisionDetection],
  );

  // 获取可用车道
  const getAvailableLane = useCallback((): number => {
    const maxLanes = Math.floor(400 / (fontSize + 10));

    for (let lane = 0; lane < maxLanes; lane++) {
      const laneBarrages = currentLanes.get(lane) || [];
      if (laneBarrages.length === 0) return lane;

      const lastBarrage = laneBarrages[laneBarrages.length - 1];
      if (lastBarrage.x + lastBarrage.width < 800) {
        return lane;
      }
    }

    return Math.floor(Math.random() * maxLanes);
  }, [currentLanes, fontSize]);

  // 添加弹幕
  const addBarrage = useCallback(
    (text: string) => {
      if (!text.trim() || barrages.length >= maxBarrages) return;

      const lane = getAvailableLane();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      ctx.font = `${fontSize}px Arial`;
      const textWidth = ctx.measureText(text).width;

      const newBarrage: BarrageItem = {
        id: Date.now().toString(),
        text,
        x: 800,
        y: lane * (fontSize + 10) + fontSize,
        speed: speed,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        fontSize,
        width: textWidth,
        height: fontSize,
        lane,
        timestamp: Date.now(),
      };

      // 检查碰撞
      if (checkCollision(newBarrage)) {
        console.log('弹幕碰撞，跳过');
        return;
      }

      setBarrages((prev) => [...prev, newBarrage]);

      // 更新车道信息
      setCurrentLanes((prev) => {
        const newLanes = new Map(prev);
        const laneBarrages = newLanes.get(lane) || [];
        newLanes.set(lane, [...laneBarrages, newBarrage]);
        return newLanes;
      });
    },
    [
      barrages.length,
      maxBarrages,
      getAvailableLane,
      fontSize,
      speed,
      checkCollision,
    ],
  );

  // 动画循环
  const animate = useCallback(() => {
    if (!canvasRef.current || !isPlaying) return;

    const now = performance.now();
    const delta = now - lastTimeRef.current;

    if (delta > 16) {
      // 约60FPS
      // 更新弹幕位置
      setBarrages((prev) => {
        const updated = prev
          .map((barrage) => ({
            ...barrage,
            x: barrage.x - barrage.speed,
          }))
          .filter((barrage) => barrage.x + barrage.width > 0);

        return updated;
      });

      // 更新车道信息
      setCurrentLanes((prev) => {
        const newLanes = new Map();
        barrages.forEach((barrage) => {
          if (barrage.x + barrage.width > 0) {
            const laneBarrages = newLanes.get(barrage.lane) || [];
            newLanes.set(barrage.lane, [...laneBarrages, barrage]);
          }
        });
        return newLanes;
      });

      // 人物检测
      if (enablePersonDetection && videoRef.current) {
        detectPersons(videoRef.current).then((detections) => {
          setPersonDetections(detections);

          // 发送蒙版生成请求到 Worker
          if (workerRef.current) {
            workerRef.current.postMessage({
              type: 'GENERATE_MASK',
              payload: {
                detections,
                width: canvasRef.current?.width || 800,
                height: canvasRef.current?.height || 400,
              },
            });
          }
        });
      }

      // 发送渲染请求到 Worker
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'RENDER_BARRAGE',
          payload: {
            barrages,
            width: canvasRef.current.width,
            height: canvasRef.current.height,
          },
        });
      }

      // 更新FPS
      fpsRef.current++;
      if (now - lastTimeRef.current > 1000) {
        setFps(fpsRef.current);
        fpsRef.current = 0;
        lastTimeRef.current = now;
      }

      setBarrageCount(barrages.length);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [isPlaying, barrages, enablePersonDetection, detectPersons]);

  // 开始/暂停
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // 清空弹幕
  const clearBarrages = useCallback(() => {
    setBarrages([]);
    setCurrentLanes(new Map());
  }, []);

  // 处理输入
  const handleSendBarrage = useCallback(() => {
    addBarrage(inputText);
    setInputText('');
  }, [inputText, addBarrage]);

  // 模拟高并发弹幕
  const simulateHighConcurrency = useCallback(() => {
    const messages = [
      '666666',
      '太厉害了！',
      '哈哈哈',
      '好看！',
      '支持主播',
      '第一次来',
      '老粉丝了',
      '刷礼物了',
      '点赞！',
      '关注了',
    ];

    const interval = setInterval(() => {
      const randomMessage =
        messages[Math.floor(Math.random() * messages.length)];
      addBarrage(randomMessage);
    }, 100);

    setTimeout(() => clearInterval(interval), 5000); // 5秒后停止
  }, [addBarrage]);

  // 初始化和清理
  useEffect(() => {
    if (enablePersonDetection && !model) {
      loadModel();
    }
  }, [enablePersonDetection, model, loadModel]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  // 初始化 OffscreenCanvas
  useEffect(() => {
    if (canvasRef.current && workerRef.current) {
      const offscreen = canvasRef.current.transferControlToOffscreen?.();
      if (offscreen) {
        workerRef.current.postMessage(
          {
            type: 'INIT_CANVAS',
            payload: { canvas: offscreen },
          },
          [offscreen],
        );
      }
    }
  }, []);

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Title level={2}>🎯 智能弹幕系统</Title>

      {/* 状态面板 */}
      <Card style={{ marginBottom: '20px' }}>
        <Space wrap>
          <Badge count={barrageCount} showZero>
            <Text strong>当前弹幕</Text>
          </Badge>
          <Text>FPS: {fps}</Text>
          <Text>
            TensorFlow:{' '}
            {isModelLoading ? '加载中...' : model ? '已就绪' : '未加载'}
          </Text>
          <Text>人物检测: {personDetections.length} 个</Text>
        </Space>
      </Card>

      {/* 控制面板 */}
      <Card title="控制面板" style={{ marginBottom: '20px' }}>
        <Space wrap>
          <Button
            type="primary"
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={togglePlay}
          >
            {isPlaying ? '暂停' : '开始'}
          </Button>

          <Button icon={<ClearOutlined />} onClick={clearBarrages}>
            清空弹幕
          </Button>

          <Button onClick={simulateHighConcurrency}>模拟高并发</Button>
        </Space>
      </Card>

      {/* 配置面板 */}
      <Card title="参数配置" style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <div>
            <Text>最大弹幕数量</Text>
            <Slider
              min={50}
              max={500}
              value={maxBarrages}
              onChange={setMaxBarrages}
              tooltip={{ formatter: (value) => `${value}条` }}
            />
          </div>

          <div>
            <Text>弹幕速度</Text>
            <Slider
              min={0.5}
              max={5}
              step={0.1}
              value={speed}
              onChange={setSpeed}
              tooltip={{ formatter: (value) => `${value}x` }}
            />
          </div>

          <div>
            <Text>字体大小</Text>
            <Slider
              min={12}
              max={36}
              value={fontSize}
              onChange={setFontSize}
              tooltip={{ formatter: (value) => `${value}px` }}
            />
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <Space wrap>
            <Switch
              checked={enablePersonDetection}
              onChange={setEnablePersonDetection}
              checkedChildren="人物识别"
              unCheckedChildren="人物识别"
            />

            <Switch
              checked={enableCollisionDetection}
              onChange={setEnableCollisionDetection}
              checkedChildren="防碰撞"
              unCheckedChildren="防碰撞"
            />
          </Space>
        </div>
      </Card>

      {/* 视频输入 */}
      {enablePersonDetection && (
        <Card title="视频输入" style={{ marginBottom: '20px' }}>
          <video
            ref={videoRef}
            width={400}
            height={225}
            controls
            style={{ maxWidth: '100%' }}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        </Card>
      )}

      {/* 弹幕画布 */}
      <Card title="弹幕显示区域">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          style={{
            width: '100%',
            maxWidth: '800px',
            height: 'auto',
            border: '2px solid #d9d9d9',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'block',
          }}
        />

        {/* 弹幕输入 */}
        <div style={{ marginTop: '16px' }}>
          <Input.Group compact>
            <Input
              style={{ width: 'calc(100% - 100px)' }}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onPressEnter={handleSendBarrage}
              placeholder="输入弹幕内容..."
              maxLength={50}
            />
            <Button type="primary" onClick={handleSendBarrage}>
              发送
            </Button>
          </Input.Group>
        </div>
      </Card>
    </div>
  );
};

export default IntelligentBarrageSystem;
