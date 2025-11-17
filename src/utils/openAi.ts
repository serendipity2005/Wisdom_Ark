import OpenAI from 'openai';
import toolsMap from './aiTools';
import { zodToJsonSchema } from 'zod-to-json-schema';

// ==================== 类型定义 ====================
interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp?: number;
  tokens?: number;
  metadata?: any;
}

interface ConversationContext {
  id: string;
  messages: Message[];
  totalTokens: number;
  maxTokens: number;
  createdAt: Date;
  lastActivity: Date;
  summary?: string;
  keyPoints?: string[];
  topics?: string[];
}

// ==================== 对话上下文管理器 ====================
class ConversationManager {
  private contexts = new Map<string, ConversationContext>();
  private maxContextTokens = 4000;
  private maxHistoryMessages = 10;
  private summaryThreshold = 8;

  createConversation(id: string): ConversationContext {
    const context: ConversationContext = {
      id,
      messages: [],
      totalTokens: 0,
      maxTokens: this.maxContextTokens,
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    this.contexts.set(id, context);
    return context;
  }

  addMessage(contextId: string, message: Message) {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`对话上下文 ${contextId} 不存在`);
    }

    if (!message.content) {
      console.warn('⚠️ 消息内容为空，跳过添加');
      return;
    }

    message.timestamp = Date.now();
    context.messages.push(message);
    context.lastActivity = new Date();
    context.totalTokens += this.estimateTokens(String(message.content));

    this.checkAndCompressHistory(contextId);
  }

  getOptimizedMessages(contextId: string): Message[] {
    const context = this.contexts.get(contextId);
    if (!context) return [];

    const messages = [...context.messages];
    const recentMessages = messages.slice(-this.maxHistoryMessages);

    if (context.summary && messages.length > this.maxHistoryMessages) {
      return [
        {
          role: 'user',
          content: `[对话历史摘要]\n${context.summary}\n[以下是最近的对话]`,
        },
        ...recentMessages,
      ];
    }

    return recentMessages;
  }

  private async checkAndCompressHistory(contextId: string) {
    const context = this.contexts.get(contextId);
    if (!context) return;

    if (context.messages.length > this.summaryThreshold && !context.summary) {
      await this.generateSummary(contextId);
    }

    while (
      context.totalTokens > this.maxContextTokens &&
      context.messages.length > 2
    ) {
      const removed = context.messages.shift();
      if (removed && removed.content) {
        context.totalTokens -= this.estimateTokens(String(removed.content));
      }
    }
  }

  private async generateSummary(contextId: string) {
    const context = this.contexts.get(contextId);
    if (!context) return;

    const userMessages = context.messages.filter((m) => m.role === 'user');

    context.summary = `
用户主要询问了 ${userMessages.length} 个问题，涉及以下主题：
${this.extractTopics(context.messages).join('、')}

助手已提供了相关技术指导和代码示例。
    `.trim();

    console.log(`📝 生成对话摘要: ${contextId}`);
  }

  private extractTopics(messages: Message[]): string[] {
    const topics = new Set<string>();
    const keywords = [
      'Vue',
      'React',
      'Webpack',
      'TypeScript',
      'JavaScript',
      '组件',
      '性能',
      '优化',
      '部署',
      'Markdown',
    ];

    messages.forEach((msg) => {
      keywords.forEach((keyword) => {
        if (msg.content && msg.content.includes(keyword)) {
          topics.add(keyword);
        }
      });
    });

    return Array.from(topics);
  }

  private estimateTokens(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return Math.ceil(chineseChars * 2 + englishWords * 1.3);
  }

  getStats(contextId: string) {
    const context = this.contexts.get(contextId);
    if (!context) return null;

    return {
      messageCount: context.messages.length,
      totalTokens: context.totalTokens,
      duration: Date.now() - context.createdAt.getTime(),
      topics: this.extractTopics(context.messages),
    };
  }

  cleanupInactive(maxAge = 3600000) {
    const now = Date.now();
    for (const [id, context] of this.contexts.entries()) {
      if (now - context.lastActivity.getTime() > maxAge) {
        this.contexts.delete(id);
        console.log(`🗑️ 清理过期对话: ${id}`);
      }
    }
  }

  getContext(contextId: string) {
    return this.contexts.get(contextId);
  }
}

