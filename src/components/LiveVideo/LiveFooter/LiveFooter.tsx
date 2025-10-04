import { useCamera, useScreenShare, useLiveControl } from '@/hooks/liveVideo';
import { useStream } from '@/hooks/liveVideo/useStream';
import { Context, type DeviceInfo } from '@/pages/livevideo';
import { getSelectOptions } from '@/utils/getSelectOptions';
import { CopyOutlined } from '@ant-design/icons';
import { Select, Button, Popover, Flex, Input, QRCode, Space } from 'antd';
import qrCode from 'antd/es/qr-code';
import { Share2 } from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';
interface LiveFooterProps {
  deviceInfo: DeviceInfo;
}
export default function LiveFooter(props: LiveFooterProps) {
  const rtc = useContext(Context);
  const { startCamera, stopCamera, videoRef, isLive, setIsLive } = useCamera();
  const { startScreenShare, stopScreenShare, isScreenSharing } =
    useScreenShare();
  const { stopLive, startLive } = useLiveControl();
  const { localDevices } = useStream();
  const [audioIn, setAudioIn] = useState([]);
  const [videoIn, setVideoIn] = useState([]);

  const handleLive = () => {
    isLive
      ? stopLive(isLive, stopCamera, setIsLive)
      : startLive(isLive, startCamera, setIsLive);
  };
  const handleScreenShare = () => {
    return isScreenSharing
      ? stopScreenShare(videoRef!)
      : startScreenShare(videoRef);
  };
  const handleCamera = () => {
    if (rtc?.videoState) {
      rtc?.deviceSwitch(false, 'video');
    } else {
      rtc?.deviceSwitch(true, 'video');
    }
  };
  const handleMicrophone = () => {
    if (rtc?.audioState) {
      rtc?.deviceSwitch(false, 'audio');
    } else {
      rtc?.deviceSwitch(true, 'audio');
    }
  };
  // 切换设备
  const audioChange = (deviceId: string) => {};
  const videoChange = (deviceId: string) => {};
  // useEffect(() => {

  // }, [props]);

  return (
    <div className="options  flex justify-between ">
      <div>
        <Select
          value={props.deviceInfo.audioIn.label}
          className="w-100 h-35 mr-5"
          options={getSelectOptions(localDevices.audioIn)}
        />
        <Button onClick={handleMicrophone}>开麦</Button>
      </div>

      <div>
        <Select
          value={props.deviceInfo.videoIn.label}
          className="w-100 h-35 mr-5"
          options={getSelectOptions(localDevices.videoIn)}
        />
        <Button onClick={handleCamera}>开摄像头</Button>
      </div>
      <Select
        className="w-100 h-40"
        options={getSelectOptions(localDevices.audioOut)}
      />

      <div
        className="cover flex items-center mr-20 cursor-pointer"
        onClick={handleScreenShare}
      >
        <Button className="ml-3 text-13">
          {isScreenSharing ? '停止共享' : '共享屏幕'}
        </Button>
      </div>
      {/* <Popover content={qrCode} trigger="click">
            <div className="share flex items-center mr-20 cursor-pointer">
              <Share2 className="w-15 h-15  mr-2" />
              <span className="ml-3 text-13">分享</span>
            </div>
          </Popover> */}
      <div className="go-in flex items-center">
        <Flex gap="small" wrap>
          <Button className="text-13" onClick={handleLive}>
            {isLive ? '结束直播' : '开始直播'}
          </Button>
        </Flex>
      </div>
    </div>
  );
}
