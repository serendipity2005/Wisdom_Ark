import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
import editor from '../config/editorConfig';

/**
 * 虚拟化渲染扩展 - 基于 Decoration 的智能占位方案
 * 参考语雀/飞书方案一：保持文档模型完整，仅在视图层优化
 *
 * 核心特性：
 * 1. 自动为块级节点生成唯一 blockId
 * 2. 通过 ResizeObserver 动态测量并缓存节点高度
 * 3. 基于滚动位置计算可视区，非可视区用占位符替代
 * 4. 光标附近强制渲染，确保编辑体验
 * 5. 提供 scrollToBlock 命令用于目录跳转
 */

const VIRTUAL_RENDERER_KEY = new PluginKey('virtualRenderer');

// 块高度与位置缓存
class BlockMetrics {
  private heightCache = new Map<string, number>();
  private positionCache = new Map<string, number>();
  private blockOrder: string[] = [];

  // 预估高度（用于首次渲染前）
  private estimatedHeights: Record<string, number> = {
    paragraph: 80,
    heading: 60,
    codeBlock: 200,
    listItem: 40,
    blockquote: 80,
  };

  setBlockOrder(order: string[]) {
    this.blockOrder = order;
    this.recalculatePositions();
  }

  setHeight(blockId: string, height: number) {
    if (height <= 0 || !Number.isFinite(height)) return;
    this.heightCache.set(blockId, height);
  }

  getHeight(blockId: string, nodeType?: string): number {
    return (
      this.heightCache.get(blockId) ??
      this.estimatedHeights[nodeType || 'paragraph'] ??
      80
    );
  }

  getOffsetTop(blockId: string): number {
    return this.positionCache.get(blockId) ?? 0;
  }

  getTotalHeight(): number {
    let total = 0;
    for (const id of this.blockOrder) {
      total += this.heightCache.get(id) ?? 80;
    }
    return total;
  }

  private recalculatePositions() {
    let currentTop = 0;
    for (const id of this.blockOrder) {
      this.positionCache.set(id, currentTop);
      currentTop += this.heightCache.get(id) ?? 80;
    }
  }

  // 二分查找可视区范围
  getVisibleRange(scrollTop: number, viewportHeight: number, buffer = 5) {
    if (this.blockOrder.length === 0) return { start: 0, end: -1 };

    let startIdx = 0;
    let endIdx = this.blockOrder.length - 1;

    // 二分查找起始块
    let left = 0;
    let right = this.blockOrder.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const id = this.blockOrder[mid];
      const top = this.getOffsetTop(id);
      const bottom = top + this.getHeight(id);

      if (scrollTop >= top && scrollTop < bottom) {
        startIdx = mid;
        break;
      }
      if (scrollTop < top) right = mid - 1;
      else left = mid + 1;
      startIdx = left;
    }

    // 累加高度查找结束块
    let acc = 0;
    endIdx = startIdx;
    while (endIdx < this.blockOrder.length && acc < viewportHeight) {
      acc += this.getHeight(this.blockOrder[endIdx]);
      endIdx++;
    }

    return {
      start: Math.max(0, startIdx - buffer),
      end: Math.min(this.blockOrder.length - 1, endIdx + buffer),
    };
  }

  findBlockIdAtY(y: number): string | null {
    if (this.blockOrder.length === 0) return null;
    for (const id of this.blockOrder) {
      const top = this.getOffsetTop(id);
      const bottom = top + this.getHeight(id);
      if (y >= top && y < bottom) return id;
    }
    return this.blockOrder[this.blockOrder.length - 1] ?? null;
  }
}

const metrics = new BlockMetrics();

