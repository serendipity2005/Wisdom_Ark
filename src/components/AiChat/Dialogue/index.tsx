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
 * 单条消息组件
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
  chatHistory,
  msgLoading,
  currentMessage,
}) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // 合并当前流式消息到历史记录
  //   const displayMessages = React.useMemo(() => {
  //     if (!currentMessage || chatHistory.length === 0) {
  //       return chatHistory;
  //     }

  //     const lastMessage = chatHistory[chatHistory.length - 1];

  //     // 只有当最后一条消息是 assistant 且正在加载时才合并
  //     if (lastMessage.role === 'assistant' && msgLoading) {
  //       return [
  //         ...chatHistory.slice(0, -1),
  //         {
  //           ...lastMessage,
  //           content: lastMessage.content + currentMessage,
  //         },
  //       ];
  //     }

  //     return chatHistory;
  //   }, [chatHistory, currentMessage, msgLoading]);

  // displayMessages 逻辑简化
  const displayMessages = chatHistory; // 直接使用

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

  // 滚动事件监听
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

  // 消息更新时自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [displayMessages.length, scrollToBottom]);

  // 流式消息更新时也要滚动(但使用节流避免过于频繁)
  const lastScrollTimeRef = useRef(0);
  useEffect(() => {
    if (currentMessage && msgLoading) {
      const now = Date.now();
      if (now - lastScrollTimeRef.current > 100) {
        scrollToBottom();
        lastScrollTimeRef.current = now;
      }
    }
  }, [currentMessage, msgLoading, scrollToBottom]);

  return (
    <Layout className="dialogue-box">
      <Content className="dialogue-content">
        <div className="dialogue-messages" ref={messagesContainerRef}>
          <div className="messages-container">
            {displayMessages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLast={index === displayMessages.length - 1}
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
