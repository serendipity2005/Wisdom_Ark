// src/components/LoginRequiredButton.jsx
import type React from 'react';
import { Button } from 'antd';
import { useAuth } from '@/contexts/authContext';
interface LoginRequiredButtonProps {
  onClick?: () => void;
  children?: React.ReactNode;
}
// 封装一个“需登录才能点击”的按钮
const LoginRequiredButton = ({
  onClick,
  children,
  ...props
}: LoginRequiredButtonProps) => {
  const { isLoggedIn, showLoginModal } = useAuth();

  // 点击时拦截：未登录则显示弹窗，已登录则执行原逻辑
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isLoggedIn) {
      showLoginModal(); // 未登录：显示弹窗
    } else {
      if (onClick) {
        onClick(e); // 已登录：执行原操作
      }
    }
  };

  return (
    <Button {...props} onClick={handleClick}>
      {children}
    </Button>
  );
};

export default LoginRequiredButton;
