import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, useWindowDimensions 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingProgressBar, SelectableCard } from '@components/index';
import { Routes } from '@constants/routes';
import type { AuthNavigationProp } from '@t/navigation';

import { useOnboarding } from '../../context/OnboardingContext';

const GOALS = [
  { id: 'athletic_performance', label: 'Athletic Performance', desc: 'Faster, stronger, better in sport', icon: '⚡' },
  { id: 'strength_muscle', label: 'Strength & Muscle', desc: 'Hypertrophy & functional power', icon: '💪' },
  { id: 'endurance_fitness', label: 'Endurance & Fitness', desc: 'Stamina, VO2 max, cardio base', icon: '🫀' },
  { id: 'fat_loss', label: 'Fat Loss + Fitness', desc: 'Reduce body fat & stay athletic', icon: '🔥' },
];

const DIET_PREFS = [
  { id: 'veg', label: 'Veg' },
  { id: 'non_veg', label: 'Non-veg' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'eggetarian', label: 'Eggetarian' },
];

const CUISINES = [
  'North Indian', 'South Indian', 'Maharashtrian', 
  'Gujarati', 'Bengali', 'Punjabi'
];

const GoalDietScreen = (): React.JSX.Element => {
  const { state, updateState } = useOnboarding();
  const navigation = useNavigation<AuthNavigationProp<'GoalDiet'>>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallScreen = height < 720;
  const isTablet = width >= 768;

  const [goals, setGoals] = useState<string[]>(state.goals || []);
  const [dietPref, setDietPref] = useState<'veg' | 'non_veg' | 'vegan' | 'eggetarian' | undefined>(state.diet_preference);
  const [cuisine, setCuisine] = useState<string | undefined>(state.regional_cuisine);

  const toggleGoal = (id: string) => {
    setGoals((prev) => 
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const isFormValid = goals.length > 0 && dietPref;

  const handleContinue = () => {
    if (!isFormValid) return;

    updateState({
      goals,
      diet_preference: dietPref,
      regional_cuisine: cuisine,
    });

    navigation.navigate(Routes.Auth.ACTIVITY_LEVEL);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />
      
      <View style={styles.outerWrapper}>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingBottom: Math.max(insets.bottom, 16) + 80,
              paddingTop: isSmallScreen ? 10 : 16,
            }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.responsiveContainer}>
            
            {/* 1. Progress Bar (Step 6 of 7) */}
            <View style={styles.progressBarWrapper}>
              <OnboardingProgressBar currentStep={6} totalSteps={7} />
            </View>

            {/* 2. Header */}
            <View style={[styles.headerSection, isSmallScreen && { marginBottom: 12 }]}>
              <Text 
                style={[
                  styles.heading,
                  isSmallScreen && styles.headingSmall,
                  isTablet && styles.headingTablet,
                ]}
              >
                Goal & diet
              </Text>
              <Text 
                style={[
                  styles.subtitle,
                  isSmallScreen && styles.subtitleSmall,
                ]}
              >
                Customises your daily macros, meals, and AI workout intensities.
              </Text>
            </View>

            {/* 3. Primary Goals */}
            <Text style={styles.sectionLabel}>PRIMARY GOAL</Text>
            <View style={styles.goalsContainer}>
              {GOALS.map((goal) => (
                <View key={goal.id} style={styles.goalWrapper}>
                  <SelectableCard
                    label={goal.label}
                    icon={goal.icon}
                    selected={goals.includes(goal.id)}
                    onToggle={() => toggleGoal(goal.id)}
                  />
                  <Text style={styles.cardDesc}>{goal.desc}</Text>
                </View>
              ))}
            </View>

            {/* 4. Diet Preference */}
            <Text style={styles.sectionLabel}>DIET PREFERENCE</Text>
            <View style={styles.chipsRowWrap}>
              {DIET_PREFS.map((pref) => (
                <TouchableOpacity
                  key={pref.id}
                  style={[styles.chip, dietPref === pref.id && styles.chipSelected]}
                  activeOpacity={0.7}
                  onPress={() => setDietPref(pref.id as any)}
                >
                  <Text style={[styles.chipText, dietPref === pref.id && styles.chipTextSelected]}>
                    {pref.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 5. Regional Cuisine */}
            <Text style={[styles.sectionLabel, { marginTop: 16 }]}>REGIONAL CUISINE</Text>
            <Text style={styles.helperText}>Optional — helps tailor familiar food suggestions.</Text>
            <View style={styles.chipsRowWrap}>
              {CUISINES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, cuisine === item && styles.chipSelected]}
                  activeOpacity={0.7}
                  onPress={() => setCuisine(cuisine === item ? undefined : item)}
                >
                  <Text style={[styles.chipText, cuisine === item && styles.chipTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
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
                !isFormValid && styles.continueButtonDisabled
              ]}
              activeOpacity={isFormValid ? 0.85 : 1}
              onPress={handleContinue}
              disabled={!isFormValid}
            >
              <Text 
                style={[
                  styles.continueButtonText,
                  !isFormValid && styles.continueButtonTextDisabled
                ]}
              >
                Continue →
              </Text>
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

  // Section Labels
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 10,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 4,
  },
  goalWrapper: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  cardDesc: {
    color: '#64748B',
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },
  chipsRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#161B26',
  },
  chipSelected: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#000000',
    fontWeight: '800',
  },
  helperText: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 10,
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

export default GoalDietScreen;
