import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import {
  Layout,
  Button,
  Avatar,
  Space,
  Tooltip,
  Divider,
  Tree,
  Input,
} from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  PictureOutlined,
  FileOutlined,
  FolderOutlined,
  MenuOutlined,
  CodeOutlined,
  FontSizeOutlined,
  QuestionCircleOutlined,
  StrikethroughOutlined,
  TableOutlined,
} from '@ant-design/icons';
import {
  getHierarchicalIndexes,
  TableOfContents,
} from '@tiptap/extension-table-of-contents';
import { EditorContent, useEditor } from '@tiptap/react';

import '@/assets/styles/tiptap.scss';
const { Header, Sider, Content } = Layout;

import editor from '@/pages/editor/config/editorConfig';
import Toolbar from '../../components/ToolBar/index';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import React from 'react';
import { Toc } from '@/components/Toc';
import { useSelector } from 'react-redux';
import CustomLinkBubble from '@/components/LinkBubble';
const MemorizedToC = React.memo(Toc);
const TiptapEditor = () => {
  const items = useSelector((state: any) => state.toc.tocItems);
  const [collapsed, setCollapsed] = useState(false);
  const [isLinkBubbleVisible, setIsLinkBubbleVisible] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  // 工具栏"插入链接"按钮的回调
  const handleInsertLink = () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    // if (from !== to) {
    // 有选中内容时才显示气泡框
    if (from == to) {
      const linkText = '链接';
      editor
        .chain()
        .focus()
        .insertContent('链接')
        .setTextSelection({ from, to: from + linkText.length })
        .run();
    }
    setIsLinkBubbleVisible(true);
    // }
  };
  // 提交链接（传给气泡框的回调）
  const handleLinkSubmit = (text: string, url: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;

    const linkText = from !== to ? text : text || '链接';

    // 执行插入链接操作
    editor
      .chain()
      .focus()
      .deleteRange({ from, to }) // 删除选中的文本
      .insertContentAt(from, {
        type: 'text',
        text: linkText,
        marks: [{ type: 'link', attrs: { href: url } }],
      })
      .run();

    setIsLinkBubbleVisible(false);
  };
  return (
    <Layout className="editor-container" style={{ height: '100vh' }}>
      {/* Header - 包含导航栏和工具栏 */}
      <Header
        style={{
          background: '#fff',
          padding: '0',
          borderBottom: '1px solid #f0f0f0',
          height: 'auto',
        }}
      >
        {/* 导航栏 */}
        <div
          style={{
            padding: '0 24px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ marginRight: 16 }}
            />
            <span style={{ fontSize: '16px', fontWeight: 500 }}>
              <Input
                className="title-input"
                variant="borderless"
                maxLength={20}
                placeholder=" 输入文章标题"
              />
            </span>
          </div>

          <Space>
            <Button type="text">保存成功</Button>
            <Button type="primary" ghost>
              草稿箱
            </Button>
            <Button type="primary">发布</Button>
            <Avatar
              size="small"
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=1"
            />
          </Space>
        </div>

        {/* 工具栏 */}
        <Toolbar handleInsertLink={handleInsertLink}></Toolbar>
      </Header>

      <Layout>
        {/* 左侧目录 */}
        <Sider
          width={280}
          style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
          collapsed={collapsed}
          collapsedWidth={0}
        >
          <div style={{ padding: '16px' }}>
            <div className="sidebar-options">
              <h4 className="label-large">目录</h4>
              <div className="table-of-contents">
                <MemorizedToC editor={editor} items={items} />
              </div>
            </div>
          </div>
        </Sider>

        <Layout style={{ background: '#fff' }}>
          {/* 编辑区域 */}
          <Content
            style={{
              padding: '0',
              background: '#fff',
              display: 'flex',
              justifyContent: 'center',
              overflowY: 'auto',
            }}
          >
            <div
              ref={editorContainerRef}
              style={{
                width: '100%',
                maxWidth: '800px',
                padding: '10px 24px',
                position: 'relative',
              }}
            >
              {/* 这里是编辑器内容区域 */}
              {/* {editor && (
                <BubbleMenu className="bubble-menu" editor={editor}>
                  <Button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'is-active' : ''}
                  >
                    <BoldOutlined />
                  </Button>
                  <Button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'is-active' : ''}
                  >
                    <ItalicOutlined />
                  </Button>
                  <Button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive('strike') ? 'is-active' : ''}
                  >
                    <StrikethroughOutlined />
                  </Button>
                </BubbleMenu>
              )}

              {editor && (
                <FloatingMenu className="floating-menu" editor={editor}>
                  <Button
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                    className={
                      editor.isActive('heading', { level: 1 })
                        ? 'is-active'
                        : ''
                    }
                  >
                    H1
                  </Button>
                  <Button
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    className={
                      editor.isActive('heading', { level: 2 })
                        ? 'is-active'
                        : ''
                    }
                  >
                    H2
                  </Button>
                  <Button
                    onClick={() =>
                      editor.chain().focus().toggleBulletList().run()
                    }
                    className={editor.isActive('bulletList') ? 'is-active' : ''}
                  >
                    Bullet list
                  </Button>
                </FloatingMenu>
              )} */}

              <EditorContent className="tiptap" editor={editor}></EditorContent>
              {/* 添加链接气泡框 */}
              <CustomLinkBubble
                onSubmit={handleLinkSubmit}
                editor={editor}
                isVisible={isLinkBubbleVisible}
                onClose={() => setIsLinkBubbleVisible(false)}
              />
            </div>
          </Content>
        </Layout>
      </Layout>

      {/* <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style> */}
    </Layout>
  );
};

export default TiptapEditor;
