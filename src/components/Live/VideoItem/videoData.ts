import videoUrl from '@/assets/video/play.mp4';

// 统一视频数据结构
export interface VideoData {
  id: number;
  coverUrl: string;
  title: string;
  views: string;
  liveUrl: string;
  videoUrl: string;
}

// 模拟视频数据
export const allVideoData: VideoData[] = [
  {
    id: 1,
    coverUrl:
      'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    title: 'AI编程社 共学计划Vol.6',
    views: '1234',
    liveUrl: 'https://ant.design/',
    videoUrl: videoUrl,
  },
  {
    id: 2,
    coverUrl:
      'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    title: 'AI编程社 共学计划Vol.5',
    views: '5678',
    liveUrl: 'https://ant.design/',
    videoUrl: videoUrl,
  },
  {
    id: 3,
    coverUrl:
      'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    title: 'AI编程社 共学计划Vol.4',
    views: '9012',
    liveUrl: 'https://ant.design/',
    videoUrl: videoUrl,
  },
  {
    id: 4,
    coverUrl:
      'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    title: 'AI编程社 共学计划Vol.3',
    views: '3456',
    liveUrl: 'https://ant.design/',
    videoUrl: videoUrl,
  },
];
