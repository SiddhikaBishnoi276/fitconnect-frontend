/**
 * FitConnect — Main Tab Navigator
 *
 * Bottom tab navigation for authenticated users.
 * Add new tabs here as the app grows.
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Text } from 'react-native';

import { Routes } from '@constants/routes';
import HomeScreen from '@screens/home/HomeScreen';
import PlanScreen from '@screens/Plan/PlanScreen';
import ProfileScreen from '@screens/Profile/ProfileScreen';
import type { MainTabParamList } from '@t/navigation';
import { Colors, Layout } from '@theme/index';


const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = (): React.JSX.Element => {
  return (
    <Tab.Navigator
      initialRouteName={Routes.Main.HOME}
      screenOptions={({ route: _route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background.secondary,
          borderTopColor: Colors.border.primary,
          borderTopWidth: 1,
          height: Layout.tabBarHeight,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.brand.primary,
        tabBarInactiveTintColor: Colors.text.tertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        tabBarIcon: () => null,
      })}
    >
      <Tab.Screen
        name={Routes.Main.HOME}
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name={Routes.Main.PLAN} 
        component={PlanScreen} 
        options={{
          tabBarLabel: 'Plan',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size - 4 }}>📅</Text>
          ),
        }} 
      />
      <Tab.Screen 
        name={Routes.Main.PROFILE} 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size - 4 }}>👤</Text>
          ),
        }} 
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
