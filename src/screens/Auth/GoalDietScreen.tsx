import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity 
} from 'react-native';

import { AppButton, OnboardingProgressBar, SelectableCard } from '@components/index';
import { Routes } from '@constants/routes';
import type { AuthNavigationProp } from '@t/navigation';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';

import { useOnboarding } from '../../context/OnboardingContext';


const GOALS = [
  { id: 'athletic_performance', label: 'Athletic Performance', desc: 'Faster, stronger, better in my sport', icon: '⚡' },
  { id: 'strength_muscle', label: 'Build Strength & Muscle', desc: 'Hypertrophy and functional power', icon: '💪' },
  { id: 'endurance_fitness', label: 'Endurance & Fitness', desc: 'Stamina, VO2 max, cardiovascular base', icon: '🫀' },
  { id: 'fat_loss', label: 'Fat Loss + Fitness', desc: 'Reduce body fat while staying active', icon: '🔥' },
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

const GoalDietScreen = () => {
  const { state, updateState } = useOnboarding();
  const navigation = useNavigation<AuthNavigationProp<'GoalDiet'>>();

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <OnboardingProgressBar currentStep={6} totalSteps={7} />

          <Text style={[TextPresets.h2, styles.heading]}>Goal & diet</Text>

          {/* Primary Goals */}
          <Text style={[TextPresets.label, styles.sectionLabel]}>PRIMARY GOAL</Text>
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

          {/* Diet Preference */}
          <Text style={[TextPresets.label, styles.sectionLabel]}>DIET PREFERENCE</Text>
          <View style={styles.chipsRowWrap}>
            {DIET_PREFS.map((pref) => (
              <TouchableOpacity
                key={pref.id}
                style={[styles.chip, dietPref === pref.id && styles.chipSelected]}
                onPress={() => setDietPref(pref.id as any)}
              >
                <Text style={[TextPresets.body, dietPref === pref.id ? styles.chipTextSelected : styles.chipText]}>
                  {pref.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Regional Cuisine */}
          <Text style={[TextPresets.label, styles.sectionLabel, { marginTop: Spacing[4] }]}>REGIONAL CUISINE</Text>
          <Text style={[TextPresets.caption, styles.helperText]}>Optional — helps tailor food suggestions.</Text>
          <View style={styles.chipsRowWrap}>
            {CUISINES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, cuisine === item && styles.chipSelected]}
                onPress={() => setCuisine(cuisine === item ? undefined : item)}
              >
                <Text style={[TextPresets.body, cuisine === item ? styles.chipTextSelected : styles.chipText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <AppButton 
            title="Continue →" 
            onPress={handleContinue} 
            disabled={!isFormValid} 
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
    marginBottom: Spacing[6],
  },
  sectionLabel: {
    color: Colors.text.tertiary,
    marginBottom: Spacing[3],
    letterSpacing: 1,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing[2],
  },
  goalWrapper: {
    width: '50%',
    paddingHorizontal: Spacing[2],
    marginBottom: Spacing[6],
  },
  cardDesc: {
    ...TextPresets.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing[2],
  },
  chipsRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing[2],
  },
  chip: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.background.secondary,
    marginRight: Spacing[2],
    marginBottom: Spacing[2],
  },
  chipSelected: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  chipText: {
    color: Colors.text.primary,
  },
  chipTextSelected: {
    color: Colors.text.inverse,
    fontFamily: TextPresets.h4.fontFamily,
  },
  helperText: {
    color: Colors.text.secondary,
    marginBottom: Spacing[3],
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

export default GoalDietScreen;
