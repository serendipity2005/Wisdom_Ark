import './index.scss';
import { Card, Col, Menu, type MenuProps } from 'antd';
// 文章组件

import { Outlet } from 'react-router-dom';

type MenuItem = Required<MenuProps>['items'][number];
const headMenu: MenuItem[] = [
  {
    key: '/synthesis',
    label: '推荐',
  },
  {
    key: '/synthesis/following',
    label: '关注',
  },
];
interface MiddleContentProps {
  children?: React.ReactNode;
  className?: string;
  menu?: boolean | MenuItem[];
  style?: React.CSSProperties;
}
// 模拟文章数据

// 中间内容
export default function MiddleContent({
  children,
  className,
  menu = true,
  style,
}: MiddleContentProps) {
  return (
    <Col
      className={`article-container ` + className}
      style={{ flexGrow: '1', ...style }}
    >
      <Card
        size="small"
        variant="borderless"
        style={{
          background: '#fff',
          borderRadius: '8px',
        }}
      >
        {menu ? (
          <div
            className="article-container-header"
            style={{
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Menu
              mode="horizontal"
              items={headMenu}
              selectedKeys={[location.pathname]}
            />
          </div>
        ) : (
          <></>
        )}
        {children}
      </Card>
    </Col>
  );
}
