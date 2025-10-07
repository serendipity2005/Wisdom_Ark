// 关于流的操作

import { message } from 'antd';
import { useCallback, useEffect, useState } from 'react';

export function useStream() {
  // 响应式设备列表
  const [localDevices, setLocalDevices] = useState({
    audioIn: [] as any,
    videoIn: [] as any,
    audioOut: [] as any,
  });
  // 当前选中的设备
  const [selectedDevices, setSelectedDevices] = useState({
    audioIn: '',
    videoIn: '',
    audioOut: '',
  });
  // 媒体流状态
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  //获取设备列表
  const getLocalDeviceList = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return message.error('浏览器不支持获取媒体设备');
    }
    const contraints = {
      video: true,
      audio: true,
    };
    await navigator.mediaDevices.getUserMedia(contraints).then((stream) => {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    });

    // 获取设备列表
    const devices = await navigator.mediaDevices.enumerateDevices();
    // 创建新的设备列表对象
    const newDeviceList = {
      audioIn: [] as any[],
      videoIn: [] as any[],
      audioOut: [] as any[],
    };
    devices.forEach((device) => {
      const obj = {
        value: device.deviceId,
        kind: device.kind,
        label: device.label,
        id: device.deviceId,
      };
      if (device.kind === 'audioinput') {
        if (
          newDeviceList.audioIn.filter((e) => e.id === device.deviceId)
            .length === 0
        ) {
          newDeviceList.audioIn.push(obj);
        }
      } else if (device.kind === 'audiooutput') {
        if (
          newDeviceList.audioOut.filter((e) => e.id === device.deviceId)
            .length === 0
        ) {
          newDeviceList.audioOut.push(obj);
        }
      } else if (device.kind === 'videoinput') {
        if (
          newDeviceList.videoIn.filter((e) => e.id === device.deviceId)
            .length === 0
        ) {
          newDeviceList.videoIn.push(obj);
        }
      }
    });

    setLocalDevices(newDeviceList);
  }, []);
  useEffect(() => {
    getLocalDeviceList();

    const handleDeviceChange = () => {
      console.log('设备变化，重新获取设备列表');
      getLocalDeviceList();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        handleDeviceChange,
      );
    };
  }, [getLocalDeviceList]);

  //   创建媒体流
  const createStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setStream(stream);
  }, []);

  // 获取当前正在用的设备信息
  const getCurrentDeviceInfo = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    if (!stream) return null;

    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];

    const currentDevices = {
      audioIn: null as any, //音频输入 如麦克风
      videoIn: null as any, //视频输入 如摄像头
    };

    if (audioTrack) {
      const audioSettings = audioTrack.getSettings();
      currentDevices.audioIn = {
        deviceId: audioSettings.deviceId,
        groupId: audioSettings.groupId,
        label: audioTrack.label,
        kind: 'audioinput',
        settings: audioSettings,
      };
    }

    if (videoTrack) {
      const videoSettings = videoTrack.getSettings();
      currentDevices.videoIn = {
        deviceId: videoSettings.deviceId,
        groupId: videoSettings.groupId,
        label: videoTrack.label,
        kind: 'videoinput',
        settings: videoSettings,
      };
    }

    return currentDevices;
  }, [stream]);
  return {
    localDevices,
    getLocalDeviceList,
    stream,
    setStream,
    getCurrentDeviceInfo,
  };
}
