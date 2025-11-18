export const mockMarked = {
  use: (config: any) => {
    mockMarked.config = config;
  },
  parse: async (text: string) => {
    let html = text;
    const codeBlocks: string[] = [];
    const inlineCodes: string[] = [];
    const tables: string[] = [];

    // 1. 处理代码块 - 必须最先处理，避免内容被其他规则影响
    html = html.replace(
      /```(\w+)?\s*\n([\s\S]*?)\n```/g,
      (match: any, lang: any, code: any) => {
        const safeCode = String(code || '')
          .trim()
          // 转义HTML特殊字符，防止被后续处理
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

        const langClass = lang ? `language-${lang}` : '';
        const langLabel = lang
          ? `<div style="color: #666; font-size: 12px; margin-bottom: 8px; font-weight: 500;">${lang}</div>`
          : '';

        const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push(`<div class="code-block" style="margin: 16px 0;">
        ${langLabel}
        <pre style="background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; margin: 0; border: 1px solid #e1e4e8;"><code class="hljs ${langClass}" style="background: none; padding: 0; font-family: 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; line-height: 1.5; font-size: 14px; white-space: pre;">${safeCode}</code></pre>
      </div>`);

        return placeholder;
      },
    );

    // 2. 处理行内代码 - 也需要保护
    html = html.replace(/`([^`\n]+)`/g, (match: any, code: any) => {
      const safeCode = String(code)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

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

    // 7. 处理段落 - 改进算法
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
