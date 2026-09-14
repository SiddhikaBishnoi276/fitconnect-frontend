/**
 * FitConnect — Home Screen (Placeholder)
 *
 * Main screen after login. Replace with Figma UI.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch } from '@store/hooks';
import { logout } from '@store/slices/authSlice';
import { Colors, Spacing, TextPresets } from '@theme/index';

const HomeScreen = (): React.JSX.Element => {
  const dispatch = useAppDispatch();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🏋️</Text>
        <Text style={styles.title}>Welcome to FitConnect!</Text>
        <Text style={styles.subtitle}>Home Screen</Text>
        <Text style={styles.hint}>Replace with Figma UI</Text>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => dispatch(logout())}
        >
          <Text style={styles.logoutText}>Logout (test)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[4],
  },
  emoji: {
    fontSize: 56,
    marginBottom: Spacing[4],
  },
  title: {
    ...TextPresets.h2,
    color: Colors.brand.primary,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  subtitle: {
    ...TextPresets.h4,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  hint: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    marginBottom: Spacing[8],
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: Colors.status.error,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: 12,
  },
  logoutText: {
    ...TextPresets.button,
    color: Colors.status.error,
  },
});
