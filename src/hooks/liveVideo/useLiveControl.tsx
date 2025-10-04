import { message } from 'antd';

export function useLiveControl() {
  /**
   * 开始直播
   * @param isLive 是否正在直播
   * @param stopCamera 停止摄像头
   * @param setIsLive 设置直播状态
   */
  const startLive = (
    isLive: boolean,
    startCamera: () => Promise<void>,
    setIsLive: (isLive: boolean) => void,
  ) => {
    if (!isLive) {
      try {
        setIsLive(true);
        message.success('已开始直播，可以手动开启摄像头和麦克风');
      } catch (error) {
        message.error('开始直播失败');
      }
    }
  };

  /**
   * 停止直播
   * @param isLive 是否正在直播
   * @param stopCamera 停止摄像头
   * @param setIsLive 设置直播状态
   */
  const stopLive = (
    isLive: boolean,
    stopCamera: () => void,
    setIsLive: (isLive: boolean) => void,
  ) => {
    if (isLive) {
      stopCamera();
      setIsLive(false);
    }
  };
  return { startLive, stopLive };
}
