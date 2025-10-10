// AI服务状态监控组件
import React, { useState, useEffect } from 'react';
import {
  getAIServicesStatus,
  getCurrentAIService,
  forceHealthCheck,
} from '@/utils/openAi';

// 服务状态组件
export const AIServiceStatusPanel: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [currentService, setCurrentService] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);

  // 更新服务状态
  const updateStatus = () => {
    setServices(getAIServicesStatus());
    setCurrentService(getCurrentAIService());
  };

  // 手动触发健康检查
  const handleHealthCheck = async () => {
    setIsChecking(true);
    await forceHealthCheck();
    updateStatus();
    setIsChecking(false);
  };

  // 定时更新状态
  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 5000); // 每5秒更新一次UI
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'offline':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return '✅';
      case 'offline':
        return '❌';
      default:
        return '⏳';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">AI 服务状态</h3>
        <button
          onClick={handleHealthCheck}
          disabled={isChecking}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isChecking ? '检测中...' : '刷新状态'}
        </button>
      </div>

      <div className="mb-3 p-3 bg-blue-900/30 rounded border border-blue-700">
        <div className="text-sm text-blue-300">当前使用服务</div>
        <div className="text-white font-medium mt-1">{currentService}</div>
      </div>

      <div className="space-y-2">
        {services.map((service) => (
          <div
            key={service.id}
            className={`p-3 rounded border ${
              currentService === service.name
                ? 'bg-blue-900/20 border-blue-500'
                : 'bg-gray-700 border-gray-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getStatusIcon(service.status)}</span>
                <span className="text-white font-medium">{service.name}</span>
              </div>
              <span className={`text-sm ${getStatusColor(service.status)}`}>
                {service.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div>
                <span>优先级: </span>
                <span className="text-white">{service.priority}</span>
              </div>
              {service.responseTime && (
                <div>
                  <span>响应: </span>
                  <span className="text-white">{service.responseTime}ms</span>
                </div>
              )}
              <div>
                <span>失败次数: </span>
                <span
                  className={
                    service.consecutiveFailures > 0
                      ? 'text-red-400'
                      : 'text-white'
                  }
                >
                  {service.consecutiveFailures}
                </span>
              </div>
              {service.lastCheck && (
                <div>
                  <span>最后检查: </span>
                  <span className="text-white">
                    {new Date(service.lastCheck).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 简化版状态指示器（可放在聊天界面右上角）
export const AIServiceIndicator: React.FC = () => {
  const [currentService, setCurrentService] = useState<string>('');
  const [status, setStatus] = useState<string>('checking');

  useEffect(() => {
    const updateStatus = () => {
      const services = getAIServicesStatus();
      const current = getCurrentAIService();
      setCurrentService(current);

      const currentServiceData = services.find((s) => s.name === current);
      setStatus(currentServiceData?.status || 'offline');
    };

    updateStatus();
    const interval = setInterval(updateStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const getIndicatorColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
      <div
        className={`w-2 h-2 rounded-full ${getIndicatorColor()} animate-pulse`}
      ></div>
      <span className="text-xs text-gray-300">{currentService}</span>
    </div>
  );
};

// 在聊天组件中使用的 Hook
export const useAIServiceStatus = () => {
  const [currentService, setCurrentService] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(false);

  useEffect(() => {
    const updateStatus = () => {
      const services = getAIServicesStatus();
      const current = getCurrentAIService();
      setCurrentService(current);
      setIsOnline(services.some((s) => s.status === 'online'));
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return { currentService, isOnline };
};
