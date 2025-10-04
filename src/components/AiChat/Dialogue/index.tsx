import type React from 'react';
import { useState, useRef, useEffect } from 'react';
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
}

const ChatConversationPage: React.FC<DialogueProps> = ({
  chatHistory: messages,
  msgLoading,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const scrollToBottom = (smooth = false) => {
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
  };

  // 初始滚动
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom(false); // 初始滚动不带动画
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // 监听滚动事件，判断是否显示回到底部按钮
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // 当距离底部超过200px时显示按钮
      if (scrollHeight - scrollTop - clientHeight > 200) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  //   const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  //     const isUser = message.role === 'user';

  //     return (
  //       <div
  //         className="message-box"
  //         style={{
  //           justifyContent: isUser ? 'flex-end' : 'flex-start',
  //         }}
  //       >
  //         <div className="message-bubble">
  //           <div
  //             className="message-text"
  //             style={{
  //               background: isUser ? '#448ef7' : '#fff',
  //               color: isUser ? '#fff' : '#34495e',
  //               borderRadius: isUser ? '18px 18px 4px 18px' : '',
  //               padding: isUser ? '12px 16px' : '10px 0',
  //             }}
  //           >
  //             <div>
  //               <FixedMarkdownRenderer
  //                 rawText={message.content}
  //               ></FixedMarkdownRenderer>
  //             </div>
  //           </div>

  //           <div
  //             className="message-timestamp"
  //             style={{
  //               textAlign: isUser ? 'right' : 'left',
  //             }}
  //           >
  //             {message.timestamp.toLocaleTimeString('zh-CN', {
  //               hour: '2-digit',
  //               minute: '2-digit',
  //             })}
  //           </div>
  //         </div>
  //       </div>
  //     );
  //   };

  //   底部按钮显示与隐藏
  return (
    <Layout className="dialogue-box">
      <Content className="dialogue-content">
        {/* 消息列表区域 */}
        <div className="dialogue-messages" ref={messagesContainerRef}>
          <div className="messages-container">
            {messages.map((message) => (
              //   <MessageBubble key={message.id} message={message} />
              <div
                className="message-box"
                key={message.id}
                style={{
                  justifyContent:
                    message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div className="message-bubble">
                  <div
                    className="message-text"
                    style={{
                      background: message.role === 'user' ? '#448ef7' : '#fff',
                      color: message.role === 'user' ? '#fff' : '#34495e',
                      borderRadius:
                        message.role === 'user' ? '18px 18px 4px 18px' : '',
                      padding: message.role === 'user' ? '12px 16px' : '10px 0',
                    }}
                  >
                    <div>
                      <FixedMarkdownRenderer
                        rawText={message.content}
                      ></FixedMarkdownRenderer>
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
