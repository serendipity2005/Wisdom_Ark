import type { ReactNode } from 'react';
import React, { createContext, useContext, useState } from 'react';

interface LiveContextType {
  // 设备信息
  localDevices: {
    audioIn: any[];
    videoIn: any[];
    audioOut: any[];
  };
  setLocalDevices: (devices: any) => void;

  // 直播状态
  isLive: boolean;
  setIsLive: (live: boolean) => void;

  // 选中的设备
  selectedDevices: {
    audioIn: string;
    videoIn: string;
    audioOut: string;
  };
  setSelectedDevices: (devices: any) => void;

  // 媒体流
  stream: MediaStream | null;
  setStream: (stream: MediaStream | null) => void;
}

const LiveContext = createContext<LiveContextType | undefined>(undefined);

interface LiveProviderProps {
  children: ReactNode;
}

export const LiveProvider: React.FC<LiveProviderProps> = ({ children }) => {
  const [localDevices, setLocalDevices] = useState({
    audioIn: [],
    videoIn: [],
    audioOut: [],
  });

  const [isLive, setIsLive] = useState(false);

  const [selectedDevices, setSelectedDevices] = useState({
    audioIn: '',
    videoIn: '',
    audioOut: '',
  });

  const [stream, setStream] = useState<MediaStream | null>(null);

  const value = {
    localDevices,
    setLocalDevices,
    isLive,
    setIsLive,
    selectedDevices,
    setSelectedDevices,
    stream,
    setStream,
  };

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
};

// 自定义 Hook
export const useLiveContext = () => {
  const context = useContext(LiveContext);
  if (context === undefined) {
    throw new Error('useLiveContext must be used within a LiveProvider');
  }
  return context;
};
