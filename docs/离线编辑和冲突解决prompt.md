这是一个叫 Wisdom_Ark 的前端项目，主要是一个基于 React + Tiptap 的 Markdown/富文本编辑器，用于文章的编辑和发布。代码风格偏 React Hooks + 自定义 Hook，编辑主页面在 [src/pages/editor/draft.tsx](cci:7://file:///e:/React/Wisdom_Ark/src/pages/editor/draft.tsx:0:0-0:0)。

我现在/将来想在这个项目里持续扩展「离线编辑 + 断网恢复后同步」相关的能力，主要面向下面这种真实场景：

- 上午在公司电脑上写文章
- 下班在高铁/地铁上用自己的笔记本继续编辑（可能完全离线）
- 回到家联网后，自动把本地修改同步到服务器
- 如果两边都有修改，给出清晰的冲突提示，而不是直接覆盖

请基于 **Offline-First、多设备但不依赖 CRDT 的思路** 来设计或实现功能，约束和要求如下：

【项目背景（你只需适度利用，不必重构全部）】

- 前端：React + Tiptap，主要编辑页面：[src/pages/editor/draft.tsx](cci:7://file:///e:/React/Wisdom_Ark/src/pages/editor/draft.tsx:0:0-0:0)
- 已有：一定程度的本地持久化和离线能力（可使用 IndexedDB）
- 目标场景更偏「稀土掘金这种 MD 编辑器」：**单人编辑为主，多设备切换，偶尔有冲突**，不是重度实时协同文档

【能力目标】

1. **离线编辑**
   - 在没有网络时，编辑器仍然可以正常输入/修改
   - 内容定时或实时保存到本地（推荐 IndexedDB，而不是仅仅 localStorage）
   - 刷新页面或浏览器崩溃后，可以从本地恢复草稿

2. **多设备切换**
   - 同一篇草稿，在公司电脑、家里电脑、笔记本之间切换
   - 不要求多设备「同时在线实时协同」，而是「不同时间段继续写」
   - 允许每台设备有本地缓存副本

3. **断网恢复后的同步**
   - 监听浏览器 `online/offline` 状态
   - 网络从 offline → online 时：
     - 从 IndexedDB 读取本地草稿（如果标记为 `needsSync = true`）
     - 调用后端接口获取当前服务器草稿版本
     - 根据版本号/时间戳判断是否有冲突
     - 决定是「直接上传」还是「进入冲突解决流程」

4. **冲突检测与解决（不要用 CRDT 自动合并）**
   - 数据结构中增加版本和元信息，例如：
     - `id`: 文章/草稿 ID
     - `content`: 当前草稿内容（Markdown 或 Tiptap JSON）
     - `version`: 草稿版本号（递增）
     - `deviceId`: 设备标识（如公司电脑/笔记本）
     - `lastModified`: 最后修改时间戳
     - `lastSyncTime`: 最近一次成功与服务器同步的时间戳
     - `needsSync`: 本地是否有未同步修改
   - 冲突判定示例：
     - 本地 `needsSync = true`
     - 服务器草稿的 `version` 或 `lastModified` > 本地的 `lastSyncTime`
       → 认为存在冲突
   - 冲突解决策略：
     - 不做复杂 CRDT 自动合并，由用户**手动选择**版本
     - 弹出一个冲突解决 UI（Modal）：
       - 左边：服务器版本（另一台设备的内容、时间、设备名）
       - 右边：本地版本（当前设备的内容、时间、设备名）
       - 可选：一个 diff 视图（如 react-diff-viewer），展示两边差异
     - 用户可以选择：
       - 保留本地版本（覆盖服务器）
       - 使用服务器版本（丢弃本地修改）
     - 之后更新本地 IndexedDB 状态，清理 `needsSync` 标记

【前后端接口与 Hook 设计建议】

- 封装一个 Hook（命名可类似）：
  - `useMultiDeviceDraft(articleId: string)` 或 `useOfflineDraftSync(articleId: string)`
  - 职责：
    - 加载草稿（优先尝试服务器，其次 IndexedDB）
    - 管理 `content` / `setContent`
    - 定时保存到 IndexedDB
    - 监听 `online` 事件并触发同步逻辑
    - 暴露 `syncStatus`（如 `'synced' | 'syncing' | 'offline' | 'conflict'`）、`lastSaved` 等状态
- 后端草稿接口（你可以给一个推荐设计即可）：
  - `GET /api/articles/:id/draft`：获取当前服务器草稿（含 version、lastModified、deviceId）
  - `PUT /api/articles/:id/draft`：提交本地草稿，携带 version，用于做乐观锁/冲突检测
  - 发生冲突时，可以返回 409 + 冲突详情（服务器版本的 meta 信息）

【设计原则】

- 默认使用：**IndexedDB + 版本号 + 冲突提示 UI** 来解决「公司电脑 ↔ 笔记本」多设备场景
- 不要默认引入 CRDT / WebSocket，除非我明确说要做「实时协同编辑」
- 代码要尽量复用现有的编辑页面结构（如 [draft.tsx](cci:7://file:///e:/React/Wisdom_Ark/src/pages/editor/draft.tsx:0:0-0:0)），通过新增 Hook / 工具函数来扩展，而不是大规模重写
- 需要时请给出：
  - Hook 伪代码或 TypeScript 示例
  - IndexedDB 层的简单封装结构
  - 冲突弹窗的结构（不必写完整 UI，但要有字段/状态流向）

在这个项目的上下文里，请根据以上约束，给出**最合适的架构设计和关键实现代码**，并顺带整理一段可以在面试时解释「为什么我选这种方案而不是 CRDT」的讲解稿。
