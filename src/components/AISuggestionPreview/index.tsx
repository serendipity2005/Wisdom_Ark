import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import AISuggestionBus, { type AISuggestion } from '@/utils/AISuggestionBus';

interface AISuggestionPreviewProps {
  editor: any;
}

export default function AISuggestionPreview({
  editor,
}: AISuggestionPreviewProps) {
  const bus = useMemo(() => AISuggestionBus.getInstance(), []);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [editable, setEditable] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return bus.subscribe((s) => {
      setSuggestion(s);
      setEditable(false);
      setDraft(s?.text ?? '');
    });
  }, [bus]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!suggestion) return;
      // Tab/Enter accept, Esc cancel
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        handleAccept();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        bus.clear();
      }
    };
    if (suggestion) {
      window.addEventListener('keydown', onKey, { capture: true });
    }
    return () =>
      window.removeEventListener('keydown', onKey, { capture: true } as any);
  }, [suggestion]);

  const handleAccept = () => {
    if (!suggestion) return;
    const textToInsert = editable ? draft : suggestion.text;
    if (
      suggestion.mode === 'insert' &&
      typeof suggestion.position === 'number'
    ) {
      editor
        .chain()
        .focus()
        .insertContentAt(suggestion.position, textToInsert)
        .run();
    } else if (suggestion.mode === 'replace' && suggestion.range) {
      editor
        .chain()
        .focus()
        .deleteRange({ from: suggestion.range.from, to: suggestion.range.to })
        .insertContentAt(suggestion.range.from, textToInsert)
        .run();
    } else if (suggestion.mode === 'replace_all') {
      editor.commands.setContent(textToInsert);
    }
    bus.clear();
  };

  if (!suggestion) return null;

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        padding: '8px 12px',
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ color: '#1677ff', fontWeight: 500 }}>AI建议</span>
      {editable ? (
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{
            flex: 1,
            minHeight: 60,
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            padding: 8,
          }}
        />
      ) : (
        <div
          style={{
            flex: 1,
            maxHeight: 160,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {suggestion.text}
        </div>
      )}
      <Space>
        <Tooltip
          title={editable ? '保存并插入 (Enter/Tab)' : '插入 (Enter/Tab)'}
        >
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleAccept}
          />
        </Tooltip>
        <Tooltip title={editable ? '退出编辑' : '编辑建议'}>
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditable((v) => !v)}
          />
        </Tooltip>
        <Tooltip title="取消 (Esc)">
          <Button danger icon={<CloseOutlined />} onClick={() => bus.clear()} />
        </Tooltip>
      </Space>
    </div>
  );
}
