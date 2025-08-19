// import { Extension } from '@tiptap/core';
// import { Editor } from '@tiptap/core';
// import { Node as ProseMirrorNode } from 'prosemirror-model';
// import { Transaction, EditorState } from 'prosemirror-state';
// import { EditorView } from 'prosemirror-view';

// import { Plugin, PluginKey } from 'prosemirror-state';

// export interface AutoMergeBlockquotesOptions {
//   /** 是否启用自动合并 */
//   enabled?: boolean;
//   /** 延迟执行时间(ms)，避免频繁触发 */
//   delay?: number;
//   /** 是否在粘贴后合并 */
//   mergeOnPaste?: boolean;
//   /** 是否在删除后合并 */
//   mergeOnDelete?: boolean;
//   /** 是否在输入后合并 */
//   mergeOnInput?: boolean;
// }
// // 方法一：基础合并函数
// // export function mergeAdjacentBlockquotes(editor: Editor): boolean {
// //   const { state, dispatch } = editor.view;
// //   const { tr } = state;
// //   let modified = false;

// //   state.doc.descendants(
// //     (node: ProseMirrorNode, pos: number): boolean | void => {
// //       if (node.type.name === 'blockquote') {
// //         const nextPos = pos + node.nodeSize;
// //         const nextNode = state.doc.nodeAt(nextPos);

// //         if (nextNode && nextNode.type.name === 'blockquote') {
// //           // 将第二个 blockquote 的内容移动到第一个中
// //           const content = nextNode.content;
// //           tr.insert(pos + node.nodeSize - 1, content);
// //           tr.delete(nextPos, nextPos + nextNode.nodeSize);
// //           modified = true;
// //           return false; // 停止遍历
// //         }
// //       }
// //     },
// //   );

// //   if (modified && dispatch) {
// //     dispatch(tr);
// //     return true;
// //   }
// //   return false;
// // }

// // 方法二：自定义扩展
// export interface MergeBlockquotesOptions {
//   autoMerge?: boolean;
//   mergeOnBackspace?: boolean;

//   /** 延迟执行时间(ms)，避免频繁触发 */
//   delay?: number;
//   /** 是否在粘贴后合并 */
//   mergeOnPaste?: boolean;
//   /** 是否在删除后合并 */
//   mergeOnDelete?: boolean;
//   /** 是否在输入后合并 */
//   mergeOnInput?: boolean;
// }

// declare module '@tiptap/core' {
//   interface Commands<ReturnType> {
//     mergeBlockquotes: {
//       mergeBlockquotes: () => ReturnType;
//       mergeBlockquotesAtSelection: () => ReturnType;
//     };
//   }
// }

// export const MergeBlockquotes = Extension.create<MergeBlockquotesOptions>({
//   name: 'mergeBlockquotes',

//   addOptions(): MergeBlockquotesOptions {
//     return {
//       autoMerge: false,
//       mergeOnBackspace: true,
//     };
//   },

//   addCommands() {
//     return {
//       mergeBlockquotes:
//         () =>
//         ({
//           tr,
//           state,
//           dispatch,
//           editor,
//         }: {
//           tr: Transaction;
//           state: EditorState;
//           dispatch?: (tr: Transaction) => void;
//           editor: Editor;
//         }) => {
//           let merged = false;
//           console.log(555);

//           state.doc.descendants(
//             (node: ProseMirrorNode, pos: number): boolean | void => {
//               if (node.type.name === 'blockquote') {
//                 const after = state.doc.resolve(pos + node.nodeSize);
//                 const nextNode = after.nodeAfter;

//                 if (nextNode && nextNode.type.name === 'blockquote') {
//                   // 合并内容
//                   const mergedContent = node.content.append(nextNode.content);
//                   const newBlockquote = state.schema.nodes.blockquote.create(
//                     node.attrs,
//                     mergedContent,
//                   );

//                   tr.replaceWith(
//                     pos,
//                     pos + node.nodeSize + nextNode.nodeSize,
//                     newBlockquote,
//                   );
//                   merged = true;
//                   return false;
//                 }
//               }
//             },
//           );

//           if (merged && dispatch) {
//             dispatch(tr);
//             return true;
//           }
//           return false;
//         },

