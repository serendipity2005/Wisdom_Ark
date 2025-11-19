import { Editor, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Blockquote from '@tiptap/extension-blockquote';
import { Mathematics } from '@tiptap/extension-mathematics';
import { TableKit } from '@tiptap/extension-table';
import Highlight from '@tiptap/extension-highlight';
import { TaskItem, TaskList } from '@tiptap/extension-list';
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
import store from '@/store';
import CodeBlockWithSuggestion from '../extensions/CodeBlockWithSuggestion';
import marked from '@/utils/marked';
import BlockAttributes from '../extensions/BlockAttributes';
import VirtualScroll from '../extensions/VirtualScroll';

// 🔥 协同编辑扩展
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import type * as Y from 'yjs';
import type { WebsocketProvider } from 'y-websocket';

const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('json', json);
lowlight.register('html', html);
lowlight.register('css', css);

const GlobalAttributes = Extension.create({
  name: 'globalAttributes',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'listItem', 'codeBlock', 'blockquote'],
        attributes: {
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
      setBlockId:
        (id: string, nodeType = 'paragraph') =>
        ({ commands }: { commands: any }) => {
          console.log('setBlockId', id, nodeType);
          commands.updateAttributes(nodeType, { blockId: id });
        },

      setCustomData:
        (value: string, nodeType = 'paragraph') =>
        ({ commands }: { commands: any }) =>
          commands.updateAttributes(nodeType, { customData: value }),

      setNodeAttrs:
        (attrs: Record<string, unknown>, nodeType = 'paragraph') =>
        ({ commands }: { commands: any }) =>
          commands.updateAttributes(nodeType, attrs),
    } as Record<string, unknown>;
  },
});

/**
 * 🔥 创建支持协同编辑的编辑器
 * @param ydoc - Yjs 文档实例
 * @param provider - WebSocket 提供者（用于协同光标）
 */
export function createCollaborativeEditor(
  ydoc: Y.Doc,
  provider: WebsocketProvider,
) {
  return new Editor({
    editable: true,
    extensions: [
      StarterKit.configure({
        // 🔥 关键：禁用 StarterKit 的 history，因为 Yjs 有自己的 undo/redo
        history: false,
        codeBlock: false,
      }),

      // 🔥 协同编辑核心扩展
      Collaboration.configure({
        document: ydoc,
      }),

      // 🔥 协同光标（显示其他用户的光标位置）
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: 'Anonymous',
          color: '#f783ac',
        },
      }),

      BlockAttributes,

      VirtualScroll.configure({
        buffer: 15,
        cursorBuffer: 3000,
        scrollThrottle: 50,
        preloadMargin: '800px',
        scrollContainerSelector: '#tiptap',
        enableWhileEditing: false,
        enableDebugLog: true,
        enableVisualDebug: true,
      }),

      TaskList,
      TaskItem,
      Blockquote,

      TableOfContents.configure({
        getIndex: getHierarchicalIndexes,
        onUpdate(content) {
          const serializableContent = content.map(
            ({ editor, node, dom, view, ...rest }: any) => {
              const blockId = node?.attrs?.blockId;
              return { ...rest, blockId };
            },
          );
          store.dispatch(setTocItems(serializableContent));
        },
      }),

      Mathematics.configure({
        inlineOptions: {
          onClick: (node, pos, editor) => {
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
      }),

      TableKit.configure({
        table: { resizable: true },
      }),

      Highlight,
      ImgNode,
      Link,
      Image.configure({
        allowBase64: true,
      }),

      CodeBlockWithSuggestion.configure({ lowlight }),
    ],
    content: '',
    editorProps: {
      handlePaste(_view, event) {
        try {
          const clipboardData = (event as ClipboardEvent).clipboardData;
          if (!clipboardData) return false;

          const text = clipboardData.getData('text/plain') || '';
          const html = clipboardData.getData('text/html') || '';

          if (html && !text) return false;

          const isLikelyMarkdown =
            /(^|\n)\s{0,3}#{1,6}\s|(^|\n)>\s|(^|\n)(-|\*|\+)\s|(^|\n)\d+\.\s|```|__.+__|\*\*.+\*\*|!\[[^\]]*\]\([^)]*\)|\[[^\]]+\]\([^)]*\)/.test(
              text,
            );

          if (!isLikelyMarkdown) return false;

          event.preventDefault();

          const rendered = String(marked.parse(text));
          _view.state.tr.doc.type.schema.text;
          // 使用 _view 参数中的 editor
          const editor = (_view as any).editor;
          if (editor) {
            editor.chain().focus().insertContent(rendered).run();
          }
          return true;
        } catch (e) {
          return false;
        }
      },
    },
  });
}
