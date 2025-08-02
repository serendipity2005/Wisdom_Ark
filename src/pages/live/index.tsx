import MyHeader from '@/layouts/frontLayout/Header';
import React from 'react';
import VideoShow from '@/components/Live/VideoShow';
import VideoList from '@/components/Live/VideoList';

export default function Live() {
  return (
    <>
      <MyHeader></MyHeader>
      <div className="w-100% h-620 bg-#232323 flex justify-center items-center">
        <VideoShow></VideoShow>
        <VideoList></VideoList>
      </div>
    </>
  );
}
