// 根据文件扩展名判断是否为代码文件
function isCodeFile(fileName: string): boolean {
  const codeExtensions = [
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.vue',
    '.svelte',
    '.py',
    '.java',
    '.cpp',
    '.c',
    '.cs',
    '.php',
    '.rb',
    '.go',
    '.rs',
    '.swift',
    '.kt',
    '.scala',
    '.html',
    '.css',
    '.scss',
    '.sass',
    '.less',
    '.json',
    '.xml',
    '.yaml',
    '.yml',
    '.toml',
    '.sql',
    '.sh',
    '.bash',
    '.zsh',
    '.fish',
    '.dockerfile',
    '.dockerignore',
    '.gitignore',
  ];

  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return codeExtensions.includes(extension);
}
// 检测内容是否包含代码特征
function isCodeContent(content: string): boolean {
  const codePatterns = [
    // 函数定义
    /function\s+\w+\s*\(/,
    /const\s+\w+\s*=\s*\(/,
    /let\s+\w+\s*=\s*\(/,
    /var\s+\w+\s*=\s*\(/,

    // 类定义
    /class\s+\w+/,

    // 导入语句
    /import\s+.*from/,
    /require\s*\(/,

    // 控制流
    /if\s*\(/,
    /for\s*\(/,
    /while\s*\(/,
    /switch\s*\(/,

    // 注释
    /\/\/.*$/,
    /\/\*[\s\S]*?\*\//,

    // 字符串和模板
    /`[^`]*`/,
    /"[^"]*"/,
    /'[^']*'/,

    // 操作符
    /[+\-*/=<>!&|]+/,

    // 括号匹配
    /[{}()[\]]/,
  ];

  const matches = codePatterns.filter((pattern) => pattern.test(content));

  return matches.length >= 2; // 至少匹配3个代码特征
}
// 检测光标是否在代码块内
function isInCodeBlock(content: string, cursorPosition: number): boolean {
  const beforeCursor = content.substring(0, cursorPosition);
  const afterCursor = content.substring(cursorPosition);

  // 检查是否在代码块内（markdown）
  const codeBlockRegex = /```[\s\S]*?```/g;
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (
      cursorPosition >= match.index &&
      cursorPosition <= match.index + match[0].length
    ) {
      return true;
    }
  }

  // 检查是否在HTML标签内
  const htmlTagRegex = /<[^>]*>/g;
  while ((match = htmlTagRegex.exec(content)) !== null) {
    if (
      cursorPosition >= match.index &&
      cursorPosition <= match.index + match[0].length
    ) {
      return true;
    }
  }

  return false;
}
interface EditorContext {
  fileName?: string;
  content: string;
  cursorPosition?: number;
  language?: string;
}

// export default function isInCodeContext(context: EditorContext): boolean {
//   const { fileName, content, cursorPosition, language } = context;
//   console.log(context);

//   // 1. 基于文件扩展名
//   if (fileName && isCodeFile(fileName)) {
//     return true;
//   }

//   // 2. 基于语言设置
//   if (language && isCodeLanguage(language)) {
//     return true;
//   }

//   // 3. 基于内容特征
//   if (isCodeContent(content)) {
//     return true;
//   }

//   // 4. 基于光标位置
//   if (cursorPosition !== undefined && isInCodeBlock(content, cursorPosition)) {
//     return true;
//   }

//   return false;
// }
export default function isInCodeContext(
  editor:
    | { state: any; isActive: (name: string) => boolean }
    | null
    | undefined,
): boolean {
  if (!editor) return false;
  const { selection } = editor.state || {};
  const $from = selection?.$from;
  const hasIsActive = typeof (editor as any).isActive === 'function';
  // O(1): 直接通过父节点类型或激活的 mark/node 判断

  return (
    $from?.parent?.type?.name === 'codeBlock' ||
    (hasIsActive && (editor as any).isActive('codeBlock')) ||
    (hasIsActive && (editor as any).isActive('code'))
  );
}
function isCodeLanguage(language: string): boolean {
  const codeLanguages = [
    'javascript',
    'typescript',
    'python',
    'java',
    'cpp',
    'c',
    'csharp',
    'php',
    'ruby',
    'go',
    'rust',
    'swift',
    'kotlin',
    'scala',
    'html',
    'css',
    'scss',
    'sass',
    'less',
    'json',
    'xml',
    'yaml',
    'sql',
    'bash',
    'shell',
    'dockerfile',
  ];

  return codeLanguages.includes(language.toLowerCase());
}
