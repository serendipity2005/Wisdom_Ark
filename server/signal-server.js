// 注意：信令服务器可能需要在本地进行下载
require('dotenv').config(); //node 环境下加载环境变量
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const redis = require('redis');
const app = express();
const server = http.createServer(app);

// 中间件配置  启动cors和json解析
app.use(cors());
app.use(express.json());

// Socket.IO配置
const io = socketIo(server, {
  // 允许两个端口访问
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // 支持websocket 和轮询
  transports: ['websocket', 'polling'],
});

// Redis客户端配置
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  database: process.env.REDIS_DATABASE || 0,

  //重试策略  最多10次 间隔递增，上限 3 秒
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('Redis服务器连接被拒绝');
      return new Error('Redis服务器连接被拒绝');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error('Redis重试时间超时');
      return new Error('Redis重试时间超时');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  },
});

// Redis事件监听
redisClient.on('error', (err) => {
  console.error('Redis连接错误:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis连接成功');
});

redisClient.on('ready', () => {
  console.log('✅ Redis准备就绪');
});

// 房间管理类
class RoomManager {
  // 接收参数  redisClient
  constructor(redisClient) {
    this.redis = redisClient;
  }

  // 创建房间
  /**
   * @description: 创建房间
   * @param  roomId 房间id
   * @param  broadcasterId  广播id
   */
  async createRoom(roomId, broadcasterId) {
    // 房间数据
    const roomData = {
      broadcaster: broadcasterId,
      viewers: JSON.stringify([]),
      createdAt: Date.now(),
      status: 'active',
      title: `房间 ${roomId}`,
      description: '直播房间',
    };

    try {
      await this.redis.hset(`room:${roomId}`, roomData);
      await this.redis.expire(`room:${roomId}`, 3600); // 1小时过期
      console.log(`✅ 房间创建成功: ${roomId}`);
      return roomData;
    } catch (error) {
      console.error('创建房间失败:', error);
      throw error;
    }
  }

  // 加入房间
  async joinRoom(roomId, viewerId) {
    const roomKey = `room:${roomId}`;

    try {
      const room = await this.redis.hgetall(roomKey);

      if (!room || Object.keys(room).length === 0) {
        throw new Error('房间不存在');
      }

      const viewers = JSON.parse(room.viewers || '[]');
      if (!viewers.includes(viewerId)) {
        viewers.push(viewerId);
        await this.redis.hset(roomKey, 'viewers', JSON.stringify(viewers));
      }

      console.log(`✅ 用户加入房间: ${roomId}, 观众数: ${viewers.length}`);
      return {
        ...room,
        viewers: viewers,
      };
    } catch (error) {
      console.error('加入房间失败:', error);
      throw error;
    }
  }

  // 离开房间
  async leaveRoom(roomId, userId) {
    const roomKey = `room:${roomId}`;

    try {
      const room = await this.redis.hgetall(roomKey);

      if (!room || Object.keys(room).length === 0) {
        return { deleted: false };
      }

      if (room.broadcaster === userId) {
        // 主播离开，删除房间
        await this.redis.del(roomKey);
        console.log(`✅ 房间删除: ${roomId}`);
        return { deleted: true };
      } else {
        // 观众离开
        const viewers = JSON.parse(room.viewers || '[]');
        const updatedViewers = viewers.filter((id) => id !== userId);
        await this.redis.hset(
          roomKey,
          'viewers',
          JSON.stringify(updatedViewers),
        );
        console.log(
          `✅ 用户离开房间: ${roomId}, 剩余观众: ${updatedViewers.length}`,
        );
        return { deleted: false, viewers: updatedViewers };
      }
    } catch (error) {
      console.error('离开房间失败:', error);
      throw error;
    }
  }

  // 获取房间信息
  async getRoom(roomId) {
    try {
      const room = await this.redis.hgetall(`room:${roomId}`);
      if (room && Object.keys(room).length > 0) {
        room.viewers = JSON.parse(room.viewers || '[]');
      }
      return room;
    } catch (error) {
      console.error('获取房间信息失败:', error);
      return null;
    }
  }

  // 获取所有房间
  async getAllRooms() {
    try {
      const keys = await this.redis.keys('room:*');
      const rooms = [];

      for (const key of keys) {
        const room = await this.redis.hgetall(key);
        if (room && Object.keys(room).length > 0) {
          room.id = key.replace('room:', '');
          room.viewers = JSON.parse(room.viewers || '[]');
          rooms.push(room);
        }
      }

      return rooms;
    } catch (error) {
      console.error('获取房间列表失败:', error);
      return [];
    }
  }
}

// 创建房间管理器实例
const roomManager = new RoomManager(redisClient);

// 连接Redis
redisClient.connect().catch(console.error);

