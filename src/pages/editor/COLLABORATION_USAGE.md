# 🔥 协同编辑功能使用指南

## 📦 已创建的文件

1. **`src/utils/collaboration/CollaborationProvider.ts`**
   - 协同服务提供者，封装 Yjs、WebSocket 和 IndexedDB

2. **`src/pages/editor/config/collaborativeEditorConfig.ts`**
   - 支持协同的编辑器配置

3. **`src/hooks/useCollaborativeEditor.ts`**
   - React Hook，简化协同编辑器的使用

4. **`src/components/ConnectionStatus/index.tsx`**
   - 连接状态指示器组件

---

## 🚀 如何在 `draft.tsx` 中使用

### 方案 A：完全替换为协同编辑器（推荐用于演示）

在 `draft.tsx` 中，替换原有的 `editor` 导入：

```typescript
// ❌ 旧代码
import editor from '@/pages/editor/config/editorConfig';

// ✅ 新代码
import { useCollaborativeEditor } from '@/hooks/useCollaborativeEditor';
import { ConnectionStatus } from '@/components/ConnectionStatus';

const TiptapEditor = () => {
  // 使用协同编辑器 Hook
  const { editor, status, isOnline } = useCollaborativeEditor(
    'my-document-123', // 房间名称（文档 ID）
    'User-' + Math.random().toString(36).slice(2, 7), // 随机用户名
  );

  // ... 其他代码保持不变

  return (
    <Layout className="editor-container">
      <Header>
        {/* 在 Header 中添加连接状态指示器 */}
        <Space>
          <ConnectionStatus status={status} />
          {/* ... 其他按钮 */}
        </Space>
      </Header>

      {/* ... 其他代码 */}
    </Layout>
  );
};
```

---

### 方案 B：保留原编辑器，添加协同开关（推荐用于生产）

```typescript
const TiptapEditor = () => {
  const [useCollaboration, setUseCollaboration] = useState(false);

  // 原编辑器
  const localEditor = editor;

  // 协同编辑器
  const { editor: collabEditor, status } = useCollaborativeEditor(
    'my-document-123',
    'User-' + Math.random().toString(36).slice(2, 7),
  );

  // 根据开关选择使用哪个编辑器
  const activeEditor = useCollaboration ? collabEditor : localEditor;

  return (
    <Layout>
      <Header>
        <Space>
          <Switch
            checked={useCollaboration}
            onChange={setUseCollaboration}
            checkedChildren="协同模式"
            unCheckedChildren="本地模式"
          />
          {useCollaboration && <ConnectionStatus status={status} />}
        </Space>
      </Header>

      <EditorContent editor={activeEditor} />
    </Layout>
  );
};
```

---

## 🎯 核心特性

### 1. **离线优先（Local-First）**

- 所有更改立即保存到浏览器 IndexedDB
- 断网时继续编辑，无任何提示
- 联网后自动同步，无需手动操作

### 2. **实时协同**

- 多个用户可以同时编辑同一文档
- 看到其他用户的光标位置和选区
- 无冲突合并（CRDT 算法保证）

### 3. **性能优化**

- 增量同步：只传输变更的部分（几个字节）
- 服务器无压力：只转发二进制数据，不解析内容
- 本地缓存：IndexedDB 持久化，刷新页面不丢失

---

## 🔧 配置说明

### 修改 WebSocket 服务器地址

在 `CollaborationProvider.ts` 第 30 行：

```typescript
this.wsProvider = new WebsocketProvider(
  'wss://demos.yjs.dev', // ⚠️ 这是公共测试服务器
  roomName,
  this.doc,
);
```

**生产环境请替换为你自己的服务器：**

```typescript
this.wsProvider = new WebsocketProvider(
  'ws://localhost:1234', // 本地开发
  // 或
  'wss://your-domain.com/ws', // 生产环境
  roomName,
  this.doc,
);
```

---

## 🖥️ 搭建 WebSocket 服务器（可选）

如果你想搭建自己的服务器，在 `server/` 目录下创建 `y-websocket-server.js`：

\`\`\`javascript
const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');

const server = http.createServer((request, response) => {
response.writeHead(200, { 'Content-Type': 'text/plain' });
response.end('Yjs WebSocket Server');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
setupWSConnection(ws, req);
});

const port = process.env.PORT || 1234;
server.listen(port, () => {
console.log(\`🚀 Yjs WebSocket 服务器运行在 http://localhost:\${port}\`);
});
\`\`\`

安装依赖并运行：
\`\`\`bash
cd server
npm install y-websocket ws
node y-websocket-server.js
\`\`\`

---

## 🎤 面试话术

### 问："你是如何实现离线编辑的？"

**答：**

> "我使用了 Yjs 的 CRDT 算法结合 IndexedDB 实现了 Local-First 架构。
>
> 具体来说：
>
> 1. 用户的每次编辑操作都会生成一个 CRDT Update（几个字节的二进制数据）
> 2. 这个 Update 同时写入两个地方：
>    - IndexedDB（本地持久化）
>    - WebSocket（实时同步）
> 3. 如果网络断开，Update 只写入 IndexedDB，用户无感知
> 4. 网络恢复时，y-websocket 会自动检测到连接，把积压的 Update 发送给服务器
> 5. CRDT 的数学特性保证了：只要所有 Update 都收到，最终结果一定一致，无需手动解决冲突
>
> 这种架构的优势是：
>
> - 用户体验好：离线和在线无差别
> - 服务器压力小：只转发二进制流，不解析 JSON
> - 数据安全：本地有完整副本，不怕服务器挂掉"

---

## ✅ 测试步骤

1. **安装依赖**（如果还没安装）：
   \`\`\`bash
   npm install yjs @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor y-websocket y-indexeddb --legacy-peer-deps
   \`\`\`

2. **修改 `draft.tsx`**，按照上面的方案 A 或 B

3. **打开两个浏览器窗口**，访问同一个页面

4. **在一个窗口输入**，另一个窗口会实时看到变化

5. **断网测试**：
   - 打开 DevTools → Network → Offline
   - 继续编辑
   - 恢复网络 → 数据自动同步

6. **刷新测试**：
   - 编辑一些内容
   - 刷新页面
   - 内容依然存在（IndexedDB 持久化）

---

## 🐛 常见问题

### Q: 安装依赖时报错 `ERESOLVE`？

**A:** 使用 `--legacy-peer-deps` 参数：
\`\`\`bash
npm install yjs @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor y-websocket y-indexeddb --legacy-peer-deps
\`\`\`

### Q: 编辑器初始化失败？

**A:** 检查 `useCollaborativeEditor` Hook 是否在组件顶层调用（不能在条件语句中）

### Q: 数据没有同步？

**A:** 检查：

1. WebSocket 服务器是否运行
2. 浏览器控制台是否有连接错误
3. 两个窗口的 `roomName` 是否一致

---

## 📚 相关资源

- [Yjs 官方文档](https://docs.yjs.dev/)
- [Tiptap Collaboration 指南](https://tiptap.dev/docs/editor/extensions/functionality/collaboration)
- [CRDT 算法讲解](https://crdt.tech/)
