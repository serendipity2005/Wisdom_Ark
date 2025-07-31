// 无权访问

import { useRef, useEffect } from 'react';
import lottie from 'lottie-web';

import animationData from '../../../../public/LottieIcon/access.json';
import './index.scss';

function LottieAccess() {
  // 创建容器引用
  const containerRef = useRef<HTMLDivElement>(null);
  // 使用 useRef 存储动画实例
  const animationRef = useRef<any>(null);

  useEffect(() => {
    if (containerRef.current) {
      // 初始化 Lottie 动画并保存到 ref
      animationRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: animationData,
      });
    }

    // 组件卸载时清理动画
    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, []);

  return <div className="lottie-access" ref={containerRef}></div>;
}

export default LottieAccess;