//       mergeBlockquotesAtSelection:
//         () =>
//         ({
//           state,
//           dispatch,
//           editor,
//         }: {
//           state: EditorState;
//           dispatch?: (tr: Transaction) => void;
//           editor: Editor;
//         }) => {
//           const { selection } = state;
//           const { $from } = selection;

//           if ($from.parent.type.name !== 'blockquote') {
//             return false;
//           }

//           const blockquotePos = $from.before();
//           const prevNode = state.doc.resolve(blockquotePos).nodeBefore;
//           const nextNode = state.doc.resolve($from.after()).nodeAfter;

//           const tr = state.tr;
//           let merged = false;

//           // 尝试与前一个节点合并
//           if (prevNode && prevNode.type.name === 'blockquote') {
//             const mergedContent = prevNode.content.append($from.parent.content);
//             const newBlockquote = state.schema.nodes.blockquote.create(
//               prevNode.attrs,
//               mergedContent,
//             );

//             tr.replaceWith(
//               blockquotePos - prevNode.nodeSize,
//               blockquotePos + $from.parent.nodeSize,
//               newBlockquote,
//             );
//             merged = true;
//           }
//           // 尝试与后一个节点合并
//           else if (nextNode && nextNode.type.name === 'blockquote') {
//             const mergedContent = $from.parent.content.append(nextNode.content);
//             const newBlockquote = state.schema.nodes.blockquote.create(
//               $from.parent.attrs,
//               mergedContent,
//             );

//             tr.replaceWith(
//               blockquotePos,
//               blockquotePos + $from.parent.nodeSize + nextNode.nodeSize,
//               newBlockquote,
//             );
//             merged = true;
//           }

//           if (merged && dispatch) {
//             dispatch(tr);
//             return true;
//           }
//           return false;
//         },
//     };
//   },
//   addProseMirrorPlugins() {
//     const options = this.options;

//     return [
//       new Plugin({
//         key: new PluginKey('autoMergeBlockquotes'),

//         state: {
//           init() {
//             return {
//               timeoutId: null as NodeJS.Timeout | null,
//             };
//           },

//           apply(
//             tr: Transaction,
//             pluginState: { timeoutId: NodeJS.Timeout | null },
//           ) {
//             // 如果禁用了自动合并，直接返回
//             if (!options.autoMerge) {
//               return pluginState;
//             }

//             // 检查是否有文档变更
//             if (!tr.docChanged) {
//               return pluginState;
//             }

//             // 清除之前的定时器
//             if (pluginState.timeoutId) {
//               clearTimeout(pluginState.timeoutId);
//             }

//             return pluginState;
//           },
//         },

//         appendTransaction(
//           transactions: Transaction[],
//           oldState: EditorState,
//           newState: EditorState,
//         ) {
//           if (!options.autoMerge) {
//             return null;
//           }

//           // 检查是否需要触发合并
//           const shouldMerge = transactions.some((tr) => {
//             if (!tr.docChanged) return false;

//             // 检查事务类型
//             const meta = tr.getMeta('paste');
//             if (meta && options.mergeOnPaste) return true;

//             const inputType = tr.getMeta('inputType');
//             if (inputType === 'deleteContentBackward' && options.mergeOnDelete)
//               return true;
//             if (inputType === 'insertText' && options.mergeOnInput) return true;

//             // 检查是否有 blockquote 相关的更改
//             let hasBlockquoteChanges = false;
//             tr.steps.forEach((step) => {
//               if (step.toJSON && step.toJSON().stepType) {
//                 const stepData = step.toJSON();
//                 if (stepData.slice && stepData.slice.content) {
//                   const content = JSON.stringify(stepData.slice.content);
//                   if (content.includes('blockquote')) {
//                     hasBlockquoteChanges = true;
//                   }
//                 }
//               }
//             });

//             return hasBlockquoteChanges;
//           });

//           if (!shouldMerge) {
//             return null;
//           }

//           // 执行自动合并
//           return this.autoMergeBlockquotes(newState);
//         },

//         // 自动合并逻辑
//         autoMergeBlockquotes(state: EditorState): Transaction | null {
//           const tr = state.tr;
//           let modified = false;

//           // 递归查找并合并相邻的 blockquote
//           const mergeAdjacentBlockquotes = (
//             node: ProseMirrorNode,
//             offset: number,
//           ) => {
//             if (node.type.name === 'blockquote') {
//               const nextPos = offset + node.nodeSize;
//               const nextNode = state.doc.nodeAt(nextPos);

