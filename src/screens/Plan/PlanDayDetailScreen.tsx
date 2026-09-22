import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { AppButton } from '@components/index';
import { Routes } from '@constants/routes';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';

interface DetailExercise {
  id?: string;
  exercise_id?: string;
  name?: string;
  exercise_name?: string;
  description?: string;
  notes?: string;
  target_muscle_group?: string;
  is_injury_substituted?: boolean;
  substitution_reason?: string;
  target_sets?: number;
  sets?: number;
  target_reps?: number | string;
  reps?: number | string;
}

interface DayDetail {
  plan_day_id?: string;
  day_number?: number;
  day_index?: number;
  day_label?: string;
  title?: string;
  type?: string;
  is_rest_day?: boolean;
  rest_day?: boolean;
  exercises: DetailExercise[];
}

const PlanDayDetailScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { dayIndex = 1, isToday = false } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayData, setDayData] = useState<DayDetail | null>(null);

  const insets = useSafeAreaInsets();

  const fetchDayDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(Endpoints.plans.day(dayIndex));
      setDayData(res.data?.data);
    } catch (err: any) {
      console.error('Failed to fetch day details:', err);
      setError(err.message || 'Failed to load day details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayDetail();
  }, [dayIndex]);

  if (loading && !dayData) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  if (error && !dayData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Day Details</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={[styles.center, styles.errorContainer]}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Could not load day details</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <AppButton 
            title="Retry" 
            onPress={fetchDayDetail} 
            size="medium"
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!dayData) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.errorMessage}>No day details found.</Text>
        <AppButton title="Go Back" onPress={() => navigation.goBack()} size="medium" style={{ marginTop: Spacing[4] }} />
      </SafeAreaView>
    );
  }

  const isRestDay = dayData.is_rest_day ?? dayData.rest_day ?? false;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />
      
      <View style={styles.responsiveContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{dayData.title || dayData.day_label || `Day ${dayData.day_index || dayData.day_number || dayIndex}`}</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView 
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 80 }
          ]} 
          showsVerticalScrollIndicator={false}
        >
          {isRestDay ? (
            <View style={[styles.card, styles.center]}>
              <Text style={styles.restDayEmoji}>🧘</Text>
              <Text style={styles.restDayTitle}>Recovery day</Text>
              <Text style={styles.restDayDesc}>Light mobility or full rest</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {dayData.exercises?.map((ex, idx) => (
                <View key={idx} style={styles.exerciseCard}>
                  <View style={styles.exHeaderRow}>
                    <Text style={styles.exName}>{idx + 1}. {ex.exercise_name || ex.name || 'Exercise'}</Text>
                  </View>

                  {ex.is_injury_substituted && ex.substitution_reason && (
                    <View style={styles.amberTag}>
                      <Text style={styles.amberTagText}>Swapped — {ex.substitution_reason}</Text>
                    </View>
                  )}

                  <View style={styles.exDetails}>
                    <Text style={styles.exTarget}>{ex.target_muscle_group || 'General'}</Text>
                    <Text style={styles.exSetsReps}>
                      {(ex.sets ?? ex.target_sets) || 3} Sets × {(ex.reps ?? ex.target_reps) || 10} Reps
                    </Text>
                  </View>

                  {(ex.notes || ex.description) && (
                    <Text style={styles.exDesc} numberOfLines={2}>{ex.notes || ex.description}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {isToday ? (
              <AppButton 
                title="Start Session →" 
                onPress={() => navigation.navigate(Routes.Modals.PRE_WORKOUT_MODAL, { planDayId: dayData?.plan_day_id || (dayData as any)?.day_id || (dayData as any)?.id })}
              />
          ) : (
            <View style={styles.previewBadge}>
              <Text style={styles.previewText}>Preview only (Not today's session)</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backText: {
    ...TextPresets.body,
    color: Colors.brand.primary,
  },
  headerTitle: {
    ...TextPresets.h4,
    color: Colors.text.primary,
  },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
  },
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[8],
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  restDayEmoji: {
    fontSize: 48,
    marginBottom: Spacing[4],
  },
  restDayTitle: {
    ...TextPresets.h2,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  restDayDesc: {
    ...TextPresets.body,
    color: Colors.text.secondary,
  },
  listContainer: {
    // Replaced gap with marginBottom on items
  },
  exerciseCard: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing[4],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    marginBottom: Spacing[4],
  },
  exHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  exName: {
    ...TextPresets.h4,
    color: Colors.text.primary,
    flex: 1,
  },
  amberTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignSelf: 'flex-start',
    marginBottom: Spacing[3],
  },
  amberTagText: {
    ...TextPresets.caption,
    color: '#D97706',
    fontWeight: 'bold',
  },
  exDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  exTarget: {
    ...TextPresets.caption,
    color: Colors.brand.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  exSetsReps: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
  },
  exDesc: {
    ...TextPresets.body,
    fontSize: 13,
    color: Colors.text.tertiary,
  },
  footer: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[8],
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  previewBadge: {
    backgroundColor: Colors.background.tertiary,
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  previewText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[10],
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: Spacing[4],
  },
  errorTitle: {
    ...TextPresets.h3,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  errorMessage: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing[6],
  },
  retryButton: {
    minWidth: 160,
  },
});

export default PlanDayDetailScreen;
