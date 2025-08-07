import './index.scss';

interface ChatChanelProps {
  inputHeight: number;
}

// 模拟聊天消息类型
interface ChatMessage {
  sender: string;
  senderId: number; // 身份标识
  content: string;
}

// 模拟聊天数据
const mockMessages: ChatMessage[] = [
  {
    sender: '主持人',
    senderId: 1,
    content:
      'hello直播间的小伙伴们，欢迎扫描屏幕二维码加入AI编程社社群，本期直播有回放，讲义会在结束后发到评论区或可进入社群领取哦~',
  },
  {
    sender: '用户79394072374',
    senderId: 0,
    content: '111111',
  },
  {
    sender: '知识船仓',
    senderId: 0,
    content: '[送花花~|Flower~||送花花~:1832269465396570]',
  },
  {
    sender: '知识船仓',
    senderId: 0,
    content: '[惊喜~|Wow~||驚喜~:1832269465396554]',
  },
  {
    sender: 'ghostboy',
    senderId: 0,
    content: '111111111111111111如何解决模型排队问题',
  },
  {
    sender: '用户720312023481',
    senderId: 0,
    content: '回放没有生成吗？',
  },
  {
    sender: '用户85766539978',
    senderId: 0,
    content: '回放看不了啊',
  },
];

export default function ChatChanel({ inputHeight }: ChatChanelProps) {
  return (
    <div
      className="chat w-full bg-white overflow-auto"
      style={{
        height: `${580 - inputHeight}px`,
        transition: 'height 0.3s ease-in-out',
      }}
    >
      {mockMessages.map((msg, index) => (
        <div key={index} className="messageBox mt-2 mb-10">
          <div className="flex">
            <div
              className={`name-main text-14 w-fit mr-2 text-center 
              px-2 flex items-center`}
              style={{
                border: msg.senderId === 1 ? '1px solid #f5c371' : 'none',
                color: msg.senderId === 1 ? '#f5c371' : '#1677ff',
                backgroundColor: 'white',
              }}
            >
              {msg.sender}
            </div>
            <div>：</div>
          </div>

          <div className="text-gray-600 text-13">{msg.content}</div>
        </div>
      ))}
    </div>
  );
}
