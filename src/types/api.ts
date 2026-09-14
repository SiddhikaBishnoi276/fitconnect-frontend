/**
 * FitConnect — API Response Types
 *
 * All API responses follow this standard envelope format.
 */

// ─── Standard API Envelope ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: ApiMeta;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Auth Responses ───────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: import('./user').User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: import('./user').User;
  tokens: AuthTokens;
}

// ─── Paginated list helper ────────────────────────────────────────────────────
export type PaginatedResponse<T> = ApiResponse<T[]>;