// Socket.IO连接处理
io.on('connection', (socket) => {
  console.log(`🔌 用户连接: ${socket.id}`);

  // 创建房间
  socket.on('create-room', async ({ roomId, title, description }) => {
    try {
      await roomManager.createRoom(roomId, socket.id);
      socket.join(roomId);

      // 更新房间信息
      if (title || description) {
        await redisClient.hset(`room:${roomId}`, {
          title: title || `房间 ${roomId}`,
          description: description || '直播房间',
        });
      }

      // 广播房间列表更新
      const rooms = await roomManager.getAllRooms();
      io.emit('rooms-updated', rooms);

      socket.emit('room-created', { roomId, success: true });
      console.log(`✅ 房间创建成功: ${roomId}`);
    } catch (error) {
      console.error('创建房间失败:', error);
      socket.emit('error', { message: '创建房间失败', error: error.message });
    }
  });

  // 加入房间
  socket.on('join-room', async ({ roomId }) => {
    try {
      const room = await roomManager.joinRoom(roomId, socket.id);
      socket.join(roomId);

      // 通知房间内所有用户观众数量变化
      io.to(roomId).emit('viewer-count', room.viewers.length);

      // 通知主播有新观众加入
      socket.to(roomId).emit('new-viewer', socket.id);

      socket.emit('room-joined', { roomId, success: true });
      console.log(`✅ 用户加入房间: ${roomId}`);
    } catch (error) {
      console.error('加入房间失败:', error);
      socket.emit('error', {
        message: '房间不存在或加入失败',
        error: error.message,
      });
    }
  });

  // 离开房间
  socket.on('leave-room', async () => {
    try {
      const rooms = await roomManager.getAllRooms();
      for (const room of rooms) {
        if (
          room.broadcaster === socket.id ||
          room.viewers.includes(socket.id)
        ) {
          const result = await roomManager.leaveRoom(room.id, socket.id);

          if (result.deleted) {
            io.to(room.id).emit('room-closed');
          } else {
            io.to(room.id).emit('viewer-count', result.viewers.length);
          }

          // 广播房间列表更新
          const updatedRooms = await roomManager.getAllRooms();
          io.emit('rooms-updated', updatedRooms);
          break;
        }
      }
    } catch (error) {
      console.error('离开房间失败:', error);
    }
  });

  // 获取房间列表
  socket.on('get-rooms', async () => {
    try {
      const rooms = await roomManager.getAllRooms();
      socket.emit('rooms-list', rooms);
    } catch (error) {
      console.error('获取房间列表失败:', error);
      socket.emit('error', { message: '获取房间列表失败' });
    }
  });

  // WebRTC信令处理

  // 转发offer（主播发送给观众）
  socket.on('offer', ({ roomId, offer, to }) => {
    if (to) {
      // 发送给特定用户
      socket.to(to).emit('offer', { from: socket.id, offer });
    } else {
      // 广播给房间内所有用户
      socket.to(roomId).emit('offer', { from: socket.id, offer });
    }
    console.log(`📤 Offer转发: ${socket.id} -> ${to || roomId}`);
  });

  // 转发answer（观众回复给主播）
  socket.on('answer', ({ roomId, answer, to }) => {
    if (to) {
      socket.to(to).emit('answer', { from: socket.id, answer });
    } else {
      socket.to(roomId).emit('answer', { from: socket.id, answer });
    }
    console.log(`📤 Answer转发: ${socket.id} -> ${to || roomId}`);
  });

  // 转发ICE candidate
  socket.on('ice-candidate', ({ roomId, candidate, to }) => {
    if (to) {
      socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
    } else {
      socket.to(roomId).emit('ice-candidate', { from: socket.id, candidate });
    }
    console.log(`�� ICE Candidate转发: ${socket.id} -> ${to || roomId}`);
  });

  // 聊天消息
  socket.on('chat-message', ({ roomId, message, username }) => {
    io.to(roomId).emit('chat-message', {
      from: socket.id,
      message,
      username,
      timestamp: Date.now(),
    });
    console.log(`💬 聊天消息: ${roomId} - ${username}: ${message}`);
  });

  // 断开连接处理
  socket.on('disconnect', async () => {
    console.log(`🔌 用户断开连接: ${socket.id}`);
    try {
      const rooms = await roomManager.getAllRooms();
      for (const room of rooms) {
        if (
          room.broadcaster === socket.id ||
          room.viewers.includes(socket.id)
        ) {
          const result = await roomManager.leaveRoom(room.id, socket.id);

          if (result.deleted) {
            io.to(room.id).emit('room-closed');
          } else {
            io.to(room.id).emit('viewer-count', result.viewers.length);
          }

          // 广播房间列表更新
          const updatedRooms = await roomManager.getAllRooms();
          io.emit('rooms-updated', updatedRooms);
          break;
        }
      }
    } catch (error) {
      console.error('清理房间信息失败:', error);
    }
  });
});

// HTTP路由
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connections: io.engine.clientsCount,
  });
});

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await roomManager.getAllRooms();
    res.json({ rooms });
  } catch (error) {
    console.error('获取房间列表失败:', error);
    res.status(500).json({ error: '获取房间列表失败' });
  }
});

app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const room = await roomManager.getRoom(req.params.roomId);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }
    res.json({ room });
  } catch (error) {
    console.error('获取房间信息失败:', error);
    res.status(500).json({ error: '获取房间信息失败' });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`�� 信令服务器启动成功!`);
  console.log(`�� 端口: ${PORT}`);
  console.log(`📡 WebSocket服务: ws://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/health`);
  console.log(`📋 房间列表: http://localhost:${PORT}/api/rooms`);
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 收到SIGINT信号，正在关闭服务器...');
  await redisClient.quit();
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 收到SIGTERM信号，正在关闭服务器...');
  await redisClient.quit();
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});
