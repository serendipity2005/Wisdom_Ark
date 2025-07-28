// // utils/request.ts
// import axios, {
//   type AxiosInstance,
//   type AxiosRequestConfig,
//   type AxiosResponse,
//   type InternalAxiosRequestConfig,
// } from 'axios';
// import { message } from 'antd'; // 如果使用antd，没有的话可以用其他提示组件
// import type {
//   ApiResponse,
//   RequestConfig,
//   PaginationParams,
//   PaginationResponse,
// } from '@/types/api';

// // Loading状态监听器类型
// type LoadingListener = (isLoading: boolean) => void;

// // 创建Loading管理器
// class LoadingManager {
//   private loadingCount: number = 0;
//   private loadingCallbacks: Set<LoadingListener> = new Set();

//   // 添加Loading状态监听器
//   addListener(callback: LoadingListener): void {
//     this.loadingCallbacks.add(callback);
//     // 立即调用一次，同步当前状态
//     callback(this.loadingCount > 0);
//   }

//   // 移除Loading状态监听器
//   removeListener(callback: LoadingListener): void {
//     this.loadingCallbacks.delete(callback);
//   }

//   // 开始Loading
//   startLoading(): void {
//     this.loadingCount++;
//     this.notifyListeners(true);
//   }

//   // 结束Loading
//   endLoading(): void {
//     this.loadingCount = Math.max(0, this.loadingCount - 1);
//     this.notifyListeners(this.loadingCount > 0);
//   }

//   // 通知所有监听器
//   private notifyListeners(isLoading: boolean): void {
//     this.loadingCallbacks.forEach((callback) => callback(isLoading));
//   }

//   // 获取当前Loading状态
//   isLoading(): boolean {
//     return this.loadingCount > 0;
//   }
// }

// // 创建全局Loading管理器实例
// export const loadingManager = new LoadingManager();

// // 扩展AxiosRequestConfig类型
// interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
//   hideLoading?: boolean;
// }

// // 创建axios实例
// const request: AxiosInstance = axios.create({
//   baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // 请求拦截器
// request.interceptors.request.use(
//   (config: CustomAxiosRequestConfig) => {
//     // 检查是否需要显示loading（默认显示，可通过config.hideLoading = true关闭）
//     if (!config.hideLoading) {
//       loadingManager.startLoading();
//     }

