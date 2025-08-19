import './index.scss';
import { Telescope, Radio, ArrowBigDownDash } from 'lucide-react';
import { Avatar } from 'antd';
import { useState } from 'react';

// 直播数据
const liveData = [
  {
    id: 1,
    avatarUrl:
      'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
    name: '天天摸鱼的java工程师',
    viewerCount: 456,
  },
  {
    id: 2,
    avatarUrl:
      'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
    name: '前端小智',
    viewerCount: 886,
  },
  {
    id: 3,
    avatarUrl:
      'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
    name: '小舟',
    viewerCount: 1129,
  },
  {
    id: 4,
    avatarUrl:
      'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
    name: '技术达人',
    viewerCount: 678,
  },
  {
    id: 5,
    avatarUrl:
      'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
    name: '编程小能手',
    viewerCount: 999,
  },
];
// 头部信息
const headerInfo = {
  liveCount: 2,
  showExpand: liveData.length > 3,
};

export default function VideoFocus() {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedLiveData = isExpanded ? liveData : liveData.slice(0, 3);

  return (
    <div className="w-750 bg-white mr-20 p-15">
      <div className="flex items-center justify-between">
        <div className="font-bold flex items-center">
          <Telescope className="w-19 h-19 mr-5" />
          我的关注
        </div>

        <div className="text-white ml-20 px-10 bg-#5da7f5 rounded-20 text-12 flex items-center">
          <span className="text-white">{headerInfo.liveCount}人</span>正在直播中
          <Radio className="ml-5 w-17 h-17" />
        </div>

        {headerInfo.showExpand && (
          <div
            className="ml-auto text-gray-20 text-13 flex items-center cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ArrowBigDownDash
              className={`w-20 h-20 mr-2 color-gray-20 transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
            {isExpanded ? '收起' : '展开全部'}
          </div>
        )}
      </div>

      <div className="w-full mt-12 grid grid-cols-3 gap-10">
        {displayedLiveData.map((item) => (
          <div key={item.id} className="living flex">
            <div className="live-item w-55 h-55 rounded-50% flex items-center justify-center">
              <Avatar src={item.avatarUrl} className="w-45 h-45 rounded-50%" />
            </div>
            <div className="ml-15">
              <div className="focus-name text-13.5 mt-6 font-bold text-gray-7">
                {item.name}
              </div>
              <div className="watched mt-8 text-12 text-gray-5">
                <span>{item.viewerCount}</span>人看过
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
