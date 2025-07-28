import { createBrowserRouter, Navigate } from 'react-router-dom';

import { frontRoutes } from './frontRoutes';

import FrontLayout from '@/layouts/frontLayout';
import { adminRoutes } from './adminRoutes';
import NoFound from '@/pages/[...all]';
import { Suspense } from 'react';
console.log(frontRoutes);
// export default function useRouter() {
//   //   const adminRoutes = useAdminRoutes();

//   return createBrowserRouter([
//     // 根路径重定向
//     {
//       path: '/',
//       element: <NoFound></NoFound>,
//     },
//     // 前台路由（自动生成）
//     ...frontRoutes,
//     // 后台路由（动态生成）
//     // ...adminRoutes.map((route) => ({
//     //   ...route,
//     //   element: (
//     //     <RouteGuard requiredRole="admin">
//     //       <Suspense fallback={<div>加载中...</div>}>{route.element}</Suspense>
//     //     </RouteGuard>
//     //   ),
//     // })),
//     // 404页面
//     {
//       path: '*',
//       element: <NoFound></NoFound>,
//     },
//   ]);
// }

export const router = [
  {
    path: '/',
    element: <NoFound></NoFound>,
  },
  // 前台路由（自动生成）
  ...frontRoutes,
  // 后台路由（动态生成）
  // ...adminRoutes.map((route) => ({
  //   ...route,
  //   element: (
  //     <RouteGuard requiredRole="admin">
  //       <Suspense fallback={<div>加载中...</div>}>{route.element}</Suspense>
  //     </RouteGuard>
  //   ),
  // })),
  ...adminRoutes,
];
// export const router = createBrowserRouter([
//   {
//     path: '/',
//     element: <FrontLayout />,
//     children: frontRoutes, // 前台自动路由
//   },
//   adminRoutes, // 后台手动路由
//   {
//     path: '*',
//     element: <div>404 Not Found</div>,
//   },
// ]);
