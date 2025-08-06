import { Layout, Menu, Button, Typography } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  CodeOutlined,
  PictureOutlined,
  MoreOutlined,
  LayoutOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import HistoryDialogue from './HistoryDialogue';
import './index.scss';

const { Sider } = Layout;

function AiSider() {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: 'search',
      icon: <SearchOutlined />,
      label: 'AI 搜索',
    },
    {
      key: 'write',
      icon: <EditOutlined />,
      label: '帮我写作',
    },
    {
      key: 'code',
      icon: <CodeOutlined />,
      label: 'AI 编程',
    },
    {
      key: 'image',
      icon: <PictureOutlined />,
      label: '图像生成',
    },
    {
      key: 'more',
      icon: <MoreOutlined />,
      label: '更多',
    },
  ];

  return (
    <Sider width={280} collapsed={collapsed} className="ai-sider">
      <div
        className="sider-title"
        style={
          !collapsed ? { flexDirection: 'row' } : { flexDirection: 'column' }
        }
      >
        <img
          className="sider-logo"
          src={!collapsed ? 'public/logo-蓝-图字.png' : 'public/logo图标.png'}
          alt=""
        />
        {/* <div className="sider-logo">
          <img
            className="sider-logo-icon"
            style={!collapsed ? { width: '23%' } : { width: '70%' }}
            src={!collapsed ? 'public/logo图标.png' : 'public/logo图标.png'}
            alt=""
          />
          {!collapsed && (
            <img
              className="sider-logo-text"
              src={!collapsed ? 'public/logo汉字.png' : 'public/logo图标.png'}
              alt=""
            />
          )}
        </div> */}

        <Button
          className="sider-title-btn"
          icon={<LayoutOutlined />}
          type="primary"
          size="large"
          onClick={() => setCollapsed(!collapsed)}
        ></Button>
      </div>
      <div className="sider-btn">
        <Button
          type="primary"
          block
          icon={<PlusOutlined />}
          size="large"
          className="sider-btn-add"
        >
          {!collapsed ? '新增对话' : ''}
        </Button>
      </div>

      <Menu mode="inline" className="sider-menu" items={menuItems} />
      {!collapsed && <HistoryDialogue />}
    </Sider>
  );
}

export default AiSider;
