import OpenAI from 'openai';
import toolsMap from './aiTools';
import { zodToJsonSchema } from 'zod-to-json-schema';

// 初始化客户端（Key 硬编码仅用于测试，生产环境必须移除！）
const openai = new OpenAI({
  apiKey: 'sk-MhhXBfjcOEJb5eOOjBb0bn8P0qcLaQFE0sVOZTCb5OradbEd', // 替换为你的实际 Key
  baseURL: 'https://api.chatanywhere.tech/v1',
  dangerouslyAllowBrowser: true, // 明确允许浏览器环境（仅限开发）
});

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
export const chatWithGPT = async (
  messages: any,
  onChunk?: (chunk: string) => void, // 回调函数，用于处理每个数据块
  onComplete?: (fullResponse: string) => void, // 完成时的回调
  onError?: (error: any) => void, // 错误处理回调
) => {
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
    },
    ...recentMessages,
  ];
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: newMessages,
      stream: true, // 启用流式响应
      temperature: 0.7,
      tools: tools as any,
    });

    let fullResponse = '';
    const toolCalls: any[] = [];

    // 处理流式数据
    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta;

      if (delta?.content) {
        // 普通文本内容
        const content = delta.content;
        fullResponse += content;
        // 实时回调，用于UI更新
        onChunk?.(content);
      }

      if (delta?.tool_calls) {
        // 处理工具调用（流式模式下工具调用可能分多个chunk）
        delta.tool_calls.forEach((toolCall: any, index: number) => {
          if (!toolCalls[index]) {
            toolCalls[index] = {
              id: toolCall.id,
              type: toolCall.type,
              function: { name: '', arguments: '' },
            };
          }

          if (toolCall.function?.name) {
            toolCalls[index].function.name += toolCall.function.name;
          }

          if (toolCall.function?.arguments) {
            toolCalls[index].function.arguments += toolCall.function.arguments;
          }
        });
      }

      // 检查是否完成
      if (
        chunk.choices[0]?.finish_reason === 'stop' ||
        chunk.choices[0]?.finish_reason === 'tool_calls'
      ) {
        break;
      }
    }

    // 如果有工具调用，处理工具调用
    if (toolCalls.length > 0) {
      const toolResponses = await Promise.all(
        toolCalls.map(async (toolCall) => {
          const toolId = toolCall.id;
          if (!toolId) {
            return {
              role: 'tool',
              content: '未找到对应工具',
              tool_call_id: toolId,
            };
          }

          const functionName = toolCall.function.name;
          const tool = toolsMap.get(functionName);

          if (tool) {
            try {
              const args = JSON.parse(toolCall.function.arguments);
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

      const toolResult = JSON.parse(toolResponses[0].content).content;
      onComplete?.(toolResult);
      return toolResult;
    }

    onComplete?.(fullResponse);
    return fullResponse;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return '发生错误，请重试';
  }
};
