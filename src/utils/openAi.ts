import OpenAI from 'openai';
import toolsMap from './aiTools';
import { zodToJsonSchema } from 'zod-to-json-schema';

// ==================== 对话上下文管理器 ====================
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
  summary?: string; // 对话摘要
  keyPoints?: string[]; // 关键信息点
  topics?: string[]; // 讨论的主题
}

class ConversationManager {
  private contexts = new Map<string, ConversationContext>();
  private maxContextTokens = 4000; // 单次请求最大token数
  private maxHistoryMessages = 10; // 最大保留消息数
  private summaryThreshold = 8; // 超过8条消息时触发摘要

  // 创建新对话
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

  // 添加消息
  addMessage(contextId: string, message: Message) {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`对话上下文 ${contextId} 不存在`);
    }

    message.timestamp = Date.now();
    context.messages.push(message);
    context.lastActivity = new Date();
    context.totalTokens += this.estimateTokens(message.content);

    // 检查是否需要压缩历史
    this.checkAndCompressHistory(contextId);
  }

  // 获取优化后的消息历史
  getOptimizedMessages(contextId: string): Message[] {
    const context = this.contexts.get(contextId);
    if (!context) return [];

    const messages = [...context.messages];

    // 策略1: 保留最近的N条消息
    const recentMessages = messages.slice(-this.maxHistoryMessages);

    // 策略2: 如果有摘要，插入摘要
    if (context.summary && messages.length > this.maxHistoryMessages) {
      return [
        {
          role: 'system',
          content: `[对话历史摘要]\n${context.summary}\n[以下是最近的对话]`,
        },
        ...recentMessages,
      ];
    }

    return recentMessages;
  }

  // 压缩历史记录
  private async checkAndCompressHistory(contextId: string) {
    const context = this.contexts.get(contextId);
    if (!context) return;

    // 如果消息数超过阈值，生成摘要
    if (context.messages.length > this.summaryThreshold && !context.summary) {
      await this.generateSummary(contextId);
    }

    // 如果token数超过限制，移除旧消息
    while (
      context.totalTokens > this.maxContextTokens &&
      context.messages.length > 2
    ) {
      const removed = context.messages.shift();
      if (removed) {
        context.totalTokens -= this.estimateTokens(removed.content);
      }
    }
  }

  // 生成对话摘要（可以调用AI生成，这里简化处理）
  private async generateSummary(contextId: string) {
    const context = this.contexts.get(contextId);
    if (!context) return;

    // 提取关键信息
    const userMessages = context.messages.filter((m) => m.role === 'user');
    const assistantMessages = context.messages.filter(
      (m) => m.role === 'assistant',
    );

    // 简化版摘要生成
    context.summary = `
用户主要询问了 ${userMessages.length} 个问题，涉及以下主题：
${this.extractTopics(context.messages).join('、')}

助手已提供了相关技术指导和代码示例。
    `.trim();

    console.log(`📝 生成对话摘要: ${contextId}`);
  }

  // 提取对话主题
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
    ];

    messages.forEach((msg) => {
      keywords.forEach((keyword) => {
        if (msg.content.includes(keyword)) {
          topics.add(keyword);
        }
      });
    });

    return Array.from(topics);
  }

  // 估算token数（简单估算：中文1字符≈2token，英文1单词≈1.3token）
  private estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return Math.ceil(chineseChars * 2 + englishWords * 1.3);
  }

  // 获取对话统计
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

  // 清理过期对话（超过1小时未活动）
  cleanupInactive(maxAge = 3600000) {
    const now = Date.now();
    for (const [id, context] of this.contexts.entries()) {
      if (now - context.lastActivity.getTime() > maxAge) {
        this.contexts.delete(id);
        console.log(`🗑️ 清理过期对话: ${id}`);
      }
    }
  }
}

