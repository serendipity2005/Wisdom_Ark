import { Button, Card, Tag, Space, Typography } from 'antd';
import {
  EnvironmentOutlined,
  DollarOutlined,
  HeartOutlined,
  HeartFilled,
} from '@ant-design/icons';
import { useState } from 'react';
import './index.scss';

const { Title } = Typography;

interface JobProps {
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    salary: string;
    experience: string;
    tags: string[];
    avatar: string;
    isFavorite: boolean;
  };
}

function JobCard({ job }: JobProps) {
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleFavorite = (jobId: number) => {
    setFavorites((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId],
    );
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case '全职':
        return 'green';
      case '兼职':
        return 'orange';
      case '私人':
        return 'blue';
      default:
        return 'default';
    }
  };
  return (
    <Card
      className="job-card rounded-8 mb-16 border border-solid border-[#f0f0f0] hover:shadow-lg hover:translate-y--2 transition-all duration-300 ease-in-out"
      hoverable
    >
      <div className="flex justify-between align-start">
        <div className="flex gap-16 flex-1">
          <div className="w-48 h-48 rounded-8 flex justify-center text-white fs-16 fw-bold flex-shrink-0">
            <img
              className="w-full h-full object-cover"
              src={job.avatar}
              alt=""
            />
          </div>

          <div className="flex-1">
            <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
              {job.title}
            </Title>
            <div className="text-[#666] mb-8 fs-14">{job.experience}</div>
            <div className="text-[#888] mb-12 fs-14">{job.company}</div>

            <div className="mb-16">
              <Space wrap>
                {job.tags.map((tag, index) => (
                  <Tag
                    key={index}
                    color={getTagColor(tag)}
                    className="rounded-4"
                  >
                    {tag}
                  </Tag>
                ))}
              </Space>
            </div>

            <div className="flex gap-16 align-center fs-14 text-[#666]">
              <Space>
                <EnvironmentOutlined />
                {job.location}
              </Space>
              <Space>
                <DollarOutlined />
                {job.salary}
              </Space>
            </div>
          </div>
        </div>

        <Button
          type="text"
          icon={
            favorites.includes(job.id) ? (
              <HeartFilled className="text-[#ff4d4f]" />
            ) : (
              <HeartOutlined />
            )
          }
          onClick={() => toggleFavorite(job.id)}
          className="ml-16"
        />
      </div>

      <div className="flex gap-8 mt-16 pt-16 border-t-[1px] border-[#f0f0f0] border-solid">
        <Button type="primary" className="flex-1 rounded-6">
          观看直播
        </Button>
        <Button
          type="default"
          className="flex-1 bg-[#f8f9fa] rounded-6 border-t-[1px] border-[#e9ecef] border-solid"
        >
          封禁直播
        </Button>
      </div>
    </Card>
  );
}

export default JobCard;
