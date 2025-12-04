// 1.接收headerNode 作为头部导航
// 2.接收children 作为main
import MyHeader from './Header';
import './index.scss';
import { Layout, type MenuProps } from 'antd';
type MenuItem = Required<MenuProps>['items'][number];
interface frontLayoutProps {
  headerNode?: React.ReactNode;
  siderNode?: React.ReactNode;
  rightSide?: React.ReactNode;
  children?: React.ReactNode;
  menu?: MenuItem[]; //左侧导航栏
}

export default function FrontLayout(props: frontLayoutProps) {
  const { headerNode, children } = props;
  return (
    <Layout
      className="frontLayout"
      style={{ minHeight: '1400px', background: '#f4f5f5' }}
    >
      {headerNode ? <>{headerNode}</> : <MyHeader></MyHeader>}

      {/*  内容区 */}
      <main className="main-container">{children}</main>
    </Layout>
  );
}
