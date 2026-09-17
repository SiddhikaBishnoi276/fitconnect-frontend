import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';

import { Routes } from '@constants/routes';
import type { AuthNavigationProp } from '@t/navigation';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';

const BadgeGraphic = () => (
  <View style={styles.badgeContainer}>
    {/* Background Ribbon Tails */}
    <View style={[styles.ribbonTail, styles.ribbonTailLeft]} />
    <View style={[styles.ribbonTail, styles.ribbonTailRight]} />
    {/* Circular Badge */}
    <View style={styles.circularBadge}>
      <Text style={styles.medalEmoji}>🏅</Text>
    </View>
  </View>
);

const WelcomeScreen = () => {
  const navigation = useNavigation<AuthNavigationProp<'Welcome'>>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        
        <View style={styles.contentContainer}>
          {/* 1. Badge */}
          <BadgeGraphic />

          {/* 2. Heading */}
          <Text style={[TextPresets.h1, styles.heading]}>
            Welcome to <Text style={styles.accentText}>FitConnect</Text>
          </Text>

          {/* 3. Subtitle */}
          <Text style={[TextPresets.body, styles.subtitle]}>
            AI-powered training built around your sport, schedule, and body — not a generic template.
          </Text>

          {/* 4. Feature Rows */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🤖</Text>
              <Text style={[TextPresets.bodySmall, styles.featureText]}>Adaptive plans that learn from every session</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🏆</Text>
              <Text style={[TextPresets.bodySmall, styles.featureText]}>Compete fairly across all sports with RP</Text>
            </View>
            <View style={styles.featureCard}>
              <Text style={styles.featureIcon}>🥊</Text>
              <Text style={[TextPresets.bodySmall, styles.featureText]}>Train with your squad, not in isolation</Text>
            </View>
          </View>
        </View>

        {/* 5. Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(Routes.Auth.BASIC_INFO)}
          >
            <Text style={[TextPresets.button, styles.primaryButtonText]}>Get Started →</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate(Routes.Auth.LOGIN)}
          >
            <Text style={[TextPresets.bodySmall, styles.secondaryButtonText]}>
              Already have an account? Log in
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.welcome,
  },
  container: {
    flex: 1,
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Layout.bottomSafeArea || Spacing[8],
    paddingTop: Spacing[10],
    justifyContent: 'space-between',
  },
  contentContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginTop: Spacing[10],
  },
  // Badge Styles
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[8],
    width: 100,
    height: 100,
  },
  ribbonTail: {
    position: 'absolute',
    width: 20,
    height: 40,
    bottom: -10,
    backgroundColor: Colors.brand.tertiary, // Pink/Coral color for ribbon
    borderRadius: BorderRadius.sm,
  },
  ribbonTailLeft: {
    left: 20,
    transform: [{ rotate: '25deg' }],
    backgroundColor: Colors.brand.primary, // Blue/Teal color
  },
  ribbonTailRight: {
    right: 20,
    transform: [{ rotate: '-25deg' }],
  },
  circularBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
    zIndex: 1,
  },
  medalEmoji: {
    fontSize: 40,
  },
  // Typography Styles
  heading: {
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing[4],
  },
  accentText: {
    color: Colors.brand.accent,
  },
  subtitle: {
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing[8],
    paddingHorizontal: Spacing[4],
  },
  // Feature Cards
  featuresContainer: {
    width: '100%',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  featureIcon: {
    fontSize: 20,
    marginRight: Spacing[4],
  },
  featureText: {
    color: Colors.text.primary,
    flex: 1,
  },
  // Footer / Buttons
  footer: {
    width: '100%',
    marginTop: Spacing[8],
  },
  primaryButton: {
    backgroundColor: Colors.brand.accent,
    height: Layout.buttonHeight,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: Spacing[4],
  },
  primaryButtonText: {
    color: Colors.background.welcome, // Dark text on lime button
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2],
  },
  secondaryButtonText: {
    color: Colors.text.secondary,
  },
});

export default WelcomeScreen;
