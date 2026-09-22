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

// --- Plan Types ---
export interface PlanExercise {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: string;
  notes: string;
  is_injury_substituted: boolean;
}

export interface PlanDay {
  plan_day_id: string;
  day_index: number;
  day_label: string;
  title: string;
  type: string; // 'workout' | 'active_recovery' | 'rest'
  estimated_duration_min: number;
  intensity: string;
  is_rest_day: boolean;
  exercises: PlanExercise[];
  is_completed?: boolean;
}

export interface Plan {
  plan_id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  days: PlanDay[];
}

// --- Session Types ---
export interface Session {
  id: string;
  plan_id: string;
  completed_at?: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
}

export interface SessionCompleteResponse {
  duration_min: number;
  exercises_completed: number;
  adapted_count: number;
  skipped_count: number;
  fully_completed: boolean;
  rp_awarded: number;
  new_current_streak: number;
  streak_milestone_hit: number;
  new_prs: any[];
}

// --- Home Dashboard Types ---
export interface HomeHeader {
  greeting: string;
  user_name: string;
  display_greeting: string;
  avatar_url: string;
  streak_days: number;
  streak_text: string;
  unread_notifications_count: number;
}

export interface HomeTodaySession {
  has_plan: boolean;
  plan_id?: string;
  title?: string;
  day_index?: number;
  day_label?: string;
  estimated_duration_min?: number;
  intensity?: string;
  action_button?: string;
  action_endpoint?: string;
  today_workout?: {
    title: string;
    total_exercises: number;
    target_muscles: string[];
  };
}

export interface HomeTodayNutrition {
  has_plan: boolean;
  data?: {
    calories_target?: number;
    calories_consumed?: number;
    protein_g?: number;
    carbs_g?: number;
    fats_g?: number;
  };
  action_button?: string;
  action_endpoint?: string;
}

export interface HomeStat {
  value: number | string;
  display: string;
  label: string;
  icon: string;
}

export interface HomeStats {
  streak: HomeStat;
  tier: HomeStat;
  total_rp: HomeStat;
}

export interface HomeNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export interface HomeDashboardResponse {
  header: HomeHeader;
  today_session: HomeTodaySession;
  today_nutrition: HomeTodayNutrition;
  stats: HomeStats;
  notifications: HomeNotification[];
}


// --- Other Types ---
export interface Meal {
  id: string;
  name: string;
  slot?: string;
  cuisine?: string;
  prep_simplicity?: 'easy' | 'medium' | 'hard';
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DietDay {
  date?: string;
  has_plan?: boolean;
  data?: {
    total_calories?: number;
    target_calories?: number;
    target_protein_g?: number;
    target_carbs_g?: number;
    target_fat_g?: number;
  };
  insight_text?: string;
  hydration?: {
    target_liters: number;
    label: string;
    tip: string;
  };
  meals?: Meal[];
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
