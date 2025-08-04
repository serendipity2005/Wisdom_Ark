import './index.scss';
import { Card, Col, Menu, type MenuProps } from 'antd';
// 文章组件

import { Outlet } from 'react-router-dom';

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
interface MiddleContentProps {
  children?: React.ReactNode;
}
// 模拟文章数据

// 中间内容
export default function MiddleContent() {
  return (
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
        <Outlet></Outlet>
      </Card>
    </Col>
  );
}
