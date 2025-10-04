import MyHeader from '@/layouts/frontLayout/Header';
import { createContext, useEffect, useRef, useState } from 'react';
import VideoShow from '@/components/Live/VideoShow';
import VideoItem from '@/components/Live/VideoItem';
import { allVideoData } from '@/components/Live/VideoItem/videoData';
import LivePull from '@/components/LiveVideo/LiveShow';
import LiveFooter from '@/components/LiveVideo/LiveFooter/LiveFooter';
import { Layout } from 'antd';
import { Header, Content, Footer } from 'antd/es/layout/layout';
import Sider from 'antd/es/layout/Sider';
import LiveShow from '@/components/LiveVideo/LiveShow';
import { Rtc } from '@/utils/webrtc/rtc';
import { getSelectOptions } from '@/utils/getSelectOptions';
import { useStream } from '@/hooks/liveVideo/useStream';
const contentStyle: React.CSSProperties = {
  textAlign: 'center',
  height: '95%',
  lineHeight: '120px',
  color: '#fff',
  backgroundColor: 'black',
};

const siderStyle: React.CSSProperties = {
  textAlign: 'center',
  lineHeight: '120px',
  color: '#fff',
  backgroundColor: '#2b2b2b',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#fff',
  backgroundColor: '#2b2b2b',
};

const layoutStyle = {
  borderRadius: 8,
  overflow: 'hidden',
  width: 'calc(100% - 8px)',
  height: '100vh',
  maxWidth: 'calc(100% - 8px)',
};
// --------------------------------------------------
export interface currentDeviceInfo {
  audioIn: DeviceInfo;
  videoIn: DeviceInfo;
  audioDisabled: boolean;
  videoDisabled: boolean;
  dispalyEnabled: boolean;
}
export interface DeviceInfo {
  enabled?: true;
  id?: string;
  kind?: 'audio' | 'video';
  label?: string;
}

export const Context = createContext<Rtc | null>(null);
export default function Live() {
  // 当前设备信息
  const [deviceInfo, setDeviceInfo] = useState<currentDeviceInfo>({
    audioIn: { label: '' },
    videoIn: { label: '' },
    audioDisabled: false,
    videoDisabled: false,
    dispalyEnabled: false,
  });
  // 本地流
  // const [stream, setStream] = useState<MediaStream | null>(null);
  const { getCurrentDeviceInfo, stream } = useStream();

  const rtc = useRef<Rtc>(null);
  if (!rtc.current) {
    rtc.current = new Rtc({
      constraints: {
        audio: true,
        video: true,
      },
    });
  }

  // 获取当前默认使用设备
  const getcurrentDevices = async () => {
    // const res = await rtc.current!.getDevicesInfoList();
    const res = await getCurrentDeviceInfo();
    console.log('当前设备', res);
    if (res) {
      res.videoIn.enabled = deviceInfo.videoDisabled;
      res.audioIn.enabled = deviceInfo.audioDisabled;
    }

    setDeviceInfo(res as currentDeviceInfo);
  };
  useEffect(() => {
    getcurrentDevices();
  }, []);

  return (
    <Context.Provider value={rtc.current}>
      <Layout style={layoutStyle}>
        <Sider width="20%" style={siderStyle}></Sider>
        <Layout>
          <Content style={contentStyle}>
            <LiveShow></LiveShow>
          </Content>
          <Footer style={footerStyle}>
            <LiveFooter deviceInfo={deviceInfo}></LiveFooter>
          </Footer>
        </Layout>
      </Layout>
    </Context.Provider>
  );
}
