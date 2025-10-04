import { useState, useEffect, useMemo } from 'react';
import 'highlight.js/styles/github.css'; // 代码高亮样式（可选其他主题）
import { mockMarked } from '@/utils/mdRendering';

export const FixedMarkdownRenderer = ({ rawText }) => {
  const [markdownHtml, setMarkdownHtml] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 使用useMemo优化依赖
  const processedText = useMemo(() => {
    if (!rawText) return '';

    try {
      // 安全的URL解码
      let decodedText = rawText;
      if (typeof rawText === 'string' && rawText.includes('%')) {
        try {
          decodedText = decodeURIComponent(rawText);
        } catch (decodeError) {
          console.warn('URL解码失败，使用原始文本:', decodeError);
          decodedText = rawText;
        }
      }

      // 规范化代码块标记和清理文本
      const normalizedText = String(decodedText)
        .replace(/```js\b/g, '```javascript')
        .replace(/```ts\b/g, '```typescript')
        .replace(/```html\b/g, '```html')
        .replace(/\r\n/g, '\n') // 统一换行符
        .replace(/\r/g, '\n');

      return normalizedText;
    } catch (error) {
      console.error('文本预处理失败:', error);
      return String(rawText || '');
    }
  }, [rawText]);

  useEffect(() => {
    const renderMarkdown = async () => {
      if (!processedText) {
        setMarkdownHtml('');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const html = await mockMarked.parse(processedText);
        setMarkdownHtml(html);
      } catch (error) {
        console.error('Markdown解析失败:', error);
        setError(error.message);
        setMarkdownHtml('');
      } finally {
        setIsLoading(false);
      }
    };

    renderMarkdown();
  }, [processedText]);

  if (isLoading) {
    return (
      <div
        className="markdown-content loading"
        style={{
          textAlign: 'center',
          color: '#666',
          fontStyle: 'italic',
        }}
      >
        正在渲染Markdown...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="markdown-content error"
        style={{
          color: '#d73a49',
          border: '1px solid #fdaeb7',
          borderRadius: '6px',
          margin: '16px 0',
        }}
      >
        <strong>Markdown解析错误:</strong> {error}
        <details style={{ marginTop: '12px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
            查看原始内容
          </summary>
          <pre
            style={{
              fontSize: '12px',
              overflow: 'auto',
              background: '#f8f9fa',
              padding: '8px',
              borderRadius: '4px',
              marginTop: '8px',
            }}
          >
            {String(rawText || '').slice(0, 500)}
            {String(rawText || '').length > 500
              ? '\n...(内容过长，已截断)'
              : ''}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      className="markdown-content"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: '1.6',
      }}
      dangerouslySetInnerHTML={{ __html: markdownHtml }}
    />
  );
};
