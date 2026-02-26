import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse, LoginResponse } from '@/types/api';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const SUPPORTED_LOCALES = ['en', 'ko'] as const;
const DEFAULT_LOCALE = 'en';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request 인터셉터: accessToken 자동 첨부 ──
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response 인터셉터: 401 시 토큰 갱신 ──
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

function getCurrentLocale(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const [, firstSegment] = window.location.pathname.split('/');
  return SUPPORTED_LOCALES.includes(firstSegment as (typeof SUPPORTED_LOCALES)[number])
    ? firstSegment
    : DEFAULT_LOCALE;
}

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }
  const locale = getCurrentLocale();
  window.location.assign(`/${locale}/login`);
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetriableRequestConfig;

    // 리프레시/로그인 요청 자체가 실패한 경우 무한 루프 방지
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post<ApiResponse<LoginResponse>>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
        );

        if (data.success && data.data) {
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          processQueue(null, data.data.accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          }
          return apiClient(originalRequest);
        }
        throw new Error('Refresh failed');
      } catch (refreshError) {
        processQueue(refreshError, null);
        // 토큰 삭제 후 로그인 페이지로 이동
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // 언어별 세션 만료 알림 표시
        const locale = getCurrentLocale();
        if (locale === 'ko') {
          toast.error('세션이 만료되었습니다. 다시 로그인해 주세요.');
        } else {
          toast.error('Session expired. Please log in again.');
        }

        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export function unwrap<T>(res: { data: ApiResponse<T> }): T {
  if (!res.data.success) {
    throw new Error(res.data.message ?? 'API request failed.');
  }
  return res.data.data as T;
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.get<ApiResponse<T>>(url, config);
  return unwrap(res);
}

export async function apiPost<TResponse, TRequest = unknown>(
  url: string,
  data?: TRequest,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const res = await apiClient.post<ApiResponse<TResponse>>(url, data, config);
  return unwrap(res);
}

export async function apiPut<TResponse, TRequest = unknown>(
  url: string,
  data?: TRequest,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const res = await apiClient.put<ApiResponse<TResponse>>(url, data, config);
  return unwrap(res);
}

export async function apiPatch<TResponse, TRequest = unknown>(
  url: string,
  data?: TRequest,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const res = await apiClient.patch<ApiResponse<TResponse>>(url, data, config);
  return unwrap(res);
}

export async function apiDelete(url: string, config?: AxiosRequestConfig): Promise<void> {
  await apiClient.delete<ApiResponse>(url, config);
}

export default apiClient;
