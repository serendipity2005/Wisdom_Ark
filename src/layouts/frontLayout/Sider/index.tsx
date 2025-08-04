// MySider(若不传 则自动使用默认值)
// 1.接收props.children（插槽）,则直接渲染
// 2.接收menu  用于渲染菜单
// 3.接收defaultSelectedKeys  用于设置默认选中的菜单项

import { Menu, theme, type MenuProps } from 'antd';
import Sider from 'antd/es/layout/Sider';

import './index.scss';
import { BookMarked, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useScrollVisibility } from '@/hooks/useScrollVisibility';

interface MySiderProps {
  children?: React.ReactNode;
  menu?: MenuProps['items'];
  defaultSelectedKeys?: string[];
}

const defaultMenu = [
  {
    key: '/following',
    icon: <BookMarked className="icon" size={15} />,
    label: '关注',
  },
  {
    key: '/synthesis',
    icon: <Star size={15} />,
    label: '综合',
  },
];

const MySider: React.FC<MySiderProps> = (props: MySiderProps) => {
  const { menu, defaultSelectedKeys } = props;
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const navigate = useNavigate();
  const visible = useScrollVisibility();
  const handleMenu: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  return (
    <Sider
      className={`sider ${visible ? '' : 'sideTop'}`}
      style={{ background: colorBgContainer }}
      width={200}
    >
      {!props.children ? (
        <Menu
          mode="inline"
          defaultSelectedKeys={defaultSelectedKeys || ['/following']}
          defaultOpenKeys={['sub1']}
          style={{ height: '100%' }}
          onClick={handleMenu}
          items={menu || defaultMenu}
        />
      ) : (
        props.children
      )}
    </Sider>
  );
};
export default MySider;
