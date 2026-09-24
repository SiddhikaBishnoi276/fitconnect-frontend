/**
 * FitConnect — App Configuration Constants
 *
 * Read from .env via react-native-config for environment-specific values.
 */

import Config from 'react-native-config';

export const AppConfig = {
  // ─── API ──────────────────────────────────────────────────────
  API_BASE_URL: Config.API_BASE_URL || 'https://fitconnect-backend-8vjt.onrender.com/api/v1',
  API_TIMEOUT: 60_000, // 60 seconds (giving Render free tier time to wake up)

  // ─── App ──────────────────────────────────────────────────────
  APP_ENV: (Config.APP_ENV ?? 'production') as 'development' | 'staging' | 'production',
  IS_DEV: Config.APP_ENV === 'development',
  IS_PROD: Config.APP_ENV === 'production',
  DEBUG: Config.APP_DEBUG === 'true',

  // ─── Auth ─────────────────────────────────────────────────────
  ACCESS_TOKEN_EXPIRY: Number(Config.ACCESS_TOKEN_EXPIRY ?? 900),
  REFRESH_TOKEN_EXPIRY: Number(Config.REFRESH_TOKEN_EXPIRY ?? 604_800),

  // ─── Pagination ───────────────────────────────────────────────
  DEFAULT_PAGE_SIZE: 20,

  // ─── Storage Keys ─────────────────────────────────────────────
  STORAGE_KEYS: {
    ACCESS_TOKEN: '@fitconnect/access_token',
    REFRESH_TOKEN: '@fitconnect/refresh_token',
    USER_PROFILE: '@fitconnect/user_profile',
    ONBOARDING_SEEN: '@fitconnect/onboarding_seen',
  },
} as const;
