import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity 
} from 'react-native';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';
import { Routes } from '@constants/routes';
import { AppButton, OnboardingProgressBar, SelectableCard } from '@components/index';
import { useOnboarding } from '../../context/OnboardingContext';
import { useNavigation } from '@react-navigation/native';
import type { AuthNavigationProp } from '@t/navigation';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '@store/slices/authSlice';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';

const LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'New to structured training' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Training consistently for a while' },
  { id: 'advanced', label: 'Advanced', desc: 'Competing or training at a high level' },
];

const ActivityLevelScreen = () => {
  const { state } = useOnboarding();
  const navigation = useNavigation<AuthNavigationProp<'ActivityLevel'>>();
  const dispatch = useDispatch();

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
      // Assemble full payload
      const payload = {
        name: state.name,
        email: state.email,
        password: state.password,
        username: state.username, // From basic info
        age: state.age,
        weight_kg: state.weight_kg,
        height_cm: state.height_cm,
        gender: state.gender,
        activity_level: activityLevel,
        equipment: state.equipment,
        time_budget_minutes: state.time_budget_minutes,
        preferred_days: state.preferred_days,
        goals: state.goals,
        diet_preference: state.diet_preference,
        regional_cuisine: state.regional_cuisine,
        sports: state.sports,
        injuries: state.injuries,
      };

      console.log('Sending signup payload:', JSON.stringify(payload, null, 2));

      // 1. Call Signup
      await apiClient.post(Endpoints.auth.signup, payload);

      // 2. Call Login since signup doesn't return tokens
      dispatch(loginStart());
      const loginRes = await apiClient.post(Endpoints.auth.login, {
        email: state.email,
        password: state.password,
      });

      // 3. Dispatch success to store tokens/user
      dispatch(loginSuccess(loginRes.data.data));

      // Note: RootNavigator listens to isAuthenticated and flips the stack automatically.

    } catch (err: any) {
      const status = err.response?.status;
      const responseData = err.response?.data;

      if (status === 409) {
        setIsConflict(true);
        setErrorMsg('Email or username already exists.');
      } else if (status === 400) {
        setErrorMsg(responseData?.message || 'Validation error. Please check your details.');
        console.error('Validation Error Details:', responseData);
      } else {
        setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
      }
      
      dispatch(loginFailure(err.message || 'Signup flow failed'));
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate(Routes.Auth.LOGIN);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <OnboardingProgressBar currentStep={7} totalSteps={7} />

          <Text style={[TextPresets.h2, styles.heading]}>Your activity level</Text>
          <Text style={[TextPresets.body, styles.subtitle]}>
            Used to calibrate training intensity and baseline load.
          </Text>

          <View style={styles.listContainer}>
            {LEVELS.map((level) => (
              <View key={level.id} style={styles.cardWrapper}>
                <SelectableCard
                  label={level.label}
                  selected={activityLevel === level.id}
                  onToggle={() => setActivityLevel(level.id as any)}
                />
                <Text style={styles.cardDesc}>{level.desc}</Text>
              </View>
            ))}
          </View>

          {errorMsg && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMsg}</Text>
              {isConflict && (
                <TouchableOpacity onPress={navigateToLogin} style={styles.loginLink}>
                  <Text style={styles.loginLinkText}>Log in instead?</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        </ScrollView>

        <View style={styles.footer}>
          <AppButton 
            title="Finish Setup →" 
            onPress={handleFinish} 
            disabled={!isFormValid || loading} 
            loading={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
  },
  heading: {
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  subtitle: {
    color: Colors.text.secondary,
    marginBottom: Spacing[8],
  },
  listContainer: {
    // Gap fallback since gap might not be typed
  },
  cardWrapper: {
    marginBottom: Spacing[4],
  },
  cardDesc: {
    ...TextPresets.caption,
    color: Colors.text.tertiary,
    marginTop: Spacing[2],
    textAlign: 'center',
  },
  errorContainer: {
    marginTop: Spacing[6],
    padding: Spacing[4],
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    alignItems: 'center',
  },
  errorText: {
    ...TextPresets.body,
    color: Colors.status.error,
    textAlign: 'center',
  },
  loginLink: {
    marginTop: Spacing[2],
  },
  loginLinkText: {
    ...TextPresets.body,
    color: Colors.brand.primary,
    textDecorationLine: 'underline',
  },
  footer: {
    padding: Layout.screenPaddingH,
    paddingBottom: Layout.bottomSafeArea || Spacing[8],
    backgroundColor: Colors.background.primary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.primary,
    paddingTop: Spacing[4],
  },
});

export default ActivityLevelScreen;
