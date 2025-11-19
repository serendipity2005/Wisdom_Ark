import { useEffect, useState, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { CollaborationProvider } from '@/utils/collaboration/CollaborationProvider';
import { createCollaborativeEditor } from '@/pages/editor/config/collaborativeEditorConfig';

/**
 * 🔥 协同编辑器 Hook
 * 自动管理 Yjs 文档、WebSocket 连接和 IndexedDB 持久化
 *
 * @param roomName - 房间名称（文档 ID）
 * @param userName - 用户名
 * @param userColor - 用户光标颜色
 * @returns { editor, status, isOnline }
 */
export function useCollaborativeEditor(
  roomName: string,
  userName = 'Anonymous',
  userColor: string = '#' + Math.floor(Math.random() * 16777215).toString(16),
) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [status, setStatus] = useState<'connected' | 'disconnected'>(
    'disconnected',
  );
  const providerRef = useRef<CollaborationProvider | null>(null);

  useEffect(() => {
    // 1. 创建协同服务提供者
    const provider = new CollaborationProvider(roomName, {
      name: userName,
      color: userColor,
    });

    providerRef.current = provider;

    // 2. 监听连接状态
    const unsubscribe = provider.onStatusChange((newStatus) => {
      setStatus(newStatus);
      console.log(`🔌 连接状态: ${newStatus}`);
    });

    // 3. 创建编辑器实例
    const editorInstance = createCollaborativeEditor(
      provider.getDocument(),
      provider.getProvider(),
    );

    setEditor(editorInstance);

    // 4. 清理函数
    return () => {
      unsubscribe();
      editorInstance.destroy();
      provider.destroy();
    };
  }, [roomName, userName, userColor]);

  return {
    editor,
    status,
    isOnline: status === 'connected',
  };
}
