import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, StatusBar, useWindowDimensions 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { OnboardingProgressBar, SelectableCard } from '@components/index';
import { Routes } from '@constants/routes';
import { loginStart, loginSuccess, loginFailure } from '@store/slices/authSlice';
import type { AuthNavigationProp } from '@t/navigation';

import { useOnboarding } from '../../context/OnboardingContext';

const LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'New to structured training', icon: '🌱' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Training consistently for a while', icon: '🏃‍♂️' },
  { id: 'advanced', label: 'Advanced', desc: 'Competing or training at a high level', icon: '🏆' },
];

const ActivityLevelScreen = (): React.JSX.Element => {
  const { state } = useOnboarding();
  const navigation = useNavigation<AuthNavigationProp<'ActivityLevel'>>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallScreen = height < 720;
  const isTablet = width >= 768;

  const [activityLevel, setActivityLevel] = useState<'beginner' | 'intermediate' | 'advanced' | undefined>(state.activity_level);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);

  const isFormValid = activityLevel !== undefined;

  const handleFinish = async () => {
    if (!isFormValid) return;

    setLoading(true);
    setErrorMsg(null);
    setIsConflict(false);

    try {
      const payload = {
        name: state.name,
        email: state.email,
        password: state.password,
        username: state.username,
        age: state.age,
        gender: state.gender,
        weight_kg: state.weight_kg ? parseFloat(state.weight_kg) : undefined,
        height_cm: state.height_cm ? parseFloat(state.height_cm) : undefined,
        sports: state.sports || [],
        injuries: state.injuries || [],
        equipment: state.equipment,
        preferred_days: state.preferred_days || [],
        time_budget_minutes: state.time_budget_minutes,
        goals: state.goals || [],
        diet_preference: state.diet_preference,
        regional_cuisine: state.regional_cuisine,
        activity_level: activityLevel,
      };

      dispatch(loginStart());
      const response = await apiClient.post(Endpoints.auth.signup, payload);

      if (response.data?.data) {
        dispatch(loginSuccess(response.data.data));
      } else {
        navigation.navigate(Routes.Auth.LOGIN);
      }
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 409) {
        setIsConflict(true);
        setErrorMsg('An account with this email already exists.');
      } else if (status === 400) {
        setErrorMsg(data?.message || 'Invalid details provided. Please review.');
      } else {
        setErrorMsg(err.message || 'Network error. Please try again.');
      }

      dispatch(loginFailure(err.message || 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />
      
      <View style={styles.outerWrapper}>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingBottom: Math.max(insets.bottom, 16) + 90,
              paddingTop: isSmallScreen ? 10 : 16,
            }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.responsiveContainer}>
            
            {/* 1. Progress Bar (Step 7 of 7) */}
            <View style={styles.progressBarWrapper}>
              <OnboardingProgressBar currentStep={7} totalSteps={7} />
            </View>

            {/* 2. Header */}
            <View style={[styles.headerSection, isSmallScreen && { marginBottom: 14 }]}>
              <Text 
                style={[
                  styles.heading,
                  isSmallScreen && styles.headingSmall,
                  isTablet && styles.headingTablet,
                ]}
              >
                Experience level
              </Text>
              <Text 
                style={[
                  styles.subtitle,
                  isSmallScreen && styles.subtitleSmall,
                ]}
              >
                Helps the AI dial in the right starting volume, progression rate, and exercise complexity.
              </Text>
            </View>

            {/* Error / Conflict Alert */}
            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                {isConflict && (
                  <TouchableOpacity 
                    style={styles.loginLink} 
                    onPress={() => navigation.navigate(Routes.Auth.LOGIN)}
                  >
                    <Text style={styles.loginLinkText}>Log in instead →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 3. Level Cards */}
            <View style={styles.cardsContainer}>
              {LEVELS.map((lvl) => (
                <View key={lvl.id} style={styles.cardWrapper}>
                  <SelectableCard
                    label={lvl.label}
                    icon={lvl.icon}
                    selected={activityLevel === lvl.id}
                    onToggle={() => setActivityLevel(lvl.id as any)}
                  />
                  <Text style={styles.cardDesc}>{lvl.desc}</Text>
                </View>
              ))}
            </View>

          </View>
        </ScrollView>

        {/* Bottom Floating Footer */}
        <View 
          style={[
            styles.footer,
            { 
              paddingBottom: Math.max(insets.bottom, 16),
              paddingTop: 12,
            }
          ]}
        >
          <View style={styles.footerInner}>
            <TouchableOpacity 
              style={[
                styles.continueButton,
                (!isFormValid || loading) && styles.continueButtonDisabled
              ]}
              activeOpacity={isFormValid ? 0.85 : 1}
              onPress={handleFinish}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text 
                  style={[
                    styles.continueButtonText,
                    !isFormValid && styles.continueButtonTextDisabled
                  ]}
                >
                  Generate My Plan ⚡
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
  outerWrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 20,
    backgroundColor: '#0B0F17',
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },

  // Progress Bar
  progressBarWrapper: {
    marginBottom: 8,
  },

  // Header
  headerSection: {
    marginBottom: 16,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headingSmall: {
    fontSize: 24,
  },
  headingTablet: {
    fontSize: 32,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '400',
    maxWidth: 420,
  },
  subtitleSmall: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Error Alert
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    lineHeight: 18,
  },
  loginLink: {
    marginTop: 8,
  },
  loginLinkText: {
    color: '#CCFF00',
    fontSize: 13,
    fontWeight: '700',
  },

  // Level Cards
  cardsContainer: {
    gap: 12,
    marginBottom: 12,
  },
  cardWrapper: {
    width: '100%',
  },
  cardDesc: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0B0F17',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 20,
  },
  footerInner: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  continueButton: {
    backgroundColor: '#CCFF00',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  continueButtonTextDisabled: {
    color: '#4B5563',
  },
});

export default ActivityLevelScreen;
