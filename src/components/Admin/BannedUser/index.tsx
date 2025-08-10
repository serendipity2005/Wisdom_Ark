// 用户管理
import type React from 'react';
import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Switch } from 'antd';
import { EditOutlined } from '@ant-design/icons';

import './index.scss';
import BanPopup from './BanPopup';
import Filter from '../Filter';

// 模拟数据类型定义
interface JobPosition {
  id: number;
  userName: string;
  email: string;
  balance: string;
  banned: string;
  deblocking: string;
  status: 'active' | 'inactive' | 'pending';
}

const onChange = (checked: boolean) => {
  console.log(`switch to ${checked}`);
};

function BannedUser() {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrent] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [stateType, setStateType] = useState('');
  const [identityTyp, setIdentityType] = useState('');
  const [searchText, setSearchText] = useState('');

  const threeSelMenu = {
    label: '封禁原因',
    items: [
      { key: 'all', label: '全部' },
      { key: 'online', label: '政治敏感' },
      { key: 'living', label: '辱华' },
      { key: 'offline', label: '违法' },
    ],
    onChange: setStateType,
  };

  const identityMenu = {
    label: '身份',
    items: [
      { key: 'all', label: '全部身份' },
      { key: 'user', label: '普通用户' },
      { key: 'admin', label: '管理员' },
      { key: 'superAdm', label: '高级管理员' },
    ],
    onChange: setIdentityType,
  };

  const menuItems = [threeSelMenu, identityMenu];

  useEffect(() => {
    console.log('stateType', stateType, identityTyp, searchText);
  }, [stateType, identityTyp, searchText]);

  // 模拟职位数据
  const [jobData, setJobData] = useState<JobPosition[]>([
    {
      id: 1,
      userName: 'sys',
      email: '20001104@sys.com',
      balance: '5114',
      banned: '2023-09-01',
      deblocking: '2025-09-01',
      status: 'inactive',
    },
    {
      id: 2,
      userName: 'wcq',
      email: '20000511@wcq.com',
      balance: '5114',
      banned: '2022-08-01',
      deblocking: '2025-09-01',
      status: 'inactive',
    },
    {
      id: 3,
      userName: '檀健次',
      email: '19901005@tjc.com',
      balance: '1005',
      banned: '2023-09-01',
      deblocking: '2025-09-01',
      status: 'active',
    },
    {
      id: 4,
      userName: '小炭火',
      email: '20040501@mq.com',
      balance: '1005',
      banned: '2024-10-05',
      deblocking: '2025-11-04',
      status: 'pending',
    },
    {
      id: 5,
      userName: '薯条派',
      email: '20040501@mq.com',
      balance: '5114',
      banned: '2024-10-01',
      deblocking: '2025-10-05',
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
      title: '钱包余额',
      dataIndex: 'balance',
      key: 'balance',
    },
    {
      title: '封禁时间',
      dataIndex: 'banned',
      key: 'banned',
    },
    {
      title: '解封时间',
      dataIndex: 'deblocking',
      key: 'deblocking',
    },
    {
      title: '封禁原因',
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
          <Button
            type="text"
            onClick={() => setModalVisible(true)}
            icon={<EditOutlined />}
            size="small"
          />
          <Switch
            defaultChecked
            checkedChildren="解禁"
            unCheckedChildren="封禁"
            className="bannedBtn"
            onChange={onChange}
          />
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
    <>
      {/* 筛选和搜索区域 */}
      <Filter
        menuItems={menuItems}
        pageSize={pageSize}
        setPageSize={setPageSize}
        setSearchText={setSearchText}
      />
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={jobData}
        className="mt-25"
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

      {/* 弹窗 */}
      <BanPopup visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
}

export default BannedUser;
