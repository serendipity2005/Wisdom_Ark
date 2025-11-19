import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

/**
 * 协同服务提供者
 * 负责管理 Yjs 文档、WebSocket 连接和 IndexedDB 持久化
 * 实现 "Local-First"（本地优先）架构
 */
export class CollaborationProvider {
  private doc: Y.Doc;
  private wsProvider: WebsocketProvider;
  private indexeddbProvider: IndexeddbPersistence;
  private statusHandlers: ((status: 'connected' | 'disconnected') => void)[] =
    [];

  constructor(roomName: string, user: { name: string; color: string }) {
    // 1. 创建 Yjs 文档实例 (CRDT 核心)
    this.doc = new Y.Doc();

    // 2. 初始化 IndexedDB 持久化 (离线支持核心)
    // 这使得所有更改都会立即保存到本地浏览器数据库
    this.indexeddbProvider = new IndexeddbPersistence(roomName, this.doc);

    // 3. 初始化 WebSocket 连接 (实时同步)
    // 连接到公共测试服务器（生产环境应替换为自己的服务器）
    this.wsProvider = new WebsocketProvider(
      'wss://demos.yjs.dev', // 替换为你自己的服务器地址: ws://localhost:1234
      roomName,
      this.doc,
    );

    // 配置用户信息（用于光标显示）
    this.wsProvider.awareness.setLocalStateField('user', user);

    // 监听连接状态
    this.wsProvider.on('status', (event: { status: string }) => {
      const status =
        event.status === 'connected' ? 'connected' : 'disconnected';
      this.statusHandlers.forEach((handler) => handler(status));
    });

    // 监听 IndexedDB 同步状态
    this.indexeddbProvider.on('synced', () => {
      console.log('✅ 本地数据已加载 (离线内容已恢复)');
    });
  }

  /**
   * 获取 Tiptap 需要的插件配置
   */
  public getDocument() {
    return this.doc;
  }

  public getProvider() {
    return this.wsProvider;
  }

  /**
   * 监听连接状态变化
   */
  public onStatusChange(
    handler: (status: 'connected' | 'disconnected') => void,
  ) {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * 销毁所有连接
   */
  public destroy() {
    this.wsProvider.destroy();
    this.indexeddbProvider.destroy();
    this.doc.destroy();
  }

  /**
   * 强制清除本地缓存（用于调试）
   */
  public async clearLocalCache() {
    await this.indexeddbProvider.clearData();
  }
}