//               if (nextNode && nextNode.type.name === 'blockquote') {
//                 // 合并内容
//                 const mergedContent = node.content.append(nextNode.content);
//                 const newBlockquote = state.schema.nodes.blockquote.create(
//                   { ...node.attrs }, // 保持第一个 blockquote 的属性
//                   mergedContent,
//                 );

//                 tr.replaceWith(
//                   offset,
//                   nextPos + nextNode.nodeSize,
//                   newBlockquote,
//                 );
//                 modified = true;
//                 return true; // 表示已合并，需要重新开始
//               }
//             }

//             // 递归处理子节点
//             if (node.content) {
//               let childOffset = offset + 1; // +1 跳过开始标签
//               for (let i = 0; i < node.content.childCount; i++) {
//                 const child = node.content.child(i);
//                 if (mergeAdjacentBlockquotes(child, childOffset)) {
//                   return true; // 如果子节点有合并，停止当前循环
//                 }
//                 childOffset += child.nodeSize;
//               }
//             }

//             return false;
//           };

//           // 持续合并直到没有相邻的 blockquote
//           let hasChanges = true;
//           let attempts = 0;
//           const maxAttempts = 10; // 防止无限循环

//           while (hasChanges && attempts < maxAttempts) {
//             hasChanges = false;
//             attempts++;

//             // 重新获取最新的文档状态
//             const currentDoc = modified ? tr.doc : state.doc;

//             try {
//               currentDoc.descendants((node: ProseMirrorNode, pos: number) => {
//                 if (node.type.name === 'blockquote') {
//                   const nextPos = pos + node.nodeSize;
//                   const nextNode = currentDoc.nodeAt(nextPos);

//                   if (nextNode && nextNode.type.name === 'blockquote') {
//                     const mergedContent = node.content.append(nextNode.content);
//                     const newBlockquote = state.schema.nodes.blockquote.create(
//                       { ...node.attrs },
//                       mergedContent,
//                     );

//                     tr.replaceWith(
//                       pos,
//                       nextPos + nextNode.nodeSize,
//                       newBlockquote,
//                     );
//                     modified = true;
//                     hasChanges = true;
//                     return false; // 停止当前遍历
//                   }
//                 }
//                 return true;
//               });
//             } catch (error) {
//               console.warn('Auto merge blockquotes error:', error);
//               break;
//             }
//           }

//           return modified ? tr : null;
//         },
//       }),
//     ];
//   },
//   addKeyboardShortcuts() {
//     return {
//       Backspace: ({ editor }): boolean => {
//         if (!this.options.mergeOnBackspace) {
//           return false;
//         }

//         const { state } = editor;
//         const { selection } = state;
//         const { $from } = selection;

//         // 检查当前是否在 blockquote 的开始位置
//         if (
//           $from.parent.type.name === 'blockquote' &&
//           $from.parentOffset === 0
//         ) {
//           const pos = $from.before();
//           const prevNode = state.doc.resolve(pos).nodeBefore;

//           if (prevNode && prevNode.type.name === 'blockquote') {
//             return editor.commands.mergeBlockquotesAtSelection();
//           }
//         }

//         return false;
//       },

//       'Mod-Shift-m': ({ editor }): boolean => {
//         return editor.commands.mergeBlockquotes();
//       },
//     };
//   },
// });
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import type { Transaction, EditorState } from 'prosemirror-state';

// 自动合并配置选项
export interface AutoMergeBlockquotesOptions {
  /** 是否启用自动合并 */
  enabled?: boolean;
  /** 延迟执行时间(ms)，避免频繁触发 */
  delay?: number;
  /** 是否在粘贴后合并 */
  mergeOnPaste?: boolean;
  /** 是否在删除后合并 */
  mergeOnDelete?: boolean;
  /** 是否在输入后合并 */
  mergeOnInput?: boolean;
}

// Plugin Key
const autoMergePluginKey = new PluginKey('autoMergeBlockquotes');