// ==================== Prompt 优化器 ====================
class PromptOptimizer {
  optimizeSystemPrompt(userQuery: string, conversationHistory: Message[]) {
    const topics = this.detectTopics(userQuery, conversationHistory);
    const complexity = this.assessComplexity(userQuery);
    const intent = this.detectIntent(userQuery);

    console.log('📊 Prompt优化:', { topics, complexity, intent });

    let systemPrompt = `## 角色
你是一个专业的前端导师，擅长 Vue、React、Webpack、TypeScript 等前端技术。

## 当前对话上下文
- 讨论主题: ${topics.length > 0 ? topics.join('、') : '通用前端技术'}
- 问题复杂度: ${complexity}
- 用户意图: ${intent}

## 输出规范
`;

    switch (intent) {
      case 'code':
        systemPrompt += `- 提供完整可运行的代码示例\n- 包含详细的代码注释\n- 说明设计思路和实现要点`;
        break;
      case 'concept':
        systemPrompt += `- 由浅入深解释概念\n- 使用类比和实例帮助理解\n- 提供延伸学习资源`;
        break;
      case 'debug':
        systemPrompt += `- 分析可能的错误原因\n- 提供调试思路和方法\n- 给出具体的解决方案`;
        break;
      default:
        systemPrompt += `- 简洁明了地回答问题\n- 提供必要的代码示例`;
    }

    return systemPrompt;
  }

  private detectTopics(query: string, history: Message[]): string[] {
    const safeQuery = String(query || '');
    const safeHistory = Array.isArray(history) ? history : [];

    const allText =
      safeQuery +
      ' ' +
      safeHistory
        .filter((m) => m && m.content)
        .map((m) => String(m.content))
        .join(' ');

    const topics = new Set<string>();
    const topicPatterns = {
      Vue: /vue|vuex|pinia|vue-router/i,
      React: /react|redux|mobx|hooks/i,
      TypeScript: /typescript|ts(?![a-z])|类型/i,
      Markdown: /markdown|md|渲染/i,
      性能优化: /性能|优化|渲染/i,
    };

    Object.entries(topicPatterns).forEach(([topic, pattern]) => {
      if (pattern.test(allText)) {
        topics.add(topic);
      }
    });

    return Array.from(topics);
  }

  private assessComplexity(query: string): string {
    const indicators = {
      high: ['架构', '设计模式', '源码', '原理'],
      medium: ['实现', '如何', '怎么', '方案'],
      low: ['是什么', '简单', '快速'],
    };

    for (const [level, keywords] of Object.entries(indicators)) {
      if (keywords.some((kw) => query.includes(kw))) {
        return level === 'high' ? '高' : level === 'medium' ? '中' : '低';
      }
    }
    return '中';
  }

  private detectIntent(query: string): string {
    const intentPatterns = {
      code: /代码|实现|写|示例/i,
      concept: /是什么|概念|原理|解释/i,
      debug: /错误|报错|bug|失败/i,
    };

    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(query)) {
        return intent;
      }
    }
    return 'general';
  }
}

// ==================== AI 服务配置 ====================
interface AIServiceConfig {
  id: string;
  name: string;
  priority: number;
  client: OpenAI;
  model: string;
  status: 'online' | 'offline' | 'checking';
  responseTime: number | null;
  consecutiveFailures: number;
  lastCheck: Date | null;
  lastSuccess: Date | null;
  supportsTools?: boolean; // 是否支持工具调用
}

// 🆕 多服务配置：主服务 + 千问降级
const AI_SERVICES: AIServiceConfig[] = [
  {
    id: 'primary',
    name: 'ChatAnywhere (主服务)',
    priority: 1,
    client: new OpenAI({
      apiKey: 'sk-MhhXBfjcOEJb5eOOjBb0bn8P0qcLaQFE0sVOZTCb5OradbEd',
      baseURL: 'https://api.chatanywhere.tech/v1',
      dangerouslyAllowBrowser: true,
    }),
    model: 'gpt-4o-mini',
    status: 'checking',
    responseTime: null,
    consecutiveFailures: 0,
    lastCheck: null,
    lastSuccess: null,
    supportsTools: true,
  },
  {
    id: 'qwen',
    name: '千问大模型 (降级服务)',
    priority: 2,
    client: new OpenAI({
      apiKey: 'YOUR_QWEN_API_KEY', // 🔑 替换为你的千问 API Key
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      dangerouslyAllowBrowser: true,
    }),
    model: 'qwen-plus', // 可选: qwen-turbo, qwen-plus, qwen-max
    status: 'checking',
    responseTime: null,
    consecutiveFailures: 0,
    lastCheck: null,
    lastSuccess: null,
    supportsTools: true, // 千问也支持工具调用
  },
];

