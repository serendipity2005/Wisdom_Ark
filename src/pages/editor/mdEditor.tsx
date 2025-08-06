// import React from 'react';
// import './styles/mdEditor.scss';
import Paragraph from '@tiptap/extension-paragraph';
import Blockquote from '@tiptap/extension-blockquote';
import { parseMarkdown } from '../../utils/parseMarkdown';
import Text from '@tiptap/extension-text';
import Document from '@tiptap/extension-document';
import { Placeholder } from '@tiptap/extensions';
import { Node, nodePasteRule } from '@tiptap/core';
import marked from '@/utils/marked';
import Bold from '@tiptap/extension-bold';
import Strike from '@tiptap/extension-strike';
import History from '@tiptap/extension-history';
import ImgNode from './extensions/imgNode';
import { Plugin, PluginKey } from '@tiptap/pm/state';
// import CustomBlockquote from './extensions/blockQuote';
import { AutoMergeBlockquotes } from './extensions/blockQuote';
import { AutoContinuePrefix, PrefixRulePresets } from './extensions/autoPrefix';
import {
  Table,
  TableCell,
  TableRow,
  TableKit,
  TableHeader,
} from '@tiptap/extension-table';

import type React from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button, Input, Space, Divider, Tooltip, message, Avatar } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  PictureOutlined,
  CodeOutlined,
  EyeOutlined,
  EditOutlined,
  ColumnWidthOutlined,
  SaveOutlined,
  FontSizeOutlined,
  QuestionCircleOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import LineNode from './extensions/lineNode';
import './styles/mdEditor.scss';

const lowlight = createLowlight(common);

// 类型定义
type ViewMode = 'edit' | 'preview' | 'split';

interface ToolbarButton {
  icon: React.ReactNode;
  tooltip: string;
  action: () => void;
  isActive?: () => boolean;
  type?: never;
}

interface ToolbarDivider {
  type: 'divider';
  icon?: never;
  tooltip?: never;
  action?: never;
  isActive?: never;
}

type ToolbarItem = ToolbarButton | ToolbarDivider;

interface EditorStats {
  characters: number;
  lines: number;
  words: number;
}

interface ArticleData {
  title: string;
  content: string;
}

