import './index.scss';
import { Layout, Row } from 'antd';

import { useEffect, useRef, useState } from 'react';

import RightSide from '@/layouts/frontLayout/RightSide';
import MiddleContent from '../MiddleContent';
interface ContentProps {
  children?: React.ReactNode;
}

const { Content } = Layout;
const isElementInView = (element: HTMLElement): boolean => {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  console.log(rect);
  // 判断元素是否完全在窗口内
  const isInView = !(rect.bottom < 0);

  return isInView;
};
export default function MyContent(props: ContentProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isTop, setIsTop] = useState<boolean>(false);

  useEffect(() => {
    const checkSidebarInView = () => {
      if (sidebarRef.current) {
        const isInView = isElementInView(sidebarRef.current);
        setIsTop(!isInView);
      }
    };

    // 初始检查
    checkSidebarInView();

    // 监听滚动和窗口大小变化事件
    window.addEventListener('scroll', checkSidebarInView);
    window.addEventListener('resize', checkSidebarInView);

    // 清理事件监听器
    return () => {
      window.removeEventListener('scroll', checkSidebarInView);
      window.removeEventListener('resize', checkSidebarInView);
    };
  }, []);

  return (
    <Content
      className="content"
      style={{
        padding: 0,
        minHeight: 'calc(100vh - 64px)',
        maxWidth: '1000px',
      }}
    >
      <Row gutter={24}>
        {props.children ? (
          <>props.children</>
        ) : (
          <>
            <MiddleContent></MiddleContent>
            <RightSide></RightSide>
          </>
        )}
      </Row>
    </Content>
  );
}
