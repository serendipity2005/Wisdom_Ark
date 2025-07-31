// 表格组件

import type React from 'react';
import { useState } from 'react';
import { Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

// 模拟数据类型定义
interface JobPosition {
  id: number;
  jobTitle: string;
  company: string;
  location: string;
  experience: string;
  priority: number;
  status: 'active' | 'inactive' | 'pending';
  publishDate: string;
  deadline: string;
  department: string;
  actions: string;
}
function DBTable() {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [currentPage, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 模拟职位数据
  const [jobData, setJobData] = useState<JobPosition[]>([
    {
      id: 1,
      jobTitle: 'Magento开发人员',
      company: '主营品牌',
      location: '加州',
      experience: '0-2岁',
      priority: 2,
      status: 'active',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '技术',
      actions: 'view',
    },
    {
      id: 2,
      jobTitle: '产品设计师',
      company: '网络技术 pvt.ltd',
      location: '加州',
      experience: '1-2岁',
      priority: 3,
      status: 'inactive',
      publishDate: '15 六月 2021',
      deadline: '28 六月 2021',
      department: '自主设计',
      actions: 'edit',
    },
    {
      id: 3,
      jobTitle: '市场总监',
      company: '创意机构',
      location: '凤凰',
      experience: '-',
      priority: 5,
      status: 'active',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '企划',
      actions: 'view',
    },
    {
      id: 4,
      jobTitle: 'HTML开发人员',
      company: '网络技术 pvt.ltd',
      location: '加州',
      experience: '0-4岁',
      priority: 8,
      status: 'active',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '技术',
      actions: 'edit',
    },
    {
      id: 5,
      jobTitle: '产品销售专员',
      company: '新科技解决私人有限公司制造公司',
      location: '跨境部定期州',
      experience: '5+ 年',
      priority: 1,
      status: 'inactive',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '自主设计',
      actions: 'view',
    },
    {
      id: 6,
      jobTitle: 'Magento开发人员',
      company: '主营品牌',
      location: '加州',
      experience: '0-2岁',
      priority: 2,
      status: 'active',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '技术',
      actions: 'view',
    },
    {
      id: 7,
      jobTitle: '产品设计师',
      company: '网络技术 pvt.ltd',
      location: '加州',
      experience: '1-2岁',
      priority: 3,
      status: 'inactive',
      publishDate: '15 六月 2021',
      deadline: '28 六月 2021',
      department: '自主设计',
      actions: 'edit',
    },
    {
      id: 8,
      jobTitle: '市场总监',
      company: '创意机构',
      location: '凤凰',
      experience: '-',
      priority: 5,
      status: 'active',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '企划',
      actions: 'view',
    },
    {
      id: 9,
      jobTitle: 'HTML开发人员',
      company: '网络技术 pvt.ltd',
      location: '加州',
      experience: '0-4岁',
      priority: 8,
      status: 'active',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '技术',
      actions: 'edit',
    },
    {
      id: 10,
      jobTitle: '产品销售专员',
      company: '新科技解决私人有限公司制造公司',
      location: '跨境部定期州',
      experience: '5+ 年',
      priority: 1,
      status: 'inactive',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '自主设计',
      actions: 'view',
    },
    {
      id: 11,
      jobTitle: 'Magento开发人员',
      company: '主营品牌',
      location: '加州',
      experience: '0-2岁',
      priority: 2,
      status: 'active',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '技术',
      actions: 'view',
    },
    {
      id: 12,
      jobTitle: '产品设计师',
      company: '网络技术 pvt.ltd',
      location: '加州',
      experience: '1-2岁',
      priority: 3,
      status: 'inactive',
      publishDate: '15 六月 2021',
      deadline: '28 六月 2021',
      department: '自主设计',
      actions: 'edit',
    },
    {
      id: 13,
      jobTitle: '市场总监',
      company: '创意机构',
      location: '凤凰',
      experience: '-',
      priority: 5,
      status: 'active',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '企划',
      actions: 'view',
    },
    {
      id: 14,
      jobTitle: 'HTML开发人员',
      company: '网络技术 pvt.ltd',
      location: '加州',
      experience: '0-4岁',
      priority: 8,
      status: 'active',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '技术',
      actions: 'edit',
    },
    {
      id: 15,
      jobTitle: '产品销售专员',
      company: '新科技解决私人有限公司制造公司',
      location: '跨境部定期州',
      experience: '5+ 年',
      priority: 1,
      status: 'inactive',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '自主设计',
      actions: 'view',
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
      title: '职位名称',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: '公司名称',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '经验',
      dataIndex: 'experience',
      key: 'experience',
    },
    {
      title: '类型',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'green', text: '全职' },
          inactive: { color: 'red', text: '兼职' },
          pending: { color: 'orange', text: '待定' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '发布日期',
      dataIndex: 'publishDate',
      key: 'publishDate',
      sorter: true,
    },
    {
      title: '地址',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => {
        const deptConfig = {
          技术: { color: 'blue', text: '技术' },
          自主设计: { color: 'cyan', text: '自主设计' },
          企划: { color: 'red', text: '企划' },
        };
        const config = deptConfig[dept as keyof typeof deptConfig];
        return config ? (
          <Tag color={config.color}>{config.text}</Tag>
        ) : (
          <Tag>{dept}</Tag>
        );
      },
    },
    {
      title: '行动',
      key: 'actions',
      render: (_, record: JobPosition) => (
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
