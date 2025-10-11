// server/index.js
import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';

const wss = new WebSocketServer({ port: 8080 });
const streams = new Map(); // streamKey -> {publisher, viewers}

wss.on('connection', (ws) => {
  let streamKey = null;
  let role = null;

  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case 'auth':
        streamKey = message.streamKey;
        role = 'publisher';
        if (!streams.has(streamKey)) {
          streams.set(streamKey, { publisher: ws, viewers: new Set() });
        }
        ws.send(JSON.stringify({ type: 'auth-success' }));
        break;

      case 'offer':
        // 模拟直接回 Answer（测试用）
        ws.send(JSON.stringify({ type: 'answer', sdp: 'mock-answer-sdp' }));
        break;

      case 'ice-candidate':
        console.log('ICE candidate:', message.candidate);
        break;
    }
  });

  ws.on('close', () => {
    if (streamKey && role === 'publisher') {
      streams.delete(streamKey);
    }
  });
});

console.log('✅ WebSocket Signaling Server running on ws://localhost:8080');
