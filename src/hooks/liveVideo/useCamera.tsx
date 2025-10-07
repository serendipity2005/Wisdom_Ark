import { message } from 'antd';
import { useRef, useState } from 'react';

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLive, setIsLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setStream(mediaStream); //设置媒体流
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // 修改直播状态
        setIsLive(true);
      }
    } catch (error) {
      message.error('无法访问摄像头，请检查权限设置');
    }
  };
  const stopCamera = () => {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      if (track.readyState === 'live') {
        track.stop();
      }
    });

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
    setIsLive(false);
  };

  return { startCamera, stopCamera, videoRef, stream, isLive, setIsLive };
}
