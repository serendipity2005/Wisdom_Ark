import { message } from 'antd';
import { useState } from 'react';

export function useScreenShare() {
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  /**
   * 共享屏幕
   * @param videoRef video元素
   * @param onStop 停止回调
   */
  const startScreenShare = async (
    videoRef: React.RefObject<HTMLVideoElement | null>,
    onStop?: () => void,
  ) => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setIsScreenSharing(true);
      if (videoRef.current) {
        videoRef.current.srcObject = screenStream;
        // 确保视频能够自动播放
        videoRef.current.play().catch(console.error);
      }

      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare(videoRef as React.RefObject<HTMLVideoElement>);
        if (onStop) onStop();
        message.info('屏幕共享已结束');
      });
    } catch (error) {
      console.error('共享屏幕失败:', error);
    }
  };
  const stopScreenShare = (videoRef: React.RefObject<HTMLVideoElement>) => {
    console.log('停止共享');

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
      videoRef.current.srcObject = null;
    }

    setIsScreenSharing(false);
  };
  return {
    startScreenShare,
    isScreenSharing,
    stopScreenShare,
  };
}
