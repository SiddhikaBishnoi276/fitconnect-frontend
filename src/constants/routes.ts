/**
 * FitConnect — Screen Route Name Constants
 *
 * Use these constants everywhere instead of raw strings.
 * This prevents typo bugs and gives you autocomplete.
 *
 * Usage:
 *   navigation.navigate(Routes.Auth.LOGIN);
 */

export const Routes = {
  // ─── Auth Stack ─────────────────────────────────────────────
  Auth: {
    WELCOME: 'Welcome' as const,
    ONBOARDING: 'Onboarding' as const,
    LOGIN: 'Login' as const,
    REGISTER: 'Register' as const,
    FORGOT_PASSWORD: 'ForgotPassword' as const,
    OTP_VERIFICATION: 'OtpVerification' as const,
    BASIC_INFO: 'BasicInfo' as const,
    SPORT_SELECTION: 'SportSelection' as const,
    INJURY_INPUT: 'InjuryInput' as const,
    EQUIPMENT_TIME: 'EquipmentTime' as const,
    GOAL_DIET: 'GoalDiet' as const,
    ACTIVITY_LEVEL: 'ActivityLevel' as const,
  },

  // ─── Main Tabs ───────────────────────────────────────────────
  Main: {
    HOME: 'Home' as const,
    EXPLORE: 'Explore' as const,
    TRAINERS: 'Trainers' as const,
    SESSIONS: 'Sessions' as const,
    PLAN: 'Plan' as const,
    PROFILE: 'Profile' as const,
    SOCIAL: 'Social' as const,
  },

  // ─── Modals / Full-Screen Overlays ───────────────────────────
  Modals: {
    PRE_WORKOUT_MODAL: 'PreWorkoutModal' as const,
    LIVE_WORKOUT_TRACKER: 'LiveWorkoutTracker' as const,
    SESSION_COMPLETE: 'SessionComplete' as const,
    CREATE_POST: 'CreatePost' as const,
  },

  // ─── Root ────────────────────────────────────────────────────
  Root: {
    AUTH: 'Auth' as const,
    MAIN: 'Main' as const,
    PLAN_DAY_DETAIL: 'PlanDayDetail' as const,
    TODAYS_NUTRITION: 'TodaysNutrition' as const,
    MEAL_DETAIL: 'MealDetail' as const,
    SETTINGS: 'Settings' as const,
    NOTIFICATIONS: 'Notifications' as const,
    ADD_ATHLETES: 'AddAthletes' as const,
    OTHER_USER_PROFILE: 'OtherUserProfile' as const,
  },
} as const;
