export interface Danmaku {
  id: string;
  content: string;
  sender: string;
  color: string; // 弹幕颜色
  type: 'scroll' | 'top' | 'bottom'; // 弹幕类型
  time: number; // 关联视频时间（回放用）
}

export interface DanmakuControl {
  opacity: number; // 不透明度 0-1
  area: number; // 显示区域 0-1（0=无，1=全屏）
  speed: number; // 滚动速度 0.5-2（1=正常）
  size: number; // 字体大小 12-36
  visible: boolean; // 是否显示弹幕
}
