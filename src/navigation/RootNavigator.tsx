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

import type { RootStackParamList } from '@t/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = (): React.JSX.Element => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
