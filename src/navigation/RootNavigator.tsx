/**
 * FitConnect — Root Navigator
 *
 * The gate between Auth flow and Main app.
 * Reads `isAuthenticated` from Redux store to decide
 * which stack to show.
 *
 * This is the single source of truth for navigation state.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { navigationRef } from '@navigation/navigationRef';
import { useAppSelector } from '@store/hooks';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import PreWorkoutModal from '@screens/modals/PreWorkoutModal';
import LiveWorkoutTracker from '@screens/workouts/LiveWorkoutTracker';

import type { RootStackParamList } from '@t/navigation';
import { Routes } from '@constants/routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = (): React.JSX.Element => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name={Routes.Root.MAIN} component={MainNavigator} />
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name={Routes.Modals.PRE_WORKOUT_MODAL} component={PreWorkoutModal} />
              <Stack.Screen name={Routes.Modals.LIVE_WORKOUT_TRACKER} component={LiveWorkoutTracker} />
            </Stack.Group>
          </>
        ) : (
          <Stack.Screen name={Routes.Root.AUTH} component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
