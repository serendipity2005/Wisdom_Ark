# 🔥 离线编辑功能使用指南（CRDT + IndexedDB）

## ✅ 已完成的修改

### 重构的文件

1. **`src/utils/collaboration/CollaborationProvider.ts`**
   - 重命名为 `OfflineEditorProvider`
   - 去掉 WebSocket 依赖
   - 只保留 Yjs + IndexedDB

2. **`src/pages/editor/config/collaborativeEditorConfig.ts`**
   - 函数重命名为 `createOfflineEditor`
   - 去掉 `CollaborationCursor` 扩展
   - 只保留 `Collaboration` 扩展（CRDT 核心）

3. **`src/hooks/useCollaborativeEditor.ts`**
   - 重命名为 `useOfflineEditor`
   - 去掉连接状态管理
   - 简化为纯本地编辑

---

## 🚀 如何使用

### 在 `draft.tsx` 中集成

```typescript
import { useOfflineEditor } from '@/hooks/useCollaborativeEditor';

const TiptapEditor = () => {
  // 使用离线编辑器
  const { editor, isReady } = useOfflineEditor(
    'my-document-' + (new URLSearchParams(window.location.search).get('id') || 'default')
  );

  // ... 其他代码保持不变

  return (
    <Layout>
      {!isReady && <div>正在加载本地数据...</div>}
      <EditorContent editor={editor} />
    </Layout>
  );
};
```

---

## 🎯 核心特性

### ✅ 已实现

1. **离线编辑** - 所有更改立即保存到 IndexedDB
2. **刷新不丢失** - 页面刷新后自动恢复内容
3. **CRDT 数据结构** - 使用 Yjs 的 CRDT 算法管理文档状态
4. **撤销/重做** - Yjs 自带的 undo/redo 功能

### ❌ 未实现（简化掉了）

1. ~~实时协同~~ - 不需要 WebSocket
2. ~~多人光标~~ - 不需要 CollaborationCursor
3. ~~连接状态~~ - 纯本地，无需网络

---

## 📦 需要的依赖

只需要这两个包（不需要 WebSocket 相关的包）：

```bash
npm install yjs y-indexeddb --legacy-peer-deps
npm install @tiptap/extension-collaboration --legacy-peer-deps
```

**不需要安装：**

- ~~y-websocket~~
- ~~@tiptap/extension-collaboration-cursor~~

---

## 🧪 测试步骤

### 测试 1：离线编辑

1. 打开编辑器页面
2. 输入一些内容
3. 刷新页面 → **内容依然存在**

### 测试 2：多标签页同步（同一浏览器）

1. 打开两个标签页，访问同一个文档（URL 参数 `?id=xxx` 相同）
2. 在一个标签页输入
3. 另一个标签页**不会实时看到**（因为没有 WebSocket）
4. 刷新另一个标签页 → **内容会同步**（因为都读取同一个 IndexedDB）

### 测试 3：清除本地数据

在浏览器 DevTools 中：

1. Application → IndexedDB
2. 找到你的文档 ID（例如 `my-document-default`）
3. 删除数据库 → 刷新页面 → 内容清空

---

## 🎤 面试话术

### 问："你是如何实现离线编辑的？"

**答：**

> "我使用了 Yjs 的 CRDT 算法结合 IndexedDB 实现了离线编辑功能。
>
> 具体来说：
>
> 1. **CRDT 数据结构**：Yjs 使用 CRDT（Conflict-free Replicated Data Type）来管理文档状态，这种数据结构天然支持无冲突合并。
> 2. **IndexedDB 持久化**：用户的每次编辑操作都会生成一个 CRDT Update，立即写入浏览器的 IndexedDB。
> 3. **自动恢复**：页面刷新时，Yjs 会从 IndexedDB 读取所有历史 Update，重建文档状态。
> 4. **撤销/重做**：Yjs 自带 undo/redo 功能，基于 CRDT 的操作历史实现。
>
> 这种架构的优势是：
>
> - **完全离线可用**：不依赖网络，所有数据都在本地
> - **数据安全**：浏览器崩溃也不会丢失数据
> - **架构简单**：不需要 WebSocket 服务器，降低了部署成本
> - **可扩展**：未来如果需要多人协同，只需加上 WebSocket 层即可"

---

## 🔧 未来扩展（如果需要多人协同）

如果未来需要添加实时协同功能，只需：

1. **安装 WebSocket 依赖**

   ```bash
   npm install y-websocket
   ```

2. **在 `OfflineEditorProvider` 中添加 WebSocket**

   ```typescript
   import { WebsocketProvider } from 'y-websocket';

   constructor(documentId: string) {
     this.doc = new Y.Doc();
     this.indexeddbProvider = new IndexeddbPersistence(documentId, this.doc);

     // 添加 WebSocket 同步
     this.wsProvider = new WebsocketProvider(
       'ws://localhost:1234',
       documentId,
       this.doc
     );
   }
   ```

3. **搭建 WebSocket 服务器**（见之前的文档）

---

## 📊 性能对比

| 方案                   | 依赖包大小 | 服务器要求       | 离线可用 | 多人协同 |
| ---------------------- | ---------- | ---------------- | -------- | -------- |
| **当前方案（纯离线）** | ~200KB     | 无               | ✅       | ❌       |
| WebSocket 方案         | ~500KB     | WebSocket 服务器 | ✅       | ✅       |
| 传统 HTTP 方案         | ~50KB      | REST API         | ❌       | ❌       |

---

## 🐛 常见问题

### Q: 为什么刷新页面内容还在？

**A:** 因为所有更改都保存在 IndexedDB 中，刷新页面时 Yjs 会自动从 IndexedDB 恢复数据。

### Q: 如何清除本地数据？

**A:**

1. 代码方式：调用 `provider.clearLocalCache()`
2. 手动方式：DevTools → Application → IndexedDB → 删除对应数据库

### Q: 多个标签页会同步吗？

**A:** 不会实时同步（因为没有 WebSocket），但刷新后会同步（因为都读取同一个 IndexedDB）。

### Q: 如何实现云端备份？

**A:** 可以定期调用 `provider.getSnapshot()` 获取文档快照，通过 HTTP POST 上传到服务器。

---

## 🎯 总结

当前实现是一个**极简的离线编辑方案**：

- ✅ 适合单人使用
- ✅ 不需要服务器
- ✅ 架构简单，易于理解和维护
- ✅ 面试时容易讲清楚

如果未来需要多人协同，可以无缝升级到 WebSocket 方案。
