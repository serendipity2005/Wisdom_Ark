import { Typography, Badge, Avatar, Tooltip, Dropdown, Button } from 'antd';
import { BellOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import './index.scss';

const { Title } = Typography;

interface HeaderProps {
  timePeriod: string;
  userName: string;
}

function Header({ timePeriod, userName }: HeaderProps) {
  const navigate = useNavigate();

  const userMenuItems = [
    { key: '1', label: '个人设置' },
    { key: '2', label: '使用帮助' },
    { key: '3', label: '退出登录' },
  ];

  return (
    <div className="ai-header">
      <div className="header-tit">
        <Title level={4} className="title-text">
          {timePeriod}好，{userName}
        </Title>
      </div>

      <div className="header-inform">
        <Tooltip title="主页">
          <Button
            className="header-back"
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
          ></Button>{' '}
        </Tooltip>
        <Tooltip title="通知">
          <Badge count={0} size="small">
            <BellOutlined className="inform-icon" />
          </Badge>
        </Tooltip>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div className="user-avatar">
            <Avatar size={32} className="user-avatar-icon">
              多
            </Avatar>
          </div>
        </Dropdown>
      </div>
    </div>
  );
}

export default Header;