// ==================== 服务管理器 ====================
class AIServiceManager {
  private services: AIServiceConfig[];
  private currentServiceIndex = 0;
  private maxConsecutiveFailures = 2; // 连续失败2次后切换
  private failureResetTime = 5 * 60 * 1000; // 5分钟后重置失败计数

  constructor(services: AIServiceConfig[]) {
    this.services = services.sort((a, b) => a.priority - b.priority);
  }

  getCurrentService(): AIServiceConfig | null {
    // 检查是否需要重置失败计数（距离上次失败超过5分钟）
    this.checkAndResetFailures();

    // 尝试从当前索引开始找可用服务
    for (let i = 0; i < this.services.length; i++) {
      const index = (this.currentServiceIndex + i) % this.services.length;
      const service = this.services[index];

      // 如果服务未达到最大失败次数,返回该服务
      if (service.consecutiveFailures < this.maxConsecutiveFailures) {
        this.currentServiceIndex = index;
        return service;
      }
    }

    // 所有服务都失败了,重置失败计数并返回第一个
    console.warn('⚠️ 所有服务都失败,重置失败计数');
    this.services.forEach((s) => (s.consecutiveFailures = 0));
    this.currentServiceIndex = 0;
    return this.services[0];
  }

  markServiceFailure(serviceId: string) {
    const service = this.services.find((s) => s.id === serviceId);
    if (service) {
      service.consecutiveFailures++;
      service.status = 'offline';
      service.lastCheck = new Date();

      console.error(
        `❌ ${service.name} 失败次数: ${service.consecutiveFailures}/${this.maxConsecutiveFailures}`,
      );

      // 如果达到失败阈值,自动切换到下一个服务
      if (service.consecutiveFailures >= this.maxConsecutiveFailures) {
        this.switchToNextService();
      }
    }
  }

  markServiceSuccess(serviceId: string) {
    const service = this.services.find((s) => s.id === serviceId);
    if (service) {
      service.consecutiveFailures = 0;
      service.status = 'online';
      service.lastSuccess = new Date();
      console.log(`✅ ${service.name} 服务正常`);
    }
  }

  private switchToNextService() {
    const currentService = this.services[this.currentServiceIndex];
    this.currentServiceIndex =
      (this.currentServiceIndex + 1) % this.services.length;
    const nextService = this.services[this.currentServiceIndex];

    console.log(`🔄 服务切换: ${currentService.name} → ${nextService.name}`);
  }

  // 检查并重置过期的失败计数
  private checkAndResetFailures() {
    const now = Date.now();
    this.services.forEach((service) => {
      if (
        service.lastCheck &&
        now - service.lastCheck.getTime() > this.failureResetTime &&
        service.consecutiveFailures > 0
      ) {
        console.log(
          `🔄 重置 ${service.name} 失败计数（距上次失败已超过5分钟）`,
        );
        service.consecutiveFailures = 0;
        service.status = 'checking';
      }
    });
  }

  // 获取服务健康状态
  getHealthStatus() {
    return this.services.map((s) => ({
      name: s.name,
      status: s.status,
      failures: s.consecutiveFailures,
      lastSuccess: s.lastSuccess,
    }));
  }
}

// 初始化
const conversationManager = new ConversationManager();
const promptOptimizer = new PromptOptimizer();
const aiServiceManager = new AIServiceManager(AI_SERVICES);

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

