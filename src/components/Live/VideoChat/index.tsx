import { useState } from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import ChatInput from '../ChatInput';
import ChatChanel from '../ChatChanel';

const onChange = (key: string) => {
  console.log(key);
};

export default function VideoChat() {
  const [inputHeight, setInputHeight] = useState(85);

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: '边看边聊',
      children: (
        <div className="flex flex-col" style={{ height: '560px' }}>
          <ChatChanel inputHeight={inputHeight} />
          <ChatInput onHeightChange={setInputHeight} />
        </div>
      ),
    },
    {
      key: '2',
      label: '互动',
      children: 'Content of Tab Pane 2',
    },
  ];

  return (
    <div className="w-300 h-650 bg-white px-15 pt-7">
      <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
    </div>
  );
}
