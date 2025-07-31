export interface BackendRoute {
  icon: string; // 图标组件的路径
  label: string; // 菜单名称
  key: string; // 唯一标识符 && path
  hidden?: boolean; // 是否隐藏
  permissions?: string[]; // 需要的权限
  children?: BackendRoute[];
}

export interface FrontendRoute {
  path: string;
  element: React.ReactNode;
  children?: FrontendRoute[];
}

export interface MenuItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  children?: MenuItem[];
}
