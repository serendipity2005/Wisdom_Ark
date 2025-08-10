import { Card, Typography } from 'antd';
const { Title } = Typography;
import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
export default function Audit() {
  return (
    <Card>
      <div className="content-header">
        <Title className="content-title" level={4}>
          工作列表
        </Title>
      </div>
      {/* 数据表格 */}
      <Suspense fallback={<div>Loading...</div>}>
        <Outlet />
      </Suspense>
    </Card>
  );
}
