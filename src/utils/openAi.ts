import OpenAI from 'openai';

// 初始化客户端（Key 硬编码仅用于测试，生产环境必须移除！）
const openai = new OpenAI({
  apiKey: 'sk-MhhXBfjcOEJb5eOOjBb0bn8P0qcLaQFE0sVOZTCb5OradbEd', // 替换为你的实际 Key
  baseURL: 'https://api.chatanywhere.tech/v1',
  dangerouslyAllowBrowser: true, // 明确允许浏览器环境（仅限开发）
});

// 对话函数
export const chatWithGPT = async (messages: any) => {
  console.log(messages);
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages, // 消息格式: [{role: "user", content: "你好"}]
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return '发生错误，请重试';
  }
};
