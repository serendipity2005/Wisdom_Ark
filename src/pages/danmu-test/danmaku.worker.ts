// 弹幕数据类型（与主线程保持一致）
interface DanmakuItem {
  id: string;
  text: string;
  x: number;
  y: number;
  speed: number;
  color: string;
  fontSize: number;
  opacity: number;
  width: number;
  timestamp: number;
  type: 'scroll' | 'top' | 'bottom';
  lane?: number; // 添加轨道信息
}
let animationId: number | null = null;
let offscreenCanvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let dpr = 1;
let danmakus: DanmakuItem[] = []; // 存储弹幕列表
let lanes: number[] = []; // 轨道管理数组

// 批量

// 处理主线程消息
self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;
  console.log('接收到消息了', e.data);
  switch (type) {
    // 初始化离屏Canvas
    case 'INIT':
      if (!payload) return;
      offscreenCanvas = payload.offscreenCanvas;
      console.log(offscreenCanvas);
      ctx = offscreenCanvas!.getContext('2d');
      dpr = payload.devicePixelRatio;
      // 乘以devicePixelRatio是为了在高分辨率屏幕（如Retina显示屏）上获得更清晰的图像。
      ctx?.scale(dpr, dpr);
      //    ------------------------初始化轨道-----------------------
      initTracks();
      //   addInitialDanmakus();
      //   模拟高并发
      // simulateHighTraffic(10000);
      if (!animationId) {
        animationId = requestAnimationFrame(animate);
      }
      break;

    // 添加新弹幕
    case 'ADD_DANMAKU':
      if (payload) {
        // 计算弹幕宽度
        if (ctx) {
          ctx.font = `${payload.fontSize}px Arial`;
          payload.width = ctx.measureText(payload.text).width;
        }
        // 为滚动弹幕分配轨道
        if (payload.type === 'scroll') {
          payload.lane = findAvailableLane(payload.width, payload.speed);
          payload.y = payload.lane * laneHeight + payload.fontSize;
        } else if (payload.type === 'top') {
          payload.y = payload.fontSize;
        } else if (payload.type === 'bottom') {
          payload.y = offscreenCanvas!.height / dpr - 10;
        }

        danmakus.push(payload);
      }

      break;
    // 测试并发
    case 'ADD_DANMAKUS':
      if (payload && Array.isArray(payload)) {
        processBatchDanmakus(payload);
      }
      break;

    // 清空弹幕
    case 'CLEAR':
      danmakus = [];
      break;
  }
};

// 原findAvailableLane()函数会遍历所有轨道两次（先找空闲轨道，再找最早释放轨道），5000 条弹幕时会触发 5000×2× 轨道数次循环，开销极大。优化方案：维护「空闲轨道队列」，避免重复遍历。
// 替换原lanes数组，新增空闲轨道队列
let freeLanes: number[] = []; // 空闲轨道队列（O(1)取/放）

let laneReleaseTimes: number[] = []; // 轨道释放时间（记录每条轨道的可用时间）
// 1. 新增全局配置：垂直安全间距（可根据需求调整）
const MAX_FONT_SIZE = 24; // 业务支持的最大弹幕字体大小
const VERTICAL_GAP = 8; // 跨轨道垂直安全间距（避免上下弹幕贴边）
const laneHeight = MAX_FONT_SIZE + VERTICAL_GAP; // 动态轨道高度 = 最大字体+垂直间距

// 初始化轨道
const initTracks = () => {
  if (!offscreenCanvas) return;
  const canvasHeight = offscreenCanvas.height / dpr;
  // 轨道数
  const trackCount = Math.floor(offscreenCanvas.height / dpr / laneHeight);
  lanes = new Array(trackCount).fill(0);
  // 改
  // 初始化空闲轨道队列（0~trackCount-1）
  freeLanes = Array.from({ length: trackCount }, (_, i) => i);
  // 初始化轨道释放时间
  laneReleaseTimes = new Array(trackCount).fill(0);
};

