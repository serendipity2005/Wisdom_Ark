import React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Layout, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { FixedMarkdownRenderer } from './FixedMDRenderer';
import './index.scss';

const { Content } = Layout;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DialogueProps {
  chatHistory: Message[];
  msgLoading: boolean;
  currentMessage: string;
}

/**
 * 单条消息组件，避免整个列表反复渲染
 */
const ChatMessage: React.FC<{
  message: Message;
  isLast: boolean;
  msgLoading: boolean;
}> = React.memo(({ message, isLast, msgLoading }) => {
  return (
    <div
      className="message-box"
      style={{
        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
      }}
    >
      <div className="message-bubble">
        <div
          className="message-text"
          style={{
            overflow: 'hidden',
            background: message.role === 'user' ? '#448ef7' : '#fff',
            color: message.role === 'user' ? '#fff' : '#34495e',
            borderRadius: message.role === 'user' ? '18px 18px 4px 18px' : '',
            padding: message.role === 'user' ? '12px 16px' : '10px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <FixedMarkdownRenderer rawText={message.content} />
            {msgLoading && isLast && message.role === 'assistant' && (
              <span className="cursor">|</span>
            )}
          </div>
        </div>

        <div
          className="message-timestamp"
          style={{
            textAlign: message.role === 'user' ? 'right' : 'left',
          }}
        >
          {message.timestamp.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

const ChatConversationPage: React.FC<DialogueProps> = ({
  chatHistory: messages,
  msgLoading,
  currentMessage,
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const scrollToBottom = useCallback((smooth = false) => {
    const container = messagesContainerRef.current;
    if (container) {
      if (smooth) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, []);

  // 初始进入页面时滚动到底部
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [scrollToBottom]);

  // 滚动事件监听，控制「回到底部按钮」
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight > 200) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 只有新增消息时才自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  return (
    <Layout className="dialogue-box">
      <Content className="dialogue-content">
        <div className="dialogue-messages" ref={messagesContainerRef}>
          <div className="messages-container">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={
                  index === messages.length - 1 && message.role === 'assistant'
                    ? { ...message, content: message.content + currentMessage }
                    : message
                }
                isLast={index === messages.length - 1}
                msgLoading={msgLoading}
              />
            ))}
          </div>

          <Button
            className="scroll-to-bottom-btn"
            style={{ visibility: visible ? 'visible' : 'hidden' }}
            type="primary"
            shape="circle"
            icon={<DownOutlined />}
            onClick={() => scrollToBottom(true)}
            size="large"
          />
        </div>
      </Content>
    </Layout>
  );
};
export default ChatConversationPage;
