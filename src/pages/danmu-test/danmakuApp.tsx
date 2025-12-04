import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import danmakuReducer from '@/store/modules/danmakuSlice';
import DanmakuPlayer from './index';
import { Layout } from 'antd';
import './index.scss';

const { Header, Content, Footer } = Layout;

// 配置Redux store
const store = configureStore({
  reducer: {
    danmaku: danmakuReducer,
  },
});

const DanmakuApp: React.FC = () => {
  return (
    <Provider store={store}>
      <Layout className="danmaku-app">
        <Header className="app-header">
          <h1>React Canvas 弹幕系统</h1>
        </Header>
        <Content className="app-content">
          <DanmakuPlayer />
        </Content>
        <Footer className="app-footer">
          视频弹幕系统 &copy;{new Date().getFullYear()} 使用 React + Redux +
          TypeScript + Canvas 构建
        </Footer>
      </Layout>
    </Provider>
  );
};

export default DanmakuApp;
