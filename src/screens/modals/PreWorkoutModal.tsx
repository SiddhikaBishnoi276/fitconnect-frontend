import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { AppButton, DropdownPickerModal } from '@components/index';
import { Routes } from '@constants/routes';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';

// NOTE FOR BACKEND TEAM:
// Please confirm the exact string values expected for these enums.
// Currently mapping as:
// sleep_quality_enum: 'good' | 'ok' | 'poor'
// soreness_enum: 'none' | 'some' | 'sore'
// energy_enum: 'fresh' | 'normal' | 'tired'

const BODY_PARTS = [
  { label: 'Knee', value: 'knee' },
  { label: 'Shoulder', value: 'shoulder' },
  { label: 'Lower Back', value: 'lower_back' },
  { label: 'Ankle', value: 'ankle' },
  { label: 'Hip', value: 'hip' },
  { label: 'Wrist', value: 'wrist' },
  { label: 'Elbow', value: 'elbow' },
  { label: 'Hamstring', value: 'hamstring' },
  { label: 'Neck', value: 'neck' },
  { label: 'Other', value: 'other' },
];

const PreWorkoutModal = (): React.JSX.Element => {
  const navigation = useNavigation<any>(); // Replace with precise navigation type later
  const route = useRoute<any>();
  const planDayId = route.params?.planDayId;
  const sessionTitle = route.params?.sessionTitle || 'Workout';
  const sessionDuration = route.params?.sessionDuration || 45;

  const [sleep, setSleep] = useState<'good' | 'ok' | 'poor'>('ok');
  const [soreness, setSoreness] = useState<'none' | 'some' | 'sore'>('some');
  const [energy, setEnergy] = useState<'fresh' | 'normal' | 'tired'>('normal');

  const [hasDiscomfort, setHasDiscomfort] = useState<boolean>(false);
  const [discomfortPart, setDiscomfortPart] = useState<string>('');
  const [pickerVisible, setPickerVisible] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleStartWorkout = async () => {
    setLoading(true);
    try {
      const payload = {
        plan_day_id: planDayId,
        sleep_quality: sleep,
        soreness: soreness,
        energy: energy,
        new_discomfort_present: hasDiscomfort,
        new_discomfort_body_part: hasDiscomfort && discomfortPart ? discomfortPart : null,
      };

      const res = await apiClient.post(Endpoints.sessions.create, payload);
      
      // On success, navigate to Live Workout Tracker with session info
      const sessionData = res.data?.data;
      
      // We use replace or navigate to go into the Tracker overlay
      navigation.navigate(Routes.Modals.LIVE_WORKOUT_TRACKER, { 
        sessionId: sessionData?.id, 
        sessionData 
      });
      
    } catch (error: any) {
      setLoading(false);
      console.error('Failed to start workout session:', error);
      if (error.statusCode === 409 && error.errors?.session_id) {
        navigation.navigate(Routes.Modals.LIVE_WORKOUT_TRACKER, { 
          sessionId: error.errors.session_id, 
        });
      } else {
        Alert.alert('Session Failed', error.message || 'Something went wrong.');
      }
    }
  };

  const renderChips = (
    options: { label: string; value: string }[],
    selectedValue: string,
    onSelect: (val: any) => void
  ) => {
    return (
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const isSelected = selectedValue === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onSelect(opt.value)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>{'<'}</Text>
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>How's your body today?</Text>
            <Text style={styles.subtitle}>
              {sessionTitle} · {sessionDuration} min
            </Text>
          </View>
        </View>

        <View style={styles.aiCoachBanner}>
          <Text style={styles.aiCoachText}>
            <Text style={styles.aiCoachTextHighlight}>Your AI coach reads this. </Text>
            Honest answers = a better session adapted in real time.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sleep quality last night</Text>
          {renderChips([
            { label: 'Good', value: 'good' },
            { label: 'OK', value: 'ok' },
            { label: 'Poor', value: 'poor' }
          ], sleep, setSleep)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Muscle soreness</Text>
          {renderChips([
            { label: 'None', value: 'none' },
            { label: 'Some', value: 'some' },
            { label: 'Sore', value: 'sore' }
          ], soreness, setSoreness)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Energy level</Text>
          {renderChips([
            { label: 'Fresh', value: 'fresh' },
            { label: 'Normal', value: 'normal' },
            { label: 'Tired', value: 'tired' }
          ], energy, setEnergy)}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textTransform: 'uppercase' }]}>ANY NEW DISCOMFORT?</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, !hasDiscomfort && styles.chipSelected]}
              onPress={() => {
                setHasDiscomfort(false);
                setDiscomfortPart('');
              }}
            >
              <Text style={[styles.chipText, !hasDiscomfort && styles.chipTextSelected]}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, hasDiscomfort && styles.chipSelected]}
              onPress={() => setHasDiscomfort(true)}
            >
              <Text style={[styles.chipText, hasDiscomfort && styles.chipTextSelected]}>Yes</Text>
            </TouchableOpacity>
          </View>

          {hasDiscomfort && (
            <TouchableOpacity 
              style={styles.dropdownTrigger}
              onPress={() => setPickerVisible(true)}
            >
              <Text style={discomfortPart ? styles.dropdownTextActive : styles.dropdownTextPlaceholder}>
                {discomfortPart 
                  ? BODY_PARTS.find(p => p.value === discomfortPart)?.label 
                  : 'Select body part...'}
              </Text>
              <Text>▼</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.startButton, (hasDiscomfort && !discomfortPart) && styles.startButtonDisabled]}
            disabled={hasDiscomfort && !discomfortPart}
            onPress={handleStartWorkout}
          >
            {loading ? (
              <ActivityIndicator color={Colors.background.primary} />
            ) : (
              <Text style={[styles.startButtonText, (hasDiscomfort && !discomfortPart) && styles.startButtonTextDisabled]}>Start Workout</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Body Part Picker Modal */}
      <DropdownPickerModal
        visible={pickerVisible}
        title="Select Body Part"
        options={BODY_PARTS}
        selected={discomfortPart}
        onSelect={setDiscomfortPart}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    marginBottom: Spacing[4],
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: '#1E293B', // Dark button background
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...TextPresets.h2,
    color: '#FFFFFF', // Pure white like design
    marginBottom: 4,
    fontSize: 22,
  },
  subtitle: {
    ...TextPresets.body,
    color: '#64748B',
    fontSize: 14,
  },
  aiCoachBanner: {
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: Spacing[8],
  },
  aiCoachText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
  },
  aiCoachTextHighlight: {
    color: '#CCFF00',
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing[6],
  },
  sectionTitle: {
    ...TextPresets.h4,
    color: '#64748B',
    fontSize: 13,
    marginBottom: Spacing[3],
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  chip: {
    flex: 1,
    paddingVertical: Spacing[3],
    backgroundColor: '#161B26', // Dark gray card background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: 'rgba(204, 255, 0, 0.05)', // Faint neon tint
    borderColor: '#CCFF00',
  },
  chipText: {
    ...TextPresets.body,
    color: '#64748B',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#CCFF00',
    fontWeight: '700',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[4],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.sm,
  },
  dropdownTextPlaceholder: {
    ...TextPresets.body,
    color: Colors.text.tertiary,
  },
  dropdownTextActive: {
    ...TextPresets.body,
    color: Colors.text.primary,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: Spacing[6],
  },
  startButton: {
    backgroundColor: '#1E293B',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#0F141E',
  },
  startButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '700',
  },
  startButtonTextDisabled: {
    color: '#334155',
  }
});

export default PreWorkoutModal;
