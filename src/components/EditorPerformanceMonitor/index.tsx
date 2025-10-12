/**
 * EditorPerformanceMonitor - 编辑器性能实时监控
 *
 * 功能：
 * 1. 实时显示 FPS（帧率）
 * 2. 显示 DOM 节点数量
 * 3. 显示虚拟化块统计
 * 4. 显示内存占用（如果支持）
 * 5. 显示滚动性能指标
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import './index.scss';

interface PerformanceStats {
  fps: number;
  domNodes: number;
  virtualizedBlocks: number;
  visibleBlocks: number;
  totalBlocks: number;
  memoryUsage: number | null;
  scrollY: number;
  renderTime: number;
}

interface EditorPerformanceMonitorProps {
  editor: Editor | null;
  visible?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const EditorPerformanceMonitor: React.FC<EditorPerformanceMonitorProps> = ({
  editor,
  visible = false,
  position = 'top-right',
}) => {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    domNodes: 0,
    virtualizedBlocks: 0,
    visibleBlocks: 0,
    totalBlocks: 0,
    memoryUsage: null,
    scrollY: 0,
    renderTime: 0,
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!visible || !editor) return;

    // FPS 计算
    const calculateFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
        return fps;
      }

      return null;
    };

    // 统计 DOM 节点
    const countDOMNodes = () => {
      if (!editor.view.dom) return 0;
      return editor.view.dom.querySelectorAll('*').length;
    };

    // 统计虚拟化块
    const countVirtualizedBlocks = () => {
      if (!editor.view.dom) return { virtualized: 0, visible: 0, total: 0 };

      const total = editor.view.dom.querySelectorAll('[data-block-id]').length;
      const virtualized = editor.view.dom.querySelectorAll(
        '[data-virtualized="true"]',
      ).length;
      const visible = total - virtualized;

      return { virtualized, visible, total };
    };

    // 获取内存占用（仅支持 Chrome）
    const getMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
      }
      return null;
    };

    // 获取滚动位置
    const getScrollY = () => {
      const container = editor.view.dom.closest('.tiptap') as HTMLElement;
      return container?.scrollTop || 0;
    };

    // 更新统计
    const updateStats = () => {
      const startTime = performance.now();

      const fps = calculateFPS();
      const domNodes = countDOMNodes();
      const { virtualized, visible, total } = countVirtualizedBlocks();
      const memoryUsage = getMemoryUsage();
      const scrollY = getScrollY();

      const renderTime = performance.now() - startTime;

      setStats({
        fps: fps ?? stats.fps,
        domNodes,
        virtualizedBlocks: virtualized,
        visibleBlocks: visible,
        totalBlocks: total,
        memoryUsage,
        scrollY,
        renderTime,
      });

      rafRef.current = requestAnimationFrame(updateStats);
    };

    rafRef.current = requestAnimationFrame(updateStats);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [visible, editor]);

  if (!visible || !editor) return null;

  const positionClass = `performance-monitor-${position}`;
  const fpsColor =
    stats.fps >= 55 ? '#52c41a' : stats.fps >= 30 ? '#faad14' : '#ff4d4f';
  const virtualizationRate =
    stats.totalBlocks > 0
      ? ((stats.virtualizedBlocks / stats.totalBlocks) * 100).toFixed(1)
      : '0';

  return (
    <div className={`performance-monitor ${positionClass}`}>
      <div className="performance-monitor-header">
        <span>⚡ 性能监控</span>
      </div>

      <div className="performance-monitor-body">
        {/* FPS */}
        <div className="stat-item">
          <span className="stat-label">FPS</span>
          <span className="stat-value" style={{ color: fpsColor }}>
            {stats.fps}
          </span>
        </div>

        {/* DOM 节点 */}
        <div className="stat-item">
          <span className="stat-label">DOM 节点</span>
          <span className="stat-value">{stats.domNodes.toLocaleString()}</span>
        </div>

        {/* 虚拟化率 */}
        <div className="stat-item">
          <span className="stat-label">虚拟化率</span>
          <span className="stat-value" style={{ color: '#1890ff' }}>
            {virtualizationRate}%
          </span>
        </div>

        {/* 可见/总块数 */}
        <div className="stat-item">
          <span className="stat-label">可见块</span>
          <span className="stat-value">
            {stats.visibleBlocks} / {stats.totalBlocks}
          </span>
        </div>

        {/* 内存占用 */}
        {stats.memoryUsage !== null && (
          <div className="stat-item">
            <span className="stat-label">内存</span>
            <span className="stat-value">{stats.memoryUsage} MB</span>
          </div>
        )}

        {/* 滚动位置 */}
        <div className="stat-item">
          <span className="stat-label">滚动位置</span>
          <span className="stat-value">{Math.round(stats.scrollY)} px</span>
        </div>

        {/* 渲染时间 */}
        <div className="stat-item">
          <span className="stat-label">渲染耗时</span>
          <span className="stat-value">{stats.renderTime.toFixed(2)} ms</span>
        </div>
      </div>

      <div className="performance-monitor-footer">
        <small>实时更新 • 按 Ctrl+Shift+P 切换显示</small>
      </div>
    </div>
  );
};

export default EditorPerformanceMonitor;
