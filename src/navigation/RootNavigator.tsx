/**
 * FitConnect — Root Navigator
 *
 * The gate between Auth flow and Main app.
 * Reads `isAuthenticated` from Redux store to decide
 * which stack to show.
 *
 * This is the single source of truth for navigation state.
 */

import { NavigationContainer } from '@react-navigation/native';
/**
 * FitConnect — Root Navigator
 *
 * The gate between Auth flow and Main app.
 * Reads `isAuthenticated` from Redux store to decide
 * which stack to show.
 *
 * This is the single source of truth for navigation state.
 */

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { Routes } from '@constants/routes';
import { navigationRef } from '@navigation/navigationRef';
import MealDetailScreen from '@screens/Diet/MealDetailScreen';
import TodaysNutritionScreen from '@screens/Diet/TodaysNutritionScreen';
import PreWorkoutModal from '@screens/modals/PreWorkoutModal';
import NotificationsScreen from '@screens/notifications/NotificationsScreen';
import PlanDayDetailScreen from '@screens/Plan/PlanDayDetailScreen';
import SettingsScreen from '@screens/Profile/SettingsScreen';
import LiveWorkoutTracker from '@screens/workouts/LiveWorkoutTracker';
import SessionCompleteScreen from '@screens/workouts/SessionCompleteScreen';
import { useAppSelector } from '@store/hooks';

import type { RootStackParamList } from '@t/navigation';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = (): React.JSX.Element => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name={Routes.Root.MAIN} component={MainNavigator} />
            <Stack.Screen name={Routes.Root.PLAN_DAY_DETAIL} component={PlanDayDetailScreen} />
            <Stack.Screen name={Routes.Root.TODAYS_NUTRITION} component={TodaysNutritionScreen} />
            <Stack.Screen name={Routes.Root.MEAL_DETAIL} component={MealDetailScreen} />
            <Stack.Screen name={Routes.Root.SETTINGS} component={SettingsScreen} />
            <Stack.Screen name={Routes.Root.NOTIFICATIONS} component={NotificationsScreen} />
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
              <Stack.Screen name={Routes.Modals.PRE_WORKOUT_MODAL} component={PreWorkoutModal} />
              <Stack.Screen name={Routes.Modals.LIVE_WORKOUT_TRACKER} component={LiveWorkoutTracker} />
              <Stack.Screen name={Routes.Modals.SESSION_COMPLETE} component={SessionCompleteScreen} />
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
