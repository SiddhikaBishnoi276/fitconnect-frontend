/**
 * FitConnect — Navigation Type Definitions
 *
 * Defines all screen parameter lists for type-safe navigation.
 * Add new screens here when you create them.
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

// ─── Auth Stack ───────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OtpVerification: { email: string };
  BasicInfo: undefined;
  SportSelection: undefined;
  InjuryInput: undefined;
};

// ─── Main Tab ────────────────────────────────────────────────────────────────
export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Trainers: undefined;
  Sessions: undefined;
  Profile: undefined;
};

// ─── Root Stack ──────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// ─── Convenience types for screen props ──────────────────────────────────────
export type AuthNavigationProp<T extends keyof AuthStackParamList> =
  NativeStackNavigationProp<AuthStackParamList, T>;

export type AuthRouteProp<T extends keyof AuthStackParamList> =
  RouteProp<AuthStackParamList, T>;

export type TabNavigationProp<T extends keyof MainTabParamList> =
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, T>,
    NativeStackNavigationProp<RootStackParamList>
  >;
