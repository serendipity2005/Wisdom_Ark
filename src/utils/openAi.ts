import OpenAI from 'openai';
import toolsMap from './aiTools';
import { zodToJsonSchema } from 'zod-to-json-schema';

// 初始化客户端（Key 硬编码仅用于测试，生产环境必须移除！）
const openai = new OpenAI({
  apiKey: 'sk-MhhXBfjcOEJb5eOOjBb0bn8P0qcLaQFE0sVOZTCb5OradbEd', // 替换为你的实际 Key
  baseURL: 'https://api.chatanywhere.tech/v1',
  dangerouslyAllowBrowser: true, // 明确允许浏览器环境（仅限开发）
});

// const tools = Array.from(toolsMap.values()).map(({ fun, ...item }) => ({
//   ...item,
//   parameters: zodToJsonSchema(item.function.parameters),
// }));
const tools = Array.from(toolsMap.values()).map(({ fun, ...item }) => {
  const jsonSchema = zodToJsonSchema(item.function.parameters);
  return {
    type: item.type,
    function: {
      name: item.function.name,
      description: item.function.description,
      parameters: {
        type: 'object',
        properties: jsonSchema.properties,
        required: jsonSchema.required,
      },
    },
  };
});

// 对话函数
export const chatWithGPT = async (messages: any) => {
  const externalContent =
    '智汇云舟（Wisdom Ark）是一个便于用户查询、学习、使用的前端知识库';
  const recentMessages = messages.slice(-5);
  const newMessages = [
    {
      role: 'system',
      content: `
        ## 角色
        你是一个专业的前端导师，你最擅长React、Webpack、Antd这些前端框架，你能够由浅入深的回答用户关于前端的问题
        ## 参考内容
        ${externalContent}
        ## 输出规范
        - 关于代码问题，你能够按照"设计思路"、"代码实现"两个维度来回答
        - 跟编程无关的问题你可以拒绝回答
        `,
      //   tools: tools,
    },
    ...recentMessages,
  ];
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: newMessages, // 消息格式: [{role: "user", content: "你好"}]
      //   stream: true, // 启用流式响应
      temperature: 0.7,
      tools: tools as any,
    });
    // console.log(response);
    // let fullContent = '';
    // for await (const chunk of response) {
    //   const content = chunk.choices[0]?.delta?.content || '';
    //   console.log(content);
    //   fullContent += content;
    // }
    const reply = response.choices[0].message.content;
    const toolsCall = response.choices[0].message.tool_calls;
    if (reply) return response.choices[0].message.content;
    else if (toolsCall) {
      const toolResponses = await Promise.all(
        toolsCall.map(async (toolCall) => {
          const toolId = toolCall.id;
          if (!toolId)
            return {
              role: 'tool',
              content: '未找到对应工具',
              tool_call_id: toolId,
            };

          const functionName = toolCall.function.name;
          const tool = toolsMap.get(functionName);

          if (tool) {
            try {
              // 解析参数
              const args = JSON.parse(toolCall.function.arguments);
              // 执行工具函数
              const result = await tool.fun(args);

              return {
                role: 'tool',
                content:
                  typeof result === 'string' ? result : JSON.stringify(result),
                tool_call_id: toolId,
              };
            } catch (error) {
              console.error('工具执行失败:', error);
              return {
                role: 'tool',
                content: '工具执行失败',
                tool_call_id: toolId,
              };
            }
          } else {
            return {
              role: 'tool',
              content: '未找到对应工具',
              tool_call_id: toolId,
            };
          }
        }),
      );
      return JSON.parse(toolResponses[0].content).content;

      //   // 将工具响应加入消息历史并再次请求模型生成回复
      //   const updatedMessages = [
      //     ...newMessages,
      //     response.choices[0].message,
      //     ...toolResponses,
      //   ];

      //   const finalResponse = await openai.chat.completions.create({
      //     model: 'gpt-4o-mini',
      //     messages: updatedMessages,
      //     temperature: 0.7,
      //   });

      //   return finalResponse.choices[0].message.content || '无法生成回复';
    }
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return '发生错误，请重试';
  }
};
