// src/router/context/routesContext.tsx
import { useEffect, useState } from 'react';
import { getMenu } from '@/api/test';
import { transformRoutes } from '@/utils/routeUtils';
import { generateMenus } from '@/utils/routeUtils';
import { RoutesContext } from './useRoutesContext'; // 引入拆分出去的 Context
import type { MenuItem } from '@/types/routes';

export const RoutesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dynamicRoutes, setDynamicRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState<MenuItem[]>([]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const { data } = await getMenu();
      setDynamicRoutes(transformRoutes(data));
      setMenus(generateMenus(data));
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
