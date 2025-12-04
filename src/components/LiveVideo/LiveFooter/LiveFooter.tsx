import { useCamera, useScreenShare, useLiveControl } from '@/hooks/liveVideo';
import { useStream } from '@/hooks/liveVideo/useStream';
import {
  Context,
  type currentDeviceInfo,
  type DeviceInfo,
} from '@/pages/livevideo';
import { getSelectOptions } from '@/utils/getSelectOptions';
import { Select, Button, Flex, Dropdown, message } from 'antd';
import { useContext, useEffect, useState } from 'react';
interface LiveFooterProps {
  deviceInfo: currentDeviceInfo;
  updateDeviceInfo: (value: currentDeviceInfo) => void;
  handleCanSpeaking: (value: boolean) => void;
}
export default function LiveFooter(props: LiveFooterProps) {
  const { updateDeviceInfo, handleCanSpeaking } = props;
  const rtc = useContext(Context);
  const { startCamera, stopCamera, videoRef, isLive, setIsLive } = useCamera();

  const { stopLive, startLive } = useLiveControl();
  const { localDevices } = useStream();
  // 设备选择状态
  const [selectedDevices, setSelectedDevices] = useState({
    audioIn: {} as DeviceInfo,
    videoIn: {} as DeviceInfo,
    audioOut: {} as DeviceInfo,
  });

  // 初始化设备选择
  useEffect(() => {
    console.log(localDevices, 'localDevices');
    console.log(props.deviceInfo, '初始化设备选择');
    console.log(getSelectOptions(localDevices.audioIn));

    if (props.deviceInfo.audioIn?.deviceId) {
      setSelectedDevices((prev) => ({
        ...prev,
        audioIn: props.deviceInfo.audioIn || '',
      }));
    }
    if (props.deviceInfo.videoIn?.deviceId) {
      setSelectedDevices((prev) => ({
        ...prev,
        videoIn: props.deviceInfo.videoIn || '',
      }));
    }
  }, [props.deviceInfo]);

  const handleLive = () => {
    isLive
      ? stopLive(isLive, stopCamera, setIsLive)
      : startLive(isLive, startCamera, setIsLive);
  };
  const handleScreenShare = (options?: {
    preferCurrentTab?: boolean;
    preferDisplaySurface?: 'monitor' | 'window' | 'browser';
  }) => {
    return rtc?.isScreenSharing
      ? rtc?.stopScreenShare(videoRef as React.RefObject<HTMLVideoElement>)
      : rtc?.startScreenShare(options);
  };

  // 屏幕共享选项菜单
  const screenShareMenuItems = [
    {
      key: 'monitor',
      label: '共享整个屏幕',
      onClick: () => handleScreenShare({ preferDisplaySurface: 'monitor' }),
    },
    {
      key: 'window',
      label: '共享应用程序窗口',
      onClick: () => handleScreenShare({ preferDisplaySurface: 'window' }),
    },
    {
      key: 'browser',
      label: '共享浏览器标签页',
      onClick: () => handleScreenShare({ preferDisplaySurface: 'browser' }),
    },
  ];
  const handleCamera = () => {
    if (rtc?.videoState) {
      rtc?.deviceSwitch(false, 'video');
    } else {
      rtc?.deviceSwitch(true, 'video');
    }
  };
  const handleMicrophone = () => {
    if (rtc?.audioState) {
      handleCanSpeaking(false);
      rtc?.deviceSwitch(false, 'audio');
    } else {
      handleCanSpeaking(true);
      rtc?.deviceSwitch(true, 'audio');
    }
  };
  // 切换设备
  // 音频输入设备切换
  const handleAudioInputChange = async (deviceId: string) => {
    try {
      setSelectedDevices((prev) => ({ ...prev, audioIn: deviceId }));

      if (rtc && deviceId) {
        await rtc.switchAudioInput(deviceId);
        message.success('音频输入设备已切换');
      }
    } catch (error) {
      console.error('切换音频输入设备失败:', error);
      message.error('切换音频输入设备失败');
    }
  };
  // 视频输入设备切换
  const handleVideoInputChange = async (deviceId: string) => {
    try {
      setSelectedDevices((prev) => ({ ...prev, videoIn: deviceId }));

      if (rtc && deviceId) {
        await rtc.switchVideoInput(deviceId);
        message.success('视频输入设备已切换');
      }
    } catch (error) {
      console.error('切换视频输入设备失败:', error);
      message.error('切换视频输入设备失败');
    }
  };

  // 音频输出设备切换
  const handleAudioOutputChange = async (deviceId: string) => {
    try {
      setSelectedDevices((prev) => ({ ...prev, audioOut: deviceId }));

      if (videoRef.current && deviceId) {
        if ('setSinkId' in videoRef.current) {
          await (videoRef.current as any).setSinkId(deviceId);
          message.success('音频输出设备已切换');
        } else {
          message.warning('当前浏览器不支持音频输出设备切换');
        }
      }
    } catch (error) {
      console.error('切换音频输出设备失败:', error);
      message.error('切换音频输出设备失败');
    }
  };
  return (
    <div className="options flex justify-between">
      {/* 音频输入设备选择 */}
      <div>
        <Select
          defaultValue="default"
          value={selectedDevices.audioIn.id}
          className="w-100 h-35 mr-5"
          options={localDevices.audioIn}
          onChange={handleAudioInputChange}
          placeholder="选择麦克风"
        />
        <Button onClick={handleMicrophone}>
          {rtc?.audioState ? '关闭麦克风' : '开启麦克风'}
        </Button>
      </div>

      {/* 视频输入设备选择 */}
      <div>
        <Select
          value={selectedDevices.videoIn.id}
          className="w-100 h-35 mr-5"
          options={localDevices.videoIn}
          onChange={handleVideoInputChange}
          placeholder="选择摄像头"
        />
        <Button onClick={handleCamera}>
          {rtc?.videoState ? '关闭摄像头' : '开启摄像头'}
        </Button>
      </div>

      {/* 音频输出设备选择和屏幕共享 */}
      <div className="cover flex items-center mr-20 cursor-pointer">
        <Select
          defaultValue="default"
          value={selectedDevices.audioOut.id}
          className="w-100 h-40"
          options={localDevices.audioOut}
          onChange={handleAudioOutputChange}
          placeholder="选择扬声器"
        />
        {rtc?.isScreenSharing ? (
          <Button className="ml-3 text-13" onClick={() => handleScreenShare()}>
            停止共享
          </Button>
        ) : (
          <Dropdown menu={{ items: screenShareMenuItems }} trigger={['click']}>
            <Button className="ml-3 text-13">共享屏幕 ▼</Button>
          </Dropdown>
        )}
      </div>

      {/* 直播控制 */}
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
