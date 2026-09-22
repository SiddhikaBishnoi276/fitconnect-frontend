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
  // ─── Home Dashboard ──────────────────────────────────────────
  home: {
    get: '/home',
  },

  // ─── Auth ────────────────────────────────────────────────────
  auth: {
    signup: '/auth/signup',
    login: '/auth/login',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh-token',
    me: '/auth/me',
  },

  // ─── Sports ──────────────────────────────────────────────────
  sports: {
    list: '/sports',
  },

  // ─── Exercises ───────────────────────────────────────────────
  exercises: {
    list: '/exercises',
    detail: (id: string) => `/exercises/${id}`,
  },

  // ─── Profile ─────────────────────────────────────────────────
  profile: {
    me: '/profile/me',
    injuries: '/profile/injuries',
    preferences: '/profile/preferences',
    records: '/profile/records',
  },
  // ─── Profile-Social
  social: {
    followers: '/social/follow/followers',
    following: '/social/follow/following',
    posts: '/social/feed/posts',
    deletePost: (id: string) => `/social/feed/posts/${id}`,
  },
  // ─── Profile-Media
  media: {
    uploadUrl: '/media/upload-url',
  },



  // ─── Progress ────────────────────────────────────────────────
  progress: {
    me: '/progress/me',
    prs: '/progress/prs',
  },

  // ─── Diet ────────────────────────────────────────────────────
  diet: {
    generate: '/diet/generate',
    today: '/diet/today',
    history: '/diet/history',
    meal: (id: string) => `/diet/meals/${id}`,
  },

  // ─── Plans ───────────────────────────────────────────────────
  plans: {
    generate: '/plans/generate',
    regenerate: '/plans/regenerate',
    current: '/plans/current',
    day: (i: number | string) => `/plans/current/days/${i}`,
  },

  // ─── Sessions ────────────────────────────────────────────────
  sessions: {
    create: '/sessions',
    active: '/sessions/active',
    detail: (id: string) => `/sessions/${id}`,
    feedback: (id: string, exId: string) => `/sessions/${id}/exercises/${exId}/feedback`,
    complete: (id: string) => `/sessions/${id}/complete`,
    cancel: (id: string) => `/sessions/${id}/cancel`,
  },

  // ─── Ranking ─────────────────────────────────────────────────
  ranking: {
    leaderboard: (scope: string) => `/ranking/leaderboard?scope=${scope}`,
  },

  // ─── Notifications ───────────────────────────────────────────
  notifications: {
    list: '/notifications',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    deviceToken: '/notifications/device-tokens',
  },

} as const;
