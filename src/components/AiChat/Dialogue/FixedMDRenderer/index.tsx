import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import 'highlight.js/styles/github.css'; // 代码高亮样式（可选其他主题）
import { mockMarked } from '@/utils/mdRendering';

interface MarkdownRendererProps {
  rawText: string;
}

export const FixedMarkdownRenderer = ({ rawText }: MarkdownRendererProps) => {
  const [markdownHtml, setMarkdownHtml] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 使用 ref 来追踪渲染状态，避免不必要的重渲染
  const renderingRef = useRef(false);
  const lastProcessedTextRef = useRef('');
  const renderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 防抖渲染函数
  const debouncedRender = useCallback(async (text: string) => {
    // 清除之前的定时器
    if (renderTimerRef.current) {
      clearTimeout(renderTimerRef.current);
    }

    // 如果正在渲染，跳过这次更新
    if (renderingRef.current) {
      renderTimerRef.current = setTimeout(() => debouncedRender(text), 100);
      return;
    }

    // 如果文本没有变化，跳过渲染
    if (text === lastProcessedTextRef.current) {
      return;
    }

    renderingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const html = await mockMarked.parse(text);

      // 使用 RAF 来确保 DOM 更新的平滑性
      requestAnimationFrame(() => {
        setMarkdownHtml(html);
        lastProcessedTextRef.current = text;
        setIsLoading(false);
        renderingRef.current = false;
      });
    } catch (err) {
      console.error('Markdown解析失败:', err);
      setError(err.message);
      setMarkdownHtml('');
      setIsLoading(false);
      renderingRef.current = false;
    }
  }, []);

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

  // 使用防抖渲染
  useEffect(() => {
    if (!processedText) {
      setMarkdownHtml('');
      return;
    }

    // 使用防抖渲染，减少频繁更新
    const timeoutId = setTimeout(() => {
      debouncedRender(processedText);
    }, 50); // 50ms 防抖延迟

    return () => {
      clearTimeout(timeoutId);
    };
  }, [processedText, debouncedRender]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (renderTimerRef.current) {
        clearTimeout(renderTimerRef.current);
      }
    };
  }, []);

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
      className={`markdown-content ${isLoading ? 'loading' : ''}`}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        lineHeight: '1.6',
        transition: 'opacity 0.1s ease-in-out', // 添加平滑过渡
        opacity: isLoading ? 0.8 : 1, // 加载时稍微降低透明度
        minHeight: markdownHtml ? 'auto' : '20px', // 防止高度突变
      }}
      dangerouslySetInnerHTML={{ __html: markdownHtml }}
    />
  );
};
