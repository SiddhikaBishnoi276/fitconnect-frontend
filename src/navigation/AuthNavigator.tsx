/**
 * FitConnect — Auth Navigator
 *
 * Handles: Onboarding → Login → Register → OTP verification
 * Shown when the user is NOT authenticated.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Routes } from '@constants/routes';
import LoginScreen from '@screens/auth/LoginScreen';
import RegisterScreen from '@screens/auth/RegisterScreen';
import OnboardingScreen from '@screens/auth/OnboardingScreen';

import type { AuthStackParamList } from '@t/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = (): React.JSX.Element => {
  return (
    <Stack.Navigator
      initialRouteName={Routes.Auth.ONBOARDING}
      screenOptions={{
        headerShown: false,         // Custom headers in each screen
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name={Routes.Auth.ONBOARDING} component={OnboardingScreen} />
      <Stack.Screen name={Routes.Auth.LOGIN} component={LoginScreen} />
      <Stack.Screen name={Routes.Auth.REGISTER} component={RegisterScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
