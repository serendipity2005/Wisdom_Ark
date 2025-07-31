import {
  Layout,
  Button,
  Input,
  Space,
  Dropdown,
  Avatar,
  Badge,
  type MenuProps,
} from 'antd';
import {
  MenuOutlined,
  SearchOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

import './index.scss'; // 引入样式

const { Header } = Layout;

function LayoutBar() {
  const [collapsed, setCollapsed] = useState(false);

  // 用户菜单项
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
    },
  ];

  return (
    <Header className="admin-header">
      <div className="header-btn">
        <Button
          type="text"
          className="menu-toggle"
          icon={<MenuOutlined />}
          onClick={() => setCollapsed(!collapsed)}
        />
        <Input
          placeholder="搜索..."
          prefix={<SearchOutlined />}
          className="search-input"
          style={{ width: 300, marginLeft: 16 }}
        />
      </div>

      <Space size="large">
        <Badge count={5}>
          <Button type="text" className="menu-toggle" icon={<BellOutlined />} />
        </Badge>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space className="user-menu">
            <Avatar src="public/logo/logo.png" />
            <span>管理员</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}

export default LayoutBar;
