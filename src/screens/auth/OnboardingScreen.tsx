/**
 * FitConnect — Onboarding Screen (Placeholder)
 *
 * First screen users see. Replace with Figma UI.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Routes } from '@constants/routes';
import type { AuthNavigationProp } from '@t/navigation';
import { Colors, Spacing, TextPresets } from '@theme/index';


interface Props {
  navigation: AuthNavigationProp<'Onboarding'>;
}

const OnboardingScreen = ({ navigation }: Props): React.JSX.Element => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>💪</Text>
        <Text style={styles.title}>FitConnect</Text>
        <Text style={styles.tagline}>Your fitness journey starts here</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate(Routes.Auth.REGISTER)}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate(Routes.Auth.LOGIN)}
        >
          <Text style={styles.secondaryButtonText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
  },
  logo: {
    fontSize: 64,
    marginBottom: Spacing[4],
  },
  title: {
    ...TextPresets.display,
    color: Colors.brand.primary,
    marginBottom: Spacing[2],
  },
  tagline: {
    ...TextPresets.bodyLarge,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing[10],
  },
  primaryButton: {
    backgroundColor: Colors.brand.primary,
    width: '100%',
    paddingVertical: Spacing[4],
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  primaryButtonText: {
    ...TextPresets.button,
    color: Colors.text.inverse,
  },
  secondaryButton: {
    paddingVertical: Spacing[2],
  },
  secondaryButtonText: {
    ...TextPresets.body,
    color: Colors.brand.primary,
  },
});
