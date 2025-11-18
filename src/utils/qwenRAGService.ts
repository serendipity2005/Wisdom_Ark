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
  };
}

interface SearchResult {
  content: string;
  score: number;
  metadata: any;
}

export class QwenRAGService {
  private chunks: Chunk[] = [];
  private apiKey: string;
  private embeddingCache = new Map<string, number[]>();

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

        console.log(
          `📊 进度：${Math.min(i + BATCH_SIZE, rawChunks.length)}/${rawChunks.length}`,
        );
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
    } = {},
  ): Promise<string> {
    const { topK = 3, showContext = false } = options;

    // 1. 提取查询（结合前后文）
    const query = `${prefix.slice(-200)} ${suffix.slice(0, 100)}`.trim();

    // 2. 检索相关段落
    const results = await this.search(query, topK, showContext);

    if (results.length === 0) {
      console.warn('⚠️ 未找到相关内容，使用普通补全');
      return this.normalComplete(prefix, suffix);
    }

    // 3. 构建精简证据摘要，注入到前文以引导补全
    const evidence = results
      .map((r, idx) => {
        const title = r.metadata.chapter
          ? `#${idx + 1} ${r.metadata.chapter}`
          : `#${idx + 1}`;
        const snippet =
          r.content.length > 200 ? r.content.slice(0, 200) : r.content;
        return `${title} (${(r.score * 100).toFixed(0)}%)\n${snippet}`;
      })
      .join('\n\n');
    const injectedPrefix = `${evidence}\n\n${prefix.slice(-500)}`;

    if (showContext) {
      console.log('🧩 RAG.ragComplete 调试');
      console.log(' - query:', query.slice(0, 300));
      console.log(' - 命中片段数:', results.length);
      results.forEach((r, i) => {
        const len = r.content.length;
        console.log(
          `   ${i + 1}. chapter=${r.metadata.chapter} score=${(r.score * 100).toFixed(1)}% len=${len}`,
        );
      });
      console.log(' - 证据摘要长度:', evidence.length);
      console.log('📝 注入证据预览：\n', injectedPrefix.slice(0, 500) + '...');
    }

    // 4. 调用通义千问生成
    try {
      const result = await chatInEditor({
        prefix: injectedPrefix,
        suffix: suffix.slice(0, 200),
      });
      console.log('通义千问');
      console.log(result, '555555');

      return result;
    } catch (error) {
      console.error('RAG补全失败', error);
      // 降级到普通补全
      return this.normalComplete(prefix, suffix);
    }
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
    const apiUrl = 'http://localhost:3001/api/embedding';

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
    console.log(data, 'data');
    // 返回向量数组
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

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
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
    return await chatInEditor({
      prefix: prefix.slice(-500),
      suffix: suffix.slice(0, 200),
    });
  }

  /**
   * 🔹 获取统计信息
   */
  getStats() {
    const chapters = [...new Set(this.chunks.map((c) => c.metadata.chapter))];
    const totalTokens = this.chunks.reduce((sum, chunk) => {
      return sum + Math.ceil(chunk.content.length / 2); // 中文约2字符=1token
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
