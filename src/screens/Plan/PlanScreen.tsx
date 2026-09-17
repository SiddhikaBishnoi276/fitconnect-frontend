import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert 
} from 'react-native';
import Toast from 'react-native-toast-message';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { AppButton } from '@components/index';
import { Routes } from '@constants/routes';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';

// Local types for Plan
interface PlanExercise {
  id?: string;
  exercise_id?: string;
  name?: string;
  exercise_name?: string;
  target_muscle_group?: string;
  load_tags?: string[];
  sets?: number;
  reps?: string | number;
  notes?: string;
}

interface PlanDay {
  plan_day_id?: string;
  day_number?: number;
  day_index?: number;
  day_label?: string;
  title?: string;
  type?: string;
  date?: string;
  is_completed?: boolean;
  rest_day?: boolean;
  is_rest_day?: boolean;
  exercises: PlanExercise[];
}

interface Plan {
  id?: string;
  plan_id?: string;
  name?: string;
  title?: string;
  days: PlanDay[];
}

const PlanScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  const fetchPlan = useCallback(async () => {
    try {
      const res = await apiClient.get(Endpoints.plans.current);
      const fetchedPlan = res.data?.data;
      setPlan(fetchedPlan);
      
      // Select today by default if possible
      if (fetchedPlan?.days) {
        const todayDateStr = new Date().toISOString().split('T')[0];
        const currentDayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay();
        const todayIdx = fetchedPlan.days.findIndex(
          (d: PlanDay) => d.date === todayDateStr || (d.day_index || d.day_number) === currentDayOfWeek
        );
        if (todayIdx !== -1) {
          setSelectedDayIndex(todayIdx);
        }
      }
    } catch (error) {
      console.error('Failed to fetch plan:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlan();
    }, [fetchPlan])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlan();
  };

  const handleRegenerate = () => {
    Alert.alert(
      'Regenerate Plan?',
      'This will create a new 7-day plan based on your latest preferences and progress. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Regenerate', 
          style: 'destructive',
          onPress: async () => {
            setRegenerating(true);
            try {
              await apiClient.post(Endpoints.plans.regenerate);
              Toast.show({ type: 'success', text1: 'Plan Regenerated' });
              await fetchPlan();
            } catch (err) {
              console.error('Failed to regenerate plan:', err);
              Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to regenerate plan.' });
            } finally {
              setRegenerating(false);
            }
          }
        }
      ]
    );
  };

  if (loading && !plan) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  if (!plan || !plan.days || plan.days.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>No active plan found.</Text>
        <AppButton title="Reload" onPress={fetchPlan} style={{ marginTop: Spacing[4] }} />
      </SafeAreaView>
    );
  }

  const selectedDay = plan.days[selectedDayIndex] || plan.days[0];
  const selectedDayNumber = selectedDay.day_index ?? selectedDay.day_number ?? (selectedDayIndex + 1);
  const isRestDay = selectedDay.is_rest_day ?? selectedDay.rest_day ?? false;
  
  const todayDateStr = new Date().toISOString().split('T')[0];
  const currentDayOfWeek = new Date().getDay() === 0 ? 7 : new Date().getDay();
  const isSelectedToday = selectedDay.date === todayDateStr || selectedDayNumber === currentDayOfWeek || (!selectedDay.date && selectedDayIndex === 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your 7-Day Plan</Text>
        <TouchableOpacity onPress={handleRegenerate} disabled={regenerating}>
          <Text style={styles.headerAction}>{regenerating ? 'Updating...' : 'Regenerate'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.primary} />}
      >
        {/* 1. 7-Day Tab Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekStrip}>
          {plan.days.map((day, index) => {
            const dayNum = day.day_index ?? day.day_number ?? (index + 1);
            const isToday = day.date === todayDateStr || dayNum === currentDayOfWeek || (!day.date && index === 0);
            const isSelected = selectedDayIndex === index;

            return (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.dayChip, 
                  isSelected && styles.dayChipSelected,
                  isToday && !isSelected && styles.dayChipToday,
                  day.is_completed && styles.dayChipCompleted
                ]}
                onPress={() => setSelectedDayIndex(index)}
              >
                <Text style={[
                  styles.dayChipText, 
                  isSelected && styles.dayChipTextSelected,
                  isToday && !isSelected && styles.dayChipTextToday,
                  day.is_completed && styles.dayChipTextCompleted
                ]}>
                  {day.day_label || `Day ${dayNum}`}
                </Text>
                {day.is_completed && <Text style={styles.dayChipCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 2 & 3. Selected Day Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isSelectedToday ? "Today's Session" : (selectedDay.title ? `${selectedDay.title}` : `Day ${selectedDayNumber} Overview`)}
          </Text>

          {isRestDay ? (
            <View style={styles.card}>
              <Text style={styles.restDayEmoji}>🧘</Text>
              <Text style={styles.restDayTitle}>Recovery day</Text>
              <Text style={styles.restDayDesc}>Light mobility or full rest</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.sessionTitle}>{selectedDay.title || 'Workout Session'}</Text>
              <View style={styles.sessionMetaRow}>
                <Text style={styles.sessionMeta}>⏱️ ~{selectedDay.exercises ? (selectedDay.exercises.length * 10 || 45) : 45} min</Text>
                <Text style={styles.sessionMeta}>🔥 Medium-High</Text>
                <Text style={styles.sessionMeta}>💪 {selectedDay.exercises?.length || 0} Exercises</Text>
              </View>

              <View style={styles.previewList}>
                {selectedDay.exercises?.slice(0, 3).map((ex, idx) => (
                  <Text key={idx} style={styles.previewItem}>• {ex.exercise_name || ex.name || 'Exercise'}</Text>
                ))}
                {(selectedDay.exercises?.length || 0) > 3 && (
                  <Text style={styles.previewItem}>• +{(selectedDay.exercises.length - 3)} more...</Text>
                )}
              </View>

              <AppButton 
                title="View Full Day →" 
                onPress={() => navigation.navigate(Routes.Root.PLAN_DAY_DETAIL, { 
                  dayIndex: selectedDayNumber, 
                  isToday: isSelectedToday 
                })}
              />
            </View>
          )}
        </View>

        {/* 4. Weekly Load Balance Visualization */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Load Balance</Text>
          <View style={styles.card}>
            {/* TODO: If exercise data includes load_tags (e.g. "legs_high", "core_medium"), 
                aggregate per day per body-system to build the chart here. 
                Skipping chart rendering for now since exact API load_tags shape is unconfirmed. */}
            <Text style={styles.placeholderText}>
              📊 Chart will appear here when load_tags data is populated by the backend.
            </Text>
          </View>
        </View>

        {/* 5. Diet Quick Link */}
        <View style={[styles.section, { marginBottom: Spacing[10] }]}>
          <AppButton 
            title="View Today's Diet Plan 🥗 →" 
            variant="secondary"
            onPress={() => navigation.navigate(Routes.Root.TODAYS_NUTRITION)}
          />
        </View>

      </ScrollView>
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
  headerTitle: {
    ...TextPresets.h3,
    color: Colors.text.primary,
  },
  headerAction: {
    ...TextPresets.body,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  content: {
    paddingBottom: Spacing[10],
  },
  emptyText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
  },
  weekStrip: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[6],
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    marginRight: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  dayChipSelected: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  dayChipToday: {
    borderColor: Colors.brand.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  dayChipCompleted: {
    backgroundColor: Colors.background.tertiary,
    borderColor: Colors.border.primary,
  },
  dayChipText: {
    ...TextPresets.caption,
    color: Colors.text.primary,
  },
  dayChipTextSelected: {
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  dayChipTextToday: {
    color: Colors.brand.primary,
    fontWeight: 'bold',
  },
  dayChipTextCompleted: {
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  dayChipCheck: {
    marginLeft: Spacing[2],
    color: Colors.status.success,
    fontSize: 12,
  },
  section: {
    paddingHorizontal: Layout.screenPaddingH,
    marginBottom: Spacing[8],
  },
  sectionTitle: {
    ...TextPresets.h4,
    color: Colors.text.primary,
    marginBottom: Spacing[4],
  },
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  sessionTitle: {
    ...TextPresets.h3,
    color: Colors.text.primary,
    marginBottom: Spacing[4],
  },
  sessionMetaRow: {
    flexDirection: 'row',
    gap: Spacing[4],
    marginBottom: Spacing[6],
    flexWrap: 'wrap',
  },
  sessionMeta: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    backgroundColor: Colors.background.tertiary,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  previewList: {
    marginBottom: Spacing[6],
  },
  previewItem: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    marginBottom: Spacing[2],
  },
  restDayEmoji: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  restDayTitle: {
    ...TextPresets.h3,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  restDayDesc: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  placeholderText: {
    ...TextPresets.body,
    color: Colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  }
});

export default PlanScreen;
