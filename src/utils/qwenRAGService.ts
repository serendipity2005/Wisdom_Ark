/*
 * @Author: serendipity 2843306836@qq.com
 * @Date: 2025-10-28 18:16:52
 * @LastEditors: serendipity 2843306836@qq.com
 * @LastEditTime: 2025-11-23 09:41:13
 * @FilePath: \Wisdom_Ark\src\utils\qwenRAGService.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// src/utils/qwenRAGService.ts
// RAG 检索增强

import { chatInEditor } from '@/utils/openAi'; // 你现有的通义调用

interface Chunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    chapter: string;
    level: number;
    position: number;
    type?: 'text' | 'code';
  };
}

interface SearchResult {
  content: string;
  score: number;
  metadata: {
    chapter: string;
    level: number;
    position: number;
    type?: 'text' | 'code';
  };
  source?: 'current' | 'history';
}

interface DocTypeInfo {
  primary: 'code' | 'technical' | 'literary';
  codeRatio: number;
}

// RAG 配置常量
const RAG_CONFIG = {
  // 上下文长度
  QUERY_PREFIX_LENGTH: 300,
  QUERY_SUFFIX_LENGTH: 100,
  INJECTED_PREFIX_LENGTH: 500,
  INJECTED_SUFFIX_LENGTH: 200,

  // 文档限制
  MIN_DOC_LENGTH: 500,
  MAX_CHUNK_SIZE: 800,
  MIN_CHUNK_SIZE: 100,

  // 检索参数
  DEFAULT_TOP_K: 3,
  MIN_SIMILARITY: 0.2,
  HIGH_QUALITY_THRESHOLD: 0.35,
  BATCH_SIZE: 10,

  // Token 限制
  MAX_CONTEXT_TOKENS: 3000,
  RESERVED_FOR_OUTPUT: 1024,

  // 缓存
  MAX_CACHE_SIZE: 1000,
} as const;

/**
 * 🔹 智能文档类型检测（基于内容比例）
 */
function detectDocTypeForRAG(text: string): DocTypeInfo {
  const sample = (text || '').slice(0, 5000);

  // 1. 统计代码块
  const codeBlockMatches = sample.match(/```[\s\S]*?```/g) || [];
  const codeBlockChars = codeBlockMatches.join('').length;
  const codeRatio = sample.length > 0 ? codeBlockChars / sample.length : 0;

  // 2. 统计技术词汇密度
  const technicalWords =
    sample.match(/\bAPI\b|\bHTTP\b|\bCLI\b|配置|安装|版本|性能|算法|复杂度/g) ||
    [];
  const technicalDensity = technicalWords.length / (sample.length / 100);

  // 3. 判断主要类型
  if (codeRatio > 0.3) {
    return { primary: 'code', codeRatio };
  }

  if (technicalDensity > 3) {
    return { primary: 'technical', codeRatio };
  }

  return { primary: 'literary', codeRatio };
}