// ==================== 主要对话函数 ====================
export const chatWithGPT = async (
  messages: any,
  onChunk?: (chunk: string) => void,
  onComplete?: (fullResponse: string) => void,
  onError?: (error: any) => void,
  onServiceSwitch?: (serviceName: string) => void,
) => {
  const externalContent =
    '智汇云舟(Wisdom Ark)是一个便于用户查询、学习、使用的前端知识库';
  const recentMessages = messages.slice(-5);

  const newMessages = [
    {
      role: 'system',
      content: `## 角色
你是一个专业的前端导师，你最擅长Vue、React、Webpack、Antd这些前端框架，你能够由浅入深的回答用户关于前端的问题
## 参考内容
${externalContent}
## 输出规范
- 关于代码问题，你能够按照"设计思路"、"代码实现"两个维度来回答
- 别的问题可以简单回答，但不要拒绝回答
        `,
    },
    ...recentMessages,
  ];

  const maxRetries = AI_SERVICES.length; // 最多尝试所有服务
  let currentRetry = 0;

  while (currentRetry < maxRetries) {
    const currentService = aiServiceManager.getCurrentService();

    if (!currentService) {
      const error = new Error('所有 AI 服务都不可用，请稍后再试');
      onError?.(error);
      throw error;
    }

    try {
      console.log(
        `🚀 [尝试 ${currentRetry + 1}/${maxRetries}] 使用 ${currentService.name}...`,
      );
      onServiceSwitch?.(currentService.name);

      // 🔧 根据服务能力决定是否传入 tools
      const requestParams: any = {
        model: currentService.model,
        messages: newMessages,
        stream: true,
        temperature: 0.7,
      };

      // 只有支持工具的服务才传入 tools
      if (currentService.supportsTools) {
        requestParams.tools = tools;
      }

      const response =
        await currentService.client.chat.completions.create(requestParams);

      let fullResponse = '';
      const toolCalls: any[] = [];

      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          const content = delta.content;
          fullResponse += content;
          onChunk?.(content);
        }

        // 只有支持工具的服务才处理工具调用
        if (currentService.supportsTools && delta?.tool_calls) {
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
              toolCalls[index].function.arguments +=
                toolCall.function.arguments;
            }
          });
        }

        if (
          chunk.choices[0]?.finish_reason === 'stop' ||
          chunk.choices[0]?.finish_reason === 'tool_calls'
        ) {
          break;
        }
      }

      // 处理工具调用
      if (toolCalls.length > 0 && currentService.supportsTools) {
        const toolResponses = await Promise.all(
          toolCalls.map(async (toolCall) => {
            const toolId = toolCall.id;
            const functionName = toolCall.function.name;
            const tool = toolsMap.get(functionName);

            if (tool) {
              try {
                const args = JSON.parse(toolCall.function.arguments);
                const result = await tool.fun(args);
                return {
                  role: 'tool',
                  content:
                    typeof result === 'string'
                      ? result
                      : JSON.stringify(result),
                  tool_call_id: toolId,
                };
              } catch (error) {
                return {
                  role: 'tool',
                  content: '工具执行失败',
                  tool_call_id: toolId,
                };
              }
            }
            return {
              role: 'tool',
              content: '未找到对应工具',
              tool_call_id: toolId,
            };
          }),
        );

        const toolResult = JSON.parse(toolResponses[0].content).content;
        aiServiceManager.markServiceSuccess(currentService.id);
        onComplete?.(toolResult);
        return toolResult;
      }

      // 成功返回
      aiServiceManager.markServiceSuccess(currentService.id);
      onComplete?.(fullResponse);
      return fullResponse;
    } catch (error: any) {
      console.error(`❌ ${currentService.name} 请求失败:`, error.message);
      aiServiceManager.markServiceFailure(currentService.id);
      currentRetry++;

      // 如果还有重试机会,继续下一个服务
      if (currentRetry < maxRetries) {
        console.log(`🔄 准备切换到下一个服务...`);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒后重试
        continue;
      }

      // 所有服务都失败了
      const finalError = new Error(
        `所有 AI 服务都失败了。最后错误: ${error.message}`,
      );
      onError?.(finalError);
      return '抱歉,所有 AI 服务暂时不可用,请稍后重试。我们已经尝试了所有可用的服务。';
    }
  }

  return '发生未知错误';
};

export { conversationManager, promptOptimizer, aiServiceManager };

export const analyzeConversation = (conversationId: string) => {
  const stats = conversationManager.getStats(conversationId);
  if (!stats) return null;
  return {
    ...stats,
    efficiency: stats.totalTokens / stats.messageCount,
    durationMinutes: Math.round(stats.duration / 60000),
  };
};

// 🆕 导出服务健康检查函数
export const getServicesHealth = () => {
  return aiServiceManager.getHealthStatus();
};