// 新增全局配置：同轨道水平安全间距
const HORIZONTAL_GAP = 50; // 同轨道内弹幕的水平间距（避免左右重叠）
// 时间戳形式
// 时间戳形式
function findAvailableLane(width: number, speed: number): number {
  const now = Date.now();
  const canvasWidth = offscreenCanvas!.width / dpr;

  // 计算弹幕需要多长时间移动HORIZONTAL_GAP的距离
  const gapTime = (HORIZONTAL_GAP / speed) * 1000; // 间距→时间（速度=像素/秒）

  // 改1：① 优先从空闲队列取轨道（O(1)操作，无需遍历）
  if (freeLanes.length > 0) {
    const lane = freeLanes.pop()!; // 弹出最后一条空闲轨道
    // 轨道立即可用，设置下次可用时间为当前时间+间距时间
    laneReleaseTimes[lane] = now + gapTime;
    return lane;
  }

  // 改： ② 无空闲轨道：遍历一次找最早释放的轨道（仅一次循环）
  let earliestLane = 0;
  let earliestTime = laneReleaseTimes[0];
  for (let i = 1; i < laneReleaseTimes.length; i++) {
    if (laneReleaseTimes[i] < earliestTime) {
      earliestTime = laneReleaseTimes[i];
      earliestLane = i;
    }
  }

  // 设置该轨道下次可用时间：当前最早可用时间 + 间距时间
  const finalReleaseTime = earliestTime + gapTime;
  laneReleaseTimes[earliestLane] = finalReleaseTime;
  return earliestLane;
}

// 改：轨道回收函数
// 3. 新增轨道回收函数：弹幕过期时，将轨道放回空闲队列
function recycleLane(lane: number | undefined) {
  if (lane === undefined || freeLanes.includes(lane)) return;
  freeLanes.push(lane); // 轨道回空闲队列，O(1)操作
  // freeLaneSet.add(lane); // 轨道回空闲Set
}
// 4. 重构recycleLane()：用Set回收轨道（O(1)）
// function recycleLane(lane: number | undefined) {
//   if (lane === undefined || freeLaneSet.has(lane)) return;
//   freeLaneSet.add(lane); // 轨道回空闲Set
// }
// function updateLanes() {
//   const now = Date.now();
//   for (let i = 0; i < lanes.length; i++) {
//     if (lanes[i] > 0 && lanes[i] < now) {
//       lanes[i] = 0; // 将过期的轨道标记为空闲
//     }
//   }
// }
// 2. 重构updateLanes：将过期轨道推回freeLanes
function updateLanes() {
  const now = Date.now();
  for (let i = 0; i < laneReleaseTimes.length; i++) {
    // 轨道已过期，且不在空闲队列中 → 加入空闲队列
    if (laneReleaseTimes[i] < now && !freeLanes.includes(i)) {
      freeLanes.push(i);
    }
  }
}
// 渲染性能监控变量
let frameCount = 0;
let lastFpsUpdate = performance.now();
let fps = 60;
let totalDrawTime = 0;
let drawSamples = 0;
let maxDrawTime = 0;

function draw() {
  const drawStart = performance.now();
  if (!ctx || !offscreenCanvas) return;

  const canvasWidth = offscreenCanvas.width / dpr;
  const canvasHeight = offscreenCanvas.height / dpr;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const now = Date.now();
  updateLanes();

  // 样式缓存（避免重复设置）
  let lastFont = '';
  let lastColor = '';
  let lastOpacity = -1;

  for (const danmaku of danmakus) {
    // 过滤不可见的弹幕
    let isVisible = false;
    if (danmaku.type === 'scroll') {
      isVisible = danmaku.x < canvasWidth && danmaku.x + danmaku.width > 0;
    } else {
      isVisible =
        danmaku.y > 0 &&
        danmaku.y < canvasHeight &&
        now - danmaku.timestamp <= 5000;
    }
    if (!isVisible) continue;

    // 样式缓存判断
    const font = `${danmaku.fontSize}px Arial`;
    if (font !== lastFont) {
      ctx.font = font;
      lastFont = font;
    }
    if (danmaku.color !== lastColor) {
      ctx.fillStyle = danmaku.color;
      lastColor = danmaku.color;
    }
    if (danmaku.opacity !== lastOpacity) {
      ctx.globalAlpha = danmaku.opacity;
      lastOpacity = danmaku.opacity;
    }

    // 按顺序渲染
    ctx.fillText(danmaku.text, danmaku.x, danmaku.y);
  }

  // 更新弹幕位置 + 回收过期
  updateDanmakuPositions();

  const drawEnd = performance.now();
  const drawTime = drawEnd - drawStart;

  // -------- FPS & 性能统计（保留原逻辑）
  totalDrawTime += drawTime;
  drawSamples++;
  if (drawTime > maxDrawTime) maxDrawTime = drawTime;

  frameCount++;
  if (now - lastFpsUpdate >= 1000) {
    fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
    frameCount = 0;
    lastFpsUpdate = now;

    postMessage({
      type: 'RENDER_STATS',
      payload: {
        fps,
        avgDrawTime:
          drawSamples > 0 ? (totalDrawTime / drawSamples).toFixed(2) : '0.00',
        maxDrawTime: maxDrawTime.toFixed(2),
        danmakuCount: danmakus.length,
        timestamp: Date.now(),
      },
    });

    totalDrawTime = 0;
    drawSamples = 0;
    maxDrawTime = 0;
  }
}

