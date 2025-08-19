// src/router/context/routesContext.tsx
import { useEffect, useState } from 'react';
// import { getMenu } from '@/api/test';
import { transformRoutes } from '@/utils/routeUtils';
import { generateMenus } from '@/utils/routeUtils';
import { RoutesContext } from './useRoutesContext'; // 引入拆分出去的 Context
import type { MenuItem } from '@/types/routes';
import { useSelector } from 'react-redux';
import type { RouteState } from '@/store/modules/routeSlice';

export const RoutesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dynamicRoutes, setDynamicRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const routes = useSelector((state: RouteState) => state.route.routes);
  console.log(routes);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      //   const { data } = await getMenu();
      //   console.log(data);
      setDynamicRoutes(transformRoutes(routes));
      setMenus(generateMenus(routes));
    } catch (error) {
      console.error('Failed to fetch routes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  return (
    <RoutesContext.Provider
      value={{ dynamicRoutes, menus, loading, refreshRoutes: fetchRoutes }}
    >
      {children}
    </RoutesContext.Provider>
  );
};
