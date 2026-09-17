/**
 * FitConnect — Auth Navigator
 *
 * Handles: Onboarding → Login → Register → OTP verification
 * Shown when the user is NOT authenticated.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingProvider } from '../context/OnboardingContext';

import { Routes } from '@constants/routes';
import LoginScreen from '@screens/Auth/LoginScreen';
import RegisterScreen from '@screens/Auth/RegisterScreen';
import OnboardingScreen from '@screens/Auth/OnboardingScreen';
import WelcomeScreen from '@screens/Auth/WelcomeScreen';
import SportSelectionScreen from '@screens/Auth/SportSelectionScreen';
import InjuryInputScreen from '@screens/Auth/InjuryInputScreen';

import type { AuthStackParamList } from '@t/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = (): React.JSX.Element => {
  return (
    <OnboardingProvider>
      <Stack.Navigator
      initialRouteName={Routes.Auth.WELCOME}
      screenOptions={{
        headerShown: false,         // Custom headers in each screen
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name={Routes.Auth.WELCOME} component={WelcomeScreen} />
      <Stack.Screen name={Routes.Auth.ONBOARDING} component={OnboardingScreen} />
      <Stack.Screen name={Routes.Auth.LOGIN} component={LoginScreen} />
      <Stack.Screen name={Routes.Auth.REGISTER} component={RegisterScreen} />
      <Stack.Screen name={Routes.Auth.SPORT_SELECTION} component={SportSelectionScreen} />
      <Stack.Screen name={Routes.Auth.INJURY_INPUT} component={InjuryInputScreen} />
    </Stack.Navigator>
    </OnboardingProvider>
  );
};

export default AuthNavigator;
