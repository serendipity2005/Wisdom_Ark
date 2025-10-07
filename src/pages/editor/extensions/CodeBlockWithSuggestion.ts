import { Node, mergeAttributes } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { HybridFIMService } from '@/utils/hybridFIMService';
import isInCodeContext from '@/utils/isInCode';
import type { Transaction } from 'prosemirror-state';

// 自定义代码块扩展，支持虚拟建议
const CodeBlockWithSuggestion = CodeBlockLowlight.extend({
  addProseMirrorPlugins() {
    let fimService: HybridFIMService | null = null; //FIM服务实例
    let suggestionTimeout: string | number | NodeJS.Timeout | null | undefined =
      null; // 建议定时器
    let currentSuggestion: string | null = null; // 当前建议
    let isUpdating = false;

    // 初始化 FIM 服务
    const initFIMService = () => {
      if (!fimService) {
        fimService = new HybridFIMService();
      }
    };

    // 生成 AI 建议
    const generateSuggestion = async (prefix: string, suffix: string) => {
      if (!fimService) {
        initFIMService();
        return null;
      }

      try {
        // 这里返回模拟数据，实际使用时取消注释
        // const suggestion = await fimService.fillInMiddle(prefix, suffix, {
        //   maxTokens: 100,
        //   temperature: 0.7,
        //   topP: 0.9,
        // });
        // return suggestion;

        return `let timer = null;
        return function (fn, time) {
          if(timer){
            clearTimeout(timer);
          }
          timer = setTimeout(() => {
            fn.apply(this, arguments);
          },time)
        }`;
      } catch (error) {
        console.error('生成建议失败:', error);
        return null;
      }
    };

    return [
      ...(this.parent?.() || []), // 继承原有代码块插件
      new Plugin({
        key: new PluginKey('code-block-suggestion'),

        // 状态管理
        state: {
          init() {
            return DecorationSet.empty; //初始化为空装饰集
          },
          apply(tr: Transaction, oldState: DecorationSet) {
            // 如果文档内容发生变化（排除纯选择变化），清除建议
            if (tr.docChanged) {
              //如果文档被改变过，则返回 true。
              currentSuggestion = null;
              return DecorationSet.empty;
            }

            // 如果有 meta 数据包含建议，更新 decoration
            //用给定的 name 或者 plugin key 来获取设置的 metadata 信息。
            const suggestion = tr.getMeta('suggestion');
            if (suggestion !== undefined) {
              if (suggestion === null) {
                return DecorationSet.empty;
              }

              const { pos, text } = suggestion; // 获取建议的位置和内容
              // 创建 widget decoration 在光标位置
              const widget = Decoration.widget(
                pos,
                // 创建虚拟建议元素
                () => {
                  const span = document.createElement('span');
                  span.className = 'code-suggestion';
                  span.textContent = text;
                  span.style.color = '#888';
                  span.style.opacity = '0.7';
                  span.style.pointerEvents = 'none';
                  span.style.whiteSpace = 'pre';
                  return span;
                },
                {
                  side: 1, // 显示在光标右侧
                },
              );

              return DecorationSet.create(tr.doc, [widget]);
            }

            // 映射旧的 decorations
            return oldState.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
          handleKeyDown: (view, event) => {
            const { state, dispatch } = view;
            const { selection } = state;

            // Tab 键接受建议
            if (event.key === 'Tab' && currentSuggestion) {
              const $cursor =
                selection instanceof TextSelection ? selection.$cursor : null;

              if (!$cursor) return false;
              const transaction = state.tr
                .insertText(currentSuggestion, $cursor.pos)
                .setMeta('suggestion', null);

              dispatch(transaction);
              currentSuggestion = null;
              return true;
            }

            // Esc 键取消建议
            if (event.key === 'Escape' && currentSuggestion) {
              const transaction = state.tr.setMeta('suggestion', null);
              dispatch(transaction);
              currentSuggestion = null;
              return true;
            }

            return false;
          },
        },
        view: (editorView) => {
          const updateSuggestion = async () => {
            // 防止循环更新
            if (isUpdating) {
              return;
            }
            const { state, dispatch } = editorView;
            const selection = state.selection;
            const clearSuggestion = () => {
              if (currentSuggestion) {
                isUpdating = true;
                dispatch(state.tr.setMeta('suggestion', null));
                currentSuggestion = null;
                setTimeout(() => {
                  isUpdating = false;
                }, 0);
              }
            };
            // 取消待处理的建议生成
            if (suggestionTimeout) {
              clearTimeout(suggestionTimeout);
              suggestionTimeout = null;
            }
            if (!selection) {
              clearSuggestion();
              return;
            }

            const $cursor =
              selection instanceof TextSelection ? selection.$cursor : null;

            if (!$cursor) {
              clearSuggestion();
              return;
            }

            // 检查是否在代码块中
            const node = $cursor.parent;
            if (node.type.name !== 'codeBlock') {
              clearSuggestion();
              return;
            }

            // 获取代码内容
            const codeContent = node.textContent;
            const cursorOffset = $cursor.parentOffset;
            const prefix = codeContent.substring(0, cursorOffset);
            const suffix = codeContent.substring(cursorOffset);

            // 检查是否在代码上下文中
            const context = {
              content: codeContent,
              cursorPosition: cursorOffset,
            };
            if (!isInCodeContext(context)) {
              clearSuggestion();
              return;
            }

            // // 延迟生成建议
            // if (suggestionTimeout) {
            //   clearTimeout(suggestionTimeout);
            //   suggestionTimeout = null;
            // }

            suggestionTimeout = setTimeout(async () => {
              if (!$cursor || $cursor.parent.type.name !== 'codeBlock') {
                return; // 直接返回，不生成建议
              }
              const suggestionText = await generateSuggestion(prefix, suffix);
              if (!suggestionText) {
                dispatch(state.tr.setMeta('suggestion', null));
                currentSuggestion = null;
                return;
              }

              currentSuggestion = suggestionText;
              if (!$cursor || $cursor.parent.type.name !== 'codeBlock') {
                return; // 直接返回，不生成建议
              }
              dispatch(
                // 设置元数据  建议的内容和显示位置
                state.tr.setMeta('suggestion', {
                  pos: $cursor.pos,
                  text: suggestionText,
                }),
              );
            }, 1000);
          };

          return {
            update: (view, prevState) => {
              // 防止循环更新
              if (isUpdating) {
                return;
              }
              if (view.state !== prevState) {
                updateSuggestion();
              }
            },
            destroy: () => {
              if (suggestionTimeout) {
                clearTimeout(suggestionTimeout);
              }
              currentSuggestion = null;
            },
          };
        },
      }),
    ];
  },
});

export default CodeBlockWithSuggestion;
