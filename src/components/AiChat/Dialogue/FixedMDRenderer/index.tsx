import { useState, useEffect, useMemo, useRef } from 'react';
import 'highlight.js/styles/github.css';
import { mockMarked } from '@/utils/mdRendering';

interface MarkdownRendererProps {
  rawText: string;
}

export const FixedMarkdownRenderer = ({ rawText }: MarkdownRendererProps) => {
  const [markdownHtml, setMarkdownHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const lastProcessedTextRef = useRef('');

  // 使用useMemo优化文本预处理
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

  // 直接渲染,移除防抖和RAF,减少延迟
  useEffect(() => {
    if (!processedText) {
      setMarkdownHtml('');
      lastProcessedTextRef.current = '';
      return;
    }

    // 避免重复渲染相同内容
    if (processedText === lastProcessedTextRef.current) {
      return;
    }

    const renderMarkdown = async () => {
      try {
        const html = await mockMarked.parse(processedText);
        setMarkdownHtml(html);
        lastProcessedTextRef.current = processedText;
        setError(null);
      } catch (err: any) {
        console.error('Markdown解析失败:', err);
        setError(err?.message || 'Unknown error');
        setMarkdownHtml('');
      }
    };

    renderMarkdown();
  }, [processedText]);

  if (error) {
    return (
      <div
        className="markdown-content error"
        style={{
          color: '#d73a49',
          border: '1px solid #fdaeb7',
          borderRadius: '6px',
          padding: '12px',
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
