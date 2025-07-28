import type { AxiosRequestConfig } from 'axios';

// types/api.ts
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface RequestConfig extends AxiosRequestConfig {
  hideLoading?: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  [key: string]: any;
}

export interface PaginationResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
