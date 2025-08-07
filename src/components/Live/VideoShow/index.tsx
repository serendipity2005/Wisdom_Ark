import { useState } from 'react';
import './index.scss';
import { Eye, FileImage, Share2 } from 'lucide-react';
import {
  Button,
  Flex,
  Image,
  Input,
  QRCode,
  Popover,
  Space,
  message,
} from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import type { VideoData } from '../VideoItem/videoData';

interface VideoShowProps {
  selectedVideo: VideoData | null;
}

export default function VideoShow({ selectedVideo }: VideoShowProps) {
  const [preview, setPreview] = useState(false);

  if (!selectedVideo) {
    return <div className="text-white">请选择一个视频</div>;
  }

  // 复制文本到剪贴板
  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(selectedVideo.liveUrl)
      .then(() => message.success('复制成功'))
      .catch(() => message.error('复制失败'));
  };

  // 二维码内容
  const qrCode = (
    <div>
      <Space direction="vertical" align="center">
        <QRCode value={selectedVideo.liveUrl} />
        <div className="input-copy">
          <Input
            value={selectedVideo.liveUrl}
            disabled
            suffix={
              <Button icon={<CopyOutlined />} onClick={copyToClipboard} />
            }
          />
        </div>
      </Space>
    </div>
  );

  return (
    <div className="w-800 h-540 flex justify-center items-center bg-black rounded-tl-5 rounded-tr-5 flex-col">
      {/* 视频信息 */}
      <div className="title-block w-99.8% h-50 bg-white mb-8 rounded-tl-5 rounded-tr-5 flex">
        <div>
          <div className="title text-16 font-bold">{selectedVideo.title}</div>
          <div className="views text-11 flex items-center mt-1">
            <Eye className="w-15 h-15 mr-3" />
            <span>{selectedVideo.views}</span>
          </div>
        </div>
        <div className="options flex-1 flex justify-end">
          <div
            className="cover flex items-center mr-20 cursor-pointer"
            onClick={() => setPreview(true)}
          >
            <FileImage className="w-15 h-15" />
            <span className="ml-3 text-13">直播封面</span>
          </div>
          <Popover content={qrCode} trigger="click">
            <div className="share flex items-center mr-20 cursor-pointer">
              <Share2 className="w-15 h-15  mr-2" />
              <span className="ml-3 text-13">分享</span>
            </div>
          </Popover>
          <div className="go-in flex items-center">
            <Flex gap="small" wrap>
              <Button type="primary" className="text-13">
                进入直播间
              </Button>
            </Flex>
          </div>
        </div>
      </div>
      {/* 视频播放区域 */}
      <div className="video w-99.8% h-470 bg-white">
        <video className="w-full h-full object-contain" controls>
          <source src={selectedVideo.videoUrl} type="video/mp4" />
        </video>
      </div>
      {/* 图片预览组件 */}
      <Image
        style={{ display: 'none' }}
        src={selectedVideo.coverUrl}
        preview={{
          visible: preview,
          src: selectedVideo.coverUrl,
          onVisibleChange: (value) => setPreview(value),
        }}
      />
    </div>
  );
}
