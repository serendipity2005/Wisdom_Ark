import { useContext, useEffect, useRef } from 'react';
import './LiveHeader.scss';
import { Context } from '@/pages/livevideo';
export default function LiveShow() {
  const ctx = useContext(Context);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 当 Rtc 实例变化时，设置视频流
  useEffect(() => {
    if (ctx) {
      ctx.videoElement = videoRef.current;
    }

    if (ctx && videoRef.current) {
      const stream = ctx.getCurrentStream();
      if (stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [ctx]);
  return (
    <>
      {/* 播放区域 */}
      <div className="video w-99.8% h-full bg-white">
        <video
          className="w-full h-full object-contain"
          muted
          autoPlay
          ref={videoRef}
        ></video>
      </div>
    </>
  );
}
