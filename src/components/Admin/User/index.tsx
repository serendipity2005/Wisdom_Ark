// 用户管理板块

import { Button, Card, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Filter from '../Filter';
const { Title } = Typography;
import './index.scss'; // 引入样式文件
import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';

function ContentHead() {
  return (
    <Card>
      <div className="content-header">
        <Title className="content-title" level={4}>
          工作列表
        </Title>
        <Button type="primary" icon={<PlusOutlined />}>
          添加新用户
        </Button>
      </div>

      {/* 筛选和搜索区域 */}
      <Filter />
      {/* 数据表格 */}
      {/* <DBTable /> */}
      <Suspense fallback={<div>Loading...</div>}>
        <Outlet />
      </Suspense>
    </Card>
  );
}

export default ContentHead;
