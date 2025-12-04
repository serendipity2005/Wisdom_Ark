import MyHeader from '@/layouts/frontLayout/Header';
import { useState } from 'react';
import VideoShow from '@/components/Live/VideoShow';
import VideoItem from '@/components/Live/VideoItem';
import { allVideoData } from '@/components/Live/VideoItem/videoData';
import VideoFocus from '@/components/Live/VideoFocus';
import VideoList from '@/components/Live/VideoList';
import VideoType from '@/components/Live/VideoType';
import CreateLive from '@/components/Live/CreateLive';

export default function Live() {
  // 初始化
  const [selectedId, setSelectedId] = useState<number | null>(
    allVideoData.length > 0 ? allVideoData[0].id : null,
  );
  const selectedVideo =
    allVideoData.find((item) => item.id === selectedId) || null;

  return (
    <>
      {/* 导航栏 */}
      <MyHeader></MyHeader>
      <div className="w-100% h-620 bg-#232323 flex justify-center items-center">
        <div className="flex">
          {/* 视频播放区 */}
          <div className="">
            <VideoShow selectedVideo={selectedVideo} />
          </div>
          {/* 视频列表 */}
          <div className="w-240 h-540 bg-black flex flex-col justify-center items-center ml-20 p-2">
            {allVideoData.map((item) => (
              <VideoItem
                key={item.id}
                item={item}
                isSelected={item.id === selectedId}
                onItemClick={() => setSelectedId(item.id)}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="w-100% bg-#f5f5f5 flex justify-center py-30">
        <div className="">
          <VideoFocus></VideoFocus>
          <VideoType></VideoType>
        </div>
        <div className="">
          <VideoList></VideoList>
          <CreateLive></CreateLive>
        </div>
      </div>
    </>
  );
}
