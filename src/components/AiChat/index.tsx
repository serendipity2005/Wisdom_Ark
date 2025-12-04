import type React from 'react';
import { Layout } from 'antd';
import AiSider from './AiSider';
import Header from './Header';
import './index.scss';
import AiContent from './AiContent';

const { Content } = Layout;

// 添加获取时间段的函数
const getTimePeriod = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    return '上午';
  } else if (hour >= 12 && hour < 18) {
    return '下午';
  } else {
    return '晚上';
  }
};

const ClaudeLikeInterface: React.FC = () => {
  // 获取当前时间段
  const timePeriod = getTimePeriod();
  const userName = '多多米';

  return (
    <Layout style={{ height: '100vh', background: '#fff' }}>
      {/* 左侧边栏 */}
      <AiSider />
      {/* 主内容区 */}
      <Layout>
        {/* 顶部导航 */}
        <Header timePeriod={timePeriod} userName={userName} />
        {/* 主要内容 */}
        <Content className="ai-content">
          {/* 中央内容区域 */}
          <AiContent timePeriod={timePeriod} userName={userName} />
        </Content>
      </Layout>
    </Layout>
  );
};

export default ClaudeLikeInterface;
