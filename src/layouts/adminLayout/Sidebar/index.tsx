import { Layout, Menu } from 'antd';
import { useState } from 'react';
import { useRoutesContext } from '@/router/context/useRoutesContext';

import './index.scss';

const { Sider } = Layout;

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
        {collapsed == false ? (
          <img
            className="logoImg"
            src="../../../public/logo-白-图汉字.png"
            alt=""
          />
        ) : (
          <img
            className="logoImg"
            src="../../../public/logo-图-白.png"
            alt=""
          />
        )}
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
