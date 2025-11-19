import React from 'react';
import { Badge, Tooltip } from 'antd';
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons';

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected';
  style?: React.CSSProperties;
}

/**
 * 🔥 连接状态指示器
 * 显示当前的在线/离线状态
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  style,
}) => {
  const isOnline = status === 'connected';

  return (
    <Tooltip
      title={
        isOnline ? (
          <div>
            <div>✅ 在线同步中</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
              所有更改会实时保存到云端
            </div>
          </div>
        ) : (
          <div>
            <div>📴 离线模式</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
              更改已保存到本地，联网后自动同步
            </div>
          </div>
        )
      }
    >
      <Badge
        status={isOnline ? 'success' : 'default'}
        text={
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isOnline ? (
              <WifiOutlined style={{ color: '#52c41a' }} />
            ) : (
              <DisconnectOutlined style={{ color: '#d9d9d9' }} />
            )}
            <span
              style={{ fontSize: 12, color: isOnline ? '#52c41a' : '#999' }}
            >
              {isOnline ? '在线' : '离线'}
            </span>
          </span>
        }
        style={style}
      />
    </Tooltip>
  );
};
