import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Layout, Button } from 'antd';
import ReactMarkdown from 'react-markdown';
import { DownOutlined } from '@ant-design/icons';
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
}

const ChatConversationPage: React.FC<DialogueProps> = ({
  chatHistory: messages,
  msgLoading,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 监听滚动事件，判断是否显示回到底部按钮
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // 当距离底部超过100px时显示按钮
      if (scrollHeight - scrollTop - clientHeight > 200) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
      <div
        className="message-box"
        style={{
          justifyContent: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <div className="message-bubble">
          <div
            className="message-text"
            style={{
              background: isUser ? '#448ef7' : '#fff',
              color: isUser ? '#fff' : '#333',
              borderRadius: isUser ? '18px 18px 4px 18px' : '',
              padding: isUser ? '12px 16px' : '10px 0',
            }}
          >
            {message.content.split('\n').map((line, index) => (
              <div key={index}>
                <ReactMarkdown>{line}</ReactMarkdown>
                {index < message.content.split('\n').length - 1 && <br />}
              </div>
            ))}
          </div>

          <div
            className="message-timestamp"
            style={{
              textAlign: isUser ? 'right' : 'left',
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
  };

  return (
    <Layout className="dialogue-box">
      <Content className="dialogue-content">
        {/* 消息列表区域 */}
        <div className="dialogue-messages" ref={messagesContainerRef}>
          <div className="messages-container">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
            {msgLoading && (
              <div
                className="message-box"
                style={{
                  justifyContent: 'flex-start',
                }}
              >
                <div className="message-bubble">
                  <div
                    className="message-text loading-dots"
                    style={{
                      background: '#fff',
                      color: '#333',
                      borderRadius: '',
                      padding: '10px 0',
                    }}
                  >
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 回到底部按钮 */}
          {showScrollButton && (
            <Button
              className="scroll-to-bottom-btn"
              type="primary"
              shape="circle"
              icon={<DownOutlined />}
              onClick={scrollToBottom}
              size="large"
            />
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default ChatConversationPage;
