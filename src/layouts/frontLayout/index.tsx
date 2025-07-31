import MyHeader from './Header';
import './index.scss';
import MySider from './Sider';

import './index.scss';
import { Card, Col, Layout, Menu, Row, theme, type MenuProps } from 'antd';

import { useState } from 'react';
import RightSide from '@/layouts/frontLayout/RightSide';

type MenuItem = Required<MenuProps>['items'][number];
const headMenu: MenuItem[] = [
  {
    key: '/',
    label: '推荐',
  },
  {
    key: '/pins',
    label: '关注',
  },
];
const { Content } = Layout;
// 模拟文章数据

//

// 侧边栏菜单项
import { Outlet } from 'react-router-dom';
interface frontLayoutProps {
  headerNode?: React.ReactNode;
  siderNode?: React.ReactNode;
  rightSide?: React.ReactNode;
  children?: React.ReactNode;
  menu?: MenuItem[]; //左侧导航栏
}

export default function FrontLayout(props: frontLayoutProps) {
  const { headerNode, menu, siderNode } = props;
  // 内容
  const {
    token: { borderRadiusLG },
  } = theme.useToken();
  const [isHeaderVisble, setIsHeaderVisble] = useState(false);
  const handleVisible = (data: boolean) => {
    setIsHeaderVisble(data);
  };

  return (
    <Layout
      className="frontLayout"
      style={{ minHeight: '1200px', background: '#f4f5f5' }}
    >
      {headerNode ? (
        <>{headerNode}</>
      ) : (
        <MyHeader handleIsVisible={handleVisible}></MyHeader>
      )}

      {/*  内容区 */}
      <main className="main-container">
        <Layout
          className="main-layout"
          style={{
            padding: '24px 0',
            borderRadius: borderRadiusLG,
          }}
        >
          {siderNode ? (
            <>{siderNode} </>
          ) : (
            <MySider isHeaderVisible={isHeaderVisble} menu={menu}></MySider>
          )}

          <Content
            className="content"
            style={{ padding: 0, minHeight: 'calc(100vh - 64px)' }}
          >
            <Row gutter={24}>
              {/* 文章列表 */}
              <Col className="article-container" span={16}>
                <Card
                  size="small"
                  variant="borderless"
                  style={{
                    background: '#fff',
                    borderRadius: '8px',
                  }}
                >
                  {/* 顶部标签切换 */}
                  <div
                    className="article-container-header"
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <Menu mode="horizontal" items={headMenu} />
                  </div>

                  {/* 文章列表 */}
                  <div className="article-list">
                    <Outlet />
                  </div>
                </Card>
              </Col>
              {/* 右侧边栏 */}
              <RightSide></RightSide>
            </Row>
          </Content>
        </Layout>
      </main>
    </Layout>
  );
}
