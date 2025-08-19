import MyHeader from '@/layouts/frontLayout/Header';
import VideoBlock from '@/components/Live/VideoBlock';
import VideoChat from '@/components/Live/VideoChat';
import VideoInto from '@/components/Live/VideoInto';

export default function Live() {
  return (
    <>
      <MyHeader></MyHeader>
      <div className="w-100% h-800 flex justify-center items-center bg-#232323">
        <VideoBlock></VideoBlock>
        <VideoChat></VideoChat>
      </div>
      <div className="w-100% h-800 flex justify-center  bg-#f4f5f5">
        <VideoInto></VideoInto>
      </div>
    </>
  );
}
