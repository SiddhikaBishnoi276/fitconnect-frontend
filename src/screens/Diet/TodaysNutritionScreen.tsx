import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { Routes } from '@constants/routes';
import { useAppSelector } from '@store/hooks';
import { selectCurrentUser } from '@store/slices/authSlice';
import type { DietDay } from '@t/api';

interface HistoryDay {
  date: string;
  total_calories: number;
}

const TodaysNutritionScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  const user = useAppSelector(selectCurrentUser);
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isDietGenerated, setIsDietGenerated] = useState(false);
  
  const [dietData, setDietData] = useState<DietDay | null>(null);
  const [history, setHistory] = useState<HistoryDay[]>([]);

  // Check explicit generation flag from AsyncStorage
  useEffect(() => {
    const checkGenerationStatus = async () => {
      if (user?.id) {
        const dietFlag = await AsyncStorage.getItem(`@fitconnect/diet_created_${user.id}`);
        if (dietFlag === 'true') {
          setIsDietGenerated(true);
        }
      }
    };
    checkGenerationStatus();
  }, [user?.id]);

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
      if (user?.id) {
        await AsyncStorage.setItem(`@fitconnect/diet_created_${user.id}`, 'true');
      }
      setIsDietGenerated(true);
      Toast.show({ type: 'success', text1: 'Meal Plan Generated! 🥗' });
      await fetchDiet();
    } catch (error: any) {
      console.error('Failed to generate diet:', error);
      Toast.show({
        type: 'error',
        text1: 'Generation Failed',
        text2: 'Tap here to retry.',
        onPress: () => handleGenerate(),
        autoHide: false,
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !dietData) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />
        <ActivityIndicator size="large" color="#F59E0B" />
      </SafeAreaView>
    );
  }

  // ─── NO PLAN STATE ─────────────────────────────────────────────────────────
  const hasValidPlan = isDietGenerated || (dietData && dietData.has_plan !== false && (dietData.meals?.length ?? 0) > 0);

  if (!hasValidPlan) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nutrition</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.noPlanContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.noPlanEmoji}>🥗</Text>
          </View>
          <Text style={styles.noPlanTitle}>Your meal plan isn't built yet</Text>
          <Text style={styles.noPlanDesc}>
            Meal plan and macro targets will be generated to match your training load. Takes about 5 seconds.
          </Text>
          <TouchableOpacity 
            style={styles.generateMealButton}
            activeOpacity={0.85}
            onPress={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <View style={styles.generatingRow}>
                <ActivityIndicator size="small" color="#0B0F17" style={{ marginRight: 8 }} />
                <Text style={styles.generateMealButtonTextActive}>Crafting Your Meal Plan...</Text>
              </View>
            ) : (
              <Text style={styles.generateMealButtonTextActive}>Generate My Meal Plan →</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── PLAN ACTIVE STATE ─────────────────────────────────────────────────────
  const target_calories = dietData?.target_calories || dietData?.total_calories || 0;
  const target_protein_g = dietData?.target_protein_g || 0;
  const target_carbs_g = dietData?.target_carbs_g || 0;
  const target_fat_g = dietData?.target_fat_g || 0;
  const insight_text = dietData?.insight_text;
  const hydration = dietData?.hydration;
  const meals = dietData?.meals || [];

  // Macro percentages
  const totalMacros = (target_protein_g * 4) + (target_carbs_g * 4) + (target_fat_g * 9) || 1;
  const pPct = Math.round(((target_protein_g * 4) / totalMacros) * 100) || 30;
  const cPct = Math.round(((target_carbs_g * 4) / totalMacros) * 100) || 45;
  const fPct = Math.round(((target_fat_g * 9) / totalMacros) * 100) || 25;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Nutrition</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Insight Box */}
        {insight_text && (
          <View style={styles.insightBox}>
            <Text style={styles.insightEmoji}>💡</Text>
            <Text style={styles.insightText}>{insight_text}</Text>
          </View>
        )}

        {/* Target Card */}
        <View style={styles.targetCard}>
          <View style={styles.caloriesSection}>
            <Text style={styles.caloriesNumber}>{target_calories.toLocaleString()}</Text>
            <Text style={styles.caloriesLabel}>KCAL DAILY TARGET</Text>
          </View>

          {/* Macro Pills Row */}
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#38BDF8' }]}>{target_protein_g}g</Text>
              <Text style={styles.macroLabel}>Protein ({pPct}%)</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#FBBF24' }]}>{target_carbs_g}g</Text>
              <Text style={styles.macroLabel}>Carbs ({cPct}%)</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: '#F87171' }]}>{target_fat_g}g</Text>
              <Text style={styles.macroLabel}>Fat ({fPct}%)</Text>
            </View>
          </View>

          {/* Horizontal Macro Split Bar */}
          <View style={styles.macroBarContainer}>
            <View style={[styles.macroBarSegment, { width: `${pPct}%`, backgroundColor: '#38BDF8' }]} />
            <View style={[styles.macroBarSegment, { width: `${cPct}%`, backgroundColor: '#FBBF24' }]} />
            <View style={[styles.macroBarSegment, { width: `${fPct}%`, backgroundColor: '#F87171' }]} />
          </View>
        </View>

        {/* Weekly Trend if available */}
        {history.length > 0 && (
          <View style={styles.trendCard}>
            <Text style={styles.trendTitle}>Weekly Intake Trend</Text>
            <View style={styles.sparklineContainer}>
              {history.map((day, idx) => {
                const maxCal = Math.max(...history.map(h => h.total_calories), target_calories, 2000);
                const heightPct = Math.min(100, Math.max(15, (day.total_calories / maxCal) * 100));
                return (
                  <View key={idx} style={styles.sparklineCol}>
                    <View style={[styles.sparklineBar, { height: `${heightPct}%` }]} />
                    <Text style={styles.sparklineDayText}>
                      {day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'narrow' }) : `D${idx + 1}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Hydration Card */}
        {hydration && (
          <View style={styles.hydrationCard}>
            <Text style={styles.hydrationEmoji}>💧</Text>
            <View style={styles.hydrationInfo}>
              <Text style={styles.hydrationLabel}>{hydration.label || 'HYDRATION TARGET'}</Text>
              <Text style={styles.hydrationTarget}>{hydration.target_liters}L Target</Text>
              {hydration.tip && <Text style={styles.hydrationTip}>{hydration.tip}</Text>}
            </View>
          </View>
        )}

        {/* Meals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Planned Meals ({meals.length})</Text>
          {meals.map((meal) => (
            <TouchableOpacity 
              key={meal.id} 
              style={styles.mealCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(Routes.Root.MEAL_DETAIL, { mealId: meal.id })}
            >
              <View style={styles.mealHeader}>
                <View style={styles.slotTag}>
                  <Text style={styles.slotTagText}>{(meal.slot || 'MEAL').replace('_', ' ')}</Text>
                </View>
                {meal.cuisine && (
                  <Text style={styles.cuisineText}>{meal.cuisine}</Text>
                )}
              </View>
              
              <Text style={styles.mealName}>{meal.name}</Text>
              
              <View style={styles.mealFooter}>
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                <Text style={styles.mealMacros}>
                  <Text style={{ color: '#38BDF8' }}>{meal.protein_g}g P</Text>  •  
                  <Text style={{ color: '#FBBF24' }}> {meal.carbs_g}g C</Text>  •  
                  <Text style={{ color: '#F87171' }}> {meal.fat_g}g F</Text>
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
    backgroundColor: '#0B0F17',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2638',
  },
  backText: {
    fontSize: 16,
    color: '#CCFF00',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  noPlanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#131926',
    borderWidth: 1,
    borderColor: '#1E2638',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noPlanEmoji: {
    fontSize: 42,
  },
  noPlanTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  noPlanDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8E9BAE',
    textAlign: 'center',
    marginBottom: 28,
  },
  generateMealButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateMealButtonTextActive: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B0F17',
    letterSpacing: 0.3,
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  insightEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#FBBF24',
    fontWeight: '500',
  },
  targetCard: {
    backgroundColor: '#131926',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  caloriesSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  caloriesNumber: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  caloriesLabel: {
    fontSize: 11,
    color: '#8E9BAE',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E2638',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1E2638',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 11,
    color: '#8E9BAE',
    fontWeight: '500',
  },
  macroBarContainer: {
    height: 6,
    width: '100%',
    flexDirection: 'row',
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#1E2638',
  },
  macroBarSegment: {
    height: '100%',
  },
  trendCard: {
    backgroundColor: '#131926',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  sparklineContainer: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  sparklineCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  sparklineBar: {
    width: 14,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    opacity: 0.9,
  },
  sparklineDayText: {
    fontSize: 10,
    color: '#8E9BAE',
    marginTop: 6,
    fontWeight: '600',
  },
  hydrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131926',
    padding: 16,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  hydrationEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  hydrationInfo: {
    flex: 1,
  },
  hydrationLabel: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '800',
    letterSpacing: 1,
  },
  hydrationTarget: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    marginBottom: 2,
  },
  hydrationTip: {
    fontSize: 12,
    color: '#8E9BAE',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  mealCard: {
    backgroundColor: '#131926',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E2638',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotTag: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
  },
  slotTagText: {
    fontSize: 10,
    color: '#CCFF00',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cuisineText: {
    fontSize: 12,
    color: '#8E9BAE',
    fontWeight: '500',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E2638',
  },
  mealCalories: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mealMacros: {
    fontSize: 12,
    color: '#8E9BAE',
    fontWeight: '600',
  },
});

export default TodaysNutritionScreen;
