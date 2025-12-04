import { Navigate } from 'react-router-dom';
import { useAdminRoutes } from './adminRoutes';
import { frontRoutes } from './frontRoutes';
import NoFound from '@/pages/[...all]';

// 静态路由配置
export const staticRouter = [...frontRoutes];

// 动态路由版本
export const useAppRouter = () => {
  const adminRoute = useAdminRoutes();
  return [
    ...staticRouter,
    ...adminRoute,
    {
      path: '/',
      element: <Navigate to="/synthesis" replace />,
    },
    { path: '*', element: <NoFound /> },
  ];
};
