/**
 * 虚拟化 NodeView 基类
 *
 * 核心功能：
 * 1. 视口外：渲染固定高度的占位符 DOM（真正的虚拟化）
 * 2. 视口内：渲染真实内容 DOM
 * 3. 切换时保持滚动位置稳定
 * 4. 光标附近强制渲染真实内容
 */

import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { EditorView } from '@tiptap/pm/view';
import { Decoration } from '@tiptap/pm/view';
import type { NodeView } from '@tiptap/core';
import type { Editor } from '@tiptap/core';

interface VirtualNodeViewOptions {
  /** 预加载边距（节点距离视口多远时开始加载） */
  preloadMargin?: string;
  /** 延迟卸载时间（节点离开视口后多久卸载） */
  unloadDelay?: number;
  /** 默认占位符高度 */
  defaultHeight?: number;
  /** 编辑缓冲区（光标附近多少像素强制渲染） */
  editingBuffer?: number;
}

export class VirtualNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM?: HTMLElement;
  node: ProseMirrorNode;
  view: EditorView;
  getPos: () => number | undefined;
  editor: Editor;

  private isVirtual = true; // 当前是否为虚拟状态（占位符）
  private observer: IntersectionObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private unloadTimer: number | null = null;
  private cachedHeight: number;
  private options: Required<VirtualNodeViewOptions>;

  constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
    editor: Editor,
    options: VirtualNodeViewOptions = {},
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.editor = editor;

    // 合并默认选项
    this.options = {
      preloadMargin: '500px',
      unloadDelay: 500,
      defaultHeight: 80,
      editingBuffer: 1000,
      ...options,
    };

    // 从节点属性获取缓存高度
    this.cachedHeight = node.attrs.cachedHeight || this.options.defaultHeight;

    // 创建容器
    this.dom = document.createElement('div');
    this.dom.classList.add('virtual-node-container');
    this.dom.dataset.blockId = node.attrs.blockId || '';

    // 将 NodeView 实例保存到 DOM，供 scrollToBlock 访问
    (this.dom as any).__nodeView = this;

    // 初始渲染占位符
    this.renderPlaceholder();

    // 启动 IntersectionObserver
    this.setupIntersectionObserver();
  }

  /**
   * 渲染占位符（虚拟状态）
   */
  private renderPlaceholder() {
    this.isVirtual = true;
    this.dom.innerHTML = '';
    this.contentDOM = undefined;

    // 创建占位符
    const placeholder = document.createElement('div');
    placeholder.className = 'virtual-placeholder';
    placeholder.style.height = `${this.cachedHeight}px`;
    placeholder.style.minHeight = `${this.cachedHeight}px`;
    placeholder.style.backgroundColor = 'rgba(0, 0, 255, 0.05)'; // 调试用蓝色背景
    placeholder.textContent = `[占位符 ${this.cachedHeight}px]`;
    placeholder.style.fontSize = '12px';
    placeholder.style.color = '#999';
    placeholder.style.display = 'flex';
    placeholder.style.alignItems = 'center';
    placeholder.style.justifyContent = 'center';

    this.dom.appendChild(placeholder);

    console.log(
      `[VirtualNodeView] 渲染占位符: blockId=${this.node.attrs.blockId}, height=${this.cachedHeight}px`,
    );
  }

  /**
   * 渲染真实内容
   */
  private renderRealContent() {
    this.isVirtual = false;
    this.dom.innerHTML = '';

    // 创建真实内容容器
    const content = document.createElement(this.getTagName());
    content.className = 'virtual-real-content';

    // 复制节点属性到 DOM
    Object.entries(this.node.attrs).forEach(([key, value]) => {
      if (
        value !== null &&
        value !== undefined &&
        key !== 'cachedHeight' &&
        key !== 'offsetTop'
      ) {
        content.setAttribute(`data-${key}`, String(value));
      }
    });

    this.dom.appendChild(content);
    this.contentDOM = content;

    // 启动高度监听
    this.setupResizeObserver();

    console.log(
      `[VirtualNodeView] 渲染真实内容: blockId=${this.node.attrs.blockId}, type=${this.node.type.name}`,
    );
  }

  /**
   * 获取节点对应的 HTML 标签名
   */
  private getTagName(): string {
    const typeMap: Record<string, string> = {
      paragraph: 'p',
      heading: 'h1', // 会根据 level 动态调整
      blockquote: 'blockquote',
      codeBlock: 'pre',
      listItem: 'li',
      bulletList: 'ul',
      orderedList: 'ol',
    };

    let tag = typeMap[this.node.type.name] || 'div';

    // 处理标题级别
    if (this.node.type.name === 'heading' && this.node.attrs.level) {
      tag = `h${this.node.attrs.level}`;
    }

    return tag;
  }

  /**
   * 设置 IntersectionObserver 监听节点可见性
   */
  private setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 节点进入视口（或预加载区域）
            this.onEnterViewport();
          } else {
            // 节点离开视口
            this.onLeaveViewport();
          }
        });
      },
      {
        root: this.findScrollContainer(),
        rootMargin: this.options.preloadMargin, // 提前 500px 加载
        threshold: 0,
      },
    );

    this.observer.observe(this.dom);
  }

  /**
   * 设置 ResizeObserver 监听真实内容高度变化
   */
  private setupResizeObserver() {
    if (!this.contentDOM) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;

      if (height !== this.cachedHeight) {
        this.cachedHeight = height;

        // 更新节点属性
        const pos = this.getPos();
        if (pos !== undefined) {
          this.view.dispatch(
            this.view.state.tr.setNodeMarkup(pos, undefined, {
              ...this.node.attrs,
              cachedHeight: Math.ceil(height),
            }),
          );
        }

        console.log(
          `[VirtualNodeView] 高度变化: blockId=${this.node.attrs.blockId}, height=${height}px`,
        );
      }
    });

    this.resizeObserver.observe(this.contentDOM);
  }

  /**
   * 节点进入视口
   */
  private onEnterViewport() {
    // 清除延迟卸载定时器
    if (this.unloadTimer) {
      clearTimeout(this.unloadTimer);
      this.unloadTimer = null;
    }

    // 如果当前是虚拟状态，切换到真实内容
    if (this.isVirtual) {
      this.renderRealContent();
    }
  }

  /**
   * 节点离开视口
   */
  private onLeaveViewport() {
    // 检查是否在编辑状态
    if (this.isEditing()) {
      console.log(
        `[VirtualNodeView] 跳过卸载（正在编辑）: blockId=${this.node.attrs.blockId}`,
      );
      return;
    }

    // 延迟卸载，避免快速滚动时频繁切换
    this.unloadTimer = window.setTimeout(() => {
      if (!this.isVirtual) {
        // 清理 ResizeObserver
        if (this.resizeObserver) {
          this.resizeObserver.disconnect();
          this.resizeObserver = null;
        }

        // 切换到占位符
        this.renderPlaceholder();
      }
    }, this.options.unloadDelay);
  }

  /**
   * 判断节点是否在编辑状态
   */
  private isEditing(): boolean {
    const pos = this.getPos();
    if (pos === undefined) return false;

    const { from, to } = this.view.state.selection;
    const nodeEnd = pos + this.node.nodeSize;

    // 光标或选区在当前节点内
    const hasSelection = from >= pos && to <= nodeEnd;
    if (hasSelection) return true;

    // 光标在节点附近（编辑缓冲区内）
    const buffer = this.options.editingBuffer;
    const nearCursor =
      (from >= pos - buffer && from <= nodeEnd + buffer) ||
      (to >= pos - buffer && to <= nodeEnd + buffer);

    return nearCursor;
  }

  /**
   * 查找滚动容器
   */
  private findScrollContainer(): HTMLElement | null {
    let parent = this.dom.parentElement;

    while (parent) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;

      if (overflowY === 'auto' || overflowY === 'scroll') {
        if (parent.scrollHeight > parent.clientHeight) {
          return parent;
        }
      }

      parent = parent.parentElement;
    }

    return null;
  }

  /**
   * 节点更新时调用
   */
  update(node: ProseMirrorNode): boolean {
    // 只接受相同类型的节点更新
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;

    // 如果是虚拟状态且高度变化了，更新占位符高度
    if (this.isVirtual) {
      const newHeight = node.attrs.cachedHeight || this.options.defaultHeight;
      if (newHeight !== this.cachedHeight) {
        this.cachedHeight = newHeight;
        const placeholder = this.dom.querySelector(
          '.virtual-placeholder',
        ) as HTMLElement;
        if (placeholder) {
          placeholder.style.height = `${newHeight}px`;
          placeholder.style.minHeight = `${newHeight}px`;
          placeholder.textContent = `[占位符 ${newHeight}px]`;
        }
      }
    }

    return true;
  }

  /**
   * 强制渲染真实内容（用于目录跳转）
   */
  forceRender() {
    if (this.isVirtual) {
      this.renderRealContent();
    }
  }

  /**
   * 销毁时清理资源
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.unloadTimer) {
      clearTimeout(this.unloadTimer);
      this.unloadTimer = null;
    }

    console.log(`[VirtualNodeView] 销毁: blockId=${this.node.attrs.blockId}`);
  }
}
