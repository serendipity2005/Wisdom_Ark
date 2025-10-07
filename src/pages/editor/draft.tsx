import { useRef, useState, useEffect, useCallback } from 'react';
import { Layout, Button, Avatar, Space, Input } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
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
import AISuggestionPreview from '@/components/AISuggestionPreview';
// 导入 FIM 相关服务
import { HybridFIMService } from '@/utils/hybridFIMService';
import { AutoFIMService, type FIMSuggestion } from '@/utils/autoFIMService';
import isInCodeContext from '@/utils/isInCode';

const MemorizedToC = React.memo(Toc);

const TiptapEditor = () => {
  const items = useSelector((state: any) => state.toc.tocItems);
  const [collapsed, setCollapsed] = useState(false);
  const [isLinkBubbleVisible, setIsLinkBubbleVisible] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // FIM 相关状态
  const [fimSuggestions, setFimSuggestions] = useState<FIMSuggestion[]>([]);
  const [showFimSuggestions, setShowFimSuggestions] = useState(false);
  const [isInCode, setIsInCode] = useState(false);
  const [isFimProcessing, setIsFimProcessing] = useState(false);
  //  新增 临时内容状态
  const [isTempMode, setIsTempMode] = useState(false);
  // 新增：内联建议状态
  const [inlineSuggestion, setInlineSuggestion] =
    useState<FIMSuggestion | null>(null);
  const [showInlineSuggestion, setShowInlineSuggestion] = useState(false);

  // FIM 服务引用
  const fimServiceRef = useRef<HybridFIMService | null>(null);
  const autoFIMServiceRef = useRef<AutoFIMService | null>(null);

  // 新增：内联建议事件处理
  useEffect(() => {
    fimServiceRef.current = new HybridFIMService();
    autoFIMServiceRef.current = new AutoFIMService(fimServiceRef.current, {
      delay: 2000,
      maxSuggestions: 3,
      minContextLength: 10,
      enabled: true,
      autoTriggerInCode: false,
    });

    const handleFIMSuggestion = (event: CustomEvent) => {
      const { allSuggestions } = event.detail;
      setFimSuggestions(allSuggestions);
      setShowFimSuggestions(true);
    };

    const handleFIMClear = () => {
      setFimSuggestions([]);
      setShowFimSuggestions(false);
    };

    // 新增：内联建议事件处理
    const handleInlineSuggestion = (event: CustomEvent) => {
      const { suggestion } = event.detail;
      setInlineSuggestion(suggestion);
      setShowInlineSuggestion(true);
    };

    const handleInlineSuggestionClear = () => {
      setInlineSuggestion(null);
      setShowInlineSuggestion(false);
    };

    window.addEventListener(
      'fim-suggestion',
      handleFIMSuggestion as EventListener,
    );
    window.addEventListener(
      'fim-suggestions-cleared',
      handleFIMClear as EventListener,
    );
    window.addEventListener(
      'fim-inline-suggestion',
      handleInlineSuggestion as EventListener,
    );
    window.addEventListener(
      'fim-inline-suggestions-cleared',
      handleInlineSuggestionClear as EventListener,
    );

    return () => {
      window.removeEventListener(
        'fim-suggestion',
        handleFIMSuggestion as EventListener,
      );
      window.removeEventListener(
        'fim-suggestions-cleared',
        handleFIMClear as EventListener,
      );
      window.removeEventListener(
        'fim-inline-suggestion',
        handleInlineSuggestion as EventListener,
      );
      window.removeEventListener(
        'fim-inline-suggestions-cleared',
        handleInlineSuggestionClear as EventListener,
      );
      autoFIMServiceRef.current?.destroy();
    };
  }, []);

  // 新增：监听编辑器变化，清除建议
  const handleEditorUpdate = useCallback(() => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const content = editor.getText();

    const context = {
      content,
      cursorPosition: from,
      language: 'markdown',
    };
    const inCode = isInCodeContext(context);
    setIsInCode(inCode);
    // 如果有内联建议，清除它
    if (showInlineSuggestion) {
      setShowInlineSuggestion(false);
      setInlineSuggestion(null);
    }
    if (autoFIMServiceRef.current) {
      autoFIMServiceRef.current.updateEditorState({
        content,
        cursorPosition: from,
        fileName: 'draft.md',
        language: 'markdown',
        lastEditTime: Date.now(),
      });
    }
  }, [showInlineSuggestion]);
  useEffect(() => {
    if (showInlineSuggestion && inlineSuggestion) {
      console.log('showInlineSuggestion', showInlineSuggestion);
      console.log('inlineSuggestion', inlineSuggestion);
      // editor.chain().focus().insertContent(inlineSuggestion.content).run();
    }
  }, [showInlineSuggestion, inlineSuggestion]);
  // 新增：监听编辑器变化
  useEffect(() => {
    if (editor) {
      editor.on('update', handleEditorUpdate);
      editor.on('selectionUpdate', handleEditorUpdate);

      return () => {
        editor.off('update', handleEditorUpdate);
        editor.off('selectionUpdate', handleEditorUpdate);
      };
    }
  }, [handleEditorUpdate]);

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
            {/* 新增：状态指示器 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background: isInCode ? '#e3f2fd' : '#f5f5f5',
                  color: isInCode ? '#1976d2' : '#666',
                }}
              >
                {isInCode ? '🔧 代码模式' : '📝 文本模式'}
              </span>
              {isInCode && (
                <span style={{ fontSize: '12px', color: '#4caf50' }}>
                  🤖 自动 FIM 已启用
                </span>
              )}
            </div>

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
              <EditorContent className="tiptap" editor={editor}></EditorContent>
              <AIEditorBubble editor={editor} />
              <AISuggestionPreview editor={editor} />
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
    </Layout>
  );
};

export default TiptapEditor;
