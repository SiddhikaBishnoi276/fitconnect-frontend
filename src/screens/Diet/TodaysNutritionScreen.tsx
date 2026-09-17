import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';
import { Routes } from '@constants/routes';
import { AppButton } from '@components/index';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';

interface Meal {
  id: string;
  name: string;
  slot: string;
  cuisine?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface DietDay {
  has_plan: boolean;
  target_calories?: number;
  target_protein_g?: number;
  target_carbs_g?: number;
  target_fat_g?: number;
  insight_text?: string;
  hydration?: {
    target_liters: number;
    label: string;
    tip: string;
  };
  meals?: Meal[];
}

interface HistoryDay {
  date: string;
  total_calories: number;
}

const TodaysNutritionScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [dietData, setDietData] = useState<DietDay | null>(null);
  const [history, setHistory] = useState<HistoryDay[]>([]);

  const fetchDiet = useCallback(async () => {
    try {
      const [todayRes, historyRes] = await Promise.allSettled([
        apiClient.get(Endpoints.diet.today),
        apiClient.get(`${Endpoints.diet.history}?days=7`)
      ]);

      if (todayRes.status === 'fulfilled') {
        setDietData(todayRes.value.data?.data);
      }
      if (historyRes.status === 'fulfilled') {
        setHistory(historyRes.value.data?.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch diet:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDiet();
    }, [fetchDiet])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDiet();
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await apiClient.post(Endpoints.diet.generate);
      Toast.show({ type: 'success', text1: 'Diet Plan Generated!' });
      await fetchDiet();
    } catch (error: any) {
      console.error('Failed to generate diet:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Generation Failed',
        text2: 'Tap here to retry.',
        onPress: () => handleGenerate(), // Retry on tap
        autoHide: false,
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !dietData) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  // ─── NO PLAN STATE ─────────────────────────────────────────────────────────
  if (dietData?.has_plan === false) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.noPlanContainer}>
          <Text style={styles.noPlanEmoji}>🥗</Text>
          <Text style={styles.noPlanTitle}>No Diet Plan Yet</Text>
          <Text style={styles.noPlanDesc}>
            Let the AI analyze your goals and preferences to build a personalized meal plan for today.
          </Text>
          <AppButton 
            title="Generate My Diet Plan →" 
            onPress={handleGenerate} 
            loading={generating}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── PLAN ACTIVE STATE ─────────────────────────────────────────────────────
  const {
    target_calories = 0,
    target_protein_g = 0,
    target_carbs_g = 0,
    target_fat_g = 0,
    insight_text,
    hydration,
    meals = []
  } = dietData || {};

  // Calculate percentages for macro bar (Fallback for Ring)
  const totalMacros = target_protein_g + target_carbs_g + target_fat_g || 1;
  const pPct = (target_protein_g / totalMacros) * 100;
  const cPct = (target_carbs_g / totalMacros) * 100;
  const fPct = (target_fat_g / totalMacros) * 100;

  // Max calories in history for scaling sparkline
  const maxCal = history.length > 0 ? Math.max(...history.map(h => h.total_calories), target_calories) : target_calories;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Nutrition</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Insight & Target */}
        {insight_text && (
          <View style={styles.insightBox}>
            <Text style={styles.insightText}>💡 {insight_text}</Text>
          </View>
        )}

        <View style={styles.targetCard}>
          <View style={styles.caloriesCircle}>
            <Text style={styles.caloriesNumber}>{target_calories}</Text>
            <Text style={styles.caloriesLabel}>KCAL</Text>
          </View>

          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{target_protein_g}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{target_carbs_g}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{target_fat_g}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>

          {/* Horizontal Macro Bar */}
          <View style={styles.macroBarContainer}>
            <View style={[styles.macroBarSegment, { width: `${pPct}%`, backgroundColor: '#3B82F6' }]} />
            <View style={[styles.macroBarSegment, { width: `${cPct}%`, backgroundColor: '#F59E0B' }]} />
            <View style={[styles.macroBarSegment, { width: `${fPct}%`, backgroundColor: '#EF4444' }]} />
          </View>
        </View>

        {/* Weekly Macro Trend (Sparkline) */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Calorie Trend</Text>
            <View style={styles.sparklineContainer}>
              {history.map((day, idx) => {
                const heightPct = (day.total_calories / (maxCal || 1)) * 100;
                return (
                  <View key={idx} style={styles.sparklineColumn}>
                    <View style={[styles.sparklineBar, { height: `${Math.max(10, heightPct)}%` }]} />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Hydration */}
        {hydration && (
          <View style={styles.hydrationCard}>
            <Text style={styles.hydrationEmoji}>💧</Text>
            <View style={styles.hydrationInfo}>
              <Text style={styles.hydrationLabel}>{hydration.label}</Text>
              <Text style={styles.hydrationTarget}>{hydration.target_liters}L Target</Text>
              <Text style={styles.hydrationTip}>{hydration.tip}</Text>
            </View>
          </View>
        )}

        {/* Meals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meals</Text>
          {meals.map((meal) => (
            <TouchableOpacity 
              key={meal.id} 
              style={styles.mealCard}
              onPress={() => navigation.navigate(Routes.Root.MEAL_DETAIL, { mealId: meal.id })}
            >
              <View style={styles.mealHeader}>
                <View style={styles.slotTag}>
                  <Text style={styles.slotTagText}>{meal.slot.replace('_', ' ')}</Text>
                </View>
                {meal.cuisine && (
                  <Text style={styles.cuisineText}>{meal.cuisine}</Text>
                )}
              </View>
              
              <Text style={styles.mealName}>{meal.name}</Text>
              
              <View style={styles.mealFooter}>
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                <Text style={styles.mealMacros}>
                  P: {meal.protein_g}g  •  C: {meal.carbs_g}g  •  F: {meal.fat_g}g
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingTop: Spacing[4],
    paddingBottom: Spacing[10],
  },
  noPlanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[8],
  },
  noPlanEmoji: {
    fontSize: 64,
    marginBottom: Spacing[4],
  },
  noPlanTitle: {
    ...TextPresets.h2,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  noPlanDesc: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing[8],
  },
  insightBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: Spacing[4],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[6],
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  insightText: {
    ...TextPresets.body,
    color: Colors.brand.primary,
    fontWeight: '500',
  },
  targetCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[6],
    alignItems: 'center',
    marginBottom: Spacing[6],
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  caloriesCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[6],
  },
  caloriesNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -1,
  },
  caloriesLabel: {
    ...TextPresets.caption,
    color: Colors.text.tertiary,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  macroRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    ...TextPresets.h3,
    color: Colors.text.primary,
  },
  macroLabel: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
  },
  macroBarContainer: {
    height: 8,
    width: '100%',
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: Colors.background.tertiary,
  },
  macroBarSegment: {
    height: '100%',
  },
  section: {
    marginBottom: Spacing[6],
  },
  sectionTitle: {
    ...TextPresets.h4,
    color: Colors.text.primary,
    marginBottom: Spacing[4],
  },
  sparklineContainer: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[2],
  },
  sparklineColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  sparklineBar: {
    width: 12,
    backgroundColor: Colors.brand.primary,
    borderRadius: 4,
    opacity: 0.8,
  },
  hydrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: Spacing[4],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[6],
  },
  hydrationEmoji: {
    fontSize: 32,
    marginRight: Spacing[4],
  },
  hydrationInfo: {
    flex: 1,
  },
  hydrationLabel: {
    ...TextPresets.caption,
    color: '#0284C7',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  hydrationTarget: {
    ...TextPresets.h4,
    color: '#0369A1',
    marginBottom: 2,
  },
  hydrationTip: {
    ...TextPresets.caption,
    color: '#0C4A6E',
  },
  mealCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[5],
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  slotTag: {
    backgroundColor: Colors.background.tertiary,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.sm,
  },
  slotTagText: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  cuisineText: {
    ...TextPresets.caption,
    color: Colors.brand.primary,
  },
  mealName: {
    ...TextPresets.h4,
    color: Colors.text.primary,
    marginBottom: Spacing[3],
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.primary,
  },
  mealCalories: {
    ...TextPresets.body,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  mealMacros: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
  }
});

export default TodaysNutritionScreen;
