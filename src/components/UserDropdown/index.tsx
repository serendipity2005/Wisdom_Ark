import { Avatar, Divider, Dropdown, theme, type MenuProps } from 'antd';
import React from 'react';
import UserCard from '../UserCard';
import './index.scss';
import { Link } from 'react-router-dom';
import { UserOutlined } from '@ant-design/icons';
const userItems: MenuProps['items'] = [
  {
    key: 'home',
    label: (
      <Link to="/home">
        <span>
          <UserOutlined style={{ color: 'var(--text-tertiary)' }} /> 我的主页
        </span>
      </Link>
    ),
  },
  {
    key: 'benefits',
    label: (
      <Link to="/benefits">
        <span>
          <i className="icon-benefits"></i> 成长福利
        </span>
      </Link>
    ),
  },
  {
    key: 'notes',
    label: (
      <Link to="/notes">
        <span>
          <i className="icon-notes"></i> 闪念笔记
        </span>
      </Link>
    ),
  },
  {
    key: 'membership',
    label: (
      <Link to="/membership">
        <span>
          <i className="icon-membership"></i> 会员中心
        </span>
      </Link>
    ),
  },
  {
    key: 'courses',
    label: (
      <Link to="/courses">
        <span>
          <i className="icon-courses"></i> 课程中心
        </span>
      </Link>
    ),
  },
  {
    key: 'discounts',
    label: (
      <Link to="/discounts">
        <span>
          <i className="icon-discounts"></i> 我的优惠
        </span>
      </Link>
    ),
  },
  {
    key: 'registrations',
    label: (
      <Link to="/registrations">
        <span>
          <i className="icon-registrations"></i> 我的报名
        </span>
      </Link>
    ),
  },
  {
    key: 'footprints',
    label: (
      <Link to="/footprints">
        <span>
          <i className="icon-footprints"></i> 我的足迹
        </span>
      </Link>
    ),
  },
];
interface UserDropdownProps {
  chidren?: React.ReactNode;
}
export default function UserDropdown(props: UserDropdownProps) {
  const menuStyle: React.CSSProperties = {
    boxShadow: 'none',
  };
  const {
    token: { colorBgElevated, borderRadiusLG, boxShadowSecondary },
  } = theme.useToken();
  return (
    <Dropdown
      className="user-dropdown-container"
      trigger={['click']}
      menu={{
        items: userItems,
      }}
      popupRender={(menu) => {
        return (
          <div
            className="user-dropdown"
            style={{
              backgroundColor: colorBgElevated,
              borderRadius: borderRadiusLG,
              boxShadow: boxShadowSecondary,
            }}
          >
            <UserCard />
            {/* <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: 14, color: '#1890ff' }}>
                掘友等级 JY.4
              </span>
              <span style={{ fontSize: 14, marginLeft: 8, color: '#999' }}>
                458.1 / 500
              </span>
            </div> */}
            <ul className="actions-count-list">
              <li className="item">
                <Link to="/">
                  <div className="item-count">45</div>
                  <div className="item-label">关注</div>
                </Link>
              </li>
              <li className="item">
                <Link to="/" className="block">
                  <div className="item-count">45</div>
                  <div className="item-label">关注</div>
                </Link>
              </li>
              <li className="item">
                <Link to="/">
                  <p className="item-count">45</p>
                  <p className="item-label">关注</p>
                </Link>
              </li>
            </ul>
            <div className="user-menu">
              {React.cloneElement(
                menu as React.ReactElement<{
                  style: React.CSSProperties;
                }>,
                { style: menuStyle },
              )}
            </div>

            <Divider style={{ margin: 0 }} />
            <div className="dropdown-foot" style={{ padding: 8 }}>
              <Link to="/">我的设置</Link>
              <Link to="/">退出登录</Link>
            </div>
          </div>
        );
      }}
    >
      <Avatar
        src="https://avatars.githubusercontent.com/u/1?v=4"
        style={{ cursor: 'pointer' }}
      />
    </Dropdown>
  );
}
