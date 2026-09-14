/**
 * FitConnect — API Endpoints
 *
 * All backend endpoint paths in one place.
 * Never hardcode URLs in service files — always use this.
 *
 * Usage:
 *   import { Endpoints } from '@api/endpoints';
 *   apiClient.post(Endpoints.auth.login, payload);
 */

export const Endpoints = {
  // ─── Auth ────────────────────────────────────────────────────
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyOtp: '/auth/verify-otp',
    resendOtp: '/auth/resend-otp',
  },

  // ─── User ────────────────────────────────────────────────────
  user: {
    profile: '/user/profile',
    updateProfile: '/user/profile',
    uploadAvatar: '/user/avatar',
    deleteAccount: '/user/account',
  },

  // ─── Trainers ────────────────────────────────────────────────
  trainers: {
    list: '/trainers',
    detail: (id: string) => `/trainers/${id}`,
    reviews: (id: string) => `/trainers/${id}/reviews`,
  },

  // ─── Sessions ────────────────────────────────────────────────
  sessions: {
    list: '/sessions',
    detail: (id: string) => `/sessions/${id}`,
    book: '/sessions/book',
    cancel: (id: string) => `/sessions/${id}/cancel`,
    upcoming: '/sessions/upcoming',
    history: '/sessions/history',
  },

  // ─── Feed ────────────────────────────────────────────────────
  feed: {
    posts: '/feed',
    post: (id: string) => `/feed/${id}`,
    like: (id: string) => `/feed/${id}/like`,
    comments: (id: string) => `/feed/${id}/comments`,
  },
} as const;
