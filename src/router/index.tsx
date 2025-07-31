import Admin from '@/pages/admin';
import { useAdminRoutes } from './adminRoutes';
import { frontRoutes } from './frontRoutes';
import NoFound from '@/pages/[...all]';
import Home from '@/pages/home';
console.log(frontRoutes);

// 静态路由配置
export const staticRouter = [
  {
    path: '/',
    element: <Home />,
  },
  ...frontRoutes,
];

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
