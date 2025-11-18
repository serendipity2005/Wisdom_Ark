import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const app = express();

// 中间件
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' })); // 增加限制，支持大文档
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
/**
 * 通义千问 Embedding API 代理
 * POST /api/embedding
 * Body: { texts: string[] }
 */
app.post('/api/embedding', async (req, res) => {
  console.log('请求了');

  const startTime = Date.now();

  try {
    const { texts } = req.body;
    console.log(texts, 'texts');

    // 验证请求
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: '请求参数错误',
        message: 'texts必须是非空数组',
      });
    }

    // 检查API Key
    const apiKey = process.env.DASHSCOPE_API_KEY;
    console.log('');

    if (!apiKey) {
      console.error('❌ 未配置DASHSCOPE_API_KEY环境变量');
      return res.status(500).json({
        error: '服务器配置错误',
        message: '未配置API Key',
      });
    }

    console.log(`📝 Embedding请求: ${texts.length} 个文本块`);

    // 调用通义千问API
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-v2',
          input: {
            texts: texts,
          },
          parameters: {
            text_type: 'document',
          },
        }),
      },
    );

    // 处理响应
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 通义千问API错误:', response.status, errorText);

      return res.status(response.status).json({
        error: '通义千问API调用失败',
        message: errorText,
        status: response.status,
      });
    }

    const data = await response.json();
    const duration = Date.now() - startTime;

    console.log(`✅ Embedding成功: ${texts.length} 个向量, 耗时 ${duration}ms`);

    // 返回结果
    res.json(data);
  } catch (error) {
    console.error('❌ Embedding代理错误:', error);

    res.status(500).json({
      error: '服务器内部错误',
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log(`✅ 服务器启动成功！`);
  console.log(`📡 监听端口: ${PORT}`);
  console.log(
    `🔑 API Key: ${process.env.DASHSCOPE_API_KEY ? '已配置 ✓' : '未配置 ✗'}`,
  );
  console.log('');
  console.log('📋 可用路由:');
  console.log(`   POST http://localhost:${PORT}/api/embedding`);
  console.log(`   POST http://localhost:${PORT}/api/chat`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log('========================================');
  console.log('');
});
export default app;
