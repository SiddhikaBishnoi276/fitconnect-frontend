import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';
import { Routes } from '@constants/routes';
import { AppButton, AppTextInput, OnboardingProgressBar, DropdownPickerModal } from '@components/index';
import type { DropdownOption } from '@components/index';
import { useOnboarding, InjuryPayload } from '../../context/OnboardingContext';
import { useNavigation } from '@react-navigation/native';
import type { AuthNavigationProp } from '@t/navigation';

const BODY_PARTS: DropdownOption[] = [
  { label: 'Knee', value: 'knee' },
  { label: 'Shoulder', value: 'shoulder' },
  { label: 'Ankle', value: 'ankle' },
  { label: 'Lower Back', value: 'lower_back' },
  { label: 'Hip', value: 'hip' },
  { label: 'Wrist', value: 'wrist' },
  { label: 'Elbow', value: 'elbow' },
  { label: 'Hamstring', value: 'hamstring' },
  { label: 'Neck', value: 'neck' },
  { label: 'Other', value: 'other' },
];

const CONDITIONS: DropdownOption[] = [
  { label: 'Sprain', value: 'sprain' },
  { label: 'Fracture', value: 'fracture' },
  { label: 'ACL Tear', value: 'acl_tear' },
  { label: 'Chronic Pain', value: 'chronic_pain' },
  { label: 'Post-Surgery', value: 'post_surgery' },
  { label: 'Tendinitis', value: 'tendinitis' },
  { label: 'Other', value: 'other' },
];

const RECOVERY_STATUSES: DropdownOption[] = [
  { label: 'Fully Healed', value: 'fully_healed' },
  { label: 'Mostly Recovered', value: 'mostly_recovered' },
  { label: 'Partially Recovered', value: 'partially_recovered' },
  { label: 'Ongoing', value: 'ongoing' },
];

const InjuryInputScreen = () => {
  const { state, updateState } = useOnboarding();
  const navigation = useNavigation<AuthNavigationProp<'InjuryInput'>>();

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
    // If they have a pending valid form, add it automatically
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <OnboardingProgressBar currentStep={4} totalSteps={7} />

          <Text style={[TextPresets.h2, styles.heading]}>Any injury or limitation?</Text>
          
          <View style={styles.callout}>
            <Text style={[TextPresets.caption, styles.calloutText]}>
              Hard constraint, not a suggestion. The AI will permanently exclude exercises that load this area — not just this session.
            </Text>
          </View>

          <Text style={[TextPresets.label, styles.question]}>Do you have any current or past injury?</Text>
          
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, hasInjury === true && styles.toggleActive]}
              onPress={() => setHasInjury(true)}
            >
              <Text style={[TextPresets.body, hasInjury === true ? styles.toggleTextActive : styles.toggleText]}>
                Yes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.toggleButton, hasInjury === false && styles.toggleActive]}
              onPress={() => {
                setHasInjury(false);
                setInjuries([]); // clear if they say no
              }}
            >
              <Text style={[TextPresets.body, hasInjury === false ? styles.toggleTextActive : styles.toggleText]}>
                No
              </Text>
            </TouchableOpacity>
          </View>

          {hasInjury && (
            <View style={styles.injurySection}>
              
              {/* Added Injuries List */}
              {injuries.length > 0 && (
                <View style={styles.chipContainer}>
                  {injuries.map((inj, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={[TextPresets.caption, styles.chipText]}>
                        {getLabel(inj.body_part, BODY_PARTS)} - {getLabel(inj.condition, CONDITIONS)}
                      </Text>
                      <TouchableOpacity onPress={() => handleRemoveInjury(index)} style={styles.chipRemove}>
                        <Text style={styles.chipRemoveText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Form */}
              <View style={styles.formContainer}>
                <Text style={[TextPresets.h4, styles.formTitle]}>
                  {injuries.length > 0 ? 'Add another injury' : 'Injury Details'}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[TextPresets.label, styles.label]}>Body part</Text>
                  <TouchableOpacity 
                    style={styles.pickerButton} 
                    onPress={() => setActiveModal('body_part')}
                  >
                    <Text style={[TextPresets.body, bodyPart ? styles.pickerTextSelected : styles.pickerTextPlaceholder]}>
                      {bodyPart ? getLabel(bodyPart, BODY_PARTS) : 'Select body part'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[TextPresets.label, styles.label]}>Condition</Text>
                  <TouchableOpacity 
                    style={styles.pickerButton} 
                    onPress={() => setActiveModal('condition')}
                  >
                    <Text style={[TextPresets.body, condition ? styles.pickerTextSelected : styles.pickerTextPlaceholder]}>
                      {condition ? getLabel(condition, CONDITIONS) : 'Select condition'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <AppTextInput
                  label="How long ago (months)"
                  placeholder="e.g. 12"
                  value={monthsAgo}
                  onChangeText={setMonthsAgo}
                  keyboardType="numeric"
                  helperText="Optional"
                />

                <View style={styles.inputGroup}>
                  <Text style={[TextPresets.label, styles.label]}>Recovery status</Text>
                  <TouchableOpacity 
                    style={styles.pickerButton} 
                    onPress={() => setActiveModal('recovery')}
                  >
                    <Text style={[TextPresets.body, recoveryStatus ? styles.pickerTextSelected : styles.pickerTextPlaceholder]}>
                      {recoveryStatus ? getLabel(recoveryStatus, RECOVERY_STATUSES) : 'Select status'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <AppTextInput
                  label="Notes"
                  placeholder="e.g. hurts during squats"
                  value={notes}
                  onChangeText={setNotes}
                  helperText="Optional - supplementary for reference only"
                />

                <AppButton 
                  title="Add Injury" 
                  onPress={handleAddInjury} 
                  disabled={!isFormValid}
                  variant="secondary"
                />
              </View>
            </View>
          )}

        </ScrollView>

        <View style={styles.footer}>
          <AppButton 
            title="Continue →" 
            onPress={handleContinue} 
            disabled={!isContinueEnabled} 
          />
        </View>

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

      </KeyboardAvoidingView>
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
    marginBottom: Spacing[4],
  },
  callout: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)', // Amber with opacity
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    marginBottom: Spacing[6],
  },
  calloutText: {
    color: '#D97706', // Amber-600
  },
  question: {
    color: Colors.text.primary,
    marginBottom: Spacing[3],
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: Spacing[6],
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  toggleActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  toggleText: {
    color: Colors.text.primary,
  },
  toggleTextActive: {
    color: Colors.text.inverse,
    fontFamily: TextPresets.h4.fontFamily,
  },
  injurySection: {
    marginTop: Spacing[2],
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing[6],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    marginRight: Spacing[2],
    marginBottom: Spacing[2],
  },
  chipText: {
    color: Colors.text.primary,
    marginRight: Spacing[2],
  },
  chipRemove: {
    backgroundColor: Colors.background.tertiary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRemoveText: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  formContainer: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing[4],
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.primary,
  },
  formTitle: {
    color: Colors.text.primary,
    marginBottom: Spacing[4],
  },
  inputGroup: {
    marginBottom: Spacing[4],
  },
  label: {
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  pickerButton: {
    height: Layout.inputHeight,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.sm, // or 8 if missing
    justifyContent: 'center',
    paddingHorizontal: Spacing[4],
  },
  pickerTextPlaceholder: {
    color: Colors.text.tertiary,
  },
  pickerTextSelected: {
    color: Colors.text.primary,
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

export default InjuryInputScreen;
