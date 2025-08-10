import type React from 'react';
import { useEffect, useState } from 'react';
import { Pagination, Row, Col } from 'antd';
import Filter from '../Filter';
import JobCard from './JobCard';

interface Job {
  id: number;
  title: string;
  userName: string;
  startTime: string;
  experience: string;
  tags: string[];
  cover: string;
  avatar: string;
  isFavorite: boolean;
}

// 页数筛选表单
const pageMenu = [
  { key: 12, label: 'page 12' },
  { key: 24, label: 'page 24' },
  { key: 36, label: 'page 36' },
];

const Living: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [stateType, setStateType] = useState('');
  const [identityTyp, setIdentityType] = useState('');
  const [searchText, setSearchText] = useState('');

  const threeSelMenu = {
    label: '标签',
    items: [
      { key: 'all', label: '大咖教学' },
      { key: 'online', label: '官方' },
      { key: 'living', label: '入门教程' },
      { key: 'offline', label: '求职' },
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

  const jobData: Job[] = [
    {
      id: 1,
      title: 'IMMA GET IT',
      userName: 'MIC檀健次JC-T',
      startTime: '25-8-8 10:05',
      experience: '0-2 年经验',
      tags: ['大咖教学'],
      cover: 'https://i.postimg.cc/SxZmvX9x/20250808150920-1.jpg',
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
    {
      id: 2,
      title: '产品设计师',
      userName: '斯科特科技 Pvt Ltd',
      startTime: '25-8-8 8:00',
      experience: '0-2 年经验',
      tags: ['私人'],
      cover: 'https://i.postimg.cc/SxZmvX9x/20250808150920-1.jpg',
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
    {
      id: 3,
      title: '市场总监',
      userName: '斯科特科技 Pvt Ltd',
      startTime: '25-8-8 8:00',
      experience: '0-2 岁',
      tags: ['全职', '兼职', '私人'],
      cover: 'https://i.postimg.cc/SxZmvX9x/20250808150920-1.jpg',
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
    {
      id: 4,
      title: '项目经理',
      userName: '斯科特科技 Pvt Ltd',
      startTime: '25-8-8 8:00',
      experience: '0-2 岁',
      tags: ['全职', '兼职', '私人'],
      cover: 'https://i.postimg.cc/SxZmvX9x/20250808150920-1.jpg',
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
    {
      id: 5,
      title: 'HTML 显影剂',
      userName: '斯科特科技 Pvt Ltd',
      startTime: '25-8-8 8:00',
      experience: '0-2 年经验',
      tags: ['全职', '兼职', '私人'],
      cover: 'https://i.postimg.cc/SxZmvX9x/20250808150920-1.jpg',
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
    {
      id: 6,
      title: '商业伙伴',
      userName: '斯科特科技 Pvt Ltd',
      startTime: '25-8-8 8:00',
      experience: '0-2 年经验',
      tags: ['全职', '兼职', '私人'],
      cover: 'https://i.postimg.cc/SxZmvX9x/20250808150920-1.jpg',
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
    {
      id: 7,
      title: '产品销售专员',
      userName: '斯科特科技 Pvt Ltd',
      startTime: '25-8-8 8:00',
      experience: '0-2 年经验',
      tags: ['全职', '兼职', '私人'],
      cover: 'https://i.postimg.cc/SxZmvX9x/20250808150920-1.jpg',
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
    {
      id: 8,
      title: 'Magento Developer',
      userName: '斯科特科技 Pvt Ltd',
      startTime: '25-8-8 8:00',
      experience: '0-2 年经验',
      tags: ['全职', '兼职', '私人'],
      cover: 'https://i.postimg.cc/SxZmvX9x/20250808150920-1.jpg',
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
  ];

  return (
    <div className="bg-[#fff] py-20 px-0">
      {/* 筛选和搜索区域 */}
      <Filter
        pageMenu={pageMenu}
        menuItems={menuItems}
        pageSize={pageSize}
        setPageSize={setPageSize}
        setSearchText={setSearchText}
      />
      <div className="m-auto pt-20">
        {/* 表格 */}
        <Row gutter={[8, 8]}>
          {jobData.map((job) => (
            <Col xs={24} sm={24} md={12} lg={12} xl={8} xxl={6} key={job.id}>
              <JobCard job={job} />
            </Col>
          ))}
        </Row>

        {/* 分页栏 */}
        <div className="text-center mt-10 bg-white p-10 rounded-8">
          <div className="mb-16 text-[#666]">显示 8 条目（共 12 条目）</div>
          <Pagination
            current={currentPage}
            total={12}
            pageSize={8}
            showSizeChanger={false}
            onChange={setCurrentPage}
            className="justify-center"
          />
        </div>
      </div>
    </div>
  );
};

export default Living;
