// hooks/useWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url: string) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  // 发送消息的函数，用 useCallback 包装以避免不必要的重新创建
  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      // 通常建议发送 JSON 字符串以便结构化数据
      const payload =
        typeof message === 'string' ? message : JSON.stringify(message);
      ws.current.send(payload);
    }
  }, []);

  // 关闭连接的函数
  const closeConnection = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }
  }, []);

  useEffect(() => {
    // 建立连接
    ws.current = new WebSocket(url);

    // 处理连接打开
    ws.current.onopen = () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
    };

    // 处理收到消息
    ws.current.onmessage = (event) => {
      try {
        // 尝试解析为 JSON，如果失败则使用原始数据
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch (error) {
        setMessages((prev) => [...prev, event.data]);
      }
    };

    // 处理连接关闭
    ws.current.onclose = () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    };

    // 处理错误
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // 清理函数
    return () => {
      closeConnection();
    };
  }, [url, closeConnection]); // 如果 url 变化，Effect 会重新运行

  // Hook 返回状态和方法
  return {
    messages,
    isConnected,
    sendMessage,
    closeConnection,
  };
};
