import React, { useEffect, useState } from 'react';

interface InlineSuggestionProps {
  suggestion: string;
  onAccept: () => void;
  onReject: () => void;
  editor: any;
}

const InlineSuggestion: React.FC<InlineSuggestionProps> = ({
  suggestion,
  onAccept,
  onReject,
  editor,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (editor) {
      const { from } = editor.state.selection;
      const coords = editor.view.coordsAtPos(from);
      const editorRect = editor.view.dom.getBoundingClientRect();

      setPosition({
        top: coords.top - editorRect.top,
        left: coords.left - editorRect.left,
      });
    }
  }, [editor]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      onAccept();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onReject();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        background: 'rgba(0, 123, 255, 0.1)',
        border: '1px solid #007bff',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '14px',
        color: '#007bff',
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        whiteSpace: 'pre-wrap',
        maxWidth: '100%',
        wordBreak: 'break-word',
        boxShadow: '0 2px 8px rgba(0, 123, 255, 0.2)',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {suggestion}
      <span
        style={{
          fontSize: '12px',
          color: '#666',
          marginLeft: '8px',
          fontStyle: 'italic',
        }}
      >
        Tab 确认 · Esc 取消
      </span>
    </div>
  );
};

export default InlineSuggestion;
