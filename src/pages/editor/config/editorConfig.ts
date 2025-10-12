import { Editor, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Blockquote from '@tiptap/extension-blockquote';
import { Mathematics } from '@tiptap/extension-mathematics';
import { TableKit } from '@tiptap/extension-table';
import Highlight from '@tiptap/extension-highlight';
// import Document from '@tiptap/extension-document';
// import Text from '@tiptap/extension-text';

import { TaskItem, TaskList } from '@tiptap/extension-list';
// import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
// import { ReactNodeViewRenderer } from '@tiptap/react'; // 不再需要，已移到扩展内部

// import { Paragraph } from '@tiptap/extension-paragraph';
// import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
// import CodeBlock from '@/components/CodeBlock'; // 不再需要，已移到扩展内部
// create a lowlight instance
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import Image from '@tiptap/extension-image';
import ImgNode from '../extensions/imgNode';
import Link from '@tiptap/extension-link';
import TableOfContents, {
  getHierarchicalIndexes,
} from '@tiptap/extension-table-of-contents';
// import Typography from '@tiptap/extension-typography';
import { setTocItems } from '@/store/modules/tocSlice';
// import { useDispatch } from 'react-redux';
import store from '@/store';
import CodeBlockWithSuggestion from '../extensions/CodeBlockWithSuggestion';
import marked from '@/utils/marked';
// import { Markdown } from 'tiptap-markdown';
import BlockAttributes from '../extensions/BlockAttributes';
import VirtualScroll from '../extensions/VirtualScroll'; // ✅ Decoration + content-visibility 方案
// import VirtualRenderer from '../extensions/VirtualRenderer'; // ❌ 已弃用
// import VirtualRendererSimple from '../extensions/VirtualRendererSimple'; // ❌ 已弃用
// you can also register individual languages
// const lowlight = createLowlight(all);
// lowlight.register('html', html);
// lowlight.register('css', css);
// lowlight.register('js', js);
// lowlight.register('ts', ts);
const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('json', json);
lowlight.register('html', html);
lowlight.register('css', css);
// 已移除实验性的 FlexibleParagraph 与 CustomParagraph
// 现统一使用 GlobalAttributes + VirtualRenderer
// const CustomAttribute = Extension.create({
//   addGlobalAttributes() {
//     return [
//       {
//         // Extend the following extensions
//         types: ['heading', 'paragraph'],
//         // … with those attributes
//         attributes: {
//           blockId: {
//             default: 'data-custom55',
//             parseHTML: (element) => element.getAttribute('data-custom'),
//             renderHTML: (attributes) => {
//               if (!attributes.customData) {
//                 return {};
//               }
//               return {
//                 'data-custom': attributes.customData,
//               };
//             },
//           },
//         },
//       },
//     ];
//   },
// });
// 在 CustomParagraph 定义之后添加
const GlobalAttributes = Extension.create({
  name: 'globalAttributes',

  addGlobalAttributes() {
    return [
      {
        // 指定要应用的节点类型
        types: ['paragraph', 'heading', 'listItem', 'codeBlock', 'blockquote'],
        attributes: {
          // 自定义数据属性
          customData: {
            default: 'customData',
            parseHTML: (element) => element.getAttribute('data-custom'),
            renderHTML: (attributes) => {
              if (!attributes.customData) {
                return {};
              }
              return {
                'data-custom': attributes.customData,
              };
            },
          },
          // 块 ID（默认 null，由 VirtualRenderer 自动赋值）
          blockId: {
            default: 'blockidss',
            parseHTML: (element) => element.getAttribute('data-block-id'),
            renderHTML: (attributes) => {
              if (!attributes.blockId) {
                return {};
              }
              return {
                'data-block-id': attributes.blockId,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      // 设置 blockId（可指定节点类型）
      setBlockId:
        (id: string, nodeType = 'paragraph') =>
        ({ commands }: { commands: any }) => {
          console.log('setBlockId', id, nodeType);

          commands.updateAttributes(nodeType, { blockId: id });
        },

      // 设置 customData
      setCustomData:
        (value: string, nodeType = 'paragraph') =>
        ({ commands }: { commands: any }) =>
          commands.updateAttributes(nodeType, { customData: value }),

      // 批量设置属性
      setNodeAttrs:
        (attrs: Record<string, unknown>, nodeType = 'paragraph') =>
        ({ commands }: { commands: any }) =>
          commands.updateAttributes(nodeType, attrs),
    } as Record<string, unknown>;
  },
});

const editor = new Editor({
  editable: true,
  extensions: [
    StarterKit.configure({
      // paragraph: false, // 禁用默认的 paragraph 扩展
      codeBlock: false,
      // CustomParagraph,
    }),
    // StarterKit,
    // Highlight,
    // Typography,

    //   Focus : false,

    //图片支持base64
    // FlexibleParagraph,
    // CustomParagraph,
    // CustomAttribute,

    // ✅ BlockAttributes（用于 blockId 和目录）
    BlockAttributes,

    // 🔥 混合虚拟化方案：VirtualScroll + content-visibility
    // VirtualScroll 负责 Decoration 标记和滚动计算
    // CSS content-visibility 负责浏览器级渲染优化
    VirtualScroll.configure({
      buffer: 15, // 上下缓冲块数量
      cursorBuffer: 3000, // 光标周围强制渲染范围
      scrollThrottle: 50, // 滚动节流（ms）
      preloadMargin: '800px', // 预加载边距
      scrollContainerSelector: '#tiptap', // 🔥 修复：使用 ID 选择器匹配 draft.tsx
      enableWhileEditing: false, // 编辑时暂停虚拟化
      enableDebugLog: true, // 🔧 临时开启调试日志排查问题
      enableVisualDebug: true, // 🔧 临时开启可视化调试
    }),

    TaskList,
    TaskItem,
    Blockquote,

    TableOfContents.configure({
      getIndex: getHierarchicalIndexes,
      onUpdate(content) {
        // 修改 tocItems 数据
        // store.dispatch(setTocItems(content));
        // const serializableContent = content.map((item) => {
        //   const { editor,node, ...rest } = item;
        //   return rest;
        // });
        // store.dispatch(setTocItems(serializableContent));
        const serializableContent = content.map(
          ({ editor, node, dom, view, ...rest }: any) => {
            const blockId = node?.attrs?.blockId;
            // 注：offsetTop 需要等虚拟化插件填充后才有意义
            return { ...rest, blockId };
          },
        );
        store.dispatch(setTocItems(serializableContent));
      },
    }),
    Mathematics.configure({
      inlineOptions: {
        onClick: (node, pos) => {
          // you can do anything on click, e.g. open a dialog to edit the math node
          // or just a prompt to edit the LaTeX code for a quick prototype
          const katex = prompt('Enter new calculation:', node.attrs.latex);
          if (katex) {
            editor
              .chain()
              .setNodeSelection(pos)
              .updateInlineMath({ latex: katex })
              .focus()
              .run();
          }
        },
      },
      blockOptions: {
        // optional options for the block math node
      },
      katexOptions: {
        // optional options for the KaTeX renderer
      },
    }),
    TableKit.configure({
      table: { resizable: true },
      //   tableCell: false,
    }),
    Highlight,
    ImgNode,
    // ✅ 使用懒加载图片扩展
    // LazyImage.configure({
    //   allowBase64: true,
    //   HTMLAttributes: {
    //     class: 'lazy-image',
    //   },
    // }),
    // TableCell,
    // 排版增强
    // CodeBlockLowlight,
    // ctrl+z 撤销重做
    Link,
    Image.configure({
      allowBase64: true,
    }),
    // CodeBlockLowlight.extend({
    //   addNodeView() {
    //     return ReactNodeViewRenderer(CodeBlock);
    //   },
    // }).configure({ lowlight }),
    // 使用支持虚拟建议的代码块扩展，并配置 lowlight
    // 🔧 修复：不再使用 .extend()，避免插件被注册两次
    CodeBlockWithSuggestion.configure({ lowlight }),
  ],
  content: '',
  // autofocus: true,
  editorProps: {
    handlePaste(_view, event) {
      try {
        const clipboardData = (event as ClipboardEvent).clipboardData;
        if (!clipboardData) return false;

        const text = clipboardData.getData('text/plain') || '';
        const html = clipboardData.getData('text/html') || '';

        // If HTML exists, let default paste handle it
        if (html && !text) return false;

        // Heuristic: detect likely Markdown
        const isLikelyMarkdown =
          /(^|\n)\s{0,3}#{1,6}\s|(^|\n)>\s|(^|\n)(-|\*|\+)\s|(^|\n)\d+\.\s|```|__.+__|\*\*.+\*\*|!\[[^\]]*\]\([^)]*\)|\[[^\]]+\]\([^)]*\)/.test(
            text,
          );

        if (!isLikelyMarkdown) return false;

        event.preventDefault();

        const rendered = String(marked.parse(text));
        // Insert as HTML so Tiptap converts to proper nodes
        editor.chain().focus().insertContent(rendered).run();
        return true;
      } catch (e) {
        // Fallback to default behavior on any error
        return false;
      }
    },
  },
});

export default editor;
