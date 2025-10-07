import type { HybridFIMService } from './hybridFIMService';
import isInCodeContext from './isInCode';

export interface AutoFIMOptions {
  delay?: number; // 停留时间（毫秒），默认 2000ms
  maxSuggestions?: number; // 最大建议数量，默认 3
  minContextLength?: number; // 最小上下文长度，默认 10
  enabled?: boolean; // 是否启用自动提示
  autoTriggerInCode?: boolean; // 是否在代码块中启用自动触发
}

export interface EditorState {
  content: string;
  cursorPosition: number;
  fileName?: string;
  language?: string;
  lastEditTime: number;
}

export interface FIMSuggestion {
  id: string;
  content: string;
  timestamp: number;
  type: 'auto' | 'manual';
  position?: number; // 添加位置信息
}

export class AutoFIMService {
  private fimService: HybridFIMService;
  private options: AutoFIMOptions;
  private timeoutId: NodeJS.Timeout | null = null;
  private lastState: EditorState | null = null;
  private isProcessing = false;
  private suggestions: FIMSuggestion[] = [];

  constructor(fimService: HybridFIMService, options: AutoFIMOptions = {}) {
    this.fimService = fimService;
    this.options = {
      delay: 2000,
      maxSuggestions: 3,
      minContextLength: 10,
      enabled: true,
      autoTriggerInCode: true,
      ...options,
    };
  }

  // 检测是否在 TipTap 代码块中
  private isInTipTapCodeBlock(
    content: string,
    cursorPosition: number,
  ): boolean {
    // 检测是否在 markdown 代码块中 (```code```)
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

    // 检测是否在行内代码中 (`code`)
    const inlineCodeRegex = /`[^`]*`/g;
    while ((match = inlineCodeRegex.exec(content)) !== null) {
      if (
        cursorPosition >= match.index &&
        cursorPosition <= match.index + match[0].length
      ) {
        return true;
      }
    }

    return false;
  }

  // 更新编辑器状态 - 针对 TipTap 优化
  updateEditorState(state: EditorState) {
    // 清除之前的定时器
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // 检查是否在代码上下文中
    const context = {
      fileName: state.fileName,
      content: state.content,
      cursorPosition: state.cursorPosition,
      language: state.language,
    };

    const isInCode =
      isInCodeContext(context) ||
      this.isInTipTapCodeBlock(state.content, state.cursorPosition);
    this.lastState = state;
    // 只有在代码上下文中且启用自动触发时才设置定时器
    console.log(isInCode, this.options.autoTriggerInCode, this.options.enabled);

    if (isInCode && this.options.autoTriggerInCode && this.options.enabled) {
      // 检查是否有足够的上下文
      console.log(this.hasEnoughContext(state));

      if (this.hasEnoughContext(state)) {
        this.timeoutId = setTimeout(() => {
          this.generateSuggestions('auto');
        }, this.options.delay);
      }
    }
  }

  // 检查是否有足够的上下文
  private hasEnoughContext(state: EditorState): boolean {
    const { content, cursorPosition } = state;
    const beforeCursor = content.substring(0, cursorPosition);
    const afterCursor = content.substring(cursorPosition);
    console.log(this.options.minContextLength);

    return (
      beforeCursor.length >= this.options.minContextLength &&
      afterCursor.length >= this.options.minContextLength
    );
  }

  // 生成建议
  private async generateSuggestions(type: 'auto' | 'manual' = 'auto') {
    console.log(type);

    if (!this.lastState || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const { content, cursorPosition } = this.lastState;
      const prefix = content.substring(0, cursorPosition);
      const suffix = content.substring(cursorPosition);

      console.log(`🤖 ${type === 'auto' ? '自动' : '手动'}生成 FIM 建议...`);
      console.log('前缀:', prefix.slice(-50));
      console.log('后缀:', suffix.slice(0, 50));

      const suggestion = await this.fimService.fillInMiddle(prefix, suffix, {
        maxTokens: 100,
        temperature: 0.7,
        topP: 0.9,
      });

      if (suggestion && suggestion.trim()) {
        const suggestionObj: FIMSuggestion = {
          id: `fim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: suggestion.trim(),
          timestamp: Date.now(),
          type,
          position: cursorPosition, // 记录建议位置
        };

        this.suggestions.push(suggestionObj);

        // 保持建议数量在限制内
        if (this.suggestions.length > this.options.maxSuggestions) {
          this.suggestions = this.suggestions.slice(
            -this.options.maxSuggestions,
          );
        }

        this.showInlineSuggestion(suggestionObj);
      }
    } catch (error) {
      console.error(
        `${type === 'auto' ? '自动' : '手动'} FIM 生成失败:`,
        error,
      );
    } finally {
      this.isProcessing = false;
    }
  }

  // 显示内联建议
  private showInlineSuggestion(suggestion: FIMSuggestion) {
    console.log(`💡 内联 FIM 建议 (${suggestion.type}):`, suggestion.content);

    // 触发内联建议事件
    const event = new CustomEvent('fim-inline-suggestion', {
      detail: {
        suggestion,
        allSuggestions: this.suggestions,
      },
    });

    window.dispatchEvent(event);
  }

  // 手动触发建议
  async triggerManualSuggestions() {
    if (this.lastState) {
      await this.generateSuggestions('manual');
    }
  }

  // 获取当前建议
  getSuggestions(): FIMSuggestion[] {
    return [...this.suggestions];
  }

  // 清除建议
  clearSuggestions() {
    this.suggestions = [];
    const event = new CustomEvent('fim-suggestions-cleared');
    window.dispatchEvent(event);
  }

  // 应用内联建议
  applyInlineSuggestion(suggestionId: string): string | null {
    const suggestion = this.suggestions.find((s) => s.id === suggestionId);
    if (suggestion) {
      // 移除已应用的建议
      this.suggestions = this.suggestions.filter((s) => s.id !== suggestionId);
      return suggestion.content;
    }
    return null;
  }

  // 清除内联建议
  clearInlineSuggestions() {
    this.suggestions = [];
    const event = new CustomEvent('fim-inline-suggestions-cleared');
    window.dispatchEvent(event);
  }

  // 更新配置
  updateOptions(newOptions: Partial<AutoFIMOptions>) {
    this.options = { ...this.options, ...newOptions };
  }

  // 启用/禁用
  setEnabled(enabled: boolean) {
    this.options.enabled = enabled;
    if (!enabled && this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  // 清理资源
  destroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.lastState = null;
  }
}