export class QwenRAGService {
  private chunks: Chunk[] = [];
  private apiKey: string;
  private embeddingCache = new Map<string, number[]>();
  private stats = {
    ragCalls: 0,
    normalCalls: 0,
    degradeReasons: [] as string[],
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 🔹 步骤1：构建文档索引
   */
  async buildIndex(markdown: string): Promise<void> {
    console.log('📚 开始构建RAG索引...');
    const startTime = Date.now();

    // 1. 语义分块
    const rawChunks = this.semanticChunk(markdown);
    console.log(`✂️ 文档已分成 ${rawChunks.length} 个语义块`);

    if (rawChunks.length === 0) {
      console.warn('⚠️ 文档太短，未生成有效分块');
      return;
    }

    // 2. 批量生成embedding
    const BATCH_SIZE = 10; // 通义千问建议每次不超过25个

    for (let i = 0; i < rawChunks.length; i += BATCH_SIZE) {
      const batch = rawChunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => c.content);

      try {
        const embeddings = await this.batchGetEmbeddings(texts);

        batch.forEach((chunk, idx) => {
          this.chunks.push({
            id: `chunk-${i + idx}`,
            content: chunk.content,
            embedding: embeddings[idx],
            metadata: chunk.metadata,
          });
        });

        // console.log(
        //   `📊 进度：${Math.min(i + BATCH_SIZE, rawChunks.length)}/${rawChunks.length}`,
        // );
      } catch (error) {
        console.error('Embedding生成失败', error);
        throw error;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ RAG索引构建完成！`);
    console.log(`   - 总块数：${this.chunks.length}`);
    console.log(`   - 耗时：${(duration / 1000).toFixed(1)}秒`);
  }

  /**
   * 🔹 步骤2：检索相关文档
   */
  async search(
    query: string,
    topK = 3,
    debug = false,
  ): Promise<SearchResult[]> {
    if (this.chunks.length === 0) {
      console.warn('⚠️ 索引为空，请先调用 buildIndex()');
      return [];
    }

    // 1. 查询文本转向量
    const queryEmbedding = await this.getEmbedding(query);

    // 2. 计算所有chunk的相似度
    const scores = this.chunks.map((chunk) => ({
      content: chunk.content,
      metadata: chunk.metadata,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding),
    }));
    const MIN_SIM = 0.2;
    const filtered = scores.filter((s) => s.score >= MIN_SIM);
    if (debug) {
      console.log('🔎 RAG.search 调试');
      console.log(' - query:', query.slice(0, 300));
      console.log(' - topK:', topK, ' MIN_SIM:', MIN_SIM);
      console.log(
        ' - chunks:',
        this.chunks.length,
        ' filtered:',
        filtered.length,
      );
    }

    // 3. 排序并返回Top-K
    const pool = filtered.length > 0 ? filtered : [];
    const results = pool.sort((a, b) => b.score - a.score).slice(0, topK);

    console.log('🔍 检索结果：');
    results.forEach((r, i) => {
      console.log(
        `  ${i + 1}. [${r.metadata.chapter}] 相似度: ${(r.score * 100).toFixed(1)}%`,
      );
    });

    return results;
  }

  /**
   * 🔹 步骤3：RAG增强的AI补全
   */
  async ragComplete(
    prefix: string,
    suffix: string,
    options: {
      topK?: number;
      showContext?: boolean;
      includeHistory?: boolean;
    } = {},
  ): Promise<string> {
    const {
      topK = RAG_CONFIG.DEFAULT_TOP_K,
      showContext = false,
      includeHistory = false,
    } = options;
    this.stats.ragCalls++;

    // 1. 智能提取查询（提取主题而非简单截取）
    const query = this.extractSmartQuery(prefix, suffix);

    // 2. 检索当前文档
    const currentResults = await this.search(query, topK, showContext);

    // 3. 检查结果质量并决定是否需要历史检索
    const highQualityResults = currentResults.filter(
      (r) => r.score >= RAG_CONFIG.HIGH_QUALITY_THRESHOLD,
    );

    let finalResults: SearchResult[] = [];

    // 4. 智能混合策略
    if (highQualityResults.length >= Math.ceil(topK / 2)) {
      // 当前文档结果足够好，优先使用
      finalResults = highQualityResults.slice(0, topK);
    } else if (includeHistory) {
      // 当前文档结果不足，补充历史文档
      try {
        const historyResults = await this.searchHistoryLocal(
          query,
          topK - highQualityResults.length,
          RAG_CONFIG.HIGH_QUALITY_THRESHOLD,
        );

        // 加权混合：当前文档权重更高
        const weightedCurrent = highQualityResults.map((r) => ({
          ...r,
          score: r.score * 1.2,
          source: 'current' as const,
        }));
        const weightedHistory = historyResults.map((r) => ({
          ...r,
          score: r.score * 0.8,
          source: 'history' as const,
        }));

        finalResults = [...weightedCurrent, ...weightedHistory]
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);
      } catch (error) {
        console.warn('历史检索失败，仅使用当前文档结果', error);
        finalResults = highQualityResults;
      }
    } else {
      finalResults = highQualityResults;
    }

    // 5. 降级检查
    if (finalResults.length === 0) {
      const reason = '未找到相关内容';
      this.stats.degradeReasons.push(reason);
      console.warn(`⚠️ RAG 降级: ${reason}`);
      return this.normalComplete(prefix, suffix);
    }

    if (
      finalResults.every((r) => r.score < RAG_CONFIG.HIGH_QUALITY_THRESHOLD)
    ) {
      const reason = `所有结果质量过低 (最高: ${(Math.max(...finalResults.map((r) => r.score)) * 100).toFixed(1)}%)`;
      this.stats.degradeReasons.push(reason);
      console.warn(`⚠️ RAG 降级: ${reason}`);
      return this.normalComplete(prefix, suffix);
    }

    // 6. 智能构建证据（动态调整长度，避免 Token 溢出）
    const docType = detectDocTypeForRAG(
      `${prefix.slice(-500)} ${suffix.slice(0, 200)}`,
    );

    // 计算可用 Token 数
    const estimateTokens = (text: string) => Math.ceil(text.length / 2);
    const maxInputTokens =
      RAG_CONFIG.MAX_CONTEXT_TOKENS - RAG_CONFIG.RESERVED_FOR_OUTPUT;

    // 构建 Style Guide
    const styleGuide = this.buildStyleGuide(docType.primary);
    const styleGuideTokens = estimateTokens(styleGuide);

    // 计算可用于证据和上下文的 Token
    const availableTokens = maxInputTokens - styleGuideTokens;
    const evidenceTokenBudget = Math.floor(availableTokens * 0.4);
    const contextTokenBudget = Math.floor(availableTokens * 0.6);

    // 动态调整证据长度
    const evidencePerChunk = Math.floor(
      (evidenceTokenBudget / finalResults.length) * 2,
    );
    const evidence = finalResults
      .map((r, idx) => {
        const source = r.source
          ? ` [${r.source === 'history' ? '历史' : '当前'}]`
          : '';
        const title = `#${idx + 1} ${r.metadata.chapter}${source}`;
        const snippet = r.content.slice(0, Math.max(100, evidencePerChunk));
        return `${title} (${(r.score * 100).toFixed(0)}%)\n${snippet}`;
      })
      .join('\n\n');

    // 动态调整上下文长度
    const contextChars = contextTokenBudget * 2;
    const prefixChars = Math.floor(contextChars * 0.7);
    const suffixChars = Math.floor(contextChars * 0.3);

    const injectedPrefix = `${styleGuide}\n${evidence}\n\n${prefix.slice(-prefixChars)}`;
    const injectedSuffix = suffix.slice(0, suffixChars);

    // 根据文档类型和代码比例调整温度
    let temperature = 0.7;
    if (docType.primary === 'code') {
      temperature = 0.2;
    } else if (docType.primary === 'technical') {
      temperature = docType.codeRatio > 0.1 ? 0.3 : 0.4;
    } else {
      temperature = 0.8;
    }

    if (showContext) {
      console.log('🧩 RAG.ragComplete 调试');
      console.log(' - query:', query.slice(0, 300));
      console.log(
        ' - 文档类型:',
        docType.primary,
        `(代码占比: ${(docType.codeRatio * 100).toFixed(1)}%)`,
      );
      console.log(' - 命中片段数:', finalResults.length);
      finalResults.forEach((r, i) => {
        const source = r.source ? ` [${r.source}]` : '';
        console.log(
          `   ${i + 1}. ${r.metadata.chapter}${source} - ${(r.score * 100).toFixed(1)}% (${r.content.length}字)`,
        );
      });
      console.log(' - Token 预估:');
      console.log(`   - Style Guide: ${styleGuideTokens}`);
      console.log(`   - Evidence: ${estimateTokens(evidence)}`);
      console.log(
        `   - Context: ${estimateTokens(injectedPrefix + injectedSuffix)}`,
      );
      console.log(' - Temperature:', temperature);
    }

    // 7. 调用 AI 生成
    try {
      const result = await chatInEditor({
        prefix: injectedPrefix,
        suffix: injectedSuffix,
        temperature,
      });

      if (showContext) {
        console.log('✅ RAG 生成成功:', result.slice(0, 100) + '...');
      }

      return result;
    } catch (error) {
      const reason = `生成失败: ${error.message}`;
      this.stats.degradeReasons.push(reason);
      console.error('❌ RAG 生成失败，降级到普通补全', error);
      return this.normalComplete(prefix, suffix);
    }
  }

