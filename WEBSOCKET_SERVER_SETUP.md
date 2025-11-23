# 🚀 WebSocket 服务器搭建指南

## ✅ 已完成的修改

你的项目现在已经支持 WebSocket 实时协同！

**修改的文件：**

1. `src/utils/collaboration/CollaborationProvider.ts` - 添加 WebSocket 支持
2. `src/hooks/useCollaborativeEditor.ts` - 支持 WebSocket 配置
3. `src/pages/editor/draft.tsx` - 启用 WebSocket 并显示连接状态

---

## 🎯 当前状态

**已启用：**

- ✅ WebSocket 客户端
- ✅ 连接状态显示（右上角"在线/离线"标识）
- ✅ 使用公共测试服务器：`wss://demos.yjs.dev`

**可以测试：**

- 打开两个浏览器窗口
- 访问同一个文档（`?id=test123`）
- 实时看到对方的编辑 ✅

---

## 🧪 快速测试（使用公共服务器）

### 步骤 1：打开两个窗口

1. 窗口 A：`http://localhost:5173/editor/draft?id=test123`
2. 窗口 B：`http://localhost:5173/editor/draft?id=test123`

### 步骤 2：验证连接

- 两个窗口右上角应该显示 **"在线"**（绿色圆点）
- 浏览器控制台显示：`🔌 WebSocket 状态: connected`

### 步骤 3：测试实时同步

1. 在窗口 A 输入：`这是窗口A的内容`
2. **立即**在窗口 B 看到相同内容 ✅
3. 在窗口 B 输入：`这是窗口B的内容`
4. **立即**在窗口 A 看到相同内容 ✅

### 步骤 4：测试无冲突合并

1. 在窗口 A 的第一行输入：`【A添加】`
2. 同时在窗口 B 的第二行输入：`【B添加】`
3. 两个窗口都会实时看到对方的修改，**没有冲突！** ✅

---

## 🏠 搭建自己的 WebSocket 服务器（可选）

### 方案 1：使用 y-websocket 官方服务器（最简单）

#### 1. 创建服务器文件

在项目根目录创建 `server/yjs-server.js`：

```javascript
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
  console.log('✅ 新客户端连接');
});

const PORT = 1234;
server.listen(PORT, () => {
  console.log(`🚀 Yjs WebSocket 服务器运行在 ws://localhost:${PORT}`);
});
```

#### 2. 安装依赖

```bash
npm install ws y-websocket --save-dev
```

#### 3. 启动服务器

```bash
node server/yjs-server.js
```

#### 4. 修改前端配置

在 `draft.tsx` 中修改：

```typescript
wsUrl: 'ws://localhost:1234', // 使用本地服务器
```

---

### 方案 2：使用 Docker 部署（生产环境）

#### 1. 创建 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

RUN npm install -g y-websocket

EXPOSE 1234

CMD ["y-websocket-server", "--port", "1234"]
```

#### 2. 构建并运行

```bash
docker build -t yjs-server .
docker run -d -p 1234:1234 yjs-server
```

---

### 方案 3：使用 Nginx 反向代理（支持 HTTPS）

#### nginx.conf

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /yjs {
        proxy_pass http://localhost:1234;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

前端配置：

```typescript
wsUrl: 'wss://your-domain.com/yjs',
```

---

## 🔒 生产环境安全配置

### 1. 添加身份验证

修改 `server/yjs-server.js`：

```javascript
wss.on('connection', (ws, req) => {
  const token = new URL(req.url, 'http://localhost').searchParams.get('token');

  // 验证 token
  if (!isValidToken(token)) {
    ws.close(1008, 'Unauthorized');
    return;
  }

  setupWSConnection(ws, req);
});

function isValidToken(token) {
  // 实现你的 token 验证逻辑
  return token === 'your-secret-token';
}
```

前端配置：

```typescript
wsUrl: 'ws://localhost:1234?token=your-secret-token',
```

### 2. 限制房间访问

```javascript
wss.on('connection', (ws, req) => {
  const roomName = new URL(req.url, 'http://localhost').pathname.slice(1);

  // 检查用户是否有权限访问该房间
  if (!hasRoomAccess(userId, roomName)) {
    ws.close(1008, 'Forbidden');
    return;
  }

  setupWSConnection(ws, req);
});
```

---

## 📊 性能优化

### 1. 启用消息压缩

```javascript
const wss = new WebSocket.Server({
  server,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3,
    },
  },
});
```

### 2. 限制连接数

```javascript
const MAX_CONNECTIONS = 1000;
let currentConnections = 0;

wss.on('connection', (ws, req) => {
  if (currentConnections >= MAX_CONNECTIONS) {
    ws.close(1008, 'Server is full');
    return;
  }

  currentConnections++;
  ws.on('close', () => currentConnections--);

  setupWSConnection(ws, req);
});
```

---

## 🎤 面试话术

### 问："你的 WebSocket 服务器是怎么实现的？"

**答：**

> "我使用了 Yjs 官方提供的 `y-websocket` 库来搭建 WebSocket 服务器。
>
> **核心原理：**
>
> 1. **WebSocket 连接**：客户端通过 WebSocket 连接到服务器，服务器负责转发 Yjs 的 Update 消息。
> 2. **房间隔离**：每个文档对应一个房间（room），不同房间的消息互不干扰。
> 3. **消息广播**：当一个客户端发送 Update 时，服务器会广播给同一房间的所有其他客户端。
> 4. **CRDT 合并**：客户端收到 Update 后，Yjs 会自动应用 CRDT 算法进行无冲突合并。
>
> **架构优势：**
>
> - **Local-First**：即使 WebSocket 断开，用户仍然可以编辑，数据保存在 IndexedDB 中。
> - **自动重连**：网络恢复后，客户端会自动重连并同步离线期间的更改。
> - **可扩展**：可以轻松添加身份验证、权限控制、消息持久化等功能。"

---

## ✅ 总结

**当前状态：**

- ✅ 使用公共测试服务器 `wss://demos.yjs.dev`
- ✅ 可以立即测试实时协同功能
- ✅ 支持多设备无冲突合并

**下一步（可选）：**

1. 搭建自己的 WebSocket 服务器（生产环境必须）
2. 添加身份验证和权限控制
3. 部署到云服务器（阿里云、腾讯云等）

**现在你可以直接测试了！** 🚀
