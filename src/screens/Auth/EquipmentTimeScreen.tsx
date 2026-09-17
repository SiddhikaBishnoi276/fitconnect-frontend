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

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 7, label: 'Sun' },
];

const TIME_OPTIONS = [30, 45, 60, 90];
const FREQUENCY_OPTIONS = [3, 4, 5, 6];

const EquipmentTimeScreen = () => {
  const { state, updateState } = useOnboarding();
  const navigation = useNavigation<AuthNavigationProp<'EquipmentTime'>>();

  const [equipment, setEquipment] = useState<'gym' | 'home' | undefined>(state.equipment);
  const [preferredDays, setPreferredDays] = useState<number[]>(state.preferred_days || []);
  const [timeBudget, setTimeBudget] = useState<number | undefined>(state.time_budget_minutes);
  const [frequencyTarget, setFrequencyTarget] = useState<number | null>(
    state.preferred_days ? state.preferred_days.length : null
  );

  const toggleDay = (id: number) => {
    setPreferredDays((prev) => 
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id].sort((a, b) => a - b)
    );
  };

  const isFormValid = equipment && preferredDays.length > 0 && timeBudget;

  const handleContinue = () => {
    if (!isFormValid) return;

    updateState({
      equipment,
      preferred_days: preferredDays,
      time_budget_minutes: timeBudget,
    });

    navigation.navigate(Routes.Auth.GOAL_DIET);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <OnboardingProgressBar currentStep={5} totalSteps={7} />

          <Text style={[TextPresets.h2, styles.heading]}>Setup & time</Text>
          <Text style={[TextPresets.body, styles.subtitle]}>
            Sets the training environment and how much we can pack in.
          </Text>

          {/* Equipment Access */}
          <Text style={[TextPresets.label, styles.sectionLabel]}>EQUIPMENT ACCESS</Text>
          <View style={styles.cardsContainer}>
            <View style={styles.cardWrapper}>
              <SelectableCard
                label="Full Gym Access"
                icon="🏋️‍♂️"
                selected={equipment === 'gym'}
                onToggle={() => setEquipment('gym')}
              />
              <Text style={styles.cardDesc}>Barbells, cables, machines, full kit</Text>
            </View>
            <View style={styles.cardWrapper}>
              <SelectableCard
                label="Home / Minimal"
                icon="🏠"
                selected={equipment === 'home'}
                onToggle={() => setEquipment('home')}
              />
              <Text style={styles.cardDesc}>Dumbbells, bands, bodyweight, open space</Text>
            </View>
          </View>

          {/* Training Days / Week */}
          <Text style={[TextPresets.label, styles.sectionLabel]}>TRAINING DAYS / WEEK</Text>
          <View style={styles.chipsRow}>
            {FREQUENCY_OPTIONS.map((days) => (
              <TouchableOpacity
                key={days}
                style={[styles.chip, frequencyTarget === days && styles.chipSelected]}
                onPress={() => setFrequencyTarget(days)}
              >
                <Text style={[TextPresets.body, frequencyTarget === days ? styles.chipTextSelected : styles.chipText]}>
                  {days}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Preferred Days */}
          <Text style={[TextPresets.label, styles.sectionLabel, { marginTop: Spacing[2] }]}>PREFERRED DAYS</Text>
          {frequencyTarget !== null && (
            <Text style={[TextPresets.caption, styles.helperText]}>
              Select {frequencyTarget} days below ({preferredDays.length}/{frequencyTarget} selected)
            </Text>
          )}
          <View style={styles.chipsRowWrap}>
            {DAYS_OF_WEEK.map((day) => (
              <TouchableOpacity
                key={day.id}
                style={[styles.dayChip, preferredDays.includes(day.id) && styles.chipSelected]}
                onPress={() => toggleDay(day.id)}
              >
                <Text style={[TextPresets.caption, preferredDays.includes(day.id) ? styles.chipTextSelected : styles.chipText]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Session Length */}
          <Text style={[TextPresets.label, styles.sectionLabel]}>SESSION LENGTH</Text>
          <View style={styles.chipsRow}>
            {TIME_OPTIONS.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.chip, timeBudget === time && styles.chipSelected]}
                onPress={() => setTimeBudget(time)}
              >
                <Text style={[TextPresets.body, timeBudget === time ? styles.chipTextSelected : styles.chipText]}>
                  {time}m
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
    marginBottom: Spacing[2],
  },
  subtitle: {
    color: Colors.text.secondary,
    marginBottom: Spacing[8],
  },
  sectionLabel: {
    color: Colors.text.tertiary,
    marginBottom: Spacing[3],
    marginTop: Spacing[6],
    letterSpacing: 1,
  },
  cardsContainer: {
    flexDirection: 'row',
    marginHorizontal: -Spacing[2],
  },
  cardWrapper: {
    flex: 1,
    paddingHorizontal: Spacing[2],
  },
  cardDesc: {
    ...TextPresets.caption,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing[2],
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: Spacing[2],
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
  },
  dayChip: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
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

export default EquipmentTimeScreen;