  /**
   * 🔹 智能提取查询（提取主题而非简单截取）
   */
  private extractSmartQuery(prefix: string, suffix: string): string {
    // 1. 尝试提取最近的标题
    const recentHeader = this.extractRecentHeader(prefix);
    if (recentHeader) {
      return recentHeader;
    }

    // 2. 提取最后一个段落
    const paragraphs = prefix.split('\n\n').filter((p) => p.trim());
    if (paragraphs.length > 0) {
      const lastParagraph = paragraphs[paragraphs.length - 1];
      if (lastParagraph.length >= 50 && lastParagraph.length <= 500) {
        return lastParagraph;
      }
    }

    // 3. 降级：使用前后文组合
    return `${prefix.slice(-RAG_CONFIG.QUERY_PREFIX_LENGTH)} ${suffix.slice(0, RAG_CONFIG.QUERY_SUFFIX_LENGTH)}`.trim();
  }

  /**
   * 🔹 提取最近的标题
   */
  private extractRecentHeader(prefix: string): string | null {
    const lines = prefix.split('\n');
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 20); i--) {
      const match = lines[i].match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        return match[2];
      }
    }
    return null;
  }

  /**
   * 🔹 构建 Style Guide
   */
  private buildStyleGuide(docType: 'code' | 'technical' | 'literary'): string {
    const guides = {
      code: '[STYLE]\nType: code\nInstructions: Continue the code precisely; keep language and style; avoid explanations; maintain indentation; use the same programming language.',
      technical:
        '[STYLE]\nType: technical\nInstructions: Be concise and precise; keep markdown structure; keep terminology consistent; prefer bullet points when appropriate; avoid generic filler.',
      literary:
        '[STYLE]\nType: literary\nInstructions: Keep tone consistent; ensure smooth transitions; use natural and expressive language as context indicates.',
    };
    return guides[docType];
  }

  /**
   * 🔹 通义千问Embedding API调用
   */
  private async batchGetEmbeddings(texts: string[]): Promise<number[][]> {
    // console.log(this.apiKey, 'this.apiKey');
    // const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     model: 'text-embedding-v2', // 通义千问的Embedding模型
    //     input: {
    //       texts: texts
    //     },
    //     parameters: {
    //       text_type: 'document' // document或query
    //     }
    //   })
    // });

    // if (!response.ok) {
    //   throw new Error(`Embedding API调用失败: ${response.status}`);
    // }

    // const data = await response.json();

    // // 通义千问返回格式
    // return data.output.embeddings.map((item: any) => item.embedding);
    // 🔥 使用代理路径
    // const apiUrl = import.meta.env.DEV
    //   ? '/api/dashscope/api/v1/services/embeddings/text-embedding/text-embedding' // 开发环境走代理
    //   : 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding'; // 生产环境需要后端
    const apiUrl = import.meta.env.DEV
      ? 'http://localhost:3001/api/embedding'
      : '/api/embedding';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Embedding API调用失败: ${response.status}`);
    }

    const data = await response.json();

    if (!data.output || !data.output.embeddings) {
      throw new Error('Embedding API 返回格式错误');
    }

    return data.output.embeddings.map((item: any) => item.embedding);
  }

  /**
   * 🔹 获取单个文本的Embedding（带缓存）
   */
  private async getEmbedding(text: string): Promise<number[]> {
    const cacheKey = this.hashText(text);

    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    const embeddings = await this.batchGetEmbeddings([text]);
    const embedding = embeddings[0];

    this.embeddingCache.set(cacheKey, embedding);
    return embedding;
  }

  /**
   * 轻量历史检索：从 localStorage('wisdom_ark_history_docs') 读取历史文档，
   * 与当前 query 进行相似度计算，返回 Top-K 片段。失败则返回空数组。
   */
  private async searchHistoryLocal(
    query: string,
    topK: number,
    minSim: number,
  ): Promise<SearchResult[]> {
    try {
      const raw = localStorage.getItem('wisdom_ark_history_docs');
      if (!raw) return [];
      const docs = JSON.parse(raw) as {
        id: string;
        title?: string;
        content: string;
      }[];
      if (!Array.isArray(docs) || docs.length === 0) return [];

      const queryEmbedding = await this.getEmbedding(query);

      const allChunks: {
        content: string;
        metadata: any;
        embedding?: number[];
      }[] = [];

      for (const doc of docs) {
        const parts = this.semanticChunk(doc.content);
        for (const p of parts) {
          allChunks.push({
            content: p.content,
            metadata: {
              ...p.metadata,
              chapter: p.metadata.chapter || doc.title || p.metadata.chapter,
            },
          });
        }
      }

      const BATCH = 10;
      for (let i = 0; i < allChunks.length; i += BATCH) {
        const slice = allChunks.slice(i, i + BATCH);
        const embs = await this.batchGetEmbeddings(slice.map((s) => s.content));
        slice.forEach((s, idx) => {
          s.embedding = embs[idx];
        });
      }

      const results: SearchResult[] = allChunks
        .filter((s) => Array.isArray(s.embedding))
        .map((s) => ({
          content: s.content,
          metadata: s.metadata,
          score: this.cosineSimilarity(queryEmbedding, s.embedding as number[]),
        }))
        .filter((r) => r.score >= minSim)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      return results;
    } catch {
      return [];
    }
  }

  /**
   * 🔹 语义分块（保持段落完整性）
   */
  private semanticChunk(markdown: string): {
    content: string;
    metadata: { chapter: string; level: number; position: number };
  }[] {
    const chunks = [];
    let currentChapter = '引言';
    let level = 0;
    let position = 0;

    const lines = markdown.split('\n');
    let buffer = '';

    for (const line of lines) {
      // 检测Markdown标题
      //返回的一个数组
      /**
       * [
          '# 这是 1 级标题',  // 完整匹配的字符串（索引 0）
          '#',                // 捕获组 1：1 个 #（标题级别）
          '这是 1 级标题',     // 捕获组 2：标题文本
          index: 0,           // 匹配开始位置（行首）
          input: '# 这是 1 级标题',  // 原始输入字符串
          groups: undefined   // 无命名捕获组时为 undefined
        ]
       */
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headerMatch) {
        // 保存之前的内容块
        if (buffer.trim().length > 100) {
          chunks.push({
            content: buffer.trim(),
            metadata: { chapter: currentChapter, level, position },
          });
          position++;
          buffer = '';
        }

        // 更新章节信息
        level = headerMatch[1].length;
        currentChapter = headerMatch[2];
      } else {
        buffer += line + '\n';

        // 防止单个块过大（800字）
        if (buffer.length > 800) {
          const splitPoint = Math.max(
            buffer.lastIndexOf('。'),
            buffer.lastIndexOf('\n\n'),
          );
          //如果找到了有效的分隔点
          if (splitPoint > 0) {
            chunks.push({
              content: buffer.slice(0, splitPoint + 1).trim(),
              metadata: { chapter: currentChapter, level, position },
            });
            position++;
            buffer = buffer.slice(splitPoint + 1);
          }
        }
      }
    }

    // 保存最后的buffer
    if (buffer.trim().length > 100) {
      chunks.push({
        content: buffer.trim(),
        metadata: { chapter: currentChapter, level, position },
      });
    }

    return chunks;
  }

  /**
   * 🔹 余弦相似度计算
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('向量维度不匹配');
    }

    let dotProduct = 0; //点积
    let normA = 0; // 向量A的模
    let normB = 0; // 向量B的模

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    } // 点积

    const denominator = Math.sqrt(normA) * Math.sqrt(normB); // ||A|| x ||B||
    return denominator === 0 ? 0 : dotProduct / denominator; //cos(θ)
  }

  private hashText(text: string): string {
    let hash = 5381;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 33) ^ text.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
  }

  /**
   * 🔹 普通补全（无RAG）
   */
  private async normalComplete(
    prefix: string,
    suffix: string,
  ): Promise<string> {
    this.stats.normalCalls++;
    return await chatInEditor({
      prefix: prefix.slice(-RAG_CONFIG.INJECTED_PREFIX_LENGTH),
      suffix: suffix.slice(0, RAG_CONFIG.INJECTED_SUFFIX_LENGTH),
    });
  }

  /**
   * 🔹 获取统计信息
   */
  getStats() {
    const chapters = [...new Set(this.chunks.map((c) => c.metadata.chapter))];
    const totalTokens = this.chunks.reduce((sum, chunk) => {
      return sum + Math.ceil(chunk.content.length / 2);
    }, 0);

    return {
      totalChunks: this.chunks.length,
      chapters,
      totalTokens,
      cacheSize: this.embeddingCache.size,
      averageChunkSize:
        this.chunks.length > 0
          ? Math.round(
              this.chunks.reduce((sum, c) => sum + c.content.length, 0) /
                this.chunks.length,
            )
          : 0,
      ragCalls: this.stats.ragCalls,
      normalCalls: this.stats.normalCalls,
      degradeRate:
        this.stats.ragCalls > 0
          ? ((this.stats.normalCalls / this.stats.ragCalls) * 100).toFixed(1) +
            '%'
          : '0%',
      recentDegradeReasons: this.stats.degradeReasons.slice(-5),
    };
  }

  /**
   * 🔹 清理资源
   */
  clear() {
    this.chunks = [];
    this.embeddingCache.clear();
    console.log('🗑️ RAG索引已清空');
  }
}
