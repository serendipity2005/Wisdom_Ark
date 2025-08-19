// src/context/AuthContext.tsx
import type { RootState } from '@/store';
import { setUserLogout, type UserState } from '@/store/modules/userSlice';
import type React from 'react';
import { createContext, useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface AuthContextType {
  isLoginModalVisible: boolean;
  isLoggedIn: boolean;
  showLoginModal: () => void;
  hideLoginModal: () => void;
  login: () => void;
  logout: () => void;
  requireAuth: (callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 从 Redux 获取用户状态
  const user = useSelector((state: RootState) => state.user as UserState);
  const dispatch = useDispatch();
  // const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  //   弹窗是否可见
  const [isLoginModalVisible, setIsLoginModalVisible] =
    useState<boolean>(false);
  const [authCallback, setAuthCallback] = useState<(() => void) | null>(null);

  const showLoginModal = () => {
    // 登录弹窗显示
    setIsLoginModalVisible(true);
  };

  const hideLoginModal = () => {
    setIsLoginModalVisible(false);
    setAuthCallback(null);
  };

  //   登录操作
  const login = () => {
    // setIsLoggedIn(true);
    setIsLoginModalVisible(false);

    // 执行之前需要登录的操作
    if (authCallback) {
      authCallback();
      setAuthCallback(null);
    }
  };

  const logout = () => {
    // setIsLoggedIn(false);
    // 更新 Redux 状态
    dispatch(setUserLogout());
  };

  // 需要登录验证的操作包装函数
  const requireAuth = (callback: () => void) => {
    if (user.isLogin) {
      callback();
    } else {
      setAuthCallback(() => callback);
      showLoginModal();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoginModalVisible,
        isLoggedIn: user.isLogin,
        showLoginModal,
        hideLoginModal,
        login,
        logout,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
