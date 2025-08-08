// 表格组件

import type React from 'react';
import { useState } from 'react';
import { Table, Button, Space, Tag, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import PreviewModal from '../Audit/PreviewModal';

// 模拟数据类型定义
interface JobPosition {
  id: number;
  jobTitle: string;
  company: string;
  priority: number;
  status: 'active' | 'inactive' | 'pending';
  publishDate: string;
  deadline: string;
  department: string;
  actions: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  publishTime: string;
  status: 'pending' | 'approved' | 'rejected';
  coverImage?: string;
  summary: string;
  readCount: number;
}

function ReportPhp() {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPage, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const mockArticle: Article = {
    id: '1',
    title: 'React 18 新特性详解：并发渲染与Suspense优化',
    content: `
      ## 引言
      <p>React 18 作为一个重要的版本更新，引入了许多激动人心的新特性。其中最重要的就是并发渲染（Concurrent Rendering）功能，它为React应用带来了更好的用户体验和性能优化。</p>

      <h2>并发渲染</h2>
      <p>并发渲染是React 18最重要的特性之一。它允许React在渲染过程中被中断，从而让浏览器有机会处理其他任务，比如用户输入或动画。</p>

      <h3>主要优势：</h3>
      <ul>
        <li>更好的用户体验：避免长时间阻塞主线程</li>
        <li>更流畅的动画：确保动画不会被渲染任务中断</li>
        <li>更快的响应速度：优先处理用户交互</li>
      </ul>

      <h2>Suspense改进</h2>
      <p>React 18对Suspense组件进行了重大改进，现在它不仅支持代码分割，还支持数据获取等异步操作。</p>

      <p>这些新特性为开发者提供了更多可能性，让我们能够构建更加流畅和用户友好的应用程序。</p>
    `,
    author: '张三',
    category: '前端技术',
    tags: ['React', 'JavaScript', '前端开发', 'Web技术'],
    publishTime: '2024-01-15 10:30:00',
    status: 'pending',
    coverImage:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop',
    summary:
      '本文深入探讨了React 18的核心新特性，重点介绍了并发渲染机制如何提升应用性能，以及Suspense组件的增强功能如何简化异步数据处理。',
    readCount: 1250,
  };

  const handleReview = async (
    articleId: string,
    status: 'approved' | 'rejected',
    reason: string,
  ) => {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Review submitted:', { articleId, status, reason });
        resolve(true);
      }, 1000);
    });
  };

  // 模拟职位数据
  const [jobData, setJobData] = useState<JobPosition[]>([
    {
      id: 1,
      jobTitle: 'Magento开发人员',
      company: '主营品牌',
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
      priority: 1,
      status: 'pending',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '自主设计',
      actions: 'view',
    },
    {
      id: 6,
      jobTitle: 'Magento开发人员',
      company: '主营品牌',
      priority: 2,
      status: 'pending',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '技术',
      actions: 'view',
    },
    {
      id: 7,
      jobTitle: '产品设计师',
      company: '网络技术 pvt.ltd',
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
      priority: 2,
      status: 'pending',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '技术',
      actions: 'view',
    },
    {
      id: 12,
      jobTitle: '产品设计师',
      company: '网络技术 pvt.ltd',
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
      priority: 8,
      status: 'pending',
      publishDate: '02 六月 2021',
      deadline: '25 六月 2021',
      department: '技术',
      actions: 'edit',
    },
    {
      id: 15,
      jobTitle: '产品销售专员',
      company: '新科技解决私人有限公司制造公司',
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
      title: 'id',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      sorter: true,
    },
    {
      title: '文章标题',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: '举报原因',
      dataIndex: 'company',
      key: 'company',
    },

    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'green', text: '已受理' },
          inactive: { color: 'red', text: '已驳回' },
          pending: { color: 'orange', text: '待受理' },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '举报时间',
      dataIndex: 'publishDate',
      key: 'publishDate',
      sorter: true,
    },
    {
      title: '举报类型',
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
          <Tooltip title="预览">
            <Button
              type="text"
              onClick={() => setModalVisible(true)}
              icon={<EyeOutlined />}
              size="small"
            />
          </Tooltip>
          <Tooltip title="审核">
            <Button
              type="text"
              onClick={() => setModalVisible(true)}
              icon={<EditOutlined />}
              size="small"
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="text" icon={<DeleteOutlined />} size="small" danger />
          </Tooltip>
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
      <PreviewModal
        visible={modalVisible}
        article={mockArticle}
        plate="report"
        onClose={() => setModalVisible(false)}
        onReview={handleReview}
      />
    </>
  );
}

export default ReportPhp;