// 自动合并扩展
export const AutoMergeBlockquotes =
  Extension.create<AutoMergeBlockquotesOptions>({
    name: 'autoMergeBlockquotes',

    addOptions(): AutoMergeBlockquotesOptions {
      return {
        enabled: true,
        delay: 0,
        mergeOnPaste: true,
        mergeOnDelete: true,
        mergeOnInput: true,
      };
    },

    addProseMirrorPlugins() {
      const options = this.options;

      return [
        new Plugin({
          key: autoMergePluginKey,

          state: {
            init() {
              return {
                timeoutId: null as NodeJS.Timeout | null,
              };
            },

            apply(
              tr: Transaction,
              pluginState: { timeoutId: NodeJS.Timeout | null },
            ) {
              // 如果禁用了自动合并，直接返回
              if (!options.enabled) {
                return pluginState;
              }

              // 检查是否有文档变更
              if (!tr.docChanged) {
                return pluginState;
              }

              // 清除之前的定时器
              if (pluginState.timeoutId) {
                clearTimeout(pluginState.timeoutId);
              }

              return pluginState;
            },
          },

          appendTransaction(
            transactions: readonly Transaction[],
            oldState: EditorState,
            newState: EditorState,
          ) {
            if (!options.enabled) {
              return null;
            }

            // 检查是否需要触发合并
            const shouldMerge = transactions.some((tr) => {
              if (!tr.docChanged) return false;

              // 检查事务类型
              const meta = tr.getMeta('paste');
              if (meta && options.mergeOnPaste) return true;

              const inputType = tr.getMeta('inputType');
              if (
                inputType === 'deleteContentBackward' &&
                options.mergeOnDelete
              )
                return true;
              if (inputType === 'insertText' && options.mergeOnInput)
                return true;

              // 检查是否有 blockquote 相关的更改
              let hasBlockquoteChanges = false;
              tr.steps.forEach((step) => {
                if (step.toJSON && step.toJSON().stepType) {
                  const stepData = step.toJSON();
                  if (stepData.slice && stepData.slice.content) {
                    const content = JSON.stringify(stepData.slice.content);
                    if (content.includes('blockquote')) {
                      hasBlockquoteChanges = true;
                    }
                  }
                }
              });

              return hasBlockquoteChanges;
            });

            if (!shouldMerge) {
              return null;
            }

            // 执行自动合并
            return autoMergeBlockquotes(newState);
          },

          // // 自动合并逻辑
          //   autoMergeBlockquotes(state: EditorState): Transaction | null {
          //     const tr = state.tr;
          //     let modified = false;
          //     console.log('执行了6666');

          //     // 递归查找并合并相邻的 blockquote
          //     const mergeAdjacentBlockquotes = (
          //       node: ProseMirrorNode,
          //       offset: number,
          //     ) => {
          //       if (node.type.name === 'blockquote') {
          //         const nextPos = offset + node.nodeSize;
          //         const nextNode = state.doc.nodeAt(nextPos);

          //         if (nextNode && nextNode.type.name === 'blockquote') {
          //           // 合并内容
          //           const mergedContent = node.content.append(nextNode.content);
          //           const newBlockquote = state.schema.nodes.blockquote.create(
          //             { ...node.attrs }, // 保持第一个 blockquote 的属性
          //             mergedContent,
          //           );

          //           tr.replaceWith(
          //             offset,
          //             nextPos + nextNode.nodeSize,
          //             newBlockquote,
          //           );
          //           modified = true;
          //           return true; // 表示已合并，需要重新开始
          //         }
          //       }

          //       // 递归处理子节点
          //       if (node.content) {
          //         let childOffset = offset + 1; // +1 跳过开始标签
          //         for (let i = 0; i < node.content.childCount; i++) {
          //           const child = node.content.child(i);
          //           if (mergeAdjacentBlockquotes(child, childOffset)) {
          //             return true; // 如果子节点有合并，停止当前循环
          //           }
          //           childOffset += child.nodeSize;
          //         }
          //       }

          //       return false;
          //     };

          //     // 持续合并直到没有相邻的 blockquote
          //     let hasChanges = true;
          //     let attempts = 0;
          //     const maxAttempts = 10; // 防止无限循环

          //     while (hasChanges && attempts < maxAttempts) {
          //       hasChanges = false;
          //       attempts++;

          //       // 重新获取最新的文档状态
          //       const currentDoc = modified ? tr.doc : state.doc;

          //       try {
          //         currentDoc.descendants((node: ProseMirrorNode, pos: number) => {
          //           if (node.type.name === 'blockquote') {
          //             const nextPos = pos + node.nodeSize;
          //             const nextNode = currentDoc.nodeAt(nextPos);

          //             if (nextNode && nextNode.type.name === 'blockquote') {
          //               const mergedContent = node.content.append(
          //                 nextNode.content,
          //               );
          //               const newBlockquote =
          //                 state.schema.nodes.blockquote.create(
          //                   { ...node.attrs },
          //                   mergedContent,
          //                 );

          //               tr.replaceWith(
          //                 pos,
          //                 nextPos + nextNode.nodeSize,
          //                 newBlockquote,
          //               );
          //               modified = true;
          //               hasChanges = true;
          //               return false; // 停止当前遍历
          //             }
          //           }
          //           return true;
          //         });
          //       } catch (error) {
          //         console.warn('Auto merge blockquotes error:', error);
          //         break;
          //       }
          //     }

          //     return modified ? tr : null;
          //   },
        }),
      ];
    },
  });