// ==================== Prompt 优化器 ====================
class PromptOptimizer {
  // 优化系统提示词
  optimizeSystemPrompt(userQuery: string, conversationHistory: Message[]) {
    const topics = this.detectTopics(userQuery, conversationHistory);
    const complexity = this.assessComplexity(userQuery);
    const intent = this.detectIntent(userQuery);
    console.log(topics, complexity, intent);

    let systemPrompt = `## 角色
你是一个专业的前端导师，擅长 Vue、React、Webpack、TypeScript 等前端技术。

## 当前对话上下文
- 讨论主题: ${topics.join('、')}
- 问题复杂度: ${complexity}
- 用户意图: ${intent}

## 输出规范
`;

    // 根据意图调整输出格式
    switch (intent) {
      case 'code':
        systemPrompt += `
- 提供完整可运行的代码示例
- 包含详细的代码注释
- 说明设计思路和实现要点
- 如有必要，提供多个实现方案对比
`;
        break;
      case 'concept':
        systemPrompt += `
- 由浅入深解释概念
- 使用类比和实例帮助理解
- 画出流程图或架构图（用 Markdown）
- 提供延伸学习资源
`;
        break;
      case 'debug':
        systemPrompt += `
- 分析可能的错误原因
- 提供调试思路和方法
- 给出具体的解决方案
- 预防类似问题的建议
`;
        break;
      case 'comparison':
        systemPrompt += `
- 多维度对比分析
- 列出各自优缺点
- 提供使用场景建议
- 给出技术选型建议
`;
        break;
      default:
        systemPrompt += `
- 简洁明了地回答问题
- 提供必要的代码示例
- 如需深入，可询问用户需求
`;
    }

    return systemPrompt;
  }

  // 检测话题
  private detectTopics(query: string, history: Message[]): string[] {
    const allText = query + ' ' + history.map((m) => m.content).join(' ');
    const topics = new Set<string>();

    const topicPatterns = {
      Vue: /vue|vuex|pinia|vue-router/i,
      React: /react|redux|mobx|react-router/i,
      TypeScript: /typescript|ts|类型|泛型/i,
      性能优化: /性能|优化|加载|渲染/i,
      构建工具: /webpack|vite|rollup|打包/i,
      组件开发: /组件|component|props|emit/i,
      状态管理: /状态|store|redux|vuex/i,
    };

    Object.entries(topicPatterns).forEach(([topic, pattern]) => {
      if (pattern.test(allText)) {
        topics.add(topic);
      }
    });

    return Array.from(topics);
  }

  // 评估复杂度
  private assessComplexity(query: string): string {
    const indicators = {
      high: ['架构', '设计模式', '源码', '原理', '底层'],
      medium: ['实现', '如何', '怎么', '方案', '优化'],
      low: ['是什么', '有什么', '简单', '快速'],
    };

    for (const [level, keywords] of Object.entries(indicators)) {
      if (keywords.some((kw) => query.includes(kw))) {
        return level === 'high' ? '高' : level === 'medium' ? '中' : '低';
      }
    }
    return '中';
  }

  // 检测用户意图
  private detectIntent(query: string): string {
    const intentPatterns = {
      code: /代码|实现|写|示例|demo/i,
      concept: /是什么|概念|原理|理解|解释/i,
      debug: /错误|报错|bug|不工作|失败/i,
      comparison: /对比|区别|比较|选择|vs/i,
      optimization: /优化|性能|提升|改进/i,
    };

    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(query)) {
        return intent;
      }
    }
    return 'general';
  }

  // 优化用户输入
  enhanceUserQuery(query: string, context: Message[]): string {
    // 如果用户问题过于简短，添加上下文信息
    if (query.length < 10 && context.length > 0) {
      const lastTopic = this.detectTopics(
        context[context.length - 1]?.content || '',
        [],
      );
      if (lastTopic.length > 0) {
        return `关于 ${lastTopic.join('、')} 的问题：${query}`;
      }
    }
    return query;
  }
}

// ==================== 增强的对话函数 ====================
const conversationManager = new ConversationManager();
const promptOptimizer = new PromptOptimizer();

// 定期清理过期对话
setInterval(() => {
  conversationManager.cleanupInactive();
}, 600000); // 每10分钟清理一次

