import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';
import { Routes } from '@constants/routes';
import { AppButton } from '@components/index';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';

interface DetailExercise {
  id: string;
  name: string;
  description?: string;
  target_muscle_group?: string;
  is_injury_substituted?: boolean;
  substitution_reason?: string;
  target_sets?: number;
  target_reps?: number;
}

interface DayDetail {
  day_number: number;
  day_label?: string;
  rest_day: boolean;
  exercises: DetailExercise[];
}

const PlanDayDetailScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { dayIndex = 0, isToday = false } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState<DayDetail | null>(null);

  useEffect(() => {
    const fetchDayDetail = async () => {
      try {
        const res = await apiClient.get(Endpoints.plans.day(dayIndex));
        setDayData(res.data?.data);
      } catch (error) {
        console.error('Failed to fetch day details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDayDetail();
  }, [dayIndex]);

  if (loading || !dayData) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{dayData.day_label || `Day ${dayData.day_number}`}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {dayData.rest_day ? (
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
                  <Text style={styles.exName}>{idx + 1}. {ex.name}</Text>
                </View>

                {ex.is_injury_substituted && ex.substitution_reason && (
                  <View style={styles.amberTag}>
                    <Text style={styles.amberTagText}>Swapped — {ex.substitution_reason}</Text>
                  </View>
                )}

                <View style={styles.exDetails}>
                  <Text style={styles.exTarget}>{ex.target_muscle_group}</Text>
                  <Text style={styles.exSetsReps}>
                    {ex.target_sets || 3} Sets × {ex.target_reps || 10} Reps
                  </Text>
                </View>

                {ex.description && (
                  <Text style={styles.exDesc} numberOfLines={2}>{ex.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {isToday ? (
          <AppButton 
            title="Start Session →" 
            onPress={() => navigation.navigate(Routes.Modals.PRE_WORKOUT_MODAL)}
          />
        ) : (
          <View style={styles.previewBadge}>
            <Text style={styles.previewText}>Preview only (Not today's session)</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
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
  }
});

export default PlanDayDetailScreen;
