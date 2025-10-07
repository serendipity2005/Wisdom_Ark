import React, { useState } from 'react';
import { Button, Space, message } from 'antd';
import {
  ExpandOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { BubbleMenu } from '@tiptap/react/menus';
import { HybridFIMService } from '@/utils/hybridFIMService';
import { SmartPositionDetection } from '@/utils/smartPositionDetection';
import AISuggestionBus from '@/utils/AISuggestionBus';
import '@/assets/styles/ai-editor.scss';
interface AIEditorBubbleProps {
  editor: any;
}

export default function AIEditorBubble({ editor }: AIEditorBubbleProps) {
  const [loading, setLoading] = useState(false);

  const [fimService] = useState(
    () =>
      new HybridFIMService(
        (import.meta as any).env?.REACT_APP_HF_API_KEY as string | undefined,
      ),
  );

  if (!editor) return null;

  // FIM补全
  const handleFIM = async () => {
    setLoading(true);
    try {
      const position = SmartPositionDetection.detectBestInsertionPoint(editor);
      const contextInfo = SmartPositionDetection.getContextInfo(
        editor,
        position,
      );

      const result = await fimService.fillInMiddle(
        contextInfo.prefix,
        contextInfo.suffix,
      );
      AISuggestionBus.getInstance().show({
        id: `${Date.now()}`,
        text: result,
        mode: 'insert',
        position,
      });
      message.success('已生成FIM建议，按 Tab/Enter 确认，Esc 取消');
    } catch (error) {
      message.error('FIM补全失败');
    } finally {
      setLoading(false);
    }
  };

  // 选中文本改错
  const handleCorrect = async () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    if (!selectedText.trim()) {
      message.warning('请先选择要检查的内容');
      return;
    }

    setLoading(true);
    try {
      const result = await fimService.correctText(selectedText);
      AISuggestionBus.getInstance().show({
        id: `${Date.now()}`,
        text: result,
        mode: 'replace',
        range: { from, to },
      });
      message.success('已生成改错建议，按 Tab/Enter 确认，Esc 取消');
    } catch (error) {
      message.error('改错失败');
    } finally {
      setLoading(false);
    }
  };

  // 选中文本扩写
  const handleExpand = async () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    if (!selectedText.trim()) {
      message.warning('请先选择要扩写的内容');
      return;
    }

    setLoading(true);
    try {
      const result = await fimService.expandText(selectedText);
      AISuggestionBus.getInstance().show({
        id: `${Date.now()}`,
        text: result,
        mode: 'replace',
        range: { from, to },
      });
      message.success('已生成扩写建议，按 Tab/Enter 确认，Esc 取消');
    } catch (error) {
      message.error('扩写失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      //   tippyOptions={{ duration: 100 }}
      className="ai-bubble-menu"
    >
      <Space>
        <Button
          size="small"
          icon={<ThunderboltOutlined />}
          onClick={handleFIM}
          loading={loading}
        >
          FIM补全
        </Button>
        <Button
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={handleCorrect}
          loading={loading}
        >
          改错
        </Button>
        <Button
          size="small"
          icon={<ExpandOutlined />}
          onClick={handleExpand}
          loading={loading}
        >
          扩写
        </Button>
      </Space>
    </BubbleMenu>
  );
}
