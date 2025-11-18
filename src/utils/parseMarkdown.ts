interface MarkdownOptions {
  breaks?: boolean;
  gfm?: boolean;
  tables?: boolean;
  strikethrough?: boolean;
  tasklist?: boolean;
}

interface CodeBlock {
  language: string;
  code: string;
  original: string;
}

// HTML转义映射
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

// HTML转义函数
function escapeHtml(text: string): string {
  if (!text) return '';
  return text.replace(
    /[&<>"']/g,
    (match: string): string => HTML_ESCAPE_MAP[match],
  );
}

// 解析行内元素
function parseInlineElements(
  text: string,
  options: MarkdownOptions = {},
): string {
  if (!text) return '';

  // 处理图片
  text = text.replace(
    /!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g,
    (match: string, alt: string, src: string, title?: string): string => {
      const titleAttr: string = title ? ` title="${escapeHtml(title)}"` : '';
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${titleAttr} style="max-width: 100%; height: auto;">`;
    },
  );

  // 处理链接
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g,
    (match: string, linkText: string, url: string, title?: string): string => {
      const titleAttr: string = title ? ` title="${escapeHtml(title)}"` : '';
      const target: string = url.startsWith('http')
        ? ' target="_blank" rel="noopener noreferrer"'
        : '';
      return `<a href="${escapeHtml(url)}"${titleAttr}${target}>${parseInlineElements(linkText, options)}</a>`;
    },
  );

  // 处理自动链接
  text = text.replace(
    /<(https?:\/\/[^>]+)>/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  text = text.replace(/<([^>]+@[^>]+\.[^>]+)>/g, '<a href="mailto:$1">$1</a>');

  // 处理删除线
  if (options.strikethrough && options.gfm) {
    text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  }

  // 处理粗体
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // 处理斜体
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

  return text;
}

// 完整的Markdown解析函数
export const parseMarkdown = (markdown: string) => {
  if (!markdown) return '<p></p>';

  let html = markdown;

  // 代码块（需要在其他转换之前处理）
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
  });

  // 链接
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // 标题
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // 删除线
  html = html.replace(/~~(.*?)~~/g, '<s>$1</s>');

  // 粗体和斜体（注意顺序很重要）
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');

  // 行内代码
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // 水平分割线
  html = html.replace(/^---+$/gm, '<hr>');

  // 引用
  html = html.replace(/^> (.*$)/gim, '<blockquote><p>$1</p></blockquote>');

  // 处理列表
  const lines = html.split('\n');
  const result = [];
  let inUnorderedList = false;
  let inOrderedList = false;

  // ESLint 规则 @typescript-eslint/prefer-for-of 建议使用更简洁的 for-of 循环代替传统 for 循环，当循环仅用于遍历数组且不依赖索引时。
  for (const rawLine of lines) {
    const line = rawLine.trim();

    // 无序列表
    const unorderedMatch = line.match(/^[*\-+] (.*)$/);
    // 有序列表
    const orderedMatch = line.match(/^(\d+)\. (.*)$/);

    if (unorderedMatch) {
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }
      if (!inUnorderedList) {
        result.push('<ul>');
        inUnorderedList = true;
      }
      result.push(`<li>${parseInlineElements(unorderedMatch[1])}</li>`);
    } else if (orderedMatch) {
      if (inUnorderedList) {
        result.push('</ul>');
        inUnorderedList = false;
      }
      if (!inOrderedList) {
        result.push('<ol>');
        inOrderedList = true;
      }
      result.push(`<li>${parseInlineElements(orderedMatch[2])}</li>`);
    } else {
      // 关闭所有列表
      if (inUnorderedList) {
        result.push('</ul>');
        inUnorderedList = false;
      }
      if (inOrderedList) {
        result.push('</ol>');
        inOrderedList = false;
      }

      // 处理其他内容
      if (line && !line.match(/^<(h[1-6]|blockquote|pre|hr)/)) {
        result.push(`<p>${parseInlineElements(line)}</p>`);
      } else if (line) {
        result.push(line);
      }
    }
  }

  // 确保列表被关闭
  if (inUnorderedList) result.push('</ul>');
  if (inOrderedList) result.push('</ol>');

  return result
    .join('\n')
    .replace(
      /<p><(h[1-6]|blockquote|pre|hr)([^>]*)>(.*?)<\/\1><\/p>/g,
      '<$1$2>$3</$1>',
    )
    .replace(/<p><hr><\/p>/g, '<hr>')
    .replace(/<p><\/p>/g, '')
    .replace(/\n{3,}/g, '\n\n');
};
