/**
 * FitConnect — Error Interceptor
 *
 * Normalizes all API errors into a consistent shape
 * before they reach any service or component.
 */

import type { AxiosInstance, AxiosError } from 'axios';

import type { ApiError } from '@t/api';

export class ApiException extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const attachErrorInterceptor = (axiosInstance: AxiosInstance): void => {
  axiosInstance.interceptors.response.use(
    response => response,
    (error: AxiosError<ApiError>) => {
      if (error.response) {
        const { data, status } = error.response;
        const message = data?.message ?? 'Something went wrong. Please try again.';
        const errors = data?.errors;
        return Promise.reject(new ApiException(message, status, errors));
      }

      if (error.request) {
        // Request made but no response → network error
        return Promise.reject(
          new ApiException('Network error. Check your connection.', 0),
        );
      }

      return Promise.reject(new ApiException(error.message ?? 'Unknown error', -1));
    },
  );
};
