// 用户管理板块

import { Button, Card, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Filter from '../Filter';
const { Title } = Typography;
import './index.scss'; // 引入样式文件
import { Outlet } from 'react-router-dom';
import { Suspense, useState } from 'react';
import AddUser from '../AddUser';

interface AddUserFormData {
  userName: string;
  phoneNumber: string;
  emailId: string;
  address: string;
  creditLimit: number;
  lineBalance: number;
  joinDate: any;
}

function ContentHead() {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSubmit = (values: AddUserFormData) => {
    console.log('提交的表单数据:', values);
    setModalVisible(false);
  };
  return (
    <Card>
      <div className="content-header">
        <Title className="content-title" level={4}>
          工作列表
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          添加新用户
        </Button>
        <AddUser
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          onSubmit={handleSubmit}
          title="添加客户"
        />
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
