import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, StatusBar, Platform, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { Routes } from '@constants/routes';
import { loginStart, loginSuccess, loginFailure } from '@store/slices/authSlice';
import type { AuthNavigationProp } from '@t/navigation';
import { Storage } from '@utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useOnboarding } from '../../context/OnboardingContext';

const LEVELS = [
  { 
    id: 'beginner', 
    label: 'Beginner', 
    desc: 'New to structured training', 
    icon: '🌱' 
  },
  { 
    id: 'amateur', 
    label: 'Amateur', 
    desc: 'Training 1–2 years consistently', 
    icon: '💪' 
  },
  { 
    id: 'club_level', 
    label: 'Club-level Athlete', 
    desc: 'Competing at club/district level', 
    icon: '🥈' 
  },
  { 
    id: 'competitive', 
    label: 'Competitive', 
    desc: 'State/national level or above', 
    icon: '🏆' 
  },
];

const ActivityLevelScreen = (): React.JSX.Element => {
  const { state } = useOnboarding();
  const navigation = useNavigation<AuthNavigationProp<'ActivityLevel'>>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [activityLevel, setActivityLevel] = useState<string | undefined>(state.activity_level || 'beginner');
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

      // If backend returned auth tokens directly
      if (response.data?.data?.accessToken || response.data?.data?.tokens?.accessToken) {
        // Enforce a strict purge of any leftover local cache from a previous test user session
        Storage.clearAll();
        await AsyncStorage.clear();
        dispatch(loginSuccess(response.data.data));
      } else {
        // Automatically login with registered credentials to obtain valid JWT session tokens
        const loginResponse = await apiClient.post(Endpoints.auth.login, {
          email: state.email?.trim(),
          password: state.password,
          deviceInfo: `${Platform.OS} device`,
        });

        if (loginResponse.data?.data) {
          // Enforce a strict purge of any leftover local cache from a previous test user session
          Storage.clearAll();
          await AsyncStorage.clear();
          dispatch(loginSuccess(loginResponse.data.data));
        } else {
          navigation.navigate(Routes.Auth.LOGIN);
        }
      }
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 409) {
        setIsConflict(true);
        setErrorMsg('An account with this email already exists.');
        Alert.alert('Registration Failed', 'An account with this email already exists. Please log in instead.');
      } else if (status === 400) {
        setErrorMsg(data?.message || 'Invalid details provided. Please review.');
        Alert.alert('Registration Failed', data?.message || 'Invalid details provided. Please review.');
      } else {
        setErrorMsg(err.message || 'Network error. Please try again.');
        Alert.alert('Error', err.message || 'Network error. Please try again.');
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
              paddingBottom: Math.max(insets.bottom, 16) + 100,
              paddingTop: 16,
            }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.responsiveContainer}>
            
            {/* 1. Progress Header (Step 7 of 7, 100%) */}
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressStepText}>STEP 7 OF 7</Text>
              <Text style={styles.progressPercentText}>100%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={styles.progressBarFilled} />
            </View>

            {/* 2. Title & Subtitle */}
            <View style={styles.headerSection}>
              <Text style={styles.heading}>Your activity level</Text>
              <Text style={styles.subtitle}>
                Used to calibrate training intensity and baseline load.
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

            {/* 3. 4 Level Selection Cards */}
            <View style={styles.cardsContainer}>
              {LEVELS.map((lvl) => {
                const isSelected = activityLevel === lvl.id;
                return (
                  <TouchableOpacity 
                    key={lvl.id}
                    style={[
                      styles.levelCard,
                      isSelected && styles.levelCardSelected
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setActivityLevel(lvl.id)}
                  >
                    <View style={styles.cardLeftContent}>
                      <View style={[
                        styles.iconCircle,
                        isSelected && styles.iconCircleSelected
                      ]}>
                        <Text style={styles.cardEmoji}>{lvl.icon}</Text>
                      </View>
                      <View style={styles.textContainer}>
                        <Text style={[
                          styles.cardTitle,
                          isSelected && styles.cardTitleSelected
                        ]}>
                          {lvl.label}
                        </Text>
                        <Text style={styles.cardSubtitle}>{lvl.desc}</Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

          </View>
        </ScrollView>

        {/* Bottom Floating Footer: "Finish Setup →" */}
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
                styles.finishButton,
                (!isFormValid || loading) && styles.finishButtonDisabled
              ]}
              activeOpacity={isFormValid ? 0.85 : 1}
              onPress={handleFinish}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <ActivityIndicator color="#0B0F17" />
              ) : (
                <Text 
                  style={[
                    styles.finishButtonText,
                    !isFormValid && styles.finishButtonTextDisabled
                  ]}
                >
                  Finish Setup →
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

  // Progress Header
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStepText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E9BAE',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#CCFF00',
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: '#1E2638',
    borderRadius: 2,
    width: '100%',
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBarFilled: {
    height: '100%',
    width: '100%',
    backgroundColor: '#CCFF00',
    borderRadius: 2,
  },

  // Title Section
  headerSection: {
    marginBottom: 24,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: '#8E9BAE',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
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

  // Level Selection Cards
  cardsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131926',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1E2638',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  levelCardSelected: {
    borderColor: '#CCFF00',
    backgroundColor: 'rgba(204, 255, 0, 0.04)',
  },
  cardLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E2638',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconCircleSelected: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
  },
  cardEmoji: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  cardTitleSelected: {
    color: '#CCFF00',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8E9BAE',
    fontWeight: '400',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CCFF00',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkIcon: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0B0F17',
  },

  // Footer & Button
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0B0F17',
    borderTopWidth: 1,
    borderTopColor: '#1E2638',
    paddingHorizontal: 20,
  },
  footerInner: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  finishButton: {
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
  finishButtonDisabled: {
    backgroundColor: '#1E2638',
    shadowOpacity: 0,
    elevation: 0,
  },
  finishButtonText: {
    color: '#0B0F17',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  finishButtonTextDisabled: {
    color: '#4B5563',
  },
});

export default ActivityLevelScreen;
