import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Blockquote from '@tiptap/extension-blockquote';
import { Mathematics } from '@tiptap/extension-mathematics';
import { TableCell, TableKit } from '@tiptap/extension-table';
import Highlight from '@tiptap/extension-highlight';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { EditorContent, ReactNodeViewRenderer, useEditor } from '@tiptap/react';
import { all, createLowlight } from 'lowlight';
import { Paragraph } from '@tiptap/extension-paragraph';
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import CodeBlock from '@/components/CodeBlock';
// create a lowlight instance

import css from 'highlight.js/lib/languages/css';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';
import Image from '@tiptap/extension-image';
import ImgNode from '../extensions/imgNode';
import Link from '@tiptap/extension-link';
import TableOfContents, {
  getHierarchicalIndexes,
} from '@tiptap/extension-table-of-contents';
import { setTocItems } from '@/store/modules/tocSlice';
import { useDispatch } from 'react-redux';
import store from '@/store';

// you can also register individual languages
const lowlight = createLowlight(all);
lowlight.register('html', html);
lowlight.register('css', css);
lowlight.register('js', js);
lowlight.register('ts', ts);
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
        console.log('执行了asdsada', content);

        // 修改 tocItems 数据
        store.dispatch(setTocItems(content));
        // const serializableContent = content.map((item) => {
        //   const { editor,node, ...rest } = item;
        //   return rest;
        // });
        // store.dispatch(setTocItems(serializableContent));
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
    // TableCell,
    // 排版增强
    // CodeBlockLowlight,
    // ctrl+z 撤销重做
    Link,
    Image.configure({
      allowBase64: true,
    }),
    CodeBlockLowlight.extend({
      addNodeView() {
        return ReactNodeViewRenderer(CodeBlock);
      },
    }).configure({ lowlight }),
  ],
  content: 'asddasd',
  // autofocus: true,
});

export default editor;
