import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

// 创建自定义行节点
const LineNode = Node.create({
  name: 'line',
  content: 'inline*',
  group: 'block',
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [
      {
        tag: 'pre.CodeMirror-line',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(HTMLAttributes, {
        class: 'CodeMirror-line',
        role: 'presentation',
      }),
      [
        'span',
        {
          role: 'presentation',
          style: 'padding-right: 0.1px;',
        },
        0,
      ],
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('lineHandler'),
        appendTransaction: (transactions, oldState, newState) => {
          // 检查是否已经有line节点类型，避免重复处理
          let hasParagraph = false;
          let hasLineNode = false;

          newState.doc.descendants((node) => {
            if (node.type.name === 'paragraph') {
              hasParagraph = true;
            }
            if (node.type.name === this.name) {
              hasLineNode = true;
            }
          });

          // 如果没有段落节点或者已经有line节点，不需要转换
          if (!hasParagraph || hasLineNode) {
            return null;
          }

          const tr = newState.tr;
          let modified = false;

          // 使用倒序遍历，避免位置偏移问题
          const paragraphs: { pos: number; node: any }[] = [];

          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'paragraph') {
              paragraphs.push({ pos, node });
            }
          });

          // 倒序处理，避免位置变化影响
          for (let i = paragraphs.length - 1; i >= 0; i--) {
            const { pos, node } = paragraphs[i];
            tr.setNodeMarkup(pos, this.type, node.attrs, node.marks);
            modified = true;
          }

          return modified ? tr : null;
        },
      }),
    ];
  },
});

export default LineNode;
