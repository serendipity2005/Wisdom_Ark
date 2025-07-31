import { Layout, Menu } from 'antd';
import { useState } from 'react';
import { useRoutesContext } from '@/router/context/useRoutesContext';

import './index.scss';

const { Sider } = Layout;

// 侧边栏菜单项
// const menuItems = [
//   {
//     key: 'home',
//     icon: <HomeOutlined />,
//     label: <Link to="/">首页</Link>,
//   },
//   {
//     key: 'dashboard',
//     icon: <UserOutlined />,
//     label: '用户管理',
//     children: [
//       {
//         key: 'calendar',
//         icon: <TeamOutlined />,
//         label: <Link to="/content">普通用户</Link>,
//       },
//       {
//         key: 'chat',
//         icon: <SolutionOutlined />,
//         label: <Link to="/content/administrator">管理员</Link>,
//       },
//     ],
//   },
//   {
//     key: 'work',
//     icon: <FileTextOutlined />,
//     label: '审核管理',
//     children: [
//       { key: 'job-list', icon: <FileProtectOutlined />, label: '文章管理' },
//       { key: 'job-view', icon: <FileAddOutlined />, label: '资源上传' },
//       {
//         key: 'job-apply',
//         icon: <FileExclamationOutlined />,
//         label: '举报管理',
//       },
//     ],
//   },
//   {
//     key: 'streaming',
//     icon: <VideoCameraOutlined />,
//     label: '直播管理',
//     children: [
//       { key: 'job-list', icon: <ClockCircleOutlined />, label: '正在直播' },
//       {
//         key: 'job-view',
//         icon: <ExclamationCircleOutlined />,
//         label: '封禁主播',
//       },
//     ],
//   },

//   {
//     key: 'task',
//     icon: <FolderOpenOutlined />,
//     label: '资源管理',
//   },
// ];
function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { menus, loading } = useRoutesContext();
  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={280}
      className="admin_sidebar"
    >
      <div className="admin_sidebar_logo">
        <img
          className="logoImg"
          src="../../../public/logo-白-图汉字.png"
          alt=""
        />
      </div>
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={['job-list']}
        defaultOpenKeys={['work']}
        // items={menuItems}
        items={loading ? [] : (menus as any)}
        className="admin_sidebar_menu"
      />
    </Sider>
  );
}

export default Sidebar;
