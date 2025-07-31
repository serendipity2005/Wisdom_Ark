import { Layout } from 'antd';
import Sidebar from '@/layouts/adminLayout/Sidebar';
import Header from '@/layouts/adminLayout/Header';
import Content from '@/layouts/adminLayout/Content';

function AdminLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 侧边栏 */}
      <Sidebar />
      {/* 主体内容区域 */}
      <Layout>
        {/* 顶部导航栏 */}
        <Header />
        {/* 主要内容区域 */}
        <Content />
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
