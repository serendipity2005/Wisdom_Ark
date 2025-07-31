import { lazy } from 'react';
import { useRoutesContext } from './context/useRoutesContext';
import NoAccess from '@/layouts/adminLayout/NoAccess';
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

  //   // 在动态路由加载时显示加载状态而不是 NoAccess
  //   if (loading) {
  //     return {
  //       path: '/admin',
  //       element: (
  //         <Suspense fallback={<Spin />}>
  //           <div
  //             style={{
  //               display: 'flex',
  //               justifyContent: 'center',
  //               alignItems: 'center',
  //               height: '100vh',
  //             }}
  //           >
  //             <Spin size="large" />
  //           </div>
  //         </Suspense>
  //       ),
  //       children: [],
  //     };
  //   }

  return {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      ...staticAdminRoutes,
      ...(dynamicRoutes || []), // 注入动态路由
      {
        path: '*',
        element: <NoAccess />,
      },
    ],
  };
};
