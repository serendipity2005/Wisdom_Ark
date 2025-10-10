// 常见编程语言配置
const LANGUAGE_CONFIG: Record<
  string,
  { displayName: string; category: string; color: string }
> = {
  javascript: { displayName: 'JavaScript', category: 'web', color: '#f7df1e' },
  typescript: { displayName: 'TypeScript', category: 'web', color: '#3178c6' },
  jsx: { displayName: 'JSX', category: 'web', color: '#61dafb' },
  tsx: { displayName: 'TSX', category: 'web', color: '#3178c6' },
  python: { displayName: 'Python', category: 'backend', color: '#3776ab' },
  java: { displayName: 'Java', category: 'backend', color: '#007396' },
  cpp: { displayName: 'C++', category: 'system', color: '#00599c' },
  c: { displayName: 'C', category: 'system', color: '#a8b9cc' },
  csharp: { displayName: 'C#', category: 'backend', color: '#239120' },
  go: { displayName: 'Go', category: 'backend', color: '#00add8' },
  rust: { displayName: 'Rust', category: 'system', color: '#ce412b' },
  php: { displayName: 'PHP', category: 'backend', color: '#777bb4' },
  ruby: { displayName: 'Ruby', category: 'backend', color: '#cc342d' },
  swift: { displayName: 'Swift', category: 'mobile', color: '#fa7343' },
  kotlin: { displayName: 'Kotlin', category: 'mobile', color: '#7f52ff' },
  html: { displayName: 'HTML', category: 'web', color: '#e34c26' },
  css: { displayName: 'CSS', category: 'web', color: '#1572b6' },
  scss: { displayName: 'SCSS', category: 'web', color: '#cc6699' },
  sql: { displayName: 'SQL', category: 'database', color: '#00758f' },
  shell: { displayName: 'Shell', category: 'script', color: '#89e051' },
  bash: { displayName: 'Bash', category: 'script', color: '#4eaa25' },
  json: { displayName: 'JSON', category: 'data', color: '#292929' },
  yaml: { displayName: 'YAML', category: 'data', color: '#cb171e' },
  xml: { displayName: 'XML', category: 'data', color: '#0060ac' },
  markdown: { displayName: 'Markdown', category: 'markup', color: '#083fa1' },
  text: { displayName: 'Plain Text', category: 'text', color: '#666666' },
};

// 获取语言信息
function getLanguageInfo(lang: string): {
  displayName: string;
  category: string;
  language: string;
  color: string;
} {
  const normalizedLang = (lang || '').toLowerCase().trim();
  const config = LANGUAGE_CONFIG[normalizedLang];

  return {
    language: normalizedLang || 'text',
    displayName: config?.displayName || lang || 'Code',
    category: config?.category || 'general',
    color: config?.color || '#666666',
  };
}

// 渲染代码块
function renderCodeBlock(lang: string, code: string): string {
  const langInfo = getLanguageInfo(lang);

  const safeCode = String(code || '')
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const langClass = langInfo.language ? `language-${langInfo.language}` : '';

  // 根据语言类型应用不同的样式
  const borderColor = langInfo.color;
  const categoryBadge =
    langInfo.category !== 'general'
      ? `<span style="background: ${borderColor}20; color: ${borderColor}; padding: 2px 8px; border-radius: 3px; font-size: 10px; margin-left: 8px; font-weight: 500;">${langInfo.category}</span>`
      : '';

  return `<div class="code-block" data-language="${langInfo.language}" data-category="${langInfo.category}" style="margin: 16px 0; border-left: 3px solid ${borderColor};">
    <div class="code-header" style="background: #f6f8fa; padding: 8px 16px; border-bottom: 1px solid #e1e4e8; display: flex; align-items: center; justify-content: space-between; border-radius: 6px 6px 0 0;">
      <div style="display: flex; align-items: center;">
        <span style="color: ${borderColor}; font-size: 12px; font-weight: 600; text-transform: uppercase;">${langInfo.displayName}</span>
        ${categoryBadge}
      </div>
      <button class="code-copy-btn" onclick="copyCode(this)" style="background: white; border: 1px solid #e1e4e8; padding: 4px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; color: #586069; transition: all 0.2s;" onmouseover="this.style.background='#f6f8fa'" onmouseout="this.style.background='white'">复制</button>
    </div>
    <pre style="background: #f6f8fa; padding: 16px; border-radius: 0 0 6px 6px; overflow-x: auto; margin: 0; border: 1px solid #e1e4e8; border-top: none;"><code class="hljs ${langClass}" style="background: none; padding: 0; font-family: 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; line-height: 1.5; font-size: 14px; white-space: pre;">${safeCode}</code></pre>
  </div>`;
}

