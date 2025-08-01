// index.tsx
import FrontLayout from '@/layouts/frontLayout';
import { Layout, theme, type MenuProps } from 'antd';
import { BookMarked, Star } from 'lucide-react';
import MySider from '@/layouts/frontLayout/Sider';
type MenuItem = Required<MenuProps>['items'][number];
import MainContainer from '@/layouts/frontLayout/MainContainer';
import MyContent from '@/layouts/frontLayout/Content';

const menu: MenuItem[] = [
  {
    key: '/following',
    icon: <BookMarked className="icon" size={15} />,
    label: '关注22',
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

export default function index() {
  return (
    <FrontLayout>
      <MainContainer siderNode={<Sider />}>
        <MyContent />
      </MainContainer>
    </FrontLayout>
  );
}