// function autoMergeBlockquotes(state: EditorState): Transaction | null {
//   console.log(55555555);
//   const tr = state.tr;
//   let modified = false;
//   // 递归查找并合并相邻的 blockquote
//   const mergeAdjacentBlockquotes = (node: ProseMirrorNode, offset: number) => {
//     if (node.type.name === 'blockquote') {
//       const nextPos = offset + node.nodeSize;
//       const nextNode = state.doc.nodeAt(nextPos);

//       if (nextNode && nextNode.type.name === 'blockquote') {
//         // 合并内容
//         const mergedContent = node.content.append(nextNode.content);
//         const newBlockquote = state.schema.nodes.blockquote.create(
//           { ...node.attrs }, // 保持第一个 blockquote 的属性
//           mergedContent,
//         );

//         tr.replaceWith(offset, nextPos + nextNode.nodeSize, newBlockquote);
//         modified = true;
//         return true; // 表示已合并，需要重新开始
//       }
//     }

//     // 递归处理子节点
//     if (node.content) {
//       let childOffset = offset + 1; // +1 跳过开始标签
//       for (let i = 0; i < node.content.childCount; i++) {
//         const child = node.content.child(i);
//         if (mergeAdjacentBlockquotes(child, childOffset)) {
//           return true; // 如果子节点有合并，停止当前循环
//         }
//         childOffset += child.nodeSize;
//       }
//     }

//     return false;
//   };

//   // 持续合并直到没有相邻的 blockquote
//   let hasChanges = true;
//   let attempts = 0;
//   const maxAttempts = 10; // 防止无限循环

//   while (hasChanges && attempts < maxAttempts) {
//     hasChanges = false;
//     attempts++;

//     // 重新获取最新的文档状态
//     const currentDoc = modified ? tr.doc : state.doc;

//     try {
//       currentDoc.descendants((node: ProseMirrorNode, pos: number) => {
//         if (node.type.name === 'blockquote') {
//           const nextPos = pos + node.nodeSize;
//           const nextNode = currentDoc.nodeAt(nextPos);

//           if (nextNode && nextNode.type.name === 'blockquote') {
//             const mergedContent = node.content.append(nextNode.content);
//             const newBlockquote = state.schema.nodes.blockquote.create(
//               { ...node.attrs },
//               mergedContent,
//             );

//             tr.replaceWith(pos, nextPos + nextNode.nodeSize, newBlockquote);
//             modified = true;
//             hasChanges = true;
//             return false; // 停止当前遍历
//           }
//         }
//         return true;
//       });
//     } catch (error) {
//       console.warn('Auto merge blockquotes error:', error);
//       break;
//     }
//   }

//   return modified ? tr : null;
// }

// function autoMergeBlockquotes(state: EditorState): Transaction | null {
//   console.log('执行了');

//   const tr = state.tr;
//   let modified = false;

//   // 持续合并直到没有相邻的 blockquote
//   let hasChanges = true;
//   let attempts = 0;
//   const maxAttempts = 10; // 防止无限循环

//   while (hasChanges && attempts < maxAttempts) {
//     hasChanges = false;
//     attempts++;

//     // 重新获取最新的文档状态
//     const currentDoc = modified ? tr.doc : state.doc;

