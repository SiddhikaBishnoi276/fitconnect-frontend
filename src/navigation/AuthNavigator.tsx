/**
 * FitConnect — Auth Navigator
 *
 * Handles: Onboarding → Login → Register → OTP verification
 * Shown when the user is NOT authenticated.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';


import { Routes } from '@constants/routes';
import ActivityLevelScreen from '@screens/Auth/ActivityLevelScreen';
import BasicInfoScreen from '@screens/Auth/BasicInfoScreen';
import EquipmentTimeScreen from '@screens/Auth/EquipmentTimeScreen';
import ForgotPasswordScreen from '@screens/Auth/ForgotPasswordScreen';
import GoalDietScreen from '@screens/Auth/GoalDietScreen';
import InjuryInputScreen from '@screens/Auth/InjuryInputScreen';
import LoginScreen from '@/screens/Auth/LoginScreen';
import OnboardingScreen from '@/screens/Auth/OnboardingScreen';
import RegisterScreen from '@/screens/Auth/RegisterScreen';
import SportSelectionScreen from '@screens/Auth/SportSelectionScreen';
import WelcomeScreen from '@screens/Auth/WelcomeScreen';
import type { AuthStackParamList } from '@t/navigation';

import { OnboardingProvider } from '../context/OnboardingContext';

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
      <Stack.Screen name={Routes.Auth.BASIC_INFO} component={BasicInfoScreen} />
      <Stack.Screen name={Routes.Auth.LOGIN} component={LoginScreen} />
      <Stack.Screen name={Routes.Auth.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
      <Stack.Screen name={Routes.Auth.REGISTER} component={RegisterScreen} />
      <Stack.Screen name={Routes.Auth.SPORT_SELECTION} component={SportSelectionScreen} />
      <Stack.Screen name={Routes.Auth.INJURY_INPUT} component={InjuryInputScreen} />
      <Stack.Screen name={Routes.Auth.EQUIPMENT_TIME} component={EquipmentTimeScreen} />
      <Stack.Screen name={Routes.Auth.GOAL_DIET} component={GoalDietScreen} />
      <Stack.Screen name={Routes.Auth.ACTIVITY_LEVEL} component={ActivityLevelScreen} />
    </Stack.Navigator>
    </OnboardingProvider>
  );
};

export default AuthNavigator;
