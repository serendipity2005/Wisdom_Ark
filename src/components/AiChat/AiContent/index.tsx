import { useRef, useState } from 'react';
import FuncButton from '../FuncButton';
import InputArea from '../InputArea';
import Prompt from '../Prompt';
import Dialogue from '../Dialogue';
import { chatWithGPT } from '@/utils/openAi';
import './index.scss';
import {
  BookOutlined,
  EditOutlined,
  ExperimentOutlined,
  PictureOutlined,
  SearchOutlined,
} from '@ant-design/icons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiContentProps {
  timePeriod: string;
  userName: string;
}

export default function AiContent({ timePeriod, userName }: AiContentProps) {
  const [aiType, setAiType] = useState<React.ReactNode>(null);
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(true);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  // AI扩展功能
  const quickActions = [
    {
      key: '1',
      icon: <PictureOutlined style={{ color: '#ff7a45' }} />,
      label: '图像生成',
      //   color: "#ff7a45",
    },
    {
      key: '2',
      icon: <EditOutlined style={{ color: '#1890ff' }} />,
      label: '帮我写作',
    },
    {
      key: '3',
      icon: <SearchOutlined style={{ color: '#722ed1' }} />,
      label: 'AI 搜索',
    },
    {
      key: '4',
      icon: <BookOutlined style={{ color: '#eb2f96' }} />,
      label: 'AI 阅读',
    },
    {
      key: '5',
      icon: <ExperimentOutlined style={{ color: '#13c2c2' }} />,
      label: '学术搜索',
    },
    // { icon: <MoreOutlined />, label: "更多", color: "#8c8c8c" },
  ];

  // 点击选择功能
  const handleMenuClick = (e: any) => {
    let selectedSkill = undefined;
    if (e.key == undefined) {
      selectedSkill = quickActions.find(
        (item) => item.key === e.currentTarget.value,
      )?.label;
    } else {
      selectedSkill = quickActions.find((item) => item.key === e.key)?.label;
    }

    setAiType(selectedSkill);
  };

  // 在 handleMenuClick 函数后添加新对话
  const [msgLoading, setMsgLoading] = useState(false);
  const currentResponseRef = useRef('');
  const [currentMessage, setCurrentMessage] = useState('');

  //   const handleSendMessage = async (message: string) => {
  //     if (!message.trim()) return;
  //     setMsgLoading(true);

  //     // 添加用户消息
  //     const newUserMessage = {
  //       id: Date.now().toString(),
  //       role: 'user' as const,
  //       content: message,
  //       timestamp: new Date(),
  //     };

  //     setChatHistory((prev) => [...prev, newUserMessage]);
  //     setHasSentFirstMessage(true);

  //     // 添加一个占位的AI消息
  //     const aiMessageIndex = chatHistory.length + 1;
  //     currentResponseRef.current = '';
  //     setChatHistory((prev) => [
  //       ...prev,
  //       {
  //         id: (Date.now() + 1).toString(),
  //         role: 'assistant',
  //         content: '',
  //         timestamp: new Date(),
  //       },
  //     ]);

  //     try {
  //       await chatWithGPT(
  //         [...chatHistory, newUserMessage],
  //         // onChunk: 处理每个数据块
  //         (chunk: string) => {
  //           //   setMsgLoading(false);
  //           currentResponseRef.current += chunk;
  //           setCurrentMessage(currentResponseRef.current);

  //           // 更新消息列表中的AI回复
  //           setChatHistory((prev) => {
  //             const updated = [...prev];
  //             updated[aiMessageIndex].content = currentResponseRef.current;
  //             return updated;
  //           });
  //         },
  //         // onComplete: 完成时的处理
  //         (fullResponse: string) => {
  //           setMsgLoading(false);
  //           setCurrentMessage(''); // 清空当前消息状态
  //           setChatHistory((prev) => {
  //             const updated = [...prev];
  //             updated[aiMessageIndex].content = fullResponse;
  //             return updated;
  //           });
  //         },
  //         // onError: 错误处理
  //         (error: any) => {
  //           setMsgLoading(false);
  //           setCurrentMessage(''); // 清空当前消息状态
  //           console.error('Stream error:', error);
  //           setChatHistory((prev) => {
  //             const updated = [...prev];
  //             updated[aiMessageIndex].content = '发生错误，请重试';
  //             return updated;
  //           });
  //         },
  //       );
  //     } catch (error) {
  //       setMsgLoading(false);
  //       console.error('Chat error:', error);
  //     }
  //   };

  const handleSendMessage = async (userMessage: string) => {
    // 添加用户消息
    const newUserMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user' as const,
      content: userMessage,
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, newUserMessage]);

    // 添加空的助手消息
    const assistantMessageId = `msg_${Date.now()}_assistant`;
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant' as const,
      content: '',
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, assistantMessage]);
    setMsgLoading(true);

    try {
      await chatWithGPT(
        [...chatHistory, newUserMessage],
        // onChunk - 直接更新 history
        (chunk: string) => {
          setChatHistory((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg,
            ),
          );
        },
        // onComplete
        () => {
          setMsgLoading(false);
        },
        (error) => {
          console.error(error);
          setMsgLoading(false);
        },
      );
    } catch (error) {
      console.error(error);
      setMsgLoading(false);
    }
  };

  return (
    <div
      className="main-content"
      style={{
        justifyContent: hasSentFirstMessage ? 'flex-end' : 'center',
      }}
    >
      {/* 提示语 */}
      {!hasSentFirstMessage && (
        <Prompt timePeriod={timePeriod} userName={userName} />
      )}
      {/* 聊天对话框 */}
      {hasSentFirstMessage && (
        <Dialogue
          msgLoading={msgLoading}
          chatHistory={chatHistory}
          currentMessage={currentMessage}
        />
      )}
      {/* 输入区域 */}
      <InputArea
        quickActions={quickActions}
        handleMenuClick={handleMenuClick}
        aiType={aiType}
        setAiType={setAiType}
        handleSendMessage={handleSendMessage}
        msgLoading={msgLoading}
      />
      {/* 快捷功能按钮 */}
      {!hasSentFirstMessage && (
        <FuncButton
          quickActions={quickActions}
          handleMenuClick={handleMenuClick}
        />
      )}
      {/* <Speech /> */}
    </div>
  );
}
