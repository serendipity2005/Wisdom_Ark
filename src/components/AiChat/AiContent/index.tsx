import { useState } from 'react';
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
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      id: '1',
      role: 'user',
      content: '我有一个问题',
      timestamp: new Date(),
    },
    {
      id: '2',
      role: 'assistant',
      content:
        '请你把具体的问题描述出来吧～ 无论是知识咨询、问题解答、创意创作还是其他需求，你说得越详细，我就越能准确地帮到你哦！',
      timestamp: new Date(),
    },
    {
      id: '3',
      role: 'user',
      content: '你猜我想问什么',
      timestamp: new Date(),
    },
    {
      id: '4',
      role: 'assistant',
      content:
        '哈哈，这可有点难猜呢！不过我可以根据常见的问题方向给你一些推测，看看有没有接近的～ 你可能想问：\n\n• 某个知识类问题（比如历史事件、科学原理、生活常识）？\n\n• 学习或工作上的难题（比如作业解答、技能技巧、学习方法）？\n\n• 创意相关的需求（比如文案写作、故事构思、灵感启发）？',
      timestamp: new Date(),
    },
    // {
    //   id: '5',
    //   role: 'user',
    //   content:
    //     '给一个网站起个名字：学习型网站，类似于稀土掘金和CSDN之类的，可以直播，AI，发布等等',
    //   timestamp: new Date(),
    // },
    //     {
    //       id: '6',
    //       role: 'assistant',
    //       content: `### 适合学习型技术社区的网站名称推荐
    //   结合“学习属性”“技术氛围”及“直播、AI、内容发布”等功能特性，推荐以下名称，兼顾记忆点与行业辨识度：

    //   1. **技点（Jidian）**
    //      - 谐音“知识点”，聚焦技术学习的核心，简洁有力，易传播。

    //   2. **码课圈（Makequan）**
    //      - 融合“代码”“课程”“社区”概念，突出直播授课、圈层交流属性。

    //   3. **智习社（Zhixishe）**
    //      - “智”关联AI智能，“习”强调学习，“社”体现社区属性，传递科技感与社群感。

    //   4. **掘金坊（Juejin Fang）**
    //      - 借鉴“稀土掘金”的“掘金”意象，“坊”字增添互动场景感，暗示内容创作与交流的“工坊”属性。

    //   5. **学知栈（Xuezhi Zhan）**
    //      - “栈”呼应技术领域的“堆栈”概念，寓意知识积累与进阶，同时传递“学习驿站”的温暖感。

    //   6. **AI码堂（AI Matang）**
    //      - 直接点明AI功能与代码学习属性，“堂”字带有直播课堂、技术讲堂的场景联想。

    //   7. **知播客（Zhiboke）**
    //      - 融合“知识”与“播客”，既体现直播功能，又强化“知识传播”的核心定位，易记且适配多场景。

    //   这些名称均围绕“技术学习”“社区互动”“功能特性”展开，避免生僻字，适合作为兼具内容发布、直播教学、AI辅助的技术学习平台使用。`,
    //       timestamp: new Date(),
    //     },
  ]);

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
  const handleSendMessage = async (message: string) => {
    console.log('发送消息：', message);
    if (!message.trim()) return;
    setMsgLoading(true);

    // 添加用户消息
    const newUserMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message,
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, newUserMessage]);
    setHasSentFirstMessage(true);

    const aiResponse: string =
      (await chatWithGPT([...chatHistory, newUserMessage])) ??
      '抱歉，我没有收到回复。';
    setMsgLoading(false);

    const newAiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, newAiMessage]);

    // 模拟 AI 回复（实际项目中这里应该是调用 API）
    // setTimeout(() => {
    //   const aiResponse = {
    //     id: (Date.now() + 1).toString(),
    //     type: 'assistant' as const,
    //     content: `这是对"${message}"的回复`,
    //     timestamp: new Date(),
    //   };
    //   setChatHistory((prev) => [...prev, aiResponse]);
    // }, 1000);
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
        <Dialogue msgLoading={msgLoading} chatHistory={chatHistory} />
      )}
      {/* 输入区域 */}
      <InputArea
        quickActions={quickActions}
        handleMenuClick={handleMenuClick}
        aiType={aiType}
        setAiType={setAiType}
        handleSendMessage={handleSendMessage}
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
