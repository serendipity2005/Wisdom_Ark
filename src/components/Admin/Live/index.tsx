import { Card, Typography } from 'antd';
import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';

const { Title } = Typography;

function Live() {
  return (
    <Card>
      <div className="content-header">
        <Title className="content-title" level={4}>
          直播管理
        </Title>
      </div>
      {/* 数据表格 */}
      {/* <DBTable /> */}
      <Suspense fallback={<div>Loading...</div>}>
        <Outlet />
      </Suspense>
    </Card>
  );
}

export default Live;
