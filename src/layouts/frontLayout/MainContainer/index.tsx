// 1.接收siderNode,rightSide ,中间部分做children传入
// 2.siderVisible控制sider的显示隐藏
// 3.menu  左侧导航栏菜单数据

import { Layout, theme, type MenuProps } from 'antd';
type MenuItem = Required<MenuProps>['items'][number];

import MySider from '../Sider';
interface MainContainerProps {
  siderNode?: React.ReactNode;
  rightSide?: React.ReactNode;
  children?: React.ReactNode;
  siderVisible?: boolean;
  menu?: MenuItem[]; //左侧导航栏
}

export default function MainContainer(props: MainContainerProps) {
  const { menu, siderNode, siderVisible = true, children } = props;

  // 内容
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout
      className="main-layout"
      style={{
        padding: '24px 0',
        borderRadius: borderRadiusLG,
      }}
    >
      {/* 左侧栏 */}
      {/* 侧边栏渲染逻辑:
        1. 如果传入了 siderNode，则渲染自定义侧边栏
        2. 如果没有传入 siderNode，则渲染默认的 MySider 组件
        3. siderVisible 属性控制是否显示侧边栏（当前逻辑未完全实现） */}
      {siderNode ? (
        <>{siderNode} </>
      ) : siderVisible ? (
        <MySider defaultSelectedKeys={['/synthesis']} menu={menu}></MySider>
      ) : null}
      {/* 内容+右边栏 */}
      {children}
    </Layout>
  );
}

// 可以 在Content 中传入文章、右边栏
