import { useState } from 'react';
import { Eye, FileImage, Share2 } from 'lucide-react';
import { Button, Image, Input, QRCode, Popover, Space, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import videoUrl from '../../../assets/video/play.mp4';
import VideoPlayer from '../VideoPlayer';

// 模拟直播数据
const liveData = {
  title: 'AI大模型实战：从入门到部署全流程讲解',
  views: '12,345', // 观看量
  videoUrl: videoUrl, // 视频播放地址（模拟）
  coverUrl: 'https://picsum.photos/id/237/1280/720', // 直播封面图（模拟）
  liveUrl: 'https://example.com/live/ai-model-workshop', // 直播分享链接
};

export default function VideoBlock() {
  const [preview, setPreview] = useState(false);

  // 复制文本到剪贴板
  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(liveData.liveUrl)
      .then(() => message.success('复制成功'))
      .catch(() => message.error('复制失败'));
  };

  // 二维码内容
  const qrCode = (
    <div>
      <Space direction="vertical" align="center">
        <QRCode value={liveData.liveUrl} />
        <div className="input-copy">
          <Input
            value={liveData.liveUrl}
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
    <>
      <div className="w-890 h-650 bg-white mr-10">
        {/* 视频信息 */}
        <div className="title-block w-100% h-60 pl-15 bg-white  rounded-tl-5 rounded-tr-5 flex items-center">
          <div>
            <div className="title text-16 font-bold">{liveData.title}</div>
            <div className="views text-11 flex items-center mt-3">
              <Eye className="w-15 h-15 mr-3" />
              <span>{liveData.views} 次观看</span>
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
          </div>
        </div>
        {/* 视频播放区域 */}
        <div className="video w-full h-590 bg-white ">
          <VideoPlayer
            videoUrl={liveData.videoUrl}
            thumbnailUrl={liveData.coverUrl}
          />
        </div>

        {/* 图片预览组件 */}
        <Image
          style={{ display: 'none' }}
          src={liveData.coverUrl}
          preview={{
            visible: preview,
            src: liveData.coverUrl,
            onVisibleChange: (value) => setPreview(value),
          }}
        />
      </div>
    </>
  );
}