export const chatWithGPTEnhanced = async (
  messages: Message[],
  options: {
    conversationId?: string; // 对话ID，用于多轮对话
    enableOptimization?: boolean; // 是否启用优化
    onChunk?: (chunk: string) => void;
    onComplete?: (fullResponse: string) => void;
    onError?: (error: any) => void;
    onServiceSwitch?: (serviceName: string) => void;
    onContextUpdate?: (stats: any) => void; // 上下文更新回调
  } = {},
) => {
  const {
    conversationId = `conv_${Date.now()}`,
    enableOptimization = true,
    onChunk,
    onComplete,
    onError,
    onServiceSwitch,
    onContextUpdate,
  } = options;

  // 获取或创建对话上下文
  let context = conversationManager.contexts.get(conversationId);
  if (!context) {
    context = conversationManager.createConversation(conversationId);
  }

  // 将新消息添加到上下文
  messages.forEach((msg) => {
    if (msg.role !== 'system') {
      conversationManager.addMessage(conversationId, msg);
    }
  });

  // 获取最新用户消息
  const userMessages = messages.filter((m) => m.role === 'user');
  const latestUserQuery = userMessages[userMessages.length - 1]?.content || '';

  // 优化系统提示词
  let systemPrompt = `## 角色
你是一个专业的前端导师，擅长 Vue、React、Webpack、TypeScript 等前端技术。

## 输出规范
- 代码问题：提供设计思路 + 代码实现
- 概念问题：由浅入深解释
- 其他问题：简洁准确回答
`;

  if (enableOptimization) {
    const conversationHistory =
      conversationManager.getOptimizedMessages(conversationId);
    systemPrompt = promptOptimizer.optimizeSystemPrompt(
      latestUserQuery,
      conversationHistory,
    );
  }

  // 获取优化后的消息列表
  const optimizedMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationManager.getOptimizedMessages(conversationId),
  ];

  // 发送统计信息
  const stats = conversationManager.getStats(conversationId);
  if (stats) {
    onContextUpdate?.({
      ...stats,
      optimizationEnabled: enableOptimization,
      systemPrompt: systemPrompt.substring(0, 100) + '...',
    });
  }

  // 调用原始的 chatWithGPT 函数
  try {
    const response = await chatWithGPT(
      optimizedMessages,
      onChunk,
      (fullResponse) => {
        // 将AI回复添加到上下文
        conversationManager.addMessage(conversationId, {
          role: 'assistant',
          content: fullResponse,
        });
        onComplete?.(fullResponse);
      },
      onError,
      onServiceSwitch,
    );

    return response;
  } catch (error) {
    onError?.(error);
    throw error;
  }
};

// ==================== 对话分析工具 ====================
export const analyzeConversation = (conversationId: string) => {
  const stats = conversationManager.getStats(conversationId);
  if (!stats) {
    return null;
  }

  return {
    ...stats,
    efficiency: stats.totalTokens / stats.messageCount, // 平均每条消息的token数
    durationMinutes: Math.round(stats.duration / 60000),
    recommendation: stats.messageCount > 15 ? '建议开启新对话' : '对话正常',
  };
};

// ==================== 导出管理器实例 ====================
export { conversationManager, promptOptimizer };

// ================== AI 服务配置 =================
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
}

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
    model: 'gpt-5-mini',
    status: 'checking',
    responseTime: null,
    consecutiveFailures: 0,
    lastCheck: null,
    lastSuccess: null,
  },
  {
    id: 'backup1',
    name: 'OpenAI Direct (备用)',
    priority: 2,
    client: new OpenAI({
      //   apiKey: '0f513bc89a482ed8fe9d4b6369eac7d8',
      //   baseURL: 'https://spark-api-open.xf-yun.com/v2/chat/completions',
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
  },
];

// ==================== 服务管理器 ====================
class AIServiceManager {
  private services: AIServiceConfig[];
  private currentService: AIServiceConfig | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private onServiceChangeCallback?: (service: AIServiceConfig) => void;

  constructor(services: AIServiceConfig[]) {
    this.services = services.sort((a, b) => a.priority - b.priority);
    this.selectBestService();
  }

  // 启动健康检查
  startHealthCheck(interval = 60000 * 60 * 2) {
    this.performHealthCheck();
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, interval);
  }

  // 停止健康检查
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // 执行健康检查
  async performHealthCheck() {
    const checkPromises = this.services.map(async (service) => {
      try {
        const startTime = Date.now();

        // 简单的模型列表检查作为健康检查
        await service.client.models.list();

        const responseTime = Date.now() - startTime;
        service.status = 'online';
        service.responseTime = responseTime;
        service.lastCheck = new Date();
        service.consecutiveFailures = 0;

        console.log(`✅ ${service.name} 健康检查通过 (${responseTime}ms)`);
      } catch (error) {
        service.status = 'offline';
        service.consecutiveFailures += 1;
        service.lastCheck = new Date();
        console.error(`❌ ${service.name} 健康检查失败:`, error);
      }
    });

    await Promise.allSettled(checkPromises);
    this.selectBestService();
  }

  // 选择最佳服务
  selectBestService() {
    const availableServices = this.services.filter(
      (s) => s.status === 'online',
    );

    if (availableServices.length === 0) {
      console.warn('⚠️ 没有可用的 AI 服务');
      this.currentService = null;
      return null;
    }

    // 选择优先级最高且响应最快的服务
    const bestService = availableServices.reduce((best, current) => {
      if (current.priority < best.priority) return current;
      if (
        current.priority === best.priority &&
        (current.responseTime || 0) < (best.responseTime || 0)
      ) {
        return current;
      }
      return best;
    });

    if (!this.currentService || this.currentService.id !== bestService.id) {
      console.log(`🔄 切换到服务: ${bestService.name}`);
      this.currentService = bestService;
      this.onServiceChangeCallback?.(bestService);
    }

    return bestService;
  }

  // 获取当前服务
  getCurrentService(): AIServiceConfig | null {
    return this.currentService;
  }

  // 标记服务失败
  markServiceFailure(serviceId: string) {
    const service = this.services.find((s) => s.id === serviceId);
    if (service) {
      service.consecutiveFailures += 1;

      // 连续失败3次标记为离线
      if (service.consecutiveFailures >= 3) {
        service.status = 'offline';
        console.warn(
          `⚠️ ${service.name} 被标记为离线 (连续失败${service.consecutiveFailures}次)`,
        );
        this.selectBestService();
      }
    }
  }

  // 标记服务成功
  markServiceSuccess(serviceId: string) {
    const service = this.services.find((s) => s.id === serviceId);
    if (service) {
      service.consecutiveFailures = 0;
      service.lastSuccess = new Date();
      if (service.status === 'offline') {
        service.status = 'online';
        this.selectBestService();
      }
    }
  }

  // 获取所有服务状态
  getServicesStatus() {
    return this.services.map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status,
      priority: s.priority,
      responseTime: s.responseTime,
      consecutiveFailures: s.consecutiveFailures,
      lastCheck: s.lastCheck,
      lastSuccess: s.lastSuccess,
    }));
  }

  // 设置服务变更回调
  onServiceChange(callback: (service: AIServiceConfig) => void) {
    this.onServiceChangeCallback = callback;
  }
}

