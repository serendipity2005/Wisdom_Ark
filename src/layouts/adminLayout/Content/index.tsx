import { Layout, Breadcrumb } from 'antd';

import './index.scss'; // 引入样式文件
// import DBTable from "../DBTable";
// import UserContent from "@/components/admin/UserContent";
import { Outlet } from 'react-router-dom';

const { Content } = Layout;

function ContentPage() {
  return (
    <Content className="admin-content">
      {/* 面包屑导航 */}
      <Breadcrumb
        className="breadcrumb"
        items={[{ title: '工作 / 工作列表' }]}
      />
      {/* 中心区 */}
      <Outlet />
    </Content>
  );
}
export default ContentPage;
