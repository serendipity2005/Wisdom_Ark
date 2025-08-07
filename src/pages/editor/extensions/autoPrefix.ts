import { Extension, type Command, type CommandProps } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import type { Transaction, EditorState } from 'prosemirror-state';

// 前缀规则配置
export interface PrefixRule {
  /** 匹配的正则表达式 */
  pattern: RegExp;
  /** 提取前缀的函数 */
  extractPrefix: (match: RegExpMatchArray) => string;
  /** 是否启用 */
  enabled?: boolean;
  /** 描述 */
  description?: string;
}

// 扩展配置选项
export interface AutoContinuePrefixOptions {
  /** 是否启用自动延续 */
  enabled?: boolean;
  /** 前缀规则配置 */
  rules?: PrefixRule[];
  /** 是否在空行时停止延续 */
  stopOnEmptyLine?: boolean;
  /** 延迟执行时间(ms) */
  delay?: number;
}

// 默认规则
const DEFAULT_RULES: PrefixRule[] = [
  // 引用块 (> text)
  {
    pattern: /^(\s*>\s*)/,
    extractPrefix: (match) => match[1],
    enabled: true,
    description: 'Blockquote prefix (>)',
  },

  // 无序列表 (- text, * text, + text)
  {
    pattern: /^(\s*[-*+]\s+)/,
    extractPrefix: (match) => match[1],
    enabled: true,
    description: 'Unordered list prefix (-, *, +)',
  },

  // 有序列表 (1. text, 2. text, etc.)
  {
    pattern: /^(\s*)(\d+)(\.\s+)/,
    extractPrefix: (match) => {
      const spaces = match[1];
      const number = parseInt(match[2]) + 1;
      const suffix = match[3];
      return `${spaces}${number}${suffix}`;
    },
    enabled: true,
    description: 'Ordered list prefix (1., 2., etc.)',
  },

  // 任务列表 (- [ ] text, - [x] text)
  {
    pattern: /^(\s*[-*+]\s+\[\s*[x\s]\s*\]\s+)/,
    extractPrefix: (match) => match[1].replace(/\[x\]/i, '[ ]'), // 新任务默认未完成
    enabled: true,
    description: 'Task list prefix (- [ ], - [x])',
  },

  // 自定义前缀 (// comment, # heading prefix, etc.)
  {
    pattern: /^(\s*\/\/\s*)/,
    extractPrefix: (match) => match[1],
    enabled: true,
    description: 'Comment prefix (//)',
  },

  // 多级引用 (>> text, >>> text)
  {
    pattern: /^(\s*>{2,}\s*)/,
    extractPrefix: (match) => match[1],
    enabled: true,
    description: 'Multi-level blockquote (>>, >>>)',
  },
];

// Plugin Key
const autoContinuePrefixKey = new PluginKey('autoContinuePrefix');

