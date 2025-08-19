import { lazy } from 'react';
import { useRoutesContext } from './context/useRoutesContext';
import NoFound from '@/pages/[...all]';

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

  return [
    {
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
    },
  ];
};
