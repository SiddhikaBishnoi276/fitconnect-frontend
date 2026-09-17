import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Routes } from '@constants/routes';
import type { AuthNavigationProp } from '@t/navigation';

interface Props {
  navigation: AuthNavigationProp<'Register'>;
}

const RegisterScreen = ({ navigation }: Props): React.JSX.Element => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />
      
      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={[styles.card, isTablet && styles.cardTablet]}>
          <Text style={styles.logo}>⚡</Text>
          <Text style={styles.title}>Join FitConnect</Text>
          <Text style={styles.subtitle}>
            Personalised AI training plans built around your body and sport.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(Routes.Auth.WELCOME)}
          >
            <Text style={styles.primaryButtonText}>Get Started →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(Routes.Auth.LOGIN)}
          >
            <Text style={styles.secondaryButtonText}>
              Already have an account? <Text style={styles.loginLink}>Log in</Text>
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
    backgroundColor: '#0B0F17',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  cardTablet: {
    maxWidth: 480,
  },
  logo: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  primaryButton: {
    backgroundColor: '#CCFF00',
    width: '100%',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  secondaryButton: {
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  loginLink: {
    color: '#CCFF00',
    fontWeight: '700',
  },
});

export default RegisterScreen;
