import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@theme/index';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
  currentStep,
  totalSteps,
}) => {
  const percentage = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  return (
    <View style={styles.container}>
      <View style={[styles.progress, { width: `${percentage}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 4,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full,
    width: '100%',
    overflow: 'hidden',
    marginBottom: Spacing[6],
  },
  progress: {
    height: '100%',
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.full,
  },
});
