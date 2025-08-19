import { Avatar, List } from 'antd';
import { Flame, RotateCcw } from 'lucide-react';

export default function VideoList() {
  const data = [
    { name: '天天摸鱼的工程师', likes: 2211, views: 2211 },
    { name: '小舟', likes: 1987, views: 2211 },
    { name: '前端码农', likes: 162, views: 2211 },
    { name: '技术达人', likes: 121, views: 2211 },
  ];
  const url =
    'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg';

  const getMedal = (index: number) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return null;
    }
  };

  return (
    <div className="w-300 h-400 bg-white rounded-10 p-15">
      <div className="font-bold flex items-center mb-10">
        {/* <Flame className="mr-5 w-20 h-20" /> */}
        🔥 热门主播榜
        <span className="ml-auto text-primary flex items-center font-300 text-13 cursor-pointer">
          <RotateCcw className="mr-3 w-15 h-15 font-300" />
          刷新
        </span>
      </div>

      <List
        dataSource={data}
        renderItem={(item, index) => (
          <List.Item className="py-3">
            {index < 3 && (
              <div className="mr-4 flex items-start pt-1 text-24">
                {getMedal(index)}
              </div>
            )}
            {index >= 3 && (
              <div className="mr-4 flex items-start pt-1 w-38 h-22"></div>
            )}
            <div className="w-30 h-30 rounded-50%">
              <Avatar src={<img src={url} alt="avatar" />} />
            </div>
            <div className="w-170 ml-10">
              <div className="text-14 font-bold mb-3">{item.name}</div>
              <div className="text-12 text-blue-4">2233人正在观看</div>
            </div>
            <div className="flex items-center text-13 text-gray-6 w-50">
              <Flame className="mr-1 w-17 h-17 color-red-6" />
              {item.likes}
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}
