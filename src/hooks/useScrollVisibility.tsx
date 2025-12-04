// src/hooks/useScrollVisibility.ts
import { useState, useRef, useCallback, useEffect } from 'react';

export const useScrollVisibility = (threshold = 100) => {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef<number>(0);

  const handleScroll = useCallback(() => {
    // 记录当前滚动位置
    const currentScrollY = window.scrollY;

    // 如果滚动距离小于阈值，则保持可见
    if (currentScrollY < threshold) {
      return;
    }

    // 如果向下滚动距离过大，隐藏元素
    if (currentScrollY - lastScrollY.current > 0) {
      if (visible) {
        setVisible(false);
      }
    } else {
      // 如果向上滚动，显示元素
      if (!visible) {
        setVisible(true);
      }
    }

    // 更新上次滚动位置
    lastScrollY.current = currentScrollY;
  }, [visible, threshold]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return visible;
};