// 生成唯一 blockId
function generateBlockId(): string {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// 查找滚动容器
function findScrollContainer(view: EditorView): HTMLElement {
  // 向上查找最近的可滚动容器
  let el = view.dom.parentElement;
  while (el) {
    const overflow = window.getComputedStyle(el).overflowY;
    if (overflow === 'auto' || overflow === 'scroll') return el;
    el = el.parentElement;
  }
  return view.dom as HTMLElement;
}

export const VirtualRenderer = Extension.create({
  name: 'virtualRenderer',

  addOptions() {
    return {
      bufferSize: 5, // 可视区上下缓冲块数
      cursorBuffer: 1000, // 光标周围强制渲染范围（字符数）
    };
  },

  addCommands() {
    return {
      // 目录跳转命令
      scrollToBlock:
        (blockId: string) =>
        ({ editor }) => {
          const view = editor.view;
          if (!view) return false;

          const container = findScrollContainer(view);
          const offsetTop = metrics.getOffsetTop(blockId);

          // 先快速滚动到预估位置
          container.scrollTop = Math.max(0, offsetTop - 100);

          // 等待渲染后精确定位
          requestAnimationFrame(() => {
            const targetEl = view.dom.querySelector(
              `[data-block-id="${blockId}"]`,
            );
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });

          return true;
        },

      // 手动设置 blockId（用于测试或特殊场景）
      setBlockId:
        (blockId: string, nodeType = 'paragraph') =>
        ({ commands }) =>
          commands.updateAttributes(nodeType, { blockId }),
    };
  },

  addProseMirrorPlugins() {
    const { bufferSize, cursorBuffer } = this.options;
    let currentView: EditorView | null = null;
    let heightObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    return [
      new Plugin({
        key: VIRTUAL_RENDERER_KEY,

        state: {
          init() {
            return { decorations: DecorationSet.empty };
          },

          apply(tr, value, _oldState, newState) {
            console.log(88888);

            const decorations = value.decorations.map(tr.mapping, tr.doc);
            console.log(tr.docChanged);

            // 文档变化时更新 blockId 和缓存
            if (tr.docChanged) {
              console.log('文档变化');

              const order: string[] = [];
              let modified = false;

              newState.doc.descendants((node, pos) => {
                console.log(node, 'defef');

                if (
                  ![
                    'paragraph',
                    'heading',
                    'listItem',
                    'codeBlock',
                    'blockquote',
                  ].includes(node.type.name)
                ) {
                  return true;
                }

                let blockId = (node.attrs as any)?.blockId;
                if (!blockId || blockId === 'blockidss') {
                  blockId = generateBlockId();
                  console.log('生成id', blockId, pos);

                  tr.setNodeMarkup(pos, node.type, { ...node.attrs, blockId });
                  tr.setNodeAttribute(pos, 'data-block-id', blockId);

                  console.log('设置id了');

                  modified = true;
                }
                order.push(blockId);
                return true;
              });

              metrics.setBlockOrder(order);
              return {
                decorations: modified ? DecorationSet.empty : decorations,
              };
            }

            // 批量高度更新（来自 ResizeObserver）
            const heightUpdates = tr.getMeta('heightUpdates') as
              | { blockId: string; height: number }[]
              | undefined;
            if (heightUpdates && Array.isArray(heightUpdates)) {
              for (const { blockId, height } of heightUpdates) {
                metrics.setHeight(blockId, height);
              }
              metrics.setBlockOrder(metrics['blockOrder']); // trigger recalc
            }

            return { decorations };
          },
        },

        props: {
          decorations(state) {
            if (!currentView) return DecorationSet.empty;

            const container = findScrollContainer(currentView);
            const scrollTop = container.scrollTop;
            const viewportHeight = container.clientHeight;
            const { start, end } = metrics.getVisibleRange(
              scrollTop,
              viewportHeight,
              bufferSize,
            );

            // 获取光标位置
            const { from, to } = state.selection;

            const decos: Decoration[] = [];
            let index = -1;

            state.doc.descendants((node, pos) => {
              if (
                ![
                  'paragraph',
                  'heading',
                  'listItem',
                  'codeBlock',
                  'blockquote',
                ].includes(node.type.name)
              ) {
                return true;
              }

              index++;
              const blockId = (node.attrs as any)?.blockId;
              if (!blockId) return true;

              const isVisible = index >= start && index <= end;
              const hasCursor =
                (from >= pos && from <= pos + node.nodeSize) ||
                (to >= pos && to <= pos + node.nodeSize);
              const nearCursor =
                Math.abs(from - pos) < cursorBuffer ||
                Math.abs(to - pos) < cursorBuffer;

              // 光标附近强制渲染
              if (hasCursor || nearCursor) return true;

              if (!isVisible) {
                const height = metrics.getHeight(blockId, node.type.name);
                // 占位 widget
                decos.push(
                  Decoration.widget(pos, () => {
                    const div = document.createElement('div');
                    div.className = 'virtual-placeholder';
                    div.style.height = `${height}px`;
                    div.style.width = '100%';
                    div.dataset.blockId = blockId;
                    return div;
                  }),
                );
                // 隐藏真实节点
                decos.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    style: 'display:none',
                  }),
                );
              }

              return true;
            });

            return DecorationSet.create(state.doc, decos);
          },

          handleDOMEvents: {
            scroll(view) {
              // 滚动时触发重新计算可视区
              requestAnimationFrame(() => {
                if (currentView) {
                  currentView.dispatch(
                    currentView.state.tr.setMeta('scroll', true),
                  );
                }
              });
              return false;
            },
          },
        },

        view(view) {
          currentView = view;
          const container = findScrollContainer(view);

          // ResizeObserver 测量高度
          const pendingUpdates: { blockId: string; height: number }[] = [];
          let scheduled = false;

          const flushHeights = () => {
            if (pendingUpdates.length === 0) return;
            const updates = pendingUpdates.splice(0);
            view.dispatch(view.state.tr.setMeta('heightUpdates', updates));
            scheduled = false;
          };

          heightObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
              const el = entry.target as HTMLElement;
              const blockId =
                el.dataset.blockId ||
                el.closest('[data-block-id]')?.getAttribute('data-block-id');
              if (blockId && !el.classList.contains('virtual-placeholder')) {
                pendingUpdates.push({
                  blockId,
                  height: entry.contentRect.height,
                });
              }
            }
            if (!scheduled) {
              scheduled = true;
              requestIdleCallback(flushHeights, { timeout: 100 });
            }
          });

          // 观察所有块级元素
          const observeBlocks = () => {
            const blocks = container.querySelectorAll('[data-block-id]');
            blocks.forEach((el) => {
              if (!el.classList.contains('virtual-placeholder')) {
                heightObserver?.observe(el as HTMLElement);
              }
            });
          };

          // MutationObserver 监听 DOM 变化
          mutationObserver = new MutationObserver(() => {
            observeBlocks();
          });
          mutationObserver.observe(container, {
            childList: true,
            subtree: true,
          });

          observeBlocks();

          return {
            update() {
              // 视图更新时重新观察
              observeBlocks();
            },
            destroy() {
              heightObserver?.disconnect();
              mutationObserver?.disconnect();
              currentView = null;
            },
          };
        },
      }),
    ];
  },
});

export default VirtualRenderer;
