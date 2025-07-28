// router/adminRoutes.tsx

import { lazy } from 'react';
// eg
const AdminLayout = lazy(() => import('@/layouts/adminLayout'));
export const adminRoutes = [
  {
    path: '/admin',
    element: <AdminLayout />,
  },
];
