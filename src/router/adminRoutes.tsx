import { lazy } from 'react';
import { useRoutesContext } from './context/useRoutesContext';
import NoAccess from '@/layouts/adminLayout/NoAccess';
import NoFound from '@/pages/[...all]';
// import Dashboard from '@/pages/admin/dashboard';
// import { Spin } from 'antd'; // 或使用其他加载组件

const AdminLayout = lazy(() => import('@/layouts/adminLayout'));
const Home = lazy(() => import('@/pages/admin/home'));

// 静态基础路由
const staticAdminRoutes = [
  {
    index: true,
    element: <Home />,
  },
];

// 获取完整管理路由（包含静态+动态）
export const useAdminRoutes = () => {
  const { dynamicRoutes } = useRoutesContext();

  return {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      ...staticAdminRoutes,
      ...(dynamicRoutes || []), // 注入动态路由
      {
        path: '*',
        element: <NoFound />,
      },
    ],
  };
};