const MarkdownEditor: React.FC = () => {
  // const [content, setContent] = useState('');
  // 存储文章标题
  const [title, setTitle] = useState<string>('');
  //是否正在滚动 防止编辑器和预览区域之间的滚动事件形成无限循环，当一个区域滚动时临时设为true
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  // 在保存草稿时显示加载状态，防止用户重复点击保存按钮
  const [isSaving, setIsSaving] = useState<boolean>(false);
  // 浏览模式
  const [viewMode, setViewMode] = useState<ViewMode>('split'); // 默认分屏模式
  // 是否正在发布
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  // 同步滚动开关状态
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const editorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // 同步滚动功能 - 基于百分比的精确同步
  const handleScroll = useCallback(
    (source: 'editor' | 'preview') => {
      if (viewMode !== 'split') return;

      // setIsScrolling(true);
      // 滚动来源块

      const sourceElement =
        source === 'editor' ? editorRef.current : previewRef.current;
      console.log(sourceElement);
      //
      const targetElement =
        source === 'editor' ? previewRef.current : editorRef.current;

      if (sourceElement && targetElement) {
        console.log(sourceElement.scrollTop);

        // 计算滚动百分比
        const maxScrollTop = Math.max(
          sourceElement.scrollHeight - sourceElement.clientHeight,
          1,
        );

        const scrollPercentage = sourceElement.scrollTop / maxScrollTop;

        // 应用到目标元素
        const targetMaxScrollTop = Math.max(
          targetElement.scrollHeight - targetElement.clientHeight,
          1,
        );

        // 使用 requestAnimationFrame 确保流畅滚动
        // requestAnimationFrame(() => {
        targetElement.scrollTo({
          top: scrollPercentage * targetMaxScrollTop,
        });

        // });
      }
      setIsScrolling(false);
    },
    [isScrolling, viewMode],
  );
  // 改进的同步滚动处理
  const handleScrollWithSync = useCallback(
    (source: 'editor' | 'preview') => {
      if (!syncScroll) return;
      handleScroll(source);
    },
    [syncScroll, handleScroll],
  );

  const editor = useEditor({
    extensions: [
      // Document,
      StarterKit.configure({
        // 禁用所有格式化功能，作为纯文本编辑器
        bold: false,
        italic: false,
        strike: false,
        code: false,
        // codeBlock: true,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        heading: false,
        horizontalRule: false,

        // hardBreak: true,
        // paragraph: true,
        // text: true,
        // document: true,
      }),
      // StarterKit,
      // Document,
      // Paragraph,
      // Text,
      // FigureNode,
      // 添加自定义行节点
      LineNode,
      ImgNode,
      // Blockquote,
      AutoContinuePrefix.configure({
        enabled: true, // 启用自动延续

        // stopOnEmptyLine: true, // 空行时停止延续
        // delay: 50, // 延迟 50ms
        rules: [
          PrefixRulePresets.blockquote('>'),
          // 使用默认规则，也可以自定义
          // 会自动加载默认规则，包括：
          // > 引用块
          // - * + 无序列表
          // 1. 2. 有序列表
          // - [ ] - [x] 任务列表
          // // 注释
          // >> >>> 多级引用
        ],
      }),
      // ctrl+z 撤销重做
      // History.configure({
      //   // 记录量
      //   depth: 10,
      //   newGroupDelay: 1000,
      // }),
      // Placeholder.configure({
      //   // Use a placeholder:
      //   placeholder: 'Write something …',
      //   // Use different placeholders depending on the node type:
      //   // placeholder: ({ node }) => {
      //   //   if (node.type.name === 'heading') {
      //   //     return 'What’s the title?'
      //   //   }

      //   //   return 'Can you add some further context?'
      //   // },
      // }),
      // StarterKit,
      // Bold,
      // Strike,

      // Paragraph,
      // Text,
      // Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:text-blue-700 underline cursor-pointer',
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-md',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto',
        },
      }),
    ],

    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none focus:outline-none p-6 min-h-[600px] leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      // setContent(editor.getText());
      // console.log('editor updated');
      // console.log(editor);

      const content = editor.getText();
      const markdown = editor.getHTML();
      // console.log(content);

      // console.log(content, markdown, 'get的');
      // console.log(marked.parse(content), marked.parse(markdown), 'maeked');
      // console.log(JSON.stringify(content), JSON.stringify(markdown));

      // 可以在这里添加自动保存逻辑
      previewEditor.commands.setContent(marked.parse(content));

      // console.log('Editor updated', editor.getHTML());
    },
  });
  const previewEditor = useEditor({
    // editable: false,
    extensions: [
      // StarterKit.configure({
      //   codeBlock: false,
      // }),
      StarterKit,
      Underline,
      // Blockquote,
      AutoMergeBlockquotes.configure({
        enabled: true,
      }),
      // FigureNode,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:text-blue-700 underline cursor-pointer',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      TableKit,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-md',
          referrerpolicy: 'no-referrer', // 绕过 Referer 检测
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto',
        },
      }),
    ],

    editorProps: {
      attributes: {
        class:
          'prose prose-lg max-w-none focus:outline-none p-6 min-h-[600px] leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      // setContent(editor.get);
      // 可以在这里添加自动保存逻辑
      // editor.commands.mergeBlockquotes();
    },
  });

  // 实时内容同步 - 编辑器内容变化时同步预览
  const [previewContent, setPreviewContent] = useState<string>('');

  // 插入链接
  const insertLink = useCallback(() => {
    if (!editor) return;

    const url = window.prompt('请输入链接地址:');
    if (url && url.trim()) {
      const linkText = window.prompt('请输入链接文本:') || url;
      editor.chain().focus().insertContent(`[${linkText}](${url})`).run();
    }
  }, [editor]);

  // 插入图片
  const insertImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt('请输入图片地址:');
    if (url && url.trim()) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  // 插入标题
  const insertHeading = useCallback(
    (level: 1 | 2 | 3 | 4 | 5 | 6) => {
      if (!editor) return;
      editor.chain().focus().toggleHeading({ level }).run();
    },
    [editor],
  );
  const insertMarkdown = useCallback(
    (before: any, after = '') => {
      if (!editor) return;

      const { from, to } = editor.state.selection; //选中的文本
      console.log(editor.state.selection, '选中的文本');

      const selectedText = editor.state.doc.textBetween(from, to);

      if (selectedText) {
        editor.commands.insertContentAt(
          { from, to },
          `${before}${selectedText}${after}`,
        );
      } else {
        editor.commands.insertContent(`${before}${after}`);
        // 如果有after，将光标移动到中间
        if (after) {
          editor.commands.setTextSelection(from + before.length);
        }
      }

      editor.commands.focus();
    },
    [editor],
  );
  // 工具栏按钮配置
  const toolbarButtons = useMemo<ToolbarItem[]>(
    () => [
      {
        icon: <FontSizeOutlined />,
        tooltip: '标题',
        action: () => insertHeading(1),
        isActive: () => editor?.isActive('heading', { level: 1 }) || false,
      },
      { type: 'divider' },
      {
        icon: <BoldOutlined />,
        tooltip: '粗体 (Ctrl+B)',
        action: () => insertMarkdown('**', '**'),
        isActive: () => editor?.isActive('bold') || false,
      },
      {
        icon: <ItalicOutlined />,
        tooltip: '斜体 (Ctrl+I)',
        action: () => insertMarkdown('*', '*'),
        isActive: () => editor?.isActive('italic') || false,
      },
      {
        icon: <UnderlineOutlined />,
        tooltip: '下划线 (Ctrl+U)',
        action: () => editor?.chain().focus().toggleUnderline().run(),
        isActive: () => editor?.isActive('underline') || false,
      },
      {
        icon: <StrikethroughOutlined />,
        tooltip: '删除线',
        action: () => insertMarkdown('~~', '~~'),
        isActive: () => editor?.isActive('strike') || false,
      },
      { type: 'divider' },
      {
        icon: <OrderedListOutlined />,
        tooltip: '有序列表',
        action: () => insertMarkdown('', ''),
        isActive: () => editor?.isActive('orderedList') || false,
      },
      {
        icon: <UnorderedListOutlined />,
        tooltip: '无序列表',
        action: () => insertMarkdown('- '),
        isActive: () => editor?.isActive('bulletList') || false,
      },
      { type: 'divider' },
      {
        icon: <CodeOutlined />,
        tooltip: '代码块',
        action: () => editor?.chain().focus().toggleCodeBlock().run(),
        isActive: () => editor?.isActive('codeBlock') || false,
      },
      {
        icon: <QuestionCircleOutlined />,
        tooltip: '引用',
        action: () => insertMarkdown('> '),
        isActive: () => editor?.isActive('blockquote') || false,
      },
      {
        icon: <TableOutlined />,
        tooltip: '表格',
        action: () =>
          insertMarkdown(`| 标题 |  |
| --- | --- |
|  |  |`),
      },
      { type: 'divider' },
      {
        icon: <LinkOutlined />,
        tooltip: '插入链接',
        action: () => insertMarkdown('[', ']()'),
      },
      {
        icon: <PictureOutlined />,
        tooltip: '插入图片',
        action: insertImage,
      },
    ],
    [editor, insertLink, insertImage, insertHeading],
  );

  // 获取编辑器统计信息
  const editorStats = useMemo<EditorStats>(() => {
    if (!editor) return { characters: 0, lines: 0, words: 0 };

    const text = editor.getText();
    return {
      characters: text.length,
      lines: text.split('\n').length,
      words: text
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter((word) => word.length > 0).length,
    };
  }, [editor?.getText()]);

  // 保存草稿
  const handleSave = useCallback(async () => {
    if (!editor) return;

    setIsSaving(true);
    try {
      const articleData: ArticleData = {
        title: title.trim(),
        content: editor.getHTML(),
      };

      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('保存草稿:', articleData);
      message.success('草稿保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }, [editor, title]);

  // 发布文章
  const handlePublish = useCallback(async () => {
    if (!title.trim()) {
      message.error('请输入文章标题');
      return;
    }
    if (!editor) return;

    setIsPublishing(true);
    try {
      const articleData: ArticleData = {
        title: title.trim(),
        content: editor.getHTML(),
      };

      // 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('发布文章:', articleData);
      message.success('文章发布成功！');
    } catch (error) {
      console.error('发布失败:', error);
      message.error('发布失败，请重试');
    } finally {
      setIsPublishing(false);
    }
  }, [editor, title]);

  // 渲染预览内容 - 使用状态管理的内容
  const renderPreview = useCallback(() => {
    return (
      <div
        className="prose prose-lg max-w-none p-6 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: previewContent }}
      />
    );
  }, [previewContent]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!editor) return;

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            handleSave();
            break;
          case 'Enter':
            event.preventDefault();
            handlePublish();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, handleSave, handlePublish]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-screen">加载中...</div>
    );
  }

  return (
    <div className=" md-editor min-h-screen ">
      {/* 顶部标题栏 */}

      <header>
        <Input
          className="title-input"
          variant="borderless"
          maxLength={20}
          placeholder=" 输入文章标题"
        />

        <div className="right-action">
          <Space size="large">
            <Button>草稿箱</Button>
            <Button type="primary">发布</Button>
            <Avatar />
          </Space>
        </div>
      </header>

      <main>
        {/* 工具栏 */}
        <div className=" toolbar   px-6 py-3">
          <div className="flex items-center justify-between">
            <Space split={<Divider type="vertical" />}>
              <Space>
                {toolbarButtons.map((button, index) => {
                  if (button.type === 'divider') {
                    return <Divider key={`divider-${index}`} type="vertical" />;
                  }
                  return (
                    <Tooltip key={`button-${index}`} title={button.tooltip}>
                      <Button
                        type={button.isActive?.() ? 'primary' : 'text'}
                        icon={button.icon}
                        onClick={button.action}
                        size="small"
                        className="hover:bg-gray-100"
                      />
                    </Tooltip>
                  );
                })}
              </Space>
            </Space>

            <Space>
              <Button.Group>
                <Button
                  type={viewMode === 'edit' ? 'primary' : 'default'}
                  icon={<EditOutlined />}
                  onClick={() => setViewMode('edit')}
                  size="small"
                >
                  编辑
                </Button>
                <Button
                  type={viewMode === 'split' ? 'primary' : 'default'}
                  icon={<ColumnWidthOutlined />}
                  onClick={() => setViewMode('split')}
                  size="small"
                >
                  分屏
                </Button>
                <Button
                  type={viewMode === 'preview' ? 'primary' : 'default'}
                  icon={<EyeOutlined />}
                  onClick={() => setViewMode('preview')}
                  size="small"
                >
                  预览
                </Button>
              </Button.Group>
            </Space>
          </div>
        </div>

        {/* 编辑器主体 */}
        <div className=" flex-1 flex">
          {/* 编辑器区域 */}
          {/* 如果分屏或者为编辑模式 */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div
              className={`edit-container ${viewMode === 'split' ? 'w-1/2 border-r border-gray-200' : 'flex-1'}`}
            >
              <div
                ref={editorRef}
                className="h-[calc(100vh-140px)] overflow-auto "
                onScroll={() => handleScrollWithSync('editor')}
              >
                <EditorContent editor={editor} />
              </div>
            </div>
          )}

          {/* 预览区域 */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div
              className={` markdown-body  bg-white ${viewMode === 'split' ? 'w-1/2' : 'flex-1'}`}
            >
              <div
                ref={previewRef}
                className="h-[calc(100vh-140px)] overflow-auto "
                onScroll={() => handleScroll('preview')}
              >
                {/* {renderPreview()} */}

                <EditorContent editor={previewEditor} />
              </div>
            </div>
          )}
        </div>

        {/* 底部状态栏 */}
        <div className="bg-white border-t border-gray-200 px-6 py-2">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>字符数: {editorStats.characters}</span>
              <span>行数: {editorStats.lines}</span>
              <span>单词数: {editorStats.words}</span>
            </div>
            <div className="flex items-center space-x-4">
              {viewMode === 'split' && (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  同步滚动
                </span>
              )}
              <span className="text-xs">Ctrl+S 保存 | Ctrl+Enter 发布</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarkdownEditor;
