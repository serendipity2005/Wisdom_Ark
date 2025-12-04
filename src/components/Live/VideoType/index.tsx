import './index.scss';
import { TvMinimalPlay, CalendarDays, Clock } from 'lucide-react';
import { useState } from 'react';
import { Button, Card } from 'antd';
interface LiveItem {
  id: number;
  title: string;
  date: string;
  time: string;
  status: number;
  speaker: string;
  image: string;
  tag: string;
  type: string;
}

// 模拟直播数据
const liveData: LiveItem[] = [
  {
    id: 1,
    title: 'Trae + supabase + Vercel 搭建 Web 全栈应用',
    date: '2025-05-20',
    time: '19:00',
    status: 1,
    speaker: '江昇',
    image: 'https://picsum.photos/300/180?random=1',
    tag: '直播中',
    type: '8',
  },
  {
    id: 2,
    title: 'Trae + supabase + Vercel 搭建 Web 全栈应用',
    date: '2025-05-13',
    time: '19:00',
    status: 2,
    speaker: '江昇',
    image: 'https://picsum.photos/300/180?random=2',
    tag: '回放',
    type: '7',
  },
  {
    id: 3,
    title: '今晚聊Trae: Tare赋能开源，打造优质的开源项目新范式',
    date: '2025-05-08',
    time: '19:00',
    status: 2,
    speaker: '坚果',
    image: 'https://picsum.photos/300/180?random=3',
    tag: '回放',
    type: '6',
  },
  {
    id: 4,
    title: '今晚聊Trae: MCP全链路实战 设计、优化、部署',
    date: '2025-04-28',
    time: '19:00',
    status: 2,
    speaker: '刘文溢',
    image: 'https://picsum.photos/300/180?random=4',
    tag: '回放',
    type: '5',
  },
  {
    id: 5,
    title: 'Trae + Vercel 搭建高性能应用',
    date: '2025-06-10',
    time: '20:00',
    status: 1,
    speaker: '小明',
    image: 'https://picsum.photos/300/180?random=5',
    tag: '直播中',
    type: '4',
  },
  {
    id: 6,
    title: 'Trae 最佳实践分享',
    date: '2025-06-15',
    time: '19:30',
    status: 1,
    speaker: '小红',
    image: 'https://picsum.photos/300/180?random=6',
    tag: '直播中',
    type: '3',
  },
];

// 直播类型选项
const typeOptions = [
  { value: 'all', label: '全部' },
  { value: '4', label: '创作者学院' },
  { value: '5', label: '大咖面对面' },
  { value: '6', label: '掘力计划' },
  { value: '7', label: '稀土掘金大会' },
  { value: '8', label: '掘金精选活动' },
];

// 直播状态选项
const statusOptions = [
  { value: 0, label: '全部' },
  { value: 1, label: '直播中' },
  { value: 2, label: '已结束' },
];

// 直播卡片组件
const LiveCard = ({ item }: { item: LiveItem }) => {
  return (
    <Card
      hoverable
      className="overflow-hidden transition-all  hover:shadow-md h-265"
      styles={{
        body: {
          padding: 10,
        },
      }}
      cover={
        <div className="relative">
          <img src={item.image} className="w-full object-cover" />
          {/* 直播标签 */}
          <div className="absolute top-5 left-5 bg-blue-400 text-white text-11 px-2 py-1 rounded-5 flex items-center">
            <span className="mr-1 px-6 py-3">{item.tag}</span>
          </div>
        </div>
      }
    >
      <div className="mb-5 text-14 h-44">{item.title}</div>
      <div className="mb-5 text-blue">✨{item.speaker}</div>
      <div className="space-y-4 w-full flex">
        <div className="flex items-center text-gray-600 text-sm mr-auto">
          <CalendarDays className="mr-4 w-16 h-16" />
          <span className="text-13.5">{item.date}</span>
        </div>
        <div className="flex items-center text-gray-600 text-sm ml-auto">
          <Clock className="mr-4 w-16 h-16" />
          <span className="text-13.5">{item.time}</span>
        </div>
      </div>
    </Card>
  );
};

export default function VideoType() {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState(0);

  const LiveListData = liveData.filter((item) => {
    const typeMatch = selectedType === 'all' || item.type === selectedType;
    const statusMatch = selectedStatus === 0 || item.status === selectedStatus;
    return typeMatch && statusMatch;
  });

  return (
    <div className="w-750 min-h-750 bg-white mt-20 p-15">
      <div className="font-bold flex items-center mb-15">
        <TvMinimalPlay className="w-18 h-18 mr-5" />
        直播列表
      </div>

      {/* 筛选条件 */}
      <div className="mb-10">
        {/* 直播类型 */}
        <div className="mb-5 text-15">
          <span className="mr-3 ">直播类型：</span>
          {typeOptions.map((option) => (
            <Button
              type="text"
              key={option.value}
              className={` text-14 px-8 py-5 rounded mr-10 border-0 ${selectedType === option.value ? 'bg-#eaf2ff text-blue-500' : ' hover:bg-gray-200'}`}
              onClick={() => setSelectedType(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* 直播状态 */}
        <div>
          <span className="mr-3  text-15">直播状态：</span>
          {statusOptions.map((option) => (
            <Button
              type="text"
              key={option.value}
              className={`text-14 px-8 py-5 rounded mr-10 border-0 ${selectedStatus === option.value ? 'bg-#eaf2ff text-blue-500' : ' hover:bg-gray-200'}`}
              onClick={() => setSelectedStatus(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 直播列表 */}
      <div className="grid grid-cols-3 gap-10">
        {LiveListData.map((item) => (
          <LiveCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
