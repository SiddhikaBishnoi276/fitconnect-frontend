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
  category: string;
  sets: number;
  reps: string;
  target_rpe: number;
  notes: string;
  is_injury_substituted: boolean;
}

export interface PlanDay {
  day_id: string;
  day_index: number;
  day_label: string;
  title: string;
  type: string; // 'workout' | 'active_recovery' | 'rest'
  estimated_duration_min: number;
  intensity: string;
  is_rest_day: boolean;
  exercises_count: number;
  exercises: PlanExercise[];
  is_completed?: boolean;
}

export interface Plan {
  plan_id: string;
  user_id: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  total_days: number;
  days: PlanDay[];
}

// --- Session Types ---
export interface Session {
  id: string;
  plan_id: string;
  completed_at?: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
}

export interface SessionSummary {
  session_id: string;
  plan_id: string;
  day_index: number;
  day_label: string;
  title: string;
  status: string;
  started_at: string;
  completed_at: string;
  total_duration_sec: number;
  total_duration_display: string;
  calories_burned: number;
  total_volume_kg: number;
  prs_broken_count: number;
}

export interface ExercisePerformance {
  exercise_id: string;
  exercise_name: string;
  sets_completed: number;
  target_sets: number;
  sets_data: any[];
  user_feedback: any;
  ai_adaptation_note: string;
}

export interface GamificationRewards {
  rp_earned_today: number;
  rp_breakdown: Record<string, number>;
  new_total_rp: number;
  streak_updated: {
    previous_streak: number;
    current_streak: number;
    is_milestone: boolean;
    milestone_title?: string;
  };
}

export interface SessionCompleteResponse {
  session_summary: SessionSummary;
  exercises_performance: ExercisePerformance[];
  gamification_rewards: GamificationRewards;
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
  session_id?: string;
  title?: string;
  day_index?: number;
  day_label?: string;
  estimated_duration_min?: number;
  intensity?: string;
  status?: string; // NOT_STARTED, IN_PROGRESS, COMPLETED
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
  calories_target?: number;
  calories_consumed?: number;
  protein_g?: number;
  carbs_g?: number;
  fats_g?: number;
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
