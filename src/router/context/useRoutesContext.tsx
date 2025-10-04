// useRoutesContext.tsx
import { createContext, useContext } from 'react';
import type { MenuItem } from '@/types/routes';

interface RoutesContextType {
  dynamicRoutes: any[];
  menus: MenuItem[];
  loading: boolean;
  refreshRoutes: () => Promise<void>;
}

export const RoutesContext = createContext<RoutesContextType | undefined>(
  undefined,
);

export const useRoutesContext = () => {
  const context = useContext(RoutesContext);
  if (!context)
    throw new Error('useRoutesContext must be used within a RoutesProvider');
  return context;
};
