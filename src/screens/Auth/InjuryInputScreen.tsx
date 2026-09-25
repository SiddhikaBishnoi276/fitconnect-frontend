import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, StatusBar, useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput, OnboardingProgressBar, DropdownPickerModal } from '@components/index';
import type { DropdownOption } from '@components/index';
import type { AuthNavigationProp } from '@t/navigation';
import { BODY_PARTS, CONDITIONS, RECOVERY_STATUSES } from '@constants/options';
import { Routes } from "@constants/routes";

import type { InjuryPayload } from '../../context/OnboardingContext';
import { useOnboarding } from '../../context/OnboardingContext';

const InjuryInputScreen = (): React.JSX.Element => {
  const { state, updateState } = useOnboarding();
  const navigation = useNavigation<AuthNavigationProp<'InjuryInput'>>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallScreen = height < 720;
  const isTablet = width >= 768;

  const [hasInjury, setHasInjury] = useState<boolean | null>(
    state.injuries && state.injuries.length > 0 ? true : null
  );

  const [injuries, setInjuries] = useState<InjuryPayload[]>(state.injuries || []);

  // Form State
  const [bodyPart, setBodyPart] = useState<string>('');
  const [condition, setCondition] = useState<string>('');
  const [monthsAgo, setMonthsAgo] = useState<string>('');
  const [recoveryStatus, setRecoveryStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Modals
  const [activeModal, setActiveModal] = useState<'body_part' | 'condition' | 'recovery' | null>(null);

  const isFormValid = bodyPart && condition && recoveryStatus;

  const handleAddInjury = () => {
    if (!isFormValid) return;

    const newInjury: InjuryPayload = {
      body_part: bodyPart,
      condition,
      occurred_months_ago: monthsAgo ? parseInt(monthsAgo, 10) : null,
      recovery_status: recoveryStatus as InjuryPayload['recovery_status'],
      notes: notes.trim() || undefined,
    };

    setInjuries([...injuries, newInjury]);

    // Reset Form
    setBodyPart('');
    setCondition('');
    setMonthsAgo('');
    setRecoveryStatus('');
    setNotes('');
  };

  const handleRemoveInjury = (index: number) => {
    setInjuries(injuries.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    let finalInjuries = injuries;
    if (hasInjury && isFormValid) {
      finalInjuries = [
        ...injuries,
        {
          body_part: bodyPart,
          condition,
          occurred_months_ago: monthsAgo ? parseInt(monthsAgo, 10) : null,
          recovery_status: recoveryStatus as InjuryPayload['recovery_status'],
          notes: notes.trim() || undefined,
        },
      ];
    }

    if (hasInjury === false) {
      updateState({ injuries: [] });
    } else {
      updateState({ injuries: finalInjuries });
    }

    navigation.navigate(Routes.Auth.EQUIPMENT_TIME);
  };

  const getLabel = (value: string, options: DropdownOption[]) => {
    return options.find(o => o.value === value)?.label || value;
  };

  const isContinueEnabled =
    hasInjury === false ||
    (hasInjury === true && (injuries.length > 0 || isFormValid));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.outerWrapper}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: Math.max(insets.bottom, 16) + 80,
                paddingTop: isSmallScreen ? 10 : 16,
              }
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.responsiveContainer}>
              {/* Progress Bar (Step 4 of 7) */}
              <View style={styles.progressBarWrapper}>
                <OnboardingProgressBar currentStep={4} totalSteps={7} />
              </View>

              <TouchableOpacity onPress={() => navigation.goBack()} style={{marginBottom: 16, alignSelf: 'flex-start'}}>
                <Text style={{color: '#CCFF00', fontSize: 16, fontWeight: '700'}}>← Back</Text>
              </TouchableOpacity>

              {/* Heading */}
              <View style={[styles.headerSection, isSmallScreen && { marginBottom: 12 }]}>
                <Text
                  style={[
                    styles.heading,
                    isSmallScreen && styles.headingSmall,
                    isTablet && styles.headingTablet,
                  ]}
                >
                  Any injury or limitation?
                </Text>

                <View style={styles.callout}>
                  <Text style={styles.calloutText}>
                    ⚠️ Hard constraint, not a suggestion. The AI will permanently exclude exercises that load this area — not just this session.
                  </Text>
                </View>
              </View>

              {/* Question & Toggle */}
              <Text style={styles.question}>Do you have any current or past injury?</Text>

              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, hasInjury === true && styles.toggleActive]}
                  activeOpacity={0.8}
                  onPress={() => setHasInjury(true)}
                >
                  <Text style={[styles.toggleText, hasInjury === true && styles.toggleTextActive]}>
                    Yes
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleButton, hasInjury === false && styles.toggleActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setHasInjury(false);
                    setInjuries([]);
                  }}
                >
                  <Text style={[styles.toggleText, hasInjury === false && styles.toggleTextActive]}>
                    No
                  </Text>
                </TouchableOpacity>
              </View>

              {hasInjury && (
                <View style={styles.injurySection}>

                  {/* Added Injuries Chips */}
                  {injuries.length > 0 && (
                    <View style={styles.chipContainer}>
                      {injuries.map((inj, index) => (
                        <View key={index} style={styles.chip}>
                          <Text style={styles.chipText}>
                            {getLabel(inj.body_part, BODY_PARTS)} - {getLabel(inj.condition, CONDITIONS)}
                          </Text>
                          <TouchableOpacity onPress={() => handleRemoveInjury(index)} style={styles.chipRemove}>
                            <Text style={styles.chipRemoveText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Injury Details Sub-Form */}
                  <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>
                      {injuries.length > 0 ? 'Add another injury' : 'Injury Details'}
                    </Text>

                    {/* Body Part */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Body part</Text>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        activeOpacity={0.8}
                        onPress={() => setActiveModal('body_part')}
                      >
                        <Text style={bodyPart ? styles.pickerTextSelected : styles.pickerTextPlaceholder}>
                          {bodyPart ? getLabel(bodyPart, BODY_PARTS) : 'Select body part'}
                        </Text>
                        <Text style={styles.pickerChevron}>⌄</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Condition */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Condition</Text>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        activeOpacity={0.8}
                        onPress={() => setActiveModal('condition')}
                      >
                        <Text style={condition ? styles.pickerTextSelected : styles.pickerTextPlaceholder}>
                          {condition ? getLabel(condition, CONDITIONS) : 'Select condition'}
                        </Text>
                        <Text style={styles.pickerChevron}>⌄</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Months Ago */}
                    <AppTextInput
                      label="How long ago (months)"
                      placeholder="e.g. 12"
                      value={monthsAgo}
                      onChangeText={setMonthsAgo}
                      keyboardType="numeric"
                      helperText="Optional"
                    />

                    {/* Recovery Status */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Recovery status</Text>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        activeOpacity={0.8}
                        onPress={() => setActiveModal('recovery')}
                      >
                        <Text style={recoveryStatus ? styles.pickerTextSelected : styles.pickerTextPlaceholder}>
                          {recoveryStatus ? getLabel(recoveryStatus, RECOVERY_STATUSES) : 'Select status'}
                        </Text>
                        <Text style={styles.pickerChevron}>⌄</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Notes */}
                    <AppTextInput
                      label="Notes"
                      placeholder="e.g. hurts during deep squats"
                      value={notes}
                      onChangeText={setNotes}
                      helperText="Optional — supplementary reference for AI"
                    />

                    <TouchableOpacity
                      style={[
                        styles.addInjuryButton,
                        !isFormValid && styles.addInjuryButtonDisabled
                      ]}
                      activeOpacity={isFormValid ? 0.8 : 1}
                      onPress={handleAddInjury}
                      disabled={!isFormValid}
                    >
                      <Text style={[styles.addInjuryText, !isFormValid && styles.addInjuryTextDisabled]}>
                        + Add Injury
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

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
                  !isContinueEnabled && styles.continueButtonDisabled
                ]}
                activeOpacity={isContinueEnabled ? 0.85 : 1}
                onPress={handleContinue}
                disabled={!isContinueEnabled}
              >
                <Text
                  style={[
                    styles.continueButtonText,
                    !isContinueEnabled && styles.continueButtonTextDisabled
                  ]}
                >
                  Continue →
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Modals */}
          <DropdownPickerModal
            visible={activeModal === 'body_part'}
            title="Select Body Part"
            options={BODY_PARTS}
            selected={bodyPart}
            onSelect={setBodyPart}
            onClose={() => setActiveModal(null)}
          />

          <DropdownPickerModal
            visible={activeModal === 'condition'}
            title="Select Condition"
            options={CONDITIONS}
            selected={condition}
            onSelect={setCondition}
            onClose={() => setActiveModal(null)}
          />

          <DropdownPickerModal
            visible={activeModal === 'recovery'}
            title="Recovery Status"
            options={RECOVERY_STATUSES}
            selected={recoveryStatus}
            onSelect={setRecoveryStatus}
            onClose={() => setActiveModal(null)}
          />

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  container: {
    flex: 1,
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
    marginBottom: 10,
  },
  headingSmall: {
    fontSize: 24,
  },
  headingTablet: {
    fontSize: 32,
  },
  callout: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 12,
    padding: 12,
  },
  calloutText: {
    color: '#FBBF24',
    fontSize: 13,
    lineHeight: 18,
  },

  // Question & Toggle
  question: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleActive: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  toggleText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#000000',
    fontWeight: '800',
  },

  // Injury Section
  injurySection: {
    marginTop: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 13,
    marginRight: 6,
  },
  chipRemove: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRemoveText: {
    color: '#94A3B8',
    fontSize: 11,
  },

  // Form Container
  formContainer: {
    backgroundColor: '#161B26',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 16,
  },
  formTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  pickerButton: {
    height: 52,
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  pickerTextPlaceholder: {
    color: '#6B7280',
    fontSize: 15,
  },
  pickerTextSelected: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  pickerChevron: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2,
  },
  addInjuryButton: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#CCFF00',
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  addInjuryButtonDisabled: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'transparent',
  },
  addInjuryText: {
    color: '#CCFF00',
    fontSize: 15,
    fontWeight: '700',
  },
  addInjuryTextDisabled: {
    color: '#6B7280',
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

export default InjuryInputScreen;
