/**
 * generateTestDocument - 生成万字测试文档
 *
 * 用于压力测试编辑器虚拟化性能
 */

interface GenerateOptions {
  paragraphs?: number; // 段落数量
  headings?: number; // 标题数量
  codeBlocks?: number; // 代码块数量
  blockquotes?: number; // 引用块数量
  lists?: number; // 列表数量
  tables?: number; // 表格数量
}

/**
 * 生成随机文本段落
 */
function generateParagraph(minWords = 20, maxWords = 50): string {
  const words = [
    '编辑器',
    '虚拟化',
    '性能',
    '优化',
    '渲染',
    '滚动',
    'TipTap',
    'ProseMirror',
    'React',
    '组件',
    '文档',
    '内容',
    '节点',
    '插件',
    '扩展',
    '配置',
    '测试',
    '开发',
    '技术',
    '方案',
    '实现',
    '功能',
    '体验',
    '流畅',
    '卡顿',
    '优化',
    '改进',
    '升级',
    '修复',
    'Bug',
    '问题',
    '解决',
    '设计',
    '架构',
    '代码',
    '逻辑',
    '算法',
    '数据',
    '结构',
    '模型',
  ];

  const wordCount = Math.floor(
    Math.random() * (maxWords - minWords + 1) + minWords,
  );
  const paragraph = [];

  for (let i = 0; i < wordCount; i++) {
    paragraph.push(words[Math.floor(Math.random() * words.length)]);
  }

  return paragraph.join('') + '。';
}

/**
 * 生成代码块
 */
function generateCodeBlock(): string {
  const codeExamples = [
    `const editor = useEditor({
  extensions: [StarterKit, VirtualScroll],
  content: '<p>Hello World</p>',
});`,
    `function calculateVisibleRange(scrollTop: number) {
  const startIndex = Math.floor(scrollTop / BLOCK_HEIGHT);
  const endIndex = startIndex + VISIBLE_COUNT;
  return { startIndex, endIndex };
}`,
    `interface VirtualNodeViewOptions {
  preloadMargin?: string;
  unloadDelay?: number;
  defaultHeight?: number;
}`,
    `const decos = blocks.map((block, index) => {
  return Decoration.node(block.pos, block.pos + block.nodeSize, {
    class: 'virtual-hidden',
    'data-height': block.height,
  });
});`,
  ];

  return (
    '```typescript\n' +
    codeExamples[Math.floor(Math.random() * codeExamples.length)] +
    '\n```'
  );
}

/**
 * 生成引用块
 */
