import { Avatar, Typography } from 'antd';
import React from 'react';
import './index.scss';
const { Title } = Typography;
export default function UserCard() {
  return (
    <div className="user-card ">
      <Avatar
        src="https://avatars.githubusercontent.com/u/1?v=4"
        style={{ cursor: 'pointer' }}
        size={45}
      />
      <div className="user-details">
        <p className="user-details-name">555</p>
        <p className="user-details-description">描述</p>
      </div>
    </div>
  );
}
