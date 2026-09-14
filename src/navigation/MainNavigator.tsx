/**
 * FitConnect — Main Tab Navigator
 *
 * Bottom tab navigation for authenticated users.
 * Add new tabs here as the app grows.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Routes } from '@constants/routes';
import HomeScreen from '@screens/home/HomeScreen';
import { Colors, Layout } from '@theme/index';

import type { MainTabParamList } from '@t/navigation';

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
        // TODO: Add icons here when react-native-vector-icons is linked
        tabBarIcon: () => null,
      })}
    >
      <Tab.Screen
        name={Routes.Main.HOME}
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      {/* Add more tabs here as screens are built */}
    </Tab.Navigator>
  );
};

export default MainNavigator;
