/**
 * FitConnect — Navigation Reference
 *
 * Allows imperative navigation from OUTSIDE React components
 * (e.g., from API interceptors, Redux actions, or services).
 *
 * Usage:
 *   import { navigationRef, navigate } from '@navigation/navigationRef';
 *   navigate(Routes.Auth.LOGIN);
 */

import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from '@t/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Navigate imperatively from anywhere in the app */
export const navigate = (
  name: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList],
): void => {
  if (navigationRef.isReady()) {
    // @ts-ignore — params typing is complex for dynamic keys
    navigationRef.navigate(name, params);
  }
};

/** Go back imperatively */
export const goBack = (): void => {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
};

/** Reset stack imperatively (e.g., after logout) */
export const resetToAuth = (): void => {
  if (navigationRef.isReady()) {
    try {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch {
      // Ignored: RootNavigator flips automatically based on Redux isAuthenticated state
    }
  }
};
