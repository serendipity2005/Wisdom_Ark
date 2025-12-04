import './index.scss';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
const items: TabsProps['items'] = [
  {
    key: '1',
    label: '直播介绍',
    children: (
      <div className="">
        欢迎大家来参加本次AI编程共修社直播，我们将会在直描间为大家带来精彩分享。
        分享主题：今晚聊Trae：Tare赋能开源打造高效、优质的开源项目新范式
        Al编程社共学Vo.1
      </div>
    ),
  },
];
export default function VideoInto() {
  return (
    <>
      <div className="w-1200 h-600 bg-white mt-30 p-20">
        <Tabs defaultActiveKey="1" items={items} />
      </div>
    </>
  );
}
