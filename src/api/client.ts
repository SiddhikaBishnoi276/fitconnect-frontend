/**
 * FitConnect — Axios Client
 *
 * The single Axios instance used everywhere.
 * Base URL comes from .env via react-native-config.
 *
 * DO NOT create other Axios instances — always import this.
 */

import axios from 'axios';

import { AppConfig } from '@constants/config';
import { attachAuthInterceptor } from './interceptors/authInterceptor';
import { attachErrorInterceptor } from './interceptors/errorInterceptor';

const apiClient = axios.create({
  baseURL: AppConfig.API_BASE_URL,
  timeout: AppConfig.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach interceptors (order matters: error must be after auth)
attachAuthInterceptor(apiClient);
attachErrorInterceptor(apiClient);

export default apiClient;