function generateBlockquote(): string {
  const quotes = [
    '虚拟化是提升大型文档性能的关键技术。',
    'ProseMirror 的文档模型设计使得虚拟化实现更加复杂。',
    '基于 Decoration 的虚拟化方案可以保持文档模型完整性。',
    'content-visibility 是现代浏览器提供的原生虚拟化能力。',
    '混合虚拟化方案结合了多种技术的优势。',
  ];

  return '> ' + quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * 生成列表
 */
function generateList(ordered = false): string {
  const items = [
    '虚拟化渲染优化',
    '滚动性能提升',
    '内存占用减少',
    '编辑体验改善',
    '代码健壮性增强',
  ];

  const prefix = ordered ? '1. ' : '- ';
  return items.map((item) => prefix + item).join('\n');
}

/**
 * 生成表格
 */
function generateTable(): string {
  return `| 指标 | 优化前 | 优化后 | 提升 |
| --- | --- | --- | --- |
| 初始渲染时间 | 850ms | 120ms | 85.9% |
| 滚动帧率 | 35fps | 58fps | 65.7% |
| DOM 节点数 | 5200 | 1800 | 65.4% |
| 内存占用 | 180MB | 65MB | 63.9% |`;
}

/**
 * 生成测试文档
 */
export function generateTestDocument(
  targetWords = 10000,
  options: GenerateOptions = {},
): string {
  const {
    paragraphs = 150,
    headings = 30,
    codeBlocks = 10,
    blockquotes = 10,
    lists = 5,
    tables = 3,
  } = options;

  const sections: string[] = [];
  let currentWords = 0;

  // 生成主标题
  sections.push('# 编辑器虚拟化性能测试文档');
  sections.push('');
  sections.push('这是一个用于测试编辑器虚拟化性能的万字文档。');
  sections.push('');

  // 随机分布不同类型的内容
  const contentTypes = [
    { type: 'heading', count: headings },
    { type: 'paragraph', count: paragraphs },
    { type: 'codeBlock', count: codeBlocks },
    { type: 'blockquote', count: blockquotes },
    { type: 'list', count: lists },
    { type: 'table', count: tables },
  ];

  // 展开所有内容项
  const allItems: { type: string; index: number }[] = [];
  contentTypes.forEach(({ type, count }) => {
    for (let i = 0; i < count; i++) {
      allItems.push({ type, index: i });
    }
  });

  // 随机打乱顺序
  allItems.sort(() => Math.random() - 0.5);

  // 生成内容
  const headingLevel = 2;
  allItems.forEach((item, idx) => {
    // 每 20 个项目添加一个二级标题
    if (idx % 20 === 0 && idx > 0) {
      sections.push('');
      sections.push(`## 第 ${Math.floor(idx / 20)} 章节`);
      sections.push('');
    }

    switch (item.type) {
      case 'heading': {
        const level = Math.random() > 0.5 ? 3 : 4;
        sections.push(
          `${'#'.repeat(level)} 标题 ${item.index + 1}: ${generateParagraph(3, 6)}`,
        );
        sections.push('');
        break;
      }

      case 'paragraph':
        sections.push(generateParagraph());
        sections.push('');
        currentWords += 30; // 估算字数
        break;

      case 'codeBlock':
        sections.push(generateCodeBlock());
        sections.push('');
        currentWords += 20;
        break;

      case 'blockquote':
        sections.push(generateBlockquote());
        sections.push('');
        currentWords += 15;
        break;

      case 'list':
        sections.push(generateList(Math.random() > 0.5));
        sections.push('');
        currentWords += 10;
        break;

      case 'table':
        sections.push(generateTable());
        sections.push('');
        currentWords += 30;
        break;
    }

    // 如果字数已达到目标，提前结束
    if (currentWords >= targetWords) {
      return;
    }
  });

  // 添加总结
  sections.push('');
  sections.push('## 总结');
  sections.push('');
  sections.push('本文档包含大量混合内容，用于全面测试编辑器的虚拟化性能。');
  sections.push(
    '通过观察 FPS、DOM 节点数、内存占用等指标，可以评估虚拟化效果。',
  );
  sections.push('');
  sections.push(`**文档统计信息：**`);
  sections.push(`- 预估字数: ${currentWords.toLocaleString()} 字`);
  sections.push(`- 段落数: ${paragraphs}`);
  sections.push(`- 标题数: ${headings}`);
  sections.push(`- 代码块: ${codeBlocks}`);
  sections.push(`- 引用块: ${blockquotes}`);
  sections.push(`- 列表: ${lists}`);
  sections.push(`- 表格: ${tables}`);

  return sections.join('\n');
}

/**
 * 生成超大文档（5万字+）
 */
export function generateLargeDocument(): string {
  return generateTestDocument(50000, {
    paragraphs: 800,
    headings: 150,
    codeBlocks: 50,
    blockquotes: 50,
    lists: 30,
    tables: 15,
  });
}

/**
 * 生成中等文档（1万字）
 */
export function generateMediumDocument(): string {
  return generateTestDocument(10000);
}

/**
 * 生成小文档（3000字）
 */
export function generateSmallDocument(): string {
  return generateTestDocument(3000, {
    paragraphs: 50,
    headings: 10,
    codeBlocks: 3,
    blockquotes: 3,
    lists: 2,
    tables: 1,
  });
}