// 初始化服务管理器
const aiServiceManager = new AIServiceManager(AI_SERVICES);

// 启动健康检查（每30秒）
aiServiceManager.startHealthCheck(60000 * 60 * 2);

// 监听服务切换
aiServiceManager.onServiceChange((service) => {
  console.log(`📡 当前使用服务: ${service.name}`);
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
  onServiceSwitch?: (serviceName: string) => void, // 新增：服务切换回调
) => {
  const externalContent =
    '智汇云舟（Wisdom Ark）是一个便于用户查询、学习、使用的前端知识库';
  const recentMessages = messages.slice(-5);
  const newMessages = [
    {
      role: 'system',
      content: `
        ## 角色
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

  // 尝试所有可用AI
  const attemptedServices = new Set<string>();
  let lastError: any = null;

  while (true) {
    const currentService = aiServiceManager.getCurrentService();

    if (!currentService) {
      const error = new Error('所有 AI 服务都不可用，请稍后再试');
      onError?.(error);
      throw error;
    }

    // 避免重复尝试同一服务
    if (attemptedServices.has(currentService.id)) {
      break;
    }
    attemptedServices.add(currentService.id);
    try {
      console.log(`🚀 使用 ${currentService.name} 发送请求...`);
      onServiceSwitch?.(currentService.name);

      const response = await currentService.client.chat.completions.create({
        model: currentService.model,
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
              toolCalls[index].function.arguments +=
                toolCall.function.arguments;
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
                    typeof result === 'string'
                      ? result
                      : JSON.stringify(result),
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

      // 标记服务成功
      aiServiceManager.markServiceSuccess(currentService.id);

      onComplete?.(fullResponse);
      return fullResponse;
    } catch (error) {
      lastError = error;
      console.error(`❌ ${currentService.name} 请求失败:`, error);

      // 标记服务失败
      aiServiceManager.markServiceFailure(currentService.id);

      // 尝试切换到下一个服务
      const nextService = aiServiceManager.selectBestService();

      if (!nextService || attemptedServices.has(nextService.id)) {
        // 没有更多可用服务
        break;
      }

      console.log(`🔄 自动切换到备用服务: ${nextService.name}`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒后重试
    }
  }
  // 所有服务都失败了
  const error = lastError || new Error('所有 AI 服务都失败了');
  onError?.(error);
  return '发生错误，所有 AI 服务暂时不可用，请稍后重试';
};

// ==================== 导出状态查询函数 ====================
export const getAIServicesStatus = () => {
  return aiServiceManager.getServicesStatus();
};

export const getCurrentAIService = () => {
  const service = aiServiceManager.getCurrentService();
  return service ? service.name : '无可用服务';
};

export const forceHealthCheck = () => {
  return aiServiceManager.performHealthCheck();
};

// 清理函数（在应用卸载时调用）
export const cleanup = () => {
  aiServiceManager.stopHealthCheck();
};
