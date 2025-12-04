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
    rtc: any, // 传入RTC实例
    options?: {
      preferCurrentTab?: boolean;
      preferDisplaySurface?: 'monitor' | 'window' | 'browser';
    },
  ) => {
    try {
      await rtc.startScreenShare(options);
      setIsScreenSharing(true);
      message.success('屏幕共享已开始');
    } catch (error) {
      console.error('共享屏幕失败:', error);
      message.error('屏幕共享失败');
    }
  };
  const stopScreenShare = (rtc: any) => {
    try {
      rtc.stopScreenShare();
      setIsScreenSharing(false);
      message.info('屏幕共享已停止');
    } catch (error) {
      console.error('停止屏幕共享失败:', error);
    }
  };
  return {
    startScreenShare,
    isScreenSharing,
    stopScreenShare,
  };
}
