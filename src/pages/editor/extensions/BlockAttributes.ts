import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import {
  Plugin as ProseMirrorPlugin,
  PluginKey as PMPluginKey,
} from '@tiptap/pm/state';

/**
 * 块级节点属性扩展
 * 为 paragraph、heading、codeBlock、blockquote、listItem 统一添加虚拟化所需属性
 */

// 支持虚拟化的节点类型
export const BLOCK_TYPES = [
  'paragraph',
  'heading',
  'codeBlock',
  'blockquote',
  'listItem',
];

// 生成唯一 blockId
function generateBlockId(): string {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

const AUTO_BLOCK_ID_KEY = new PMPluginKey('autoBlockId');

export const BlockAttributes = Extension.create({
  name: 'blockAttributes',

  addOptions() {
    return {
      // 是否启用虚拟化（默认启用）
      enableVirtualization: true,
      // 预加载边距
      preloadMargin: '500px',
      // 延迟卸载时间
      unloadDelay: 500,
      // 默认占位符高度
      defaultHeight: 80,
      // 编辑缓冲区
      editingBuffer: 1000,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: BLOCK_TYPES,
        attributes: {
          // 唯一标识，用于目录跳转和高度缓存
          blockId: {
            default: null,
            parseHTML: (element) => element.getAttribute('data-block-id'),
            renderHTML: (attributes) => {
              if (!attributes.blockId) return {};
              return {
                'data-block-id': attributes.blockId,
              };
            },
          },
          // 缓存高度（仅存在于文档模型，不渲染到 HTML）
          cachedHeight: {
            default: null,
            rendered: false,
          },
          // 文档中的偏移位置（仅模型）
          offsetTop: {
            default: null,
            rendered: false,
          },
        },
      },
    ];
  },

  // 🔥 暂时禁用 NodeView 虚拟化（使用 VirtualScroll 代替）
  // addNodeView() {
  //   return {};
  // },

  addProseMirrorPlugins() {
    return [
      // 自动为新节点添加 blockId
      new ProseMirrorPlugin({
        key: AUTO_BLOCK_ID_KEY,

        appendTransaction(transactions, _oldState, newState) {
          // 防止无限循环：跳过自己创建的 transaction
          if (transactions.some((tr) => tr.getMeta('autoBlockId'))) {
            return null;
          }

          // 只处理文档变化
          if (!transactions.some((tr) => tr.docChanged)) {
            return null;
          }

          const tr = newState.tr;
          let modified = false;

          newState.doc.descendants((node, pos) => {
            if (!BLOCK_TYPES.includes(node.type.name)) return true;

            const blockId = node.attrs.blockId as string | null;
            if (!blockId) {
              // 添加 blockId
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                blockId: generateBlockId(),
              });
              modified = true;
            }

            return true;
          });

          if (modified) {
            tr.setMeta('autoBlockId', true);
            return tr;
          }

          return null;
        },
      }),
    ];
  },

  addCommands() {
    return {
      scrollToBlock:
        (blockId: string) =>
        ({ editor }: { editor: Editor }) => {
          const { view } = editor;
          let targetPos: number | null = null;

          // 查找目标 blockId 的文档位置
          view.state.doc.descendants((node: ProseMirrorNode, pos: number) => {
            if (node.attrs.blockId === blockId) {
              targetPos = pos;
              return false; // 找到后停止遍历
            }
            return true;
          });

          if (targetPos === null) return false;

          console.log(
            `[BlockAttributes] 目录跳转: blockId=${blockId}, pos=${targetPos}`,
          );

          // 1. 找到目标元素并滚动到它
          requestAnimationFrame(() => {
            try {
              if (targetPos === null) return;

              const coords = view.coordsAtPos(targetPos);
              const container = view.dom.closest(
                '.tiptap',
              ) as HTMLElement | null;

              if (!container) {
                console.warn('[BlockAttributes] 未找到滚动容器');
                return;
              }

              // 计算目标位置
              const targetTop =
                coords.top -
                container.getBoundingClientRect().top +
                container.scrollTop;

              // 2. 滚动到目标位置
              container.scrollTo({
                top: targetTop - 100,
                behavior: 'smooth',
              });

              console.log(`[BlockAttributes] 滚动到: top=${targetTop - 100}px`);

              // 3. 设置光标到目标位置
              setTimeout(() => {
                if (targetPos === null) return;

                try {
                  const $pos = view.state.doc.resolve(targetPos);

                  const selection = (
                    view.state.selection.constructor as any
                  ).near($pos);
                  view.dispatch(view.state.tr.setSelection(selection));
                } catch (e) {
                  console.warn('[BlockAttributes] 设置光标失败:', e);
                }
              }, 300); // 等待滚动动画完成
            } catch (e) {
              console.warn('[BlockAttributes] 滚动失败:', e);
            }
          });

          return true;
        },
    };
  },
});

export default BlockAttributes;
