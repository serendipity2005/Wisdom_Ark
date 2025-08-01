import Admin from '@/pages/admin';
import { useAdminRoutes } from './adminRoutes';
import { frontRoutes } from './frontRoutes';
import NoFound from '@/pages/[...all]';

import { lazy } from 'react';
console.log(frontRoutes);
const Synthesis = lazy(() => import('@/pages/index/synthesis'));
// 静态路由配置
export const staticRouter = [...frontRoutes];

// 动态路由版本
export const useAppRouter = () => {
  const adminRoute = useAdminRoutes();
  return [
    ...staticRouter,
    {
      ...adminRoute,
      //   path: '/admin',
      //   element: <Admin />,
      //   children: [...adminRoute.children],
    },
    { path: '*', element: <NoFound /> },
  ];
};
