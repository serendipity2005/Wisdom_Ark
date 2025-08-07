import type React from 'react';
import { useState } from 'react';
import { Pagination, Row, Col } from 'antd';
import JobCard from './JobCard';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  experience: string;
  tags: string[];
  avatar: string;
  isFavorite: boolean;
}

const Living: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const jobData: Job[] = [
    {
      id: 1,
      title: 'Magento Developer',
      company: '斯科特科技 Pvt Ltd',
      location: '加州',
      salary: '$250 - $800 / 月',
      experience: '0-2 年经验',
      tags: ['全职', '兼职', '私人'],
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
    {
      id: 2,
      title: '产品设计师',
      company: '斯科特科技 Pvt Ltd',
      location: '英国',
      salary: '$250 - $800 / 月',
      experience: '0-2 年经验',
      tags: ['全职', '兼职', '私人'],
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
    {
      id: 3,
      title: '市场总监',
      company: '斯科特科技 Pvt Ltd',
      location: '美国',
      salary: '$250 - $800 / 月',
      experience: '0-2 岁',
      tags: ['全职', '兼职', '私人'],
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
    {
      id: 4,
      title: '项目经理',
      company: '斯科特科技 Pvt Ltd',
      location: '加州',
      salary: '$250 - $800 / 月',
      experience: '0-2 岁',
      tags: ['全职', '兼职', '私人'],
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
    {
      id: 5,
      title: 'HTML 显影剂',
      company: '斯科特科技 Pvt Ltd',
      location: '加拿大',
      salary: '$250 - $800 / 月',
      experience: '0-2 年经验',
      tags: ['全职', '兼职', '私人'],
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
    {
      id: 6,
      title: '商业伙伴',
      company: '斯科特科技 Pvt Ltd',
      location: '英国',
      salary: '$250 - $800 / 月',
      experience: '0-2 年经验',
      tags: ['全职', '兼职', '私人'],
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
    {
      id: 7,
      title: '产品销售专员',
      company: '斯科特科技 Pvt Ltd',
      location: '美国',
      salary: '$250 - $800 / 月',
      experience: '0-2 年经验',
      tags: ['全职', '兼职', '私人'],
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
    {
      id: 8,
      title: 'Magento Developer',
      company: '斯科特科技 Pvt Ltd',
      location: '巴基斯坦',
      salary: '$250 - $800 / 月',
      experience: '0-2 年经验',
      tags: ['全职', '兼职', '私人'],
      avatar: '/public/logo图标.png',
      isFavorite: false,
    },
  ];

  return (
    <div className="bg-[#fff] py-20 px-0">
      <div className="m-auto p-0">
        {/* Job Cards */}
        <Row gutter={[8, 8]}>
          {jobData.map((job) => (
            <Col xs={24} sm={24} md={12} lg={8} xl={8} xxl={6} key={job.id}>
              <JobCard job={job} />
            </Col>
          ))}
        </Row>

        {/* Pagination */}
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
