import hljs from 'highlight.js';

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

// 转义 HTML
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 渲染代码块(带语法高亮)
function renderCodeBlock(lang: string, code: string): string {
  const langInfo = getLanguageInfo(lang);
  const trimmedCode = code.trim();

  // 使用 highlight.js 进行语法高亮
  let highlightedCode: string;
  try {
    if (
      langInfo.language &&
      langInfo.language !== 'text' &&
      hljs.getLanguage(langInfo.language)
    ) {
      highlightedCode = hljs.highlight(trimmedCode, {
        language: langInfo.language,
        ignoreIllegals: true,
      }).value;
    } else {
      // 尝试自动检测
      const result = hljs.highlightAuto(trimmedCode);
      highlightedCode = result.value;
    }
  } catch (e) {
    console.warn('代码高亮失败，使用纯文本:', e);
    highlightedCode = escapeHtml(trimmedCode);
  }

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
    <pre style="background: #f6f8fa; padding: 16px; border-radius: 0 0 6px 6px; overflow-x: auto; margin: 0; border: 1px solid #e1e4e8; border-top: none;"><code class="hljs language-${langInfo.language}" style="background: none; padding: 0; font-family: 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; line-height: 1.5; font-size: 14px; white-space: pre;">${highlightedCode}</code></pre>
  </div>`;
}

export const mockMarked = {
  use: (config: any) => {
    mockMarked.config = config;
  },
  parse: async (text: string) => {
    let html = text;
    const codeBlocks: string[] = [];
    const inlineCodes: string[] = [];
    const tables: string[] = [];

    // 1. 处理代码块
    html = html.replace(
      /```(\w+)?\s*\n([\s\S]*?)\n```/g,
      (match: string, lang: string, code: string) => {
        const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push(renderCodeBlock(lang, code));
        return placeholder;
      },
    );

    // 2. 处理行内代码
    html = html.replace(/`([^`\n]+)`/g, (match: string, code: string) => {
      const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
      inlineCodes.push(
        `<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; color: #e74c3c; font-size: 0.9em; border: 1px solid #e1e4e8;">${escapeHtml(code)}</code>`,
      );
      return placeholder;
    });

    // 3. 处理表格
    html = html.replace(
      /(\|.+\|[\r\n]+)(\|[-:| ]+\|[\r\n]+)((?:\|.+\|[\r\n]*)+)/g,
      (match: string, header: string, separator: string, rows: string) => {
        const placeholder = `__TABLE_${tables.length}__`;

        // 解析表头
        const headerCells = header
          .trim()
          .split('|')
          .filter((cell) => cell.trim())
          .map(
            (cell) =>
              `<th style="border: 1px solid #e1e4e8; padding: 8px 12px; background: #f6f8fa; font-weight: 600; text-align: left;">${cell.trim()}</th>`,
          )
          .join('');

        // 解析表格行
        const rowsHtml = rows
          .trim()
          .split('\n')
          .filter((row) => row.trim())
          .map((row) => {
            const cells = row
              .trim()
              .split('|')
              .filter((cell) => cell.trim())
              .map(
                (cell) =>
                  `<td style="border: 1px solid #e1e4e8; padding: 8px 12px;">${cell.trim()}</td>`,
              )
              .join('');
            return `<tr>${cells}</tr>`;
          })
          .join('');

        const tableHtml = `<table style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #e1e4e8;">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>`;

        tables.push(tableHtml);
        return placeholder;
      },
    );

    // 4. 转义普通文本中的 HTML
    const protectedPlaceholders: string[] = [];
    html = html.replace(
      /(__(?:CODE_BLOCK|INLINE_CODE|TABLE)_\d+__)/g,
      (match) => {
        const idx = protectedPlaceholders.length;
        protectedPlaceholders.push(match);
        return `___PROTECTED_${idx}___`;
      },
    );

    html = escapeHtml(html);

    protectedPlaceholders.forEach((placeholder, idx) => {
      html = html.replace(`___PROTECTED_${idx}___`, placeholder);
    });

    // 5. 处理标题
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

    // 6. 处理引用块
    html = html.replace(
      /^&gt; (.*)$/gm,
      '<blockquote style="border-left: 4px solid #3498db; margin: 16px 0; padding: 8px 16px; background: #f8f9fa; color: #555;">$1</blockquote>',
    );

    // 7. 处理删除线
    html = html.replace(
      /~~(.*?)~~/g,
      '<del style="text-decoration: line-through; color: #999;">$1</del>',
    );

    // 8. 处理粗体和斜体
    html = html.replace(
      /\*\*(.*?)\*\*/g,
      '<strong style="color: #2c3e50; font-weight: 600;">$1</strong>',
    );
    html = html.replace(
      /\*(.*?)\*/g,
      '<em style="color: #7f8c8d; font-style: italic;">$1</em>',
    );

    // 9. 处理链接 [text](url)
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" style="color: #3498db; text-decoration: none; border-bottom: 1px solid #3498db;" target="_blank">$1</a>',
    );

    // 10. 处理任务列表
    html = html.replace(
      /^- \[x\] (.*)$/gm,
      '<div style="margin: 6px 0;"><input type="checkbox" checked disabled style="margin-right: 8px;"><span style="text-decoration: line-through; color: #999;">$1</span></div>',
    );
    html = html.replace(
      /^- \[ \] (.*)$/gm,
      '<div style="margin: 6px 0;"><input type="checkbox" disabled style="margin-right: 8px;"><span>$1</span></div>',
    );

    // 11. 收集所有数字列表项
    const listItems: string[] = [];
    html = html.replace(
      /^(\d+)\.\s+(.*)$/gm,
      (match: string, num: string, content: string) => {
        listItems.push(content);
        return `__LIST_ITEM_${listItems.length - 1}__`;
      },
    );

    // 12. 将连续的数字列表项合并
    if (listItems.length > 0) {
      html = html.replace(/(__LIST_ITEM_\d+__\n?)+/g, (match: string) => {
        const itemsInThisList: string[] = [];
        const itemMatches = match.match(/__LIST_ITEM_(\d+)__/g);

        if (itemMatches) {
          itemMatches.forEach((itemMatch) => {
            const indexMatch = itemMatch.match(/__LIST_ITEM_(\d+)__/);
            if (indexMatch) {
              const index = parseInt(indexMatch[1]);
              itemsInThisList.push(listItems[index]);
            }
          });
        }

        const listHtml = itemsInThisList
          .map(
            (item) =>
              `<li style="margin: 6px 0; line-height: 1.6;">${item}</li>`,
          )
          .join('\n');

        return `<ol style="margin: 16px 0; padding-left: 24px;">\n${listHtml}\n</ol>`;
      });
    }

    // 13. 处理无序列表 (-)
    const unorderedItems: string[] = [];
    html = html.replace(/^- (.*)$/gm, (match: string, content: string) => {
      // 跳过任务列表已经处理过的
      if (content.startsWith('[x]') || content.startsWith('[ ]')) {
        return match;
      }
      unorderedItems.push(content);
      return `__UNORDERED_ITEM_${unorderedItems.length - 1}__`;
    });

    // 14. 将连续的无序列表项合并
    if (unorderedItems.length > 0) {
      html = html.replace(/(__UNORDERED_ITEM_\d+__\n?)+/g, (match: string) => {
        const itemsInThisList: string[] = [];
        const itemMatches = match.match(/__UNORDERED_ITEM_(\d+)__/g);

        if (itemMatches) {
          itemMatches.forEach((itemMatch) => {
            const indexMatch = itemMatch.match(/__UNORDERED_ITEM_(\d+)__/);
            if (indexMatch) {
              const index = parseInt(indexMatch[1]);
              itemsInThisList.push(unorderedItems[index]);
            }
          });
        }

        const listHtml = itemsInThisList
          .map(
            (item) =>
              `<li style="margin: 6px 0; line-height: 1.6;">${item}</li>`,
          )
          .join('\n');

        return `<ul style="margin: 16px 0; padding-left: 24px; list-style-type: disc;">\n${listHtml}\n</ul>`;
      });
    }

    // 15. 处理段落
    const lines = html.split('\n');
    const paragraphs: string[] = [];
    let currentParagraph: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === '') {
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join('\n'));
          currentParagraph = [];
        }
        continue;
      }

      if (
        trimmedLine.startsWith('<') ||
        trimmedLine.includes('__CODE_BLOCK_') ||
        trimmedLine.includes('__INLINE_CODE_') ||
        trimmedLine.includes('__TABLE_')
      ) {
        if (currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join('\n'));
          currentParagraph = [];
        }
        paragraphs.push(trimmedLine);
        continue;
      }

      currentParagraph.push(trimmedLine);
    }

    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join('\n'));
    }

    html = paragraphs
      .map((paragraph) => {
        const trimmed = paragraph.trim();
        if (trimmed === '') return '';

        if (
          trimmed.startsWith('<') ||
          trimmed.includes('__CODE_BLOCK_') ||
          trimmed.includes('__INLINE_CODE_') ||
          trimmed.includes('__TABLE_')
        ) {
          return trimmed;
        }

        return `<p style="margin: 8px 0; line-height: 1.6;">${trimmed.replace(/\n/g, '<br>')}</p>`;
      })
      .filter((p) => p.trim() !== '')
      .join('\n\n');

    // 16. 恢复所有占位符
    codeBlocks.forEach((codeBlock, index) => {
      html = html.replace(`__CODE_BLOCK_${index}__`, codeBlock);
    });

    inlineCodes.forEach((inlineCode, index) => {
      html = html.replace(`__INLINE_CODE_${index}__`, inlineCode);
    });

    tables.forEach((table, index) => {
      html = html.replace(`__TABLE_${index}__`, table);
    });

    return html;
  },
  config: null as any,
};

// 复制代码功能
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
