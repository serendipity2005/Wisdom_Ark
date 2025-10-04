// 转换为 Select 组件需要的格式
export const getSelectOptions = (devices: MediaDeviceInfo[]) => {
  console.log('getSelectOptions', devices);

  return devices.map((device) => ({
    label: device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`,
    value: device.deviceId,
  }));
};
