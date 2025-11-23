//带有AI建议的代码块

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { HybridFIMService } from '@/utils/hybridFIMService';

import type { Transaction } from 'prosemirror-state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import CodeBlock from '@/components/CodeBlock';

// 自定义代码块扩展，支持虚拟建议
const CodeBlockWithSuggestion = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlock);
  },
  addProseMirrorPlugins() {
    let fimService: HybridFIMService | null = null; //FIM服务实例
    let suggestionTimeout: string | number | NodeJS.Timeout | null | undefined =
      null; // 建议定时器
    let currentSuggestion: string | null = null; // 当前建议
    let isUpdating = false;

    // ✨ 新增：取消控制器和指纹缓存
    let currentAbortController: AbortController | null = null;
    let lastRequestFingerprint: string | null = null;
    let requestInProgress = false;
    // ✨ 优化：生成请求指纹，避免重复请求
    const generateFingerprint = (prefix: string, suffix: string): string => {
      // 取前后文的关键部分生成指纹
      const prefixKey = prefix.slice(-64); // 只取末尾64字符
      const suffixKey = suffix.slice(0, 64); // 只取开头64字符
      return `${prefixKey}|${suffixKey}`;
    };
    // 初始化 FIM 服务
    const initFIMService = () => {
      if (!fimService) {
        fimService = new HybridFIMService();
      }
    };

    // 生成 AI 建议
    const generateSuggestion = async (
      prefix: string,
      suffix: string,
      abortSignal: AbortSignal,
    ) => {
      if (!fimService) {
        initFIMService();
        return null;
      }

      try {
        // 检查是否已被取消
        if (abortSignal?.aborted) {
          console.log('请求已取消');

          return null;
        }
        console.log('发起AI建议请求...');
        //❌ 问题2：无法取消进行中的 LLM 请求
        //这里返回模拟数据，实际使用时取消注释 需要传入 abortSignal
        const suggestion = await fimService.fillInMiddle(prefix, suffix, {
          maxTokens: 100,
          temperature: 0.7,
          topP: 0.9,
          signal: abortSignal,
        });
        return suggestion;

        // return `let timer = null;
        // return function (fn, time) {
        //   if(timer){
        //     clearTimeout(timer);
        //   }
        //   timer = setTimeout(() => {
        //     fn.apply(this, arguments);
        //   },time)
        // }`;

        // 模拟数据（实际使用时删除）
        return new Promise<string>((resolve, reject) => {
          const timer = setTimeout(() => {
            if (abortSignal?.aborted) {
              reject(new DOMException('Request aborted', 'AbortError'));
              return;
            }
            resolve(`let timer = null;
            return function (fn, time) {
              if(timer){
                clearTimeout(timer);
              }
              timer = setTimeout(() => {
                fn.apply(this, arguments);
              },time)
            }`);
          }, 500); // 模拟网络延迟

          abortSignal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Request aborted', 'AbortError'));
          });
        });
      } catch (error) {
        // ✨ 区分取消错误和其他错误
        if ((error as any).name === 'AbortError') {
          console.log('请求已取消');
          return null;
        }
        console.error('生成建议失败:', error);
        return null;
      }
    };

    return [
      ...(this.parent?.() || []), // 继承原有代码块插件
      new Plugin({
        key: new PluginKey('code-block-suggestion'),

        // 状态管理
        // 字段 init() 初始化状态 apply
        state: {
          init() {
            return DecorationSet.empty; //初始化为空装饰集
          },

          /*
           * 在状态更新时被调用
           * tr: Transaction - 描述文档选择的变化
           *value:当前插件状态的当前值 也就是旧状态
           * oldState: DecorationSet - 旧的装饰集
           */
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
              //widget 是
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
              // ✨ 取消当前请求
              if (currentAbortController) {
                currentAbortController.abort();
                currentAbortController = null;
              }

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
            // ✨ 新增：检查编辑器焦点状态
            if (!editorView.hasFocus()) {
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
            // ❌ 问题1：只清除定时器，不取消已发起的请求
            // if (suggestionTimeout) {
            //   clearTimeout(suggestionTimeout);
            //   suggestionTimeout = null;
            // }
            // ✨ ------------优化：取消之前的请求和定时器---------------------
            if (suggestionTimeout) {
              clearTimeout(suggestionTimeout);
              suggestionTimeout = null;
            }

            if (currentAbortController) {
              currentAbortController.abort();
              currentAbortController = null;
            }

            // -------------------------
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
            // ✨ 核心优化：指纹去重
            const fingerprint = generateFingerprint(prefix, suffix);
            if (fingerprint === lastRequestFingerprint && requestInProgress) {
              console.log('跳过重复请求');
              return;
            }
            // suggestionTimeout = setTimeout(async () => {
            //   if (!$cursor || $cursor.parent.type.name !== 'codeBlock') {
            //     return; // 直接返回，不生成建议
            //   }
            //   const suggestionText = await generateSuggestion(prefix, suffix);
            //   if (!suggestionText) {
            //     dispatch(state.tr.setMeta('suggestion', null));
            //     currentSuggestion = null;
            //     return;
            //   }

            //   currentSuggestion = suggestionText;
            //   if (!$cursor || $cursor.parent.type.name !== 'codeBlock') {
            //     return; // 直接返回，不生成建议
            //   }
            //   dispatch(
            //     // 设置元数据  建议的内容和显示位置
            //     state.tr.setMeta('suggestion', {
            //       pos: $cursor.pos,
            //       text: suggestionText,
            //     }),
            //   );
            // }, 1000);
            // ✨ 优化：缩短去抖时间，提升响应速度
            suggestionTimeout = setTimeout(async () => {
              // 二次检查：确保上下文仍然有效
              if (!$cursor || $cursor.parent.type.name !== 'codeBlock') {
                return;
              }

              // 更新指纹和请求状态
              lastRequestFingerprint = fingerprint;
              requestInProgress = true;

              // 创建新的取消控制器
              currentAbortController = new AbortController();

              try {
                const suggestionText = await generateSuggestion(
                  prefix,
                  suffix,
                  currentAbortController.signal,
                );

                // 检查请求是否被取消
                if (currentAbortController.signal.aborted) {
                  return;
                }

                if (!suggestionText) {
                  dispatch(state.tr.setMeta('suggestion', null));
                  currentSuggestion = null;
                  return;
                }

                // 最终检查：确保光标位置仍然有效
                if (!$cursor || $cursor.parent.type.name !== 'codeBlock') {
                  return;
                }

                currentSuggestion = suggestionText;
                console.log(suggestionText);

                dispatch(
                  state.tr.setMeta('suggestion', {
                    pos: $cursor.pos,
                    text: suggestionText,
                  }),
                );

                console.log('AI建议生成成功');
              } catch (error) {
                if ((error as any).name !== 'AbortError') {
                  console.error('生成建议失败:', error);
                }
              } finally {
                requestInProgress = false;
                currentAbortController = null;
              }
            }, 300); // ✨ 从1000ms减少到300ms
          };

          return {
            update: (view, prevState) => {
              // 防止循环更新
              if (isUpdating) {
                return;
              }

              //old code
              // if (view.state !== prevState) {
              //   updateSuggestion();
              // }
              // ✨ 优化：只在关键状态变化时触发更新
              const currentState = view.state;
              const selectionChanged =
                currentState.selection.from !== prevState.selection.from ||
                currentState.selection.to !== prevState.selection.to;

              const docChanged = !currentState.doc.eq(prevState.doc);

              // 只在选择变化或文档变化时更新
              if (selectionChanged || docChanged) {
                updateSuggestion();
              }
            },
            destroy: () => {
              // if (suggestionTimeout) {
              //   clearTimeout(suggestionTimeout);
              // }
              // currentSuggestion = null;
              // ✨ 清理资源
              if (suggestionTimeout) {
                clearTimeout(suggestionTimeout);
              }
              if (currentAbortController) {
                currentAbortController.abort();
              }
              currentSuggestion = null;
              lastRequestFingerprint = null;
              requestInProgress = false;
            },
          };
        },
      }),
    ];
  },
});

export default CodeBlockWithSuggestion;