//     // 添加token
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => {
//     loadingManager.endLoading();
//     return Promise.reject(error);
//   },
// );

// // 响应拦截器
// request.interceptors.response.use(
//   (response: AxiosResponse<ApiResponse>) => {
//     // 结束loading
//     if (!(response.config as CustomAxiosRequestConfig).hideLoading) {
//       loadingManager.endLoading();
//     }

//     // 统一处理响应数据格式
//     const { data, code, message: msg } = response.data;

//     if (code === 200 || code === 0) {
//       return data; // 直接返回业务数据
//     } else {
//       // 业务错误处理
//       message.error(msg || '请求失败');
//       return Promise.reject(new Error(msg || '请求失败'));
//     }
//   },
//   (error) => {
//     // 结束loading
//     loadingManager.endLoading();

//     // 网络错误处理
//     if (error.response) {
//       const { status, data } = error.response;

//       switch (status) {
//         case 401:
//           message.error('登录已过期，请重新登录');
//           // 清除token并跳转到登录页
//           localStorage.removeItem('token');
//           window.location.href = '/login';
//           break;
//         case 403:
//           message.error('没有权限访问');
//           break;
//         case 404:
//           message.error('请求的资源不存在');
//           break;
//         case 500:
//           message.error('服务器内部错误');
//           break;
//         default:
//           message.error(data?.message || `请求失败 ${status}`);
//       }
//     } else if (error.code === 'ECONNABORTED') {
//       message.error('请求超时，请重试');
//     } else {
//       message.error('网络错误，请检查网络连接');
//     }

//     return Promise.reject(error);
//   },
// );

// // 封装常用的请求方法
// export const api = {
//   // GET请求
//   get<T = any>(
//     url: string,
//     params?: Record<string, any>,
//     config?: RequestConfig,
//   ): Promise<T> {
//     return request.get(url, { params, ...config });
//   },

//   // POST请求
//   post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
//     return request.post(url, data, config);
//   },

//   // PUT请求
//   put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
//     return request.put(url, data, config);
//   },

//   // DELETE请求
//   delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
//     return request.delete(url, config);
//   },

//   // PATCH请求
//   patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
//     return request.patch(url, data, config);
//   },

//   // 文件上传
//   upload<T = any>(
//     url: string,
//     formData: FormData,
//     config?: RequestConfig,
//   ): Promise<T> {
//     return request.post(url, formData, {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//       ...config,
//     });
//   },

//   // 不显示loading的请求
//   getWithoutLoading<T = any>(
//     url: string,
//     params?: Record<string, any>,
//   ): Promise<T> {
//     return request.get(url, {
//       params,
//       hideLoading: true,
//     } as CustomAxiosRequestConfig);
//   },

//   postWithoutLoading<T = any>(url: string, data?: any): Promise<T> {
//     return request.post(url, data, {
//       hideLoading: true,
//     } as CustomAxiosRequestConfig);
//   },

//   putWithoutLoading<T = any>(url: string, data?: any): Promise<T> {
//     return request.put(url, data, {
//       hideLoading: true,
//     } as CustomAxiosRequestConfig);
//   },

//   deleteWithoutLoading<T = any>(url: string): Promise<T> {
//     return request.delete(url, {
//       hideLoading: true,
//     } as CustomAxiosRequestConfig);
//   },

//   // 分页请求
//   getPage<T = any>(
//     url: string,
//     params: PaginationParams = {},
//   ): Promise<PaginationResponse<T>> {
//     const { page = 1, pageSize = 10, ...otherParams } = params;
//     return request.get(url, {
//       params: { page, pageSize, ...otherParams },
//     });
//   },
// };

// // 导出类型
// export type {
//   ApiResponse,
//   RequestConfig,
//   PaginationParams,
//   PaginationResponse,
// };
// export default request;
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { message } from 'antd';
import store from '@/store';
import { type RootState } from '@/store';
import { clearToken } from '@/store/modules/testSlice';

const req: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
});
interface AuthState {
  token: string;
}
// 请求拦截器
req.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const state = store.getState() as RootState;
  const { token } = state.test as AuthState;
  if (token) {
    // Authorization 专门用来携带认证信息
    // Bearer 表示一种认证类型，表示后面携带的是一个令牌
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// 响应拦截器
req.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;
    const code = res.code || 200;
    if (code != 200) {
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message || '请求失败'));
    }
    return response.data;
  },
  (error) => {
    // 网络错误处理
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录');
          // 清除token并跳转到登录页
          localStorage.removeItem('token');
          store.dispatch(clearToken());
          break;
        case 403:
          message.error('没有权限访问');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(data?.message || `请求失败 ${status}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请重试');
    } else {
      message.error('网络错误，请检查网络连接');
    }

    return Promise.reject(error);
  },
);

interface ApiResponse {
  code: number;
  message: string;
  data: any;
}
export function get(url: string, params?: any): Promise<ApiResponse> {
  return req.get(url, { params });
}
export function post(url: string, data?: any): Promise<ApiResponse> {
  return req.post(url, data);
}
// PUT 请求
export function put(url: string, data?: any): Promise<ApiResponse> {
  return req.put(url, data);
}

// DELETE 请求（新增）
export function del(url: string, params?: any): Promise<ApiResponse> {
  return req.delete(url, { params });
}

// DELETE 请求（另一种方式，通过 data 传递参数）
export function deleteWithData(url: string, data?: any): Promise<ApiResponse> {
  return req.delete(url, { data });
}
export default req;
