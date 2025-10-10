import { useEffect, useRef, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

interface PoseBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PoseDetectorProps {
  onDetect: (boxes: PoseBox[]) => void;
}

export default function PoseDetector({ onDetect }: PoseDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(
    null,
  );

  useEffect(() => {
    const init = async () => {
      await poseDetection
        .createDetector(poseDetection.SupportedModels.MoveNet, {
          modelType: 'singlepose-lightning',
        })
        .then(setDetector);
      await navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        });
    };

    init();
  }, []);

  useEffect(() => {
    if (!detector || !videoRef.current) return;
    let animationId: number;

    const detect = async () => {
      if (videoRef.current!.readyState >= 2) {
        const poses = await detector.estimatePoses(videoRef.current!);
        if (poses.length > 0) {
          const kp = poses[0].keypoints;

          // 取上半身关键点
          const xs = kp
            .filter((k) =>
              [
                'nose',
                'left_shoulder',
                'right_shoulder',
                'left_hip',
                'right_hip',
              ].includes(k.name!),
            )
            .map((k) => k.x);
          const ys = kp
            .filter((k) =>
              [
                'nose',
                'left_shoulder',
                'right_shoulder',
                'left_hip',
                'right_hip',
              ].includes(k.name!),
            )
            .map((k) => k.y);

          if (xs.length > 0 && ys.length > 0) {
            const box = {
              x: Math.min(...xs),
              y: Math.min(...ys),
              width: Math.max(...xs) - Math.min(...xs),
              height: Math.max(...ys) - Math.min(...ys),
            };
            onDetect([box]);
          }
        }
      }
      animationId = requestAnimationFrame(detect);
    };

    detect();
    return () => cancelAnimationFrame(animationId);
  }, [detector, onDetect]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover rounded-lg"
      style={{ transform: 'scaleX(-1)' }} // 镜像显示
      muted
    />
  );
}
