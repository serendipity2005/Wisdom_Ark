import './index.scss';
import { CirclePlay } from 'lucide-react';
import { useState } from 'react';

// 定义视频项的接口
interface VideoItem {
  id: number;
  coverUrl: string;
  title: string;
}

// 视频数据
const videoData: VideoItem[] = [
  {
    id: 1,
    coverUrl:
      'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    title: 'AI编程社 共学计划Vol.6',
  },
  {
    id: 2,
    coverUrl:
      'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    title: 'AI编程社 共学计划Vol.5',
  },
  {
    id: 3,
    coverUrl:
      'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    title: 'AI编程社 共学计划Vol.4',
  },
  {
    id: 4,
    coverUrl:
      'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    title: 'AI编程社 共学计划Vol.3',
  },
];

export default function VideoList() {
  return (
    <div className="w-250 h-540 bg-black flex flex-col justify-center items-center ml-20 p-2">
      {videoData.map((item) => (
        <VideoItemComponent key={item.id} item={item} />
      ))}
    </div>
  );
}

// 视频项组件
function VideoItemComponent({ item }: { item: VideoItem }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`video-item w-96% h-24% cursor-pointer bg-white rounded-1 bg-cover bg-center my-4 relative transition-all duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-80'
      }`}
      style={{
        backgroundImage: `url(${item.coverUrl})`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`mask absolute inset-0  transition-opacity duration-300 ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ zIndex: 1 }}
      ></div>

      <div
        className="playback-tag absolute top-2 right-2 w-50 h-20 flex items-center justify-center bg-#5da7f5 text-white rounded-30% text-11"
        style={{ zIndex: 3 }}
      >
        <CirclePlay className="w-13 h-13" />
        <span className="ml-2"> 回放</span>
      </div>

      <div
        className="title absolute w-full h-40 bottom-0 text-white text-15 text-center flex items-center justify-center"
        style={{ zIndex: 3 }}
      >
        <div
          className="title-bg absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-5"
          style={{ zIndex: 2 }}
        ></div>{' '}
        <span className="relative z-10">{item.title}</span>
      </div>
    </div>
  );
}