export const AutoContinuePrefix = Extension.create<AutoContinuePrefixOptions>({
  name: 'autoContinuePrefix',

  addOptions(): AutoContinuePrefixOptions {
    return {
      enabled: true,
      rules: DEFAULT_RULES,
      stopOnEmptyLine: true,
      delay: 50,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: autoContinuePrefixKey,

        props: {
          handleKeyDown(view: EditorView, event: KeyboardEvent): boolean {
            if (!options.enabled) return false;

            // 只处理 Enter 键
            if (
              event.key !== 'Enter' ||
              event.shiftKey ||
              event.ctrlKey ||
              event.metaKey
            ) {
              return false;
            }

            return handleEnterKey(view, options);
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      // 手动触发延续前缀
      continuePrefix:
        () =>
        ({ state, dispatch }: CommandProps) => {
          if (!dispatch) return false;

          const result = continuePrefixAtSelection(state, this.options);
          if (result) {
            dispatch(result);
            return true;
          }
          return false;
        },

      // 添加自定义规则
      addPrefixRule: (rule: PrefixRule) => () => {
        if (!this.options.rules) {
          this.options.rules = [...DEFAULT_RULES];
        }
        this.options.rules.push(rule);
        return true;
      },

      // 切换特定规则
      togglePrefixRule: (index: number) => () => {
        if (this.options.rules && this.options.rules[index]) {
          this.options.rules[index].enabled =
            !this.options.rules[index].enabled;
          return true;
        }
        return false;
      },
    } as Partial<import('@tiptap/core').RawCommands>;
  },
});

// 处理 Enter 键
function handleEnterKey(
  view: EditorView,
  options: AutoContinuePrefixOptions,
): boolean {
  const { state } = view;
  const { selection } = state;
  const { $from } = selection;

  // 确保在段落中
  if ($from.parent.type.name !== 'paragraph') {
    return false;
  }

  // 获取当前行内容
  const currentLineText = $from.parent.textContent;

  // 如果是空行且设置了停止延续
  if (
    options.stopOnEmptyLine &&
    isEmptyPrefixLine(currentLineText, options.rules || [])
  ) {
    // 移除当前行的前缀
    const tr = state.tr;
    const start = $from.before();
    const end = $from.after();
    tr.replaceWith(start, end, state.schema.nodes.paragraph.create());
    view.dispatch(tr);
    return true;
  }

  // 检查是否需要延续前缀
  const prefixMatch = findMatchingPrefix(currentLineText, options.rules || []);
  if (!prefixMatch) {
    return false;
  }

  // 创建新行并添加前缀
  const tr = state.tr;
  const newPrefix = prefixMatch.rule.extractPrefix(prefixMatch.match);

  // 插入换行和前缀
  tr.replaceSelectionWith(state.schema.nodes.paragraph.create(), false);
  tr.insertText(newPrefix);

  view.dispatch(tr);
  return true;
}

// 在选区位置延续前缀
function continuePrefixAtSelection(
  state: EditorState,
  options: AutoContinuePrefixOptions,
): Transaction | null {
  const { selection } = state;
  const { $from } = selection;

  if ($from.parent.type.name !== 'paragraph') {
    return null;
  }

  const currentLineText = $from.parent.textContent;
  const prefixMatch = findMatchingPrefix(currentLineText, options.rules || []);

  if (!prefixMatch) {
    return null;
  }

  const tr = state.tr;
  const newPrefix = prefixMatch.rule.extractPrefix(prefixMatch.match);

  // 在当前位置插入换行和前缀
  tr.replaceSelectionWith(state.schema.nodes.paragraph.create(), false);
  tr.insertText(newPrefix);

  return tr;
}

// 查找匹配的前缀规则
function findMatchingPrefix(
  text: string,
  rules: PrefixRule[],
): { rule: PrefixRule; match: RegExpMatchArray } | null {
  for (const rule of rules) {
    if (!rule.enabled) continue;

    const match = text.match(rule.pattern);
    if (match) {
      return { rule, match };
    }
  }
  return null;
}

// 检查是否为空前缀行（只有前缀没有内容）
function isEmptyPrefixLine(text: string, rules: PrefixRule[]): boolean {
  for (const rule of rules) {
    if (!rule.enabled) continue;

    const match = text.match(rule.pattern);
    if (match) {
      // 检查前缀后是否只有空白字符
      const afterPrefix = text.slice(match[0].length).trim();
      return afterPrefix === '';
    }
  }
  return false;
}

// 工具类
export class PrefixContinuer {
  private view: EditorView;
  private options: AutoContinuePrefixOptions;

  constructor(view: EditorView, options: AutoContinuePrefixOptions = {}) {
    this.view = view;
    this.options = {
      enabled: true,
      rules: DEFAULT_RULES,
      stopOnEmptyLine: true,
      delay: 50,
      ...options,
    };
  }

  /**
   * 手动触发前缀延续
   */
  continuePrefix(): boolean {
    const result = continuePrefixAtSelection(this.view.state, this.options);
    if (result) {
      this.view.dispatch(result);
      return true;
    }
    return false;
  }

  /**
   * 添加自定义规则
   */
  addRule(rule: PrefixRule): void {
    if (!this.options.rules) {
      this.options.rules = [...DEFAULT_RULES];
    }
    this.options.rules.push(rule);
  }

  /**
   * 移除规则
   */
  removeRule(index: number): boolean {
    if (this.options.rules && this.options.rules[index]) {
      this.options.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 切换规则启用状态
   */
  toggleRule(index: number): boolean {
    if (this.options.rules && this.options.rules[index]) {
      this.options.rules[index].enabled = !this.options.rules[index].enabled;
      return true;
    }
    return false;
  }

  /**
   * 获取当前规则列表
   */
  getRules(): PrefixRule[] {
    return this.options.rules || [];
  }

  /**
   * 检查当前行是否有可延续的前缀
   */
  hasPrefix(): boolean {
    const { state } = this.view;
    const { selection } = state;
    const { $from } = selection;

    if ($from.parent.type.name !== 'paragraph') {
      return false;
    }

    const currentLineText = $from.parent.textContent;
    return (
      findMatchingPrefix(currentLineText, this.options.rules || []) !== null
    );
  }

  /**
   * 更新配置
   */
  updateOptions(newOptions: Partial<AutoContinuePrefixOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}

// React Hook
export function useAutoContinuePrefix(
  editor: any,
  customOptions?: Partial<AutoContinuePrefixOptions>,
) {
  const continuer = editor?.view
    ? new PrefixContinuer(editor.view, customOptions)
    : null;

  const continuePrefix = (): boolean => {
    return continuer?.continuePrefix() || false;
  };

  const addRule = (rule: PrefixRule): void => {
    continuer?.addRule(rule);
  };

  const toggleRule = (index: number): boolean => {
    return continuer?.toggleRule(index) || false;
  };

  const hasPrefix = (): boolean => {
    return continuer?.hasPrefix() || false;
  };

  const getRules = (): PrefixRule[] => {
    return continuer?.getRules() || [];
  };

  return {
    continuePrefix,
    addRule,
    toggleRule,
    hasPrefix,
    getRules,
    continuer,
  };
}

// 预设规则生成器
export const PrefixRulePresets = {
  // 创建引用规则
  blockquote: (symbol = '>'): PrefixRule => ({
    pattern: new RegExp(`^(\\s*\\${symbol}\\s*)`),
    extractPrefix: (match) => match[1],
    enabled: true,
    description: `Blockquote prefix (${symbol})`,
  }),

  // 创建列表规则
  unorderedList: (symbols: string[] = ['-', '*', '+']): PrefixRule => ({
    pattern: new RegExp(
      `^(\\s*[${symbols.map((s) => `\\${s}`).join('')}]\\s+)`,
    ),
    extractPrefix: (match) => match[1],
    enabled: true,
    description: `Unordered list prefix (${symbols.join(', ')})`,
  }),

  // 创建注释规则
  comment: (prefix = '//'): PrefixRule => ({
    pattern: new RegExp(`^(\\s*\\${prefix}\\s*)`),
    extractPrefix: (match) => match[1],
    enabled: true,
    description: `Comment prefix (${prefix})`,
  }),

  // 创建自定义前缀规则
  custom: (prefix: string, description?: string): PrefixRule => ({
    pattern: new RegExp(`^(\\s*\\${prefix}\\s*)`),
    extractPrefix: (match) => match[1],
    enabled: true,
    description: description || `Custom prefix (${prefix})`,
  }),
};

// 导出类型和默认规则
export { DEFAULT_RULES };
// export type { PrefixRule, AutoContinuePrefixOptions }