function animate() {
  draw();

  // 动态限流
  // 每帧检查待处理队列，避免积压
  if (pendingDanmakus.length > 0 && danmakus.length < MAX_ACTIVE_DANMAKUS) {
    const availableSlots = MAX_ACTIVE_DANMAKUS - danmakus.length;
    const toProcess = pendingDanmakus.splice(0, Math.min(availableSlots, 10)); // 每帧最多处理10条，避免阻塞
    _processDanmakus(toProcess);
  }

  animationId = requestAnimationFrame(animate);
}

// ---------------------------------对象池模式-------------------------------
// 弹幕对象池
class DanmakuPool {
  private pool: DanmakuItem[] = []; //存储可重用对象的数组
  private MAX_SIZE = 2000; // 最大容量（根据屏幕能容纳的弹幕数设置，通常200-300足够）
  // 获取对象
  acquire(): DanmakuItem {
    if (this.pool.length > 0) {
      return this.pool.pop()!; // 从池中取出一个对象 O(1)操作
    }
    // 如果池为空，创建新对象
    // 创建新对象
    return {
      id: '',
      text: '',
      x: 0,
      y: 0,
      speed: 0,
      color: '#ffffff',
      fontSize: 16,
      opacity: 1,
      width: 0,
      timestamp: 0,
      type: 'scroll',
      lane: undefined,
    };
  }

  release(danmaku: DanmakuItem) {
    // 超过最大容量时直接丢弃，避免内存溢出
    if (this.pool.length >= this.MAX_SIZE) return;
    // 重置对象属性
    danmaku.id = '';
    danmaku.text = '';
    danmaku.x = 0;
    danmaku.y = 0;
    danmaku.speed = 0;
    danmaku.color = '#ffffff';
    danmaku.fontSize = 16;
    danmaku.opacity = 1;
    danmaku.width = 0;
    danmaku.timestamp = 0;
    danmaku.type = 'scroll';
    danmaku.lane = undefined;

    // 放回池中
    this.pool.push(danmaku); // O(1)放回对象
  }
}
const danmakuPool = new DanmakuPool();
// let danmakus: DanmakuItem[] = []; // 存储弹幕列表
const pendingDanmakus: any[] = []; // 待处理弹幕队列（暂存超出容量的弹幕）
const MAX_ACTIVE_DANMAKUS = 300; // 最大活跃弹幕数（根据屏幕大小调整）

