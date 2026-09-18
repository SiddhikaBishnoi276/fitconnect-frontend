/**
 * FitConnect — Auth Interceptor
 *
 * Responsibilities:
 * 1. Attach JWT access token to every request
 * 2. On 401 → try to refresh the token
 * 3. On refresh failure → logout user and redirect to Login
 */

import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

import { Endpoints } from '@api/endpoints';
import { resetToAuth } from '@navigation/navigationRef';
import { store } from '@store/index';
import { logout, updateTokens } from '@store/slices/authSlice';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null): void => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

export const attachAuthInterceptor = (axiosInstance: AxiosInstance): void => {
  // ─── Request: Attach access token ──────────────────────────
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const { tokens } = store.getState().auth;
      if (tokens?.accessToken && config.headers) {
        if (typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
        }
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
      return config;
    },
    error => Promise.reject(error),
  );

  // ─── Response: Handle 401 with token refresh ────────────────
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      const { tokens } = store.getState().auth;
      if (!tokens?.refreshToken) {
        store.dispatch(logout());
        resetToAuth();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            if (typeof originalRequest.headers.set === 'function') {
              originalRequest.headers.set('Authorization', `Bearer ${token}`);
            }
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axiosInstance.post(Endpoints.auth.refreshToken, {
          refreshToken: tokens.refreshToken,
        });

        const newTokens = response.data.data;
        store.dispatch(updateTokens(newTokens));
        processQueue(null, newTokens.accessToken);

        if (originalRequest.headers) {
          if (typeof originalRequest.headers.set === 'function') {
            originalRequest.headers.set('Authorization', `Bearer ${newTokens.accessToken}`);
          }
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        resetToAuth();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );
};
