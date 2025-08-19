import { Avatar, Typography } from 'antd';
import React from 'react';
import './index.scss';
const { Title } = Typography;
interface UserCardProps {
  name?: string;
  description?: string;
  avatar?: string;
}

export default function UserCard({
  name = '未知',
  description = '暂无描述',
  avatar,
}: UserCardProps) {
  return (
    <div className="user-card ">
      <Avatar src={avatar} style={{ cursor: 'pointer' }} size={45} />
      <div className="user-details">
        <p className="user-details-name">{name}</p>
        <p className="user-details-description">{description}</p>
      </div>
    </div>
  );
}
