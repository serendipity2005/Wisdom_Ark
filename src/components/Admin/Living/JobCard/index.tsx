import { Button, Card, Tag, Space, Typography } from 'antd';
import {
  FireOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import './index.scss';
import LivingPopup from '../LivingPopup';
import { useState } from 'react';

const { Title } = Typography;

interface JobProps {
  job: {
    id: number;
    title: string;
    userName: string;
    startTime: string;
    experience: string;
    tags: string[];
    cover: string;
    avatar: string;
    isFavorite: boolean;
  };
}

function JobCard({ job }: JobProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [plate, setPlate] = useState('flow');

  const getTagColor = (tag: string) => {
    switch (tag) {
      case '全职':
        return 'green';
      case '兼职':
        return 'orange';
      case '私人':
        return 'blue';
      case '大咖教学':
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
        <div className="flex flex-col gap-16 flex-1">
          <div className="relative w-full h-150 rounded-8 flex justify-center text-white fs-16 fw-bold flex-shrink-0">
            <div className="flex-center absolute w-full h-full rounded-8 bg-#00000078  opacity-0 hover:opacity-100 transition duration-500 text-45 text-[#c3c3c3] hover:text-[#fff]">
              <PlayCircleOutlined />
            </div>
            <img
              className="w-full h-full object-cover"
              src={job.cover}
              alt=""
            />
          </div>
          <div className="flex-1">
            <Title level={5} className="m-0 text-16">
              {job.title}
            </Title>
            <div className="flex justify-between my-5">
              <div className="flex">
                <div className="w-25 h-25 rounded-25 flex  text-white fs-16 fw-bold flex-shrink-0">
                  <img
                    className="w-full h-full rounded-25 object-cover"
                    src={job.avatar}
                    alt=""
                  />
                </div>
                <div className="text-[#888] fs-14 text-12 ml-5 line-height-25">
                  {job.userName}
                </div>
              </div>
              <div className="text-[#888] fs-14 text-12 ml-5 line-height-25">
                <FireOutlined className="text-[#ff4d4f]" />
                1005.0万
              </div>
            </div>

            <div className="flex justify-between">
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
              <Space className="flex text-[#888]">
                <ClockCircleOutlined />
                {job.startTime}
              </Space>
            </div>
          </div>
        </div>
      </div>

      <div className="job-card-btn flex gap-8 mt-16">
        <Button
          type="primary"
          className="flex-1 rounded-6"
          onClick={() => {
            setModalVisible(true);
            setPlate('flow');
          }}
        >
          推送流量
        </Button>
        <Button
          type="default"
          onClick={() => {
            setModalVisible(true);
            setPlate('ban');
          }}
          className="flex-1  text-red-4 rounded-6 border-t-[1px] border-red border-solid hover-text-red-6"
        >
          封禁直播
        </Button>
      </div>

      {/* 弹窗 */}
      <LivingPopup
        visible={modalVisible}
        plate={plate}
        onClose={() => setModalVisible(false)}
      />
    </Card>
  );
}

export default JobCard;
