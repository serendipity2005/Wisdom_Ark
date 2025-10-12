import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * 简化版虚拟化渲染 - 基于 CSS class + IntersectionObserver
 *
 * 核心思路：
 * 1. 通过 appendTransaction 自动为块级节点添加 blockId
 * 2. 通过 nodeView 为每个块添加统一 class（block-node）
 * 3. 用 IntersectionObserver 监听可见性，动态添加/移除 .virtual-hidden
 * 4. CSS 控制 .virtual-hidden 显示占位符
 */

const BLOCK_TYPES = [
  'paragraph',
  'heading',
  'listItem',
  'codeBlock',
  'blockquote',
];

function genId() {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

class Metrics {
  heights = new Map<string, number>();
  order: string[] = [];
  estimate: Record<string, number> = {
    paragraph: 80,
    heading: 60,
    codeBlock: 200,
    listItem: 40,
    blockquote: 80,
  };
  recalcPos() {
    let top = 0;
    this.pos = new Map();
    for (const id of this.order) {
      this.pos.set(id, top);
      top += this.heights.get(id) ?? 80;
    }
  }
  pos = new Map<string, number>();
  getTop(id: string) {
    return this.pos.get(id) ?? 0;
  }
  getHeight(id: string, type?: string) {
    return this.heights.get(id) ?? this.estimate[type || 'paragraph'] ?? 80;
  }
  range(scrollTop: number, vh: number, buf: number) {
    if (!this.order.length) return { s: 0, e: -1 };
    let l = 0,
      r = this.order.length - 1,
      mid = 0;
    while (l <= r) {
      mid = (l + r) >> 1;
      const id = this.order[mid];
      const t = this.getTop(id);
      const b = t + this.getHeight(id);
      if (scrollTop >= t && scrollTop < b) break;
      if (scrollTop < t) r = mid - 1;
      else l = mid + 1;
    }
    const s = Math.max(0, mid - buf);
    let h = 0,
      e = mid;
    while (e < this.order.length && h < vh) {
      h += this.getHeight(this.order[e]);
      e++;
    }
    return { s, e: Math.min(this.order.length - 1, e + buf) };
  }
}
const metrics = new Metrics();

const key = new PluginKey('simpleVirtual');

export default Extension.create({
  name: 'virtualRendererSimple',

  addOptions() {
    return { buffer: 5, typingPause: 150 };
  },

  addGlobalAttributes() {
    return [
      {
        types: BLOCK_TYPES,
        attributes: {
          blockId: {
            default: null,
            parseHTML: (e) => e.getAttribute('data-block-id'),
            renderHTML: (attributes) => {
              if (!attributes.blockId) return {};
              return { 'data-block-id': attributes.blockId };
            },
          },
        },
      },
    ];
  },

  // 🔥 添加 CSS 样式
  onBeforeCreate() {
    if (typeof document === 'undefined') return;

    const styleId = 'virtual-renderer-simple-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 虚拟隐藏状态 - 保持高度但隐藏内容 */
      .virtual-hidden {
        min-height: 1px;
      }
      
      .virtual-hidden > * {
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  },
  addProseMirrorPlugins() {
    const buffer = this.options.buffer;
    const typingPause: number = this.options.typingPause ?? 150;
    let viewDom: HTMLElement;
    let typing = false;
    let raf = 0;
    return [
      new Plugin({
        key,
        appendTransaction(tx, _old, ns) {
          if (tx.some((t) => t.getMeta('autoId'))) return null;
          if (!tx.some((t) => t.docChanged)) return null;
          const tr = ns.tr;
          let m = false;
          ns.doc.descendants((n, pos) => {
            if (!BLOCK_TYPES.includes(n.type.name)) return true;
            const id = (n.attrs as any).blockId;
            if (!id) {
              tr.setNodeMarkup(pos, undefined, {
                ...n.attrs,
                blockId: genId(),
              });
              m = true;
            }
            return true;
          });
          if (m) {
            tr.setMeta('autoId', 1);
            return tr;
          }
          return null;
        },
        view(view) {
          viewDom = view.dom as HTMLElement;
          console.log(viewDom, 'viewDom');

          /* scroll handler */
          const applyVirtual = () => {
            const top = viewDom.scrollTop;
            const vh = viewDom.clientHeight;

            // 🔥 调试：检查滚动容器信息
            const totalBlocks = metrics.order.length;
            console.log(
              `[Virtual Debug] 滚动位置: ${top}px, 视口高度: ${vh}px, 总块数: ${totalBlocks}`,
            );

            const { s, e } = metrics.range(top, vh, buffer);
            let idx = -1;
            let hiddenCount = 0;
            let visibleCount = 0;
            let noIdCount = 0;
            let noDomCount = 0;

            view.state.doc.descendants((n, pos) => {
              if (!BLOCK_TYPES.includes(n.type.name)) return true;
              idx++;
              const id = (n.attrs as any).blockId;
              if (!id) {
                noIdCount++;
                return true;
              }
              const dom = view.nodeDOM(pos) as HTMLElement;
              if (!dom) {
                noDomCount++;
                return true;
              }
              const visible = idx >= s && idx <= e;
              if (typing || visible) {
                dom.classList.remove('virtual-hidden');
                visibleCount++;
              } else {
                console.log('有在视口外的');

                dom.classList.add('virtual-hidden');
                hiddenCount++;
              }
              return true;
            });

            // 🔥 详细调试日志
            console.log(
              `[Virtual] 可见: ${visibleCount}, 隐藏: ${hiddenCount}, 范围: ${s}-${e}`,
              `| 无ID: ${noIdCount}, 无DOM: ${noDomCount}`,
            );
          };
          const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(applyVirtual);
          };
          viewDom.addEventListener('scroll', onScroll, { passive: true });
          /* typing pause */
          viewDom.addEventListener('keydown', () => {
            typing = true;
          });
          const stop = () => {
            setTimeout(() => {
              typing = false;
              applyVirtual();
            }, typingPause);
          };
          viewDom.addEventListener('keyup', stop);
          viewDom.addEventListener('compositionend', stop);
          /* height observer */
          const ro = new ResizeObserver((entries) => {
            entries.forEach((e) => {
              const id = e.target.getAttribute('data-block-id');
              if (id) metrics.heights.set(id, e.contentRect.height);
            });
            metrics.recalcPos();
            applyVirtual();
          });
          const observeHeights = () => {
            viewDom
              .querySelectorAll('[data-block-id]')
              .forEach((el) => ro.observe(el));
          };
          observeHeights();
          /* initial cache */
          const buildOrder = () => {
            const o: string[] = [];
            view.state.doc.descendants((n) => {
              if (BLOCK_TYPES.includes(n.type.name))
                o.push((n.attrs as any).blockId);
              return true;
            });
            metrics.order = o;
            metrics.recalcPos();
          };
          buildOrder();
          applyVirtual();
          return {
            update() {
              buildOrder();
              observeHeights();
              applyVirtual();
            },
            destroy() {
              ro.disconnect();
              viewDom.removeEventListener('scroll', onScroll);
            },
          };
        },
      }),
    ];
  },
});
