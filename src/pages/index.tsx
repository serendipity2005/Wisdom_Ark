// index.tsx
import FrontLayout from '@/layouts/frontLayout';
import { Layout, theme, type MenuProps } from 'antd';
import { BookMarked, Star } from 'lucide-react';
import MySider from '@/layouts/frontLayout/Sider';
type MenuItem = Required<MenuProps>['items'][number];
import MainContainer from '@/layouts/frontLayout/MainContainer';
import MyContent from '@/layouts/frontLayout/MyContent';
import MiddleContent from '@/layouts/frontLayout/MiddleContent';
import RightSide from '@/layouts/frontLayout/RightSide';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const menu: MenuItem[] = [
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

function Sider() {
  return <MySider menu={menu} defaultSelectedKeys={['/synthesis']} />;
}
// 首页

export default function Index() {
  const location = useLocation();

  // 如果当前路径是根路径，则重定向
  if (location.pathname === '/') {
    return <Navigate to="/synthesis" replace />;
  }

  return (
    <FrontLayout>
      <MainContainer siderNode={<Sider />}>
        <MyContent>
          <MiddleContent>
            <Outlet />
          </MiddleContent>
          <RightSide></RightSide>
        </MyContent>
      </MainContainer>
    </FrontLayout>
  );
}
