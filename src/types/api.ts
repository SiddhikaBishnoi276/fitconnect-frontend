/**
 * FitConnect — API Response Types
 *
 * All API responses follow this standard envelope format.
 */

// ─── Standard API Envelope ────────────────────────────────────────────────────
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: ApiMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
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

// ─── Entities ─────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  age: number;
  weight_kg?: string; // Numeric string from Postgres
  height_cm?: string; // Numeric string from Postgres
  gender?: 'male' | 'female' | 'other';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Injury {
  id: string;
  name: string;
  description?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Sport {
  id: number;
  slug: string;
  name: string;
  category: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  target_muscle_group: string;
  video_url?: string;
}

export interface PlanDay {
  day_number: number;
  exercises: Exercise[];
  rest_day: boolean;
}

export interface Session {
  id: string;
  plan_id: string;
  completed_at?: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DietDay {
  date: string;
  total_calories: number;
  meals: Meal[];
}

export interface ProgressSummary {
  total_workouts: number;
  current_streak: number;
  total_volume_kg: number;
}

export interface PersonalRecord {
  exercise_id: string;
  value: string; // Numeric string
  previous_best?: string; // Numeric string
  date: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ─── Auth Responses ───────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

// ─── Paginated list helper ────────────────────────────────────────────────────
export type PaginatedResponse<T> = ApiSuccessResponse<T[]>;
