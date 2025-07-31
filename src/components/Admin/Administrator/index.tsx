// 管理员管理

import type React from 'react';
import { useState } from 'react';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

// 模拟数据类型定义
interface JobPosition {
  id: number;
  userName: string;
  email: string;
  identity: string;
  balance: string;
  status: 'active' | 'inactive' | 'pending';
}
function DBTable() {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 模拟职位数据
  const [jobData, setJobData] = useState<JobPosition[]>([
    {
      id: 1,
      userName: 'sys',
      email: '20001104@sys.com',
      identity: 'pending',
      balance: '5114',
      status: 'inactive',
    },
    {
      id: 2,
      userName: 'wcq',
      email: '20000511@wcq.com',
      identity: 'pending',
      balance: '5114',
      status: 'inactive',
    },
    {
      id: 3,
      userName: '檀健次',
      email: '19901005@tjc.com',
      identity: 'pending',
      balance: '1005',
      status: 'active',
    },
    {
      id: 4,
      userName: '小炭火',
      email: '20040501@mq.com',
      identity: 'inactive',
      balance: '1005',
      status: 'pending',
    },
    {
      id: 5,
      userName: '薯条派',
      email: '20040501@mq.com',
      identity: 'inactive',
      balance: '5114',
      status: 'inactive',
    },
    {
      id: 6,
      userName: 'mq',
      email: '20040501@mq.com',
      identity: 'active',
      balance: '5114',
      status: 'inactive',
    },
  ]);
  // 表格列定义
  const columns = [
    {
      title: '序',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      sorter: true,
    },
    {
      title: '用户名',
      dataIndex: 'userName',
      key: 'userName',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: '电子邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '身份',
      dataIndex: 'identity',
      key: 'identity',
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'green', text: '普通用户' },
          inactive: { color: 'red', text: '管理员' },
          pending: { color: 'orange', text: '高级管理员' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '钱包余额',
      dataIndex: 'balance',
      key: 'balance',
    },
    {
      title: '用户状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          active: { color: '#999', text: '离线' },
          inactive: { color: 'green', text: '在线' },
          pending: { color: 'blue', text: '直播中' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '行动',
      key: 'actions',
      render: (_: any, record: JobPosition) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small" />
          <Button type="text" icon={<EditOutlined />} size="small" />
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Space>
      ),
    },
  ];

  // 处理行选择
  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRows(selectedRowKeys as number[]);
    },
  };

  return (
    <Table
      rowSelection={rowSelection}
      columns={columns}
      dataSource={jobData}
      rowKey="id"
      pagination={{
        current: currentPage,
        pageSize: pageSize,
        total: jobData.length,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: any, range: any[]) =>
          `显示 ${range[0]} 个结果 (共 ${total} 个结果)`,
        onChange: (page: React.SetStateAction<number>, size: any) => {
          setCurrent(page);
          setPageSize(size || 10);
        },
      }}
      size="middle"
    />
  );
}

export default DBTable;