function processBatchDanmakus(danmakuList: any[]) {
  if (!ctx || !offscreenCanvas) return;

  // 1. 过滤过期弹幕(30秒前的弹幕直接丢弃,用户无感知)
  const now = Date.now();
  const validDanmakus = danmakuList.filter(
    (item) => now - item.timestamp < 30 * 1000,
  );
  if (validDanmakus.length === 0) return;

  // 立即处理所有有效弹幕，而不是分批处理
  _processDanmakus(validDanmakus);
}
function _processDanmakus(danmakuList) {
  const now = Date.now();
  const canvasWidth = offscreenCanvas!.width / dpr;
  const canvasHeight = offscreenCanvas!.height / dpr;

  // 跟踪当前字体设置，避免重复设置相同字体
  let currentFont = '';

  // 按原始顺序逐个处理弹幕，而不是按字体大小分组
  for (const item of danmakuList) {
    // 只有当字体变化时才重新设置
    const font = `${item.fontSize}px Arial`;
    if (font !== currentFont) {
      ctx!.font = font;
      currentFont = font;
    }

    // 计算弹幕宽度
    item.width = ctx!.measureText(item.text).width;

    // 从对象池获取弹幕对象
    const danmaku = danmakuPool.acquire();
    Object.assign(danmaku, item);

    // 分配轨道和位置
    if (danmaku.type === 'scroll') {
      danmaku.lane = findAvailableLane(danmaku.width, danmaku.speed);
      // 优化：滚动弹幕Y坐标垂直居中（避免贴轨道上下边缘）
      danmaku.y =
        (danmaku.lane || 0) * laneHeight +
        laneHeight / 2 +
        danmaku.fontSize / 2;

      // 设置x坐标 - 让弹幕紧密排列
      const releaseTime = laneReleaseTimes[danmaku.lane];

      // 如果轨道已经可用，从屏幕右侧紧贴进入
      if (releaseTime <= now) {
        danmaku.x = canvasWidth;
      } else {
        // 如果轨道还未准备好，计算应该在什么位置开始
        // 确保与前一个弹幕保持HORIZONTAL_GAP的距离
        const timeDiff = (releaseTime - now) / 1000; // 转换为秒
        // 弹幕应该在的位置 = 屏幕宽度 + 该弹幕在这段时间内移动的距离
        danmaku.x = canvasWidth + danmaku.speed * timeDiff;
      }
    }

    // 顶部弹幕：按时间戳分3层，每层间距=字体大小+垂直间距
    else if (danmaku.type === 'top') {
      const layer = Math.floor(danmaku.timestamp % 3); // 0/1/2层（循环复用）
      danmaku.y = layer * (danmaku.fontSize + VERTICAL_GAP) + VERTICAL_GAP; // 避免贴顶
      // 顶部弹幕从屏幕中间开始
      danmaku.x = (canvasWidth - danmaku.width) / 2;
    }
    // 底部弹幕：按时间戳分3层，从下往上排列
    else if (danmaku.type === 'bottom') {
      const layer = Math.floor(danmaku.timestamp % 3);
      const bottomOffset =
        layer * (danmaku.fontSize + VERTICAL_GAP) + VERTICAL_GAP; // 避免贴底
      danmaku.y = canvasHeight - bottomOffset - danmaku.fontSize / 2; // 垂直居中
      // 底部弹幕从屏幕中间开始
      danmaku.x = (canvasWidth - danmaku.width) / 2;
    }

    danmakus.push(danmaku);
  }
}

// 修改清理逻辑，使用对象池
function updateDanmakuPositions() {
  const now = Date.now();

  //优化
  const activeDanmakus: DanmakuItem[] = []; // 存储活跃弹幕
  const recycledDanmakus: DanmakuItem[] = []; // 存储待回收弹幕

  for (const danmaku of danmakus) {
    // 1. 更新滚动弹幕位置（原逻辑保留）
    if (danmaku.type === 'scroll') {
      danmaku.x -= danmaku.speed * 0.016; // 基于60fps计算
    }
    // 2. 判断是否需要回收
    const shouldRecycle =
      (danmaku.type === 'scroll' && danmaku.x + danmaku.width < 0) ||
      ((danmaku.type === 'top' || danmaku.type === 'bottom') &&
        now - danmaku.timestamp > 5000);
    if (shouldRecycle) {
      recycledDanmakus.push(danmaku);
      // -----改轨道
      if (danmaku.type === 'scroll') {
        recycleLane(danmaku.lane);
      }
    } else {
      activeDanmakus.push(danmaku);
    }
  }
  // 3. 批量回收到对象池（避免逐条回收）
  recycledDanmakus.forEach((danmaku) => danmakuPool.release(danmaku));
  // 4. 替换原数组（直接赋值，无元素移动）
  danmakus = activeDanmakus;
}
