import React, { useEffect, useRef, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

export default function PoseTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(
    null,
  );
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResults, setDetectionResults] = useState<string>('');

  // 初始化检测器
  useEffect(() => {
    const initDetector = async () => {
      try {
        console.log('开始初始化检测器...');

        // 检查TensorFlow是否可用
        console.log(
          'TensorFlow available:',
          typeof poseDetection !== 'undefined',
        );
        console.log(
          'MoveNet available:',
          poseDetection.SupportedModels.MoveNet,
        );

        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        };

        console.log('创建检测器...');
        const newDetector = await poseDetection.createDetector(
          model,
          detectorConfig,
        );

        console.log('检测器创建成功!');
        setDetector(newDetector);

        // 获取摄像头权限
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (error) {
        console.error('初始化失败:', error);
        setDetectionResults(
          `初始化失败: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    initDetector();

    return () => {
      if (detector) {
        detector.dispose();
      }
    };
  }, []);

  // 检测循环
  useEffect(() => {
    if (!detector || !videoRef.current || !canvasRef.current) return;

    let animationId: number;

    const detect = async () => {
      if (videoRef.current!.readyState >= 2) {
        try {
          const poses = await detector.estimatePoses(videoRef.current!);

          // 在canvas上绘制结果
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d')!;

          // 清除画布
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (poses.length > 0) {
            setDetectionResults(`检测到 ${poses.length} 个人像`);

            // 绘制关键点
            poses.forEach((pose, poseIndex) => {
              pose.keypoints.forEach((keypoint) => {
                if (keypoint.score && keypoint.score > 0.3) {
                  ctx.beginPath();
                  ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
                  ctx.fillStyle = 'red';
                  ctx.fill();
                }
              });
            });
          } else {
            setDetectionResults('未检测到人像');
          }
        } catch (error) {
          console.error('检测错误:', error);
          setDetectionResults(
            `检测错误: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      animationId = requestAnimationFrame(detect);
    };

    if (isDetecting) {
      detect();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [detector, isDetecting]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">姿态检测测试</h1>

      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={() => setIsDetecting(!isDetecting)}
            className={`px-4 py-2 rounded ${
              isDetecting
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isDetecting ? '停止检测' : '开始检测'}
          </button>

          <button
            onClick={() => {
              console.log('检测器状态:', !!detector);
              console.log('视频状态:', videoRef.current?.readyState);
              console.log(
                '视频尺寸:',
                videoRef.current
                  ? `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`
                  : '无',
              );
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            调试信息
          </button>
        </div>

        <div className="text-lg">状态: {detectionResults || '准备中...'}</div>

        <div className="relative">
          <video
            ref={videoRef}
            className="w-full max-w-2xl border-2 border-gray-600"
            style={{ transform: 'scaleX(-1)' }}
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full max-w-2xl"
            style={{ transform: 'scaleX(-1)' }}
          />
        </div>
      </div>
    </div>
  );
}
