import { lazy } from 'react';
import type { BackendRoute, FrontendRoute, MenuItem } from '@/types/routes';
import { Link } from 'react-router-dom';

import {
  UserOutlined,
  HomeOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  SolutionOutlined,
  FileAddOutlined,
  FileExclamationOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  VideoCameraOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';

// 创建图标映射对象
const iconMap = {
  UserOutlined: <UserOutlined />,
  HomeOutlined: <HomeOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  ExclamationCircleOutlined: <ExclamationCircleOutlined />,
  TeamOutlined: <TeamOutlined />,
  SolutionOutlined: <SolutionOutlined />,
  FileAddOutlined: <FileAddOutlined />,
  FileExclamationOutlined: <FileExclamationOutlined />,
  ClockCircleOutlined: <ClockCircleOutlined />,
  FileProtectOutlined: <FileProtectOutlined />,
  VideoCameraOutlined: <VideoCameraOutlined />,
  FolderOpenOutlined: <FolderOpenOutlined />,
  // 可以根据需要添加更多图标映射
};

// 动态加载组件
const lazyLoad = (componentName: string, fullPath?: string) => {
  if (fullPath == undefined || fullPath == componentName) {
    return lazy(() => import(`@/pages/admin/${componentName}/index.tsx`));
  } else {
    return lazy(() =>
      import(`@/pages/admin/${fullPath}/${componentName}/index.tsx`).catch(
        () => import('@/pages/admin/dashboard'),
      ),
    );
  }
};

// 将后端路由转换为React Router需要的结构
export const transformRoutes = (
  routes: BackendRoute[],
  fullPath?: string,
): FrontendRoute[] => {
  return routes.map((route) => {
    const routePath = `${route.key}`.replace(/\/+/g, '/');
    const Component = lazyLoad(routePath, fullPath);

    // console.log(route.key);
    const transformed: FrontendRoute = {
      path: routePath,
      element: <Component />,
    };

    if (route.children) {
      // 更新 fullPath 为当前路由的完整路径
      const newFullPath = routePath;
      transformed.children = transformRoutes(route.children, newFullPath);
    }
    return transformed;
  });
};

// 生成菜单结构
export const generateMenus = (
  routes: BackendRoute[],
  permissions: string[] = [],
  parentPath?: string,
): MenuItem[] => {
  return routes
    .filter((route) => {
      // 过滤隐藏菜单和无权限路由
      if (route.hidden) return false;
      if (
        route.permissions &&
        !route.permissions.some((p) => permissions.includes(p))
      ) {
        return false;
      }
      return true;
    })
    .map((route) => {
      // 构造完整的路径
      const fullPath = parentPath ? `${parentPath}/${route.key}` : route.key;
      return {
        key: route.key,
        label: parentPath ? (
          <Link to={fullPath}>{route.label}</Link>
        ) : (
          route.label
        ),
        icon:
          route.icon && iconMap[route.icon as keyof typeof iconMap]
            ? iconMap[route.icon as keyof typeof iconMap]
            : null,
        children: route.children
          ? generateMenus(route.children, permissions, fullPath)
          : undefined,
      };
    });
};
