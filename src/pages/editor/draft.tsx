import { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import { Layout, Button, Avatar, Space, Input, Dropdown, message } from 'antd';
import {
  MenuOutlined,
  ExperimentOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { EditorContent } from '@tiptap/react';
import AIEditorBubble from '@/components/AIEditorBubble';
import '@/assets/styles/tiptap.scss';
const { Header, Sider, Content } = Layout;

import editor from '@/pages/editor/config/editorConfig';
import Toolbar from '../../components/ToolBar/index';
import React from 'react';
import { Toc } from '@/components/Toc';
import { useSelector } from 'react-redux';
import CustomLinkBubble from '@/components/LinkBubble';
import AIEditorToolbar from '@/components/AiEditorToolbar';
import EditorPerformanceMonitor from '@/components/EditorPerformanceMonitor';
import {
  generateSmallDocument,
  generateMediumDocument,
  generateLargeDocument,
} from '@/utils/generateTestDocument';
import marked from '@/utils/marked';

const AISuggestionPreview = React.lazy(
  () => import('@/components/AISuggestionPreview'),
);

// 导入 FIM 相关服务
// import { HybridFIMService } from '@/utils/hybridFIMService';
// // import { AutoFIMService, type FIMSuggestion } from '@/utils/autoFIMService';
// import isInCodeContext from '@/utils/isInCode';

const MemorizedToC = React.memo(Toc);

const TiptapEditor = () => {
  const items = useSelector((state: any) => state.toc.tocItems);
  const [collapsed, setCollapsed] = useState(false);
  const [isLinkBubbleVisible, setIsLinkBubbleVisible] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // 现有的代码保持不变
  const handleInsertLink = () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
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
  };

  const handleLinkSubmit = (text: string, url: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const linkText = from !== to ? text : text || '链接';

    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContentAt(from, {
        type: 'text',
        text: linkText,
        marks: [{ type: 'link', attrs: { href: url } }],
      })
      .run();

    setIsLinkBubbleVisible(false);
  };

  // 🔥 加载测试文档
  const loadTestDocument = useCallback(
    (size: 'small' | 'medium' | 'large') => {
      if (!editor) return;

      const startTime = performance.now();
      let markdown = '';

      switch (size) {
        case 'small':
          markdown = generateSmallDocument();
          message.loading('正在加载 3000 字测试文档...', 1);
          break;
        case 'medium':
          markdown = generateMediumDocument();
          message.loading('正在加载 10000 字测试文档...', 2);
          break;
        case 'large':
          markdown = generateLargeDocument();
          message.loading('正在加载 50000 字测试文档...', 3);
          break;
      }

      // 延迟加载以显示 loading
      setTimeout(() => {
        const html = marked.parse(markdown);
        editor.commands.setContent(html);

        const loadTime = performance.now() - startTime;
        message.success(`文档加载完成，耗时 ${loadTime.toFixed(0)}ms`, 2);

        // 自动打开性能监控
        setShowPerformanceMonitor(true);
      }, 100);
    },
    [editor],
  );

  // 🔥 快捷键监听（Ctrl+Shift+P 切换性能监控）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowPerformanceMonitor((prev) => !prev);
        message.info(
          showPerformanceMonitor ? '性能监控已关闭' : '性能监控已开启',
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPerformanceMonitor]);

  return (
    <Layout className="editor-container" style={{ height: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0',
          borderBottom: '1px solid #f0f0f0',
          height: 'auto',
        }}
      >
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
            {/* 🔥 测试文档加载按钮 */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'small',
                    label: '小文档 (3K字)',
                    icon: <ExperimentOutlined />,
                    onClick: () => loadTestDocument('small'),
                  },
                  {
                    key: 'medium',
                    label: '中等文档 (1万字)',
                    icon: <ExperimentOutlined />,
                    onClick: () => loadTestDocument('medium'),
                  },
                  {
                    key: 'large',
                    label: '大文档 (5万字)',
                    icon: <ExperimentOutlined />,
                    onClick: () => loadTestDocument('large'),
                  },
                  { type: 'divider' },
                  {
                    key: 'monitor',
                    label: showPerformanceMonitor
                      ? '关闭性能监控'
                      : '打开性能监控',
                    icon: <DashboardOutlined />,
                    onClick: () => setShowPerformanceMonitor((prev) => !prev),
                  },
                ],
              }}
              placement="bottomRight"
            >
              <Button type="text" icon={<ExperimentOutlined />}>
                测试工具
              </Button>
            </Dropdown>

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

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 24px',
            width: 'max-content',
            margin: 'auto',
          }}
        >
          <Toolbar handleInsertLink={handleInsertLink} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <AIEditorToolbar editor={editor} />
          </div>
        </div>
      </Header>

      <Layout>
        <Sider
          width={280}
          style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
          collapsed={collapsed}
          collapsedWidth={0}
        >
          <div
            style={{ padding: '16px', overflowY: 'scroll', maxHeight: '60vh' }}
          >
            <div className="sidebar-options">
              <h4 className="label-large">目录</h4>
              <div className="table-of-contents">
                <MemorizedToC editor={editor} items={items} />
              </div>
            </div>
          </div>
        </Sider>

        <Layout style={{ background: '#fff' }}>
          <Content
            ref={editorContainerRef}
            // style={{
            //   padding: '0',
            //   background: '#fff',
            //   display: 'flex',
            //   width: '100%',
            //   justifyContent: 'center',
            //   overflowY: 'auto',
            // }}
          >
            {/* <div */}
            {/* // ref={editorContainerRef}
              // style={{
              //   width: '100%',
              //   maxWidth: '800px',
              //   padding: '10px 24px',
              //   position: 'relative',
              // }} */}
            {/* > */}
            <div
              id="tiptap"
              style={{
                maxHeight: 'calc(100vh - 150px)',
                padding: '0',
                background: '#fff',
                display: 'flex',
                width: '100%',
                justifyContent: 'center',
                overflowY: 'auto',
              }}
            >
              <EditorContent
                className="tiptap-editor"
                style={{ width: '100%' }}
                editor={editor}
              ></EditorContent>
            </div>

            <AIEditorBubble editor={editor} />
            <Suspense fallback={null}>
              <AISuggestionPreview editor={editor} />
            </Suspense>
            <CustomLinkBubble
              onSubmit={handleLinkSubmit}
              editor={editor}
              isVisible={isLinkBubbleVisible}
              onClose={() => setIsLinkBubbleVisible(false)}
            />

            {/* 🔥 性能监控组件 */}
            <EditorPerformanceMonitor
              editor={editor}
              visible={showPerformanceMonitor}
              position="top-right"
            />
            {/* </div> */}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default TiptapEditor;