//     try {
//       currentDoc.descendants((node: ProseMirrorNode, pos: number) => {
//         if (node.type.name === 'blockquote') {
//           const nextPos = pos + node.nodeSize;
//           const nextNode = currentDoc.nodeAt(nextPos);

//           if (nextNode && nextNode.type.name === 'blockquote') {
//             const mergedContent = node.content.append(nextNode.content);
//             const newBlockquote = state.schema.nodes.blockquote.create(
//               { ...node.attrs },
//               mergedContent,
//             );

//             tr.replaceWith(pos, nextPos + nextNode.nodeSize, newBlockquote);
//             modified = true;
//             hasChanges = true;
//             return false; // 停止当前遍历，因为文档结构已改变
//           }
//         }
//         return true;
//       });
//     } catch (error) {
//       console.warn('Auto merge blockquotes error:', error);
//       break;
//     }
//   }

//   return modified ? tr : null;
// }
// 方法3：单次遍历处理（最安全）
// function autoMergeBlockquotes(state: EditorState): Transaction | null {
//   // 合并
//   console.log('执行了');
//   const tr = state.tr;
//   console.log(state.tr);

//   let modified = false;

//   // 构建需要处理的节点信息数组
//   const nodesToMerge: Array<{
//     firstPos: number;
//     firstNode: ProseMirrorNode;
//     secondPos: number;
//     secondNode: ProseMirrorNode;
//   }> = [];
//   let count = 0;
//   // 遍历文档中的所有节点（node:当前节点,当前位置）
//   state.doc.descendants((node: ProseMirrorNode, pos: number) => {
//     if (node.type.name === 'blockquote') {
//       count++;
//       const nextPos = pos + node.nodeSize; //当前节点结束位置的下一个位置
//       const nextNode = state.doc.nodeAt(nextPos); //获取后面的节点
//       console.log('nextNode', nextNode, nextPos);
//       if (nextNode && nextNode.type.name === 'blockquote') {
//         nodesToMerge.push({
//           firstPos: pos,
//           firstNode: node,
//           secondPos: nextPos,
//           secondNode: nextNode,
//         });
//       }
//     }
//     return true;
//   });

//   // 按位置倒序排列，从后往前处理
//   nodesToMerge.sort((a, b) => b.firstPos - a.firstPos);
//   console.log(count);
//   console.log(nodesToMerge.length);

//   // 处理合并
//   for (const { firstPos, firstNode, secondPos, secondNode } of nodesToMerge) {
//     const mergedContent = firstNode.content.append(secondNode.content);
//     const newBlockquote = state.schema.nodes.blockquote.create(
//       { ...firstNode.attrs },
//       mergedContent,
//     );

//     tr.replaceWith(firstPos, secondPos + secondNode.nodeSize, newBlockquote);
//     modified = true;
//   }

//   return modified ? tr : null;
// }
function autoMergeBlockquotes(state: EditorState): Transaction | null {
  console.log('执行了');
  const tr = state.tr;
  let modified = false;

  // 限制循环次数防止无限循环
  let iterations = 0;
  const maxIterations = 20;

  // 持续处理直到没有更多可以合并的blockquote
  while (iterations < maxIterations) {
    iterations++;
    let merged = false;

    // 获取当前文档状态
    const doc = modified ? tr.doc : state.doc;

    try {
      // 查找第一对相邻的blockquote进行合并
      let found = false;
      doc.descendants((node: ProseMirrorNode, pos: number) => {
        // 如果已经找到并处理了一对，停止遍历
        if (found) return false;

        if (node.type.name === 'blockquote') {
          const nextPos = pos + node.nodeSize;
          const nextNode = doc.nodeAt(nextPos);

          if (nextNode && nextNode.type.name === 'blockquote') {
            // 合并这两个相邻的blockquote
            const mergedContent = node.content.append(nextNode.content);
            const newBlockquote = state.schema.nodes.blockquote.create(
              { ...node.attrs },
              mergedContent,
            );

            tr.replaceWith(pos, nextPos + nextNode.nodeSize, newBlockquote);
            modified = true;
            merged = true;
            found = true;
            return false; // 停止当前遍历
          }
        }
        return true;
      });

      // 如果本轮没有合并任何节点，说明处理完成
      if (!merged) {
        break;
      }
    } catch (error) {
      console.warn('Auto merge blockquotes error:', error);
      break;
    }
  }

  return modified ? tr : null;
}
