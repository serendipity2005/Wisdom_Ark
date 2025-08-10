import {
  FolderOutlined,
  FileImageOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { Progress, Typography } from 'antd';
import { useState } from 'react';

const { Title, Text } = Typography;
function Storage() {
  const [selectedStorage, setSelectedStorage] = useState<number | null>(null);

  const storageData = [
    {
      type: '全部',
      count: 1,
      size: '6.5 GB',
      color: '#a8a8a8ff',
      icon: <AppstoreOutlined />,
    },
    {
      type: '图像',
      count: 176,
      size: '6 GB',
      color: '#52c41a',
      icon: <FileImageOutlined />,
    },
    {
      type: '视频',
      count: 45,
      size: '4.1 GB',
      color: '#f5222d',
      icon: <VideoCameraOutlined />,
    },
    {
      type: '音乐',
      count: 21,
      size: '3.2 GB',
      color: '#1890ff',
      icon: <AudioOutlined />,
    },
    {
      type: '文本',
      count: 21,
      size: '2 GB',
      color: '#722ed1',
      icon: <FileTextOutlined />,
    },
    {
      type: 'zip',
      count: 20,
      size: '1.4 GB',
      color: '#faad14',
      icon: <FolderOutlined />,
    },
  ];
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <Title level={4} className="mb-6">
        存储
      </Title>

      <div className="text-center mb-6">
        <div className="relative inline-block">
          <Progress
            type="circle"
            percent={76}
            size={120}
            strokeColor="#1890ff"
            format={() => (
              <span className="text-2xl font-bold text-gray-400">76%</span>
            )}
          />
        </div>
        <div className="mt-2">
          <Text className="text-gray-500">已使用 64 GB 的 48.02 GB (76%)</Text>
        </div>
      </div>

      <div className="space-y-4">
        {storageData.map((item, index) => (
          <div
            key={index}
            // className="flex items-center justify-between px-10 py-3 hover:bg-[#f4f4f4]"
            className={`flex items-center justify-between px-10 py-3 rounded-lg cursor-pointer transition-colors duration-200 ${
              selectedStorage === index
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-gray-50'
            }`}
            onClick={() =>
              setSelectedStorage(selectedStorage === index ? null : index)
            }
          >
            <div className="flex items-center gap-3">
              <div
                className="w-15 h-15 text-18 mr-10 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `${item.color}20`,
                  color: item.color,
                }}
              >
                {item.icon}
              </div>
              <div>
                <div className="font-medium">{item.type}</div>
                <div className="text-gray-400 text-sm">{item.count} 个文件</div>
              </div>
            </div>
            <Text className="font-medium">{item.size}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Storage;
