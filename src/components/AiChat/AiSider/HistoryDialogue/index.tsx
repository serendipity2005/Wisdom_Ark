import { Dropdown, Typography } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import './index.scss';

const { Text } = Typography;

interface ChatHistory {
  id: string;
  title: string;
  preview: string;
}

const handleMenuClick = (e: any) => {
  if (e.key == '1') {
    console.log('修改');
  } else if (e.key == '2') {
    console.log('删除');
  }
};

function HistoryDialogue() {
  const [chatHistory] = useState<ChatHistory[]>([
    {
      id: '1',
      title: '关于历史对话的讨论',
      preview: '探讨了历史事件的影响和意义',
    },
    { id: '2', title: '关于历史对话的询问', preview: '询问了具体的历史问题' },
    { id: '3', title: '关于历史对话的探讨', preview: '深入分析了历史发展脉络' },
    { id: '4', title: '图片处理', preview: '处理和分析图片内容' },
  ]);

  const historyFuncMenu = [
    { key: '1', label: '修改', icon: <EditOutlined /> },
    { key: '2', label: '删除', icon: <DeleteOutlined /> },
  ];

  return (
    <div className="chat-container">
      <Text type="secondary" className="history-title">
        历史对话
      </Text>
      <div className="history-items">
        {chatHistory.map((chat) => (
          <div
            key={chat.id}
            className="history-item"
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#f0f0f0')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'transparent')
            }
          >
            <div className="history-item-content">
              <MessageOutlined className="history-item-icon" />
              <Text className="history-item-title">{chat.title}</Text>
              <Dropdown
                menu={{ items: historyFuncMenu, onClick: handleMenuClick }}
                trigger={['click']}
              >
                <EllipsisOutlined />
              </Dropdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HistoryDialogue;
