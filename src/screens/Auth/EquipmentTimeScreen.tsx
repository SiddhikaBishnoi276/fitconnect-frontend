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

const DAYS_OF_WEEK = [
  { id: 1, label: '1' },
  { id: 2, label: '2' },
  { id: 3, label: '3' },
  { id: 4, label: '4' },
  { id: 5, label: '5' },
  { id: 6, label: '6' },
  { id: 7, label: '7' },
];
// const DAYS_OF_WEEK = [
// { id: 1, label: 'Mon' },
// { id: 2, label: 'Tue' },
// { id: 3, label: 'Wed' },
// { id: 4, label: 'Thu' },
// { id: 5, label: 'Fri' },
// { id: 6, label: 'Sat' },
// { id: 7, label: 'Sun' },

// 
const TIME_OPTIONS = [30, 45, 60];
const FREQUENCY_OPTIONS = [3, 4, 5, 6, 7];

const EquipmentTimeScreen = (): React.JSX.Element => {
  const { state, updateState } = useOnboarding();
  const navigation = useNavigation<AuthNavigationProp<'EquipmentTime'>>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallScreen = height < 720;
  const isTablet = width >= 768;

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
            {/* 1. Progress Bar (Step 5 of 7) */}
            <View style={styles.progressBarWrapper}>
              <OnboardingProgressBar currentStep={5} totalSteps={7} />
            </View>

            <TouchableOpacity onPress={() => navigation.goBack()} style={{marginBottom: 16, alignSelf: 'flex-start'}}>
              <Text style={{color: '#CCFF00', fontSize: 16, fontWeight: '700'}}>← Back</Text>
            </TouchableOpacity>

            {/* 2. Header */}
            <View style={[styles.headerSection, isSmallScreen && { marginBottom: 12 }]}>
              <Text
                style={[
                  styles.heading,
                  isSmallScreen && styles.headingSmall,
                  isTablet && styles.headingTablet,
                ]}
              >
                Setup & time
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  isSmallScreen && styles.subtitleSmall,
                ]}
              >
                Sets the training environment and how much we can pack in.
              </Text>
            </View>

            {/* 3. Equipment Access */}
            <Text style={styles.sectionLabel}>EQUIPMENT ACCESS</Text>
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

            {/* 4. Training Days / Week */}
            <Text style={styles.sectionLabel}>TRAINING DAYS / WEEK</Text>
            <View style={styles.chipsRow}>
              {FREQUENCY_OPTIONS.map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[styles.chip, frequencyTarget === days && styles.chipSelected]}
                  activeOpacity={0.7}
                  onPress={() => setFrequencyTarget(days)}
                >
                  <Text style={[styles.chipText, frequencyTarget === days && styles.chipTextSelected]}>
                    {days}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 5. Preferred Days */}
            <Text style={styles.sectionLabel}>PREFERRED DAYS</Text>
            {frequencyTarget !== null && (
              <Text style={styles.helperText}>
                Select {frequencyTarget} days below ({preferredDays.length}/{frequencyTarget} selected)
              </Text>
            )}
            <View style={styles.chipsRowWrap}>
              {DAYS_OF_WEEK.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayChip, preferredDays.includes(day.id) && styles.chipSelected]}
                  activeOpacity={0.7}
                  onPress={() => toggleDay(day.id)}
                >
                  <Text style={[styles.dayChipText, preferredDays.includes(day.id) && styles.chipTextSelected]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 6. Session Length */}
            <Text style={styles.sectionLabel}>SESSION LENGTH</Text>
            <View style={styles.chipsRow}>
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.chip, timeBudget === time && styles.chipSelected]}
                  activeOpacity={0.7}
                  onPress={() => setTimeBudget(time)}
                >
                  <Text style={[styles.chipText, timeBudget === time && styles.chipTextSelected]}>
                    {time}m
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
    marginTop: 16,
    marginBottom: 10,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  cardWrapper: {
    flex: 1,
  },
  cardDesc: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  chipsRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#161B26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChip: {
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
    fontSize: 15,
    fontWeight: '600',
  },
  dayChipText: {
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
    marginBottom: 8,
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

export default EquipmentTimeScreen;
