import { CirclePlay } from 'lucide-react';
import { useState } from 'react';
import type { VideoData } from './videoData';
import './index.scss';

interface VideoItemProps {
  item: VideoData;
  isSelected: boolean;
  onItemClick: () => void;
}

export default function VideoItem({
  item,
  isSelected,
  onItemClick,
}: VideoItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const hasBorder = isHovered || isSelected;

  return (
    <div
      className={`video-item w-96% h-24% cursor-pointer bg-white rounded-1 bg-cover bg-center my-4 relative transition-all duration-300 
        ${hasBorder ? 'opacity-100 border-2 border-blue-500' : 'opacity-80 border-0'}
      `}
      style={{
        backgroundImage: `url(${item.coverUrl})`,
        boxShadow: hasBorder ? '0px 0px 2px 2px #3b82f6' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onItemClick}
    >
      <div
        className={`mask absolute inset-0 transition-opacity duration-300 ${
          hasBorder ? 'opacity-0' : 'opacity-100'
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
        <span className="relative z-10 text-14">{item.title}</span>
      </div>
    </div>
  );
}
