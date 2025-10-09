import { createContext, useEffect, useRef, useState } from 'react';
import LiveFooter from '@/components/LiveVideo/LiveFooter/LiveFooter';
import { Layout } from 'antd';
import { Content, Footer } from 'antd/es/layout/layout';
import Sider from 'antd/es/layout/Sider';
import LiveShow from '@/components/LiveVideo/LiveShow';
import { Rtc } from '@/utils/webrtc/rtc';
import { useStream } from '@/hooks/liveVideo/useStream';
import DualVideoShow from '@/components/LiveVideo/DualVideoShow';
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
  id?: string; //deviceId
  kind?: 'audio' | 'video';
  label?: string;
  deviceId?: string; //deviceId
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
  const [canSpeaking, setCanSpeaking] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  // 本地流
  // const [stream, setStream] = useState<MediaStream | null>(null);
  const { getCurrentDeviceInfo } = useStream();

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
    if (res) {
      res.videoIn.enabled = deviceInfo.videoDisabled;
      res.audioIn.enabled = deviceInfo.audioDisabled;
    }

    setDeviceInfo(res as currentDeviceInfo);
  };
  useEffect(() => {
    getcurrentDevices();
  }, []);
  useEffect(() => {
    if (!rtc.current) return;
    const handleScreenSharingChange = (value: boolean) => {
      setIsScreenSharing(value);
    };

    rtc.current.on('screenSharingChange', handleScreenSharingChange);

    return () => {
      rtc.current?.off('screenSharingChange', handleScreenSharingChange);
    };
  }, []);

  // livevideo.tsx（示例）
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [level, setLevel] = useState(0);

  useEffect(() => {
    const inst = rtc.current;
    if (!inst) return;
    if (!canSpeaking) return;
    // 监测麦克风（或传入屏幕共享流 inst.getScreenStream()
    try {
      inst.on('microphoneStarted', () => {
        inst.startAudioLevelMonitor(
          undefined,
          (lv, speaking) => {
            setLevel(lv);
            setIsSpeaking(speaking);
          },
          { threshold: 0.02, holdMs: 250, smoothing: 0.8 },
        );
      });
    } catch (e) {
      console.error(e);
    }
    return () => inst.stopAudioLevelMonitor();
  }, [rtc, canSpeaking]);
  return (
    <Context.Provider value={rtc.current}>
      <Layout style={layoutStyle}>
        <Sider width="20%" style={siderStyle}></Sider>
        <Layout>
          <Content style={contentStyle}>
            {/* 根据屏幕共享状态选择显示组件 */}
            {isScreenSharing ? <DualVideoShow /> : <LiveShow />}
          </Content>
          <Footer style={footerStyle}>
            <div>
              {isSpeaking ? '正在说话' : '静音/无声'}
              <div style={{ width: 100, height: 6, background: '#eee' }}>
                <div
                  style={{
                    width: `${Math.min(level * 100, 100)}%`,
                    height: 6,
                    background: '#67c23a',
                  }}
                />
              </div>
            </div>
            <LiveFooter
              deviceInfo={deviceInfo}
              updateDeviceInfo={(value) =>
                setDeviceInfo((deviceInfo) => ({ ...deviceInfo, ...value }))
              }
              handleCanSpeaking={(value: boolean) => setCanSpeaking(value)}
            />
          </Footer>
        </Layout>
      </Layout>
    </Context.Provider>
  );
}