export const mockMarked = {
  use: (config: null) => {
    mockMarked.config = config;
  },
  parse: async (text: any) => {
    let html = text;
    const codeBlocks: string[] = [];
    const inlineCodes: string[] = [];

    // 1. 处理代码块 - 使用新的渲染函数
    html = html.replace(
      /```(\w+)?\s*\n([\s\S]*?)\n```/g,
      (match: any, lang: any, code: any) => {
        const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push(renderCodeBlock(lang, code));
        return placeholder;
      },
    );

    // 2. 处理行内代码
    html = html.replace(/`([^`\n]+)`/g, (match: any, code: any) => {
      const safeCode = String(code)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

      const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
      inlineCodes.push(
        `<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; color: #e74c3c; font-size: 0.9em; border: 1px solid #e1e4e8;">${safeCode}</code>`,
      );
      return placeholder;
    });

    // 3. 处理标题
    html = html.replace(
      /^### (.*$)/gm,
      '<h3 style="margin: 20px 0 10px 0; font-size: 1.25em; color: #2c3e50; font-weight: 600; border-bottom: 1px solid #eee; padding-bottom: 8px;">$1</h3>',
    );
    html = html.replace(
      /^## (.*$)/gm,
      '<h2 style="margin: 24px 0 12px 0; font-size: 1.5em; color: #2c3e50; font-weight: 600; border-bottom: 2px solid #eee; padding-bottom: 10px;">$1</h2>',
    );
    html = html.replace(
      /^# (.*$)/gm,
      '<h1 style="margin: 32px 0 16px 0; font-size: 2em; color: #2c3e50; font-weight: 700; border-bottom: 3px solid #3498db; padding-bottom: 12px;">$1</h1>',
    );

    // 4. 处理粗体和斜体
    html = html.replace(
      /\*\*(.*?)\*\*/g,
      '<strong style="color: #2c3e50; font-weight: 600;">$1</strong>',
    );
    html = html.replace(
      /\*(.*?)\*/g,
      '<em style="color: #7f8c8d; font-style: italic;">$1</em>',
    );

    // 5. 收集所有数字列表项
    const listItems: any[] = [];
    html = html.replace(
      /^(\d+)\.\s+(.*)$/gm,
      (match: any, num: any, content: any) => {
        listItems.push(content);
        return `__LIST_ITEM_${listItems.length - 1}__`;
      },
    );

    // 6. 将连续的列表项合并为一个有序列表
    if (listItems.length > 0) {
      html = html.replace(/(__LIST_ITEM_\d+__\n?)+/g, (match: string) => {
        const itemsInThisList: any[] = [];
        const itemMatches = match.match(/__LIST_ITEM_(\d+)__/g);

        if (itemMatches) {
          itemMatches.forEach((itemMatch) => {
            const index = parseInt(itemMatch.match(/__LIST_ITEM_(\d+)__/)[1]);
            itemsInThisList.push(listItems[index]);
          });
        }

        const listHtml = itemsInThisList
          .map(
            (item) =>
              `<li style="margin: 6px 0; line-height: 1.6; ">${item}</li>`,
          )
          .join('\n');

        return `<ol style="margin: 16px 0; padding-left: 24px;">\n${listHtml}\n</ol>`;
      });
    }

    // 7. 处理段落
    const lines = html.split('\n');
    const paragraphs = [];
    let currentParagraph = [];
    let i = 0;
    for (const line of lines) {
      const trimmedLine = line.trim();

      // 如果是空行
      if (trimmedLine === '') {
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join('\n'));
          currentParagraph = [];
        }
        i++;
        continue;
      }

      // 如果是HTML块级元素或占位符，单独成段
      if (
        trimmedLine.includes('<pre>') ||
        trimmedLine.includes('<h1>') ||
        trimmedLine.includes('<h2>') ||
        trimmedLine.includes('<h3>') ||
        trimmedLine.includes('<ol>') ||
        trimmedLine.includes('<div class="code-block"') ||
        trimmedLine.includes('</pre>') ||
        trimmedLine.includes('</ol>') ||
        trimmedLine.includes('</div>') ||
        trimmedLine.includes('__CODE_BLOCK_') ||
        trimmedLine.includes('__INLINE_CODE_')
      ) {
        // 先处理当前段落
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join('\n'));
          currentParagraph = [];
        }
        // HTML块级元素单独成段
        paragraphs.push(trimmedLine);
        i++;
        continue;
      }

      currentParagraph.push(trimmedLine);
      i++;
    }

    // 处理最后一个段落
    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join('\n'));
    }

    // 将段落转换为HTML
    html = paragraphs
      .map((paragraph) => {
        const trimmed = paragraph.trim();
        if (trimmed === '') return '';

        // 如果已经是HTML标签或占位符，直接返回
        if (
          trimmed.includes('<pre>') ||
          trimmed.includes('<h1>') ||
          trimmed.includes('<h2>') ||
          trimmed.includes('<h3>') ||
          trimmed.includes('<ol>') ||
          trimmed.includes('<div class="code-block"') ||
          trimmed.startsWith('<') ||
          trimmed.includes('__CODE_BLOCK_') ||
          trimmed.includes('__INLINE_CODE_')
        ) {
          return trimmed;
        }

        // 普通段落
        return `<p style="text-align: justify;">${trimmed.replace(/\n/g, '<br>')}</p>`;
      })
      .filter((p) => p.trim() !== '')
      .join('\n\n');

    // 最后恢复代码块和行内代码
    codeBlocks.forEach((codeBlock, index) => {
      html = html.replace(`__CODE_BLOCK_${index}__`, codeBlock);
    });

    inlineCodes.forEach((inlineCode, index) => {
      html = html.replace(`__INLINE_CODE_${index}__`, inlineCode);
    });

    return html;
  },
  config: null,
};

// 复制代码功能（添加到全局）
if (typeof window !== 'undefined') {
  (window as any).copyCode = function (button: HTMLButtonElement) {
    const codeBlock = button.closest('.code-block');
    if (!codeBlock) return;

    const code = codeBlock.querySelector('code')?.textContent || '';

    navigator.clipboard
      .writeText(code)
      .then(() => {
        const originalText = button.textContent;
        button.textContent = '已复制！';

        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      })
      .catch((err) => {
        console.error('复制失败:', err);
        button.textContent = '复制失败';
        setTimeout(() => {
          button.textContent = '复制';
        }, 2000);
      });
  };
}
