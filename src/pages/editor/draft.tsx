import { useCallback, useMemo, useState } from 'react';
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

import { EditorContent, useEditor } from '@tiptap/react';

import '@/assets/styles/tiptap.scss';
const { Header, Sider, Content } = Layout;

import editor from '@/pages/editor/config/editorConfig';
import Toolbar from '../../components/ToolBar/index';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';

const TiptapEditor = () => {
  const [collapsed, setCollapsed] = useState(false);
  // 模拟目录数据
  const treeData = [
    {
      title: '文档1',
      key: '0-0',
      icon: <FileOutlined />,
      children: [
        {
          title: '子文档1-1',
          key: '0-0-0',
          icon: <FileOutlined />,
        },
        {
          title: '子文档1-2',
          key: '0-0-1',
          icon: <FileOutlined />,
        },
      ],
    },
    {
      title: '文档2',
      key: '0-1',
      icon: <FileOutlined />,
    },
    {
      title: '文件夹1',
      key: '0-2',
      icon: <FolderOutlined />,
      children: [
        {
          title: '文档3',
          key: '0-2-0',
          icon: <FileOutlined />,
        },
      ],
    },
  ];

  return (
    <Layout style={{ height: '100vh' }}>
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
        <Toolbar></Toolbar>
      </Header>

      <Layout>
        {/* 左侧目录 */}
        <Sider
          width={280}
          style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
          collapsed={collapsed}
          collapsedWidth={0}
        >
          <div style={{ padding: '16px 0' }}>
            <Tree
              showIcon
              defaultExpandedKeys={['0-0']}
              defaultSelectedKeys={['0-0-0']}
              treeData={treeData}
              style={{ padding: '0 16px' }}
            />
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
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '800px',
                padding: '10px 24px',
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
