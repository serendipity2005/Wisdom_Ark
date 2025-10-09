import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Blockquote from '@tiptap/extension-blockquote';
import { Mathematics } from '@tiptap/extension-mathematics';
import { TableKit } from '@tiptap/extension-table';
import Highlight from '@tiptap/extension-highlight';
import { TaskItem, TaskList } from '@tiptap/extension-list';
// import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
// import { ReactNodeViewRenderer } from '@tiptap/react'; // 不再需要，已移到扩展内部

import { Paragraph } from '@tiptap/extension-paragraph';
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
import { setTocItems } from '@/store/modules/tocSlice';
// import { useDispatch } from 'react-redux';
import store from '@/store';
import CodeBlockWithSuggestion from '../extensions/CodeBlockWithSuggestion';
import marked from '@/utils/marked';

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
const FlexibleParagraph = Paragraph.extend({
  // parseHTML() {
  //   return [
  //     { tag: 'p' },
  //     { tag: 'div' },
  //   ]
  // },
  // renderHTML({ HTMLAttributes }) {
  //   // 可以根据属性决定渲染什么标签
  //   const tag = HTMLAttributes['data-type'] === 'div' ? 'div' : 'p'
  //   return [tag, HTMLAttributes, 0]
  // },
  renderHTML({ HTMLAttributes }) {
    return ['div', HTMLAttributes, 0]; // 直接渲染为 div
  },
});
const editor = new Editor({
  editable: true,
  extensions: [
    StarterKit.configure({
      paragraph: false, // 禁用默认的 paragraph 扩展
      codeBlock: false,
    }),

    //   Document,
    //   Text,
    //   Paragraph,
    //   Focus : false,

    //图片支持base64
    FlexibleParagraph,
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
          ({ editor, node, dom, view, ...rest }: any) => rest,
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
