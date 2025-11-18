import { useContext, useEffect, useRef } from 'react';
import './LiveHeader.scss';
import { Context } from '@/pages/livevideo';

export default function DualVideoShow() {
  const ctx = useContext(Context);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);

  // 设置视频元素引用
  useEffect(() => {
    if (ctx) {
      ctx.videoElement = mainVideoRef.current;
      ctx.setScreenVideoElement(mainVideoRef.current);
    }
  }, [ctx]);

  // 更新视频流
  useEffect(() => {
    if (ctx) {
      // 主视频流（屏幕共享或摄像头）
      if (ctx.isScreenSharing && ctx.getScreenStream()) {
        // 屏幕共享时，主视频显示屏幕
        if (mainVideoRef.current) {
          mainVideoRef.current.srcObject = ctx.getScreenStream();
        }

        // 摄像头显示在右下角
        if (cameraVideoRef.current && ctx.getCurrentStream()) {
          cameraVideoRef.current.srcObject = ctx.getCurrentStream();
        }
      } else {
        // 没有屏幕共享时，主视频显示摄像头
        if (mainVideoRef.current && ctx.getCurrentStream()) {
          mainVideoRef.current.srcObject = ctx.getCurrentStream();
        }

        // 隐藏摄像头小窗口
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = null;
        }
      }
    }
  }, [ctx?.isScreenSharing, ctx?.videoState]);

  return (
    <div className="dual-video-container w-99.8% h-full bg-white relative">
      {/* 主视频区域 */}
      <div className="main-video w-full h-full">
        <video
          className="w-full h-full object-contain"
          muted
          autoPlay
          ref={mainVideoRef}
        />
      </div>

      {/* 摄像头小窗口 - 只在屏幕共享时显示 */}
      {ctx?.isScreenSharing && ctx?.videoState && (
        <div className="camera-overlay absolute bottom-4 right-4 w-auto h-150 bg-black rounded-lg overflow-hidden shadow-lg">
          <video
            className="w-full h-full object-cover"
            muted
            autoPlay
            ref={cameraVideoRef}
          />
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
            摄像头
          </div>
        </div>
      )}
    </div>
  );
}
