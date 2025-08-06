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
// you can also register individual languages
const lowlight = createLowlight(all);
lowlight.register('html', html);
lowlight.register('css', css);
lowlight.register('js', js);
lowlight.register('ts', ts);
const editor = new Editor({
  editable: true,
  extensions: [
    StarterKit,
    //   Document,
    //   Text,
    //   Paragraph,
    //   Focus : false,

    //图片支持base64
    TaskList,
    TaskItem,
    Blockquote,
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
