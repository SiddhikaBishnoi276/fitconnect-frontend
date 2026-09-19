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
import { Spacing } from '@theme/index';
import { useAppSelector } from '@store/hooks';
import { selectCurrentUser } from '@store/slices/authSlice';
import type { DietDay } from '@t/api';

interface HistoryDay {
  date: string;
  target_protein_g: number;
  target_carbs_g: number;
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CCFF00" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Chart */}
        <View style={styles.chartContainer}>
          <View style={styles.largeMacroRing}>
            <View style={styles.chartTextContainer}>
              <Text style={styles.chartCalories}>{target_calories.toLocaleString()}</Text>
              <Text style={styles.chartKcal}>kcal target</Text>
            </View>
          </View>
        </View>

        {/* Insight & Macros */}
        <Text style={styles.insightText}>
          {insight_text}
        </Text>
        
        <View style={styles.macroSummaryRow}>
          <View style={styles.macroDotGroup}>
            <View style={[styles.macroDot, { backgroundColor: '#CCFF00' }]} />
            <Text style={styles.macroLabel}>Protein <Text style={[styles.macroValue, { color: '#CCFF00' }]}>{target_protein_g}g</Text></Text>
          </View>
          <View style={styles.macroDotGroup}>
            <View style={[styles.macroDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.macroLabel}>Carbs <Text style={[styles.macroValue, { color: '#F59E0B' }]}>{target_carbs_g}g</Text></Text>
          </View>
          <View style={styles.macroDotGroup}>
            <View style={[styles.macroDot, { backgroundColor: '#818CF8' }]} />
            <Text style={styles.macroLabel}>Fat <Text style={[styles.macroValue, { color: '#818CF8' }]}>{target_fat_g}g</Text></Text>
          </View>
        </View>

        {/* Hydration Card */}
        {hydration && (
          <View style={styles.hydrationCard}>
            <Text style={styles.hydrationEmoji}>💧</Text>
            <View style={styles.hydrationInfo}>
              <Text style={styles.hydrationTitle}>{hydration.label}</Text>
              <Text style={styles.hydrationTip}>{hydration.tip}</Text>
            </View>
          </View>
        )}

        {/* Meals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MEAL PLAN</Text>
          {meals.map((meal) => {
            const isPre = meal.meal_type === 'PRE_WORKOUT';
            const isPost = meal.meal_type === 'POST_WORKOUT';
            const borderColor = isPre ? '#CCFF00' : isPost ? '#F59E0B' : '#334155';
            const badgeColor = isPre ? 'rgba(204, 255, 0, 0.1)' : 'rgba(245, 158, 11, 0.1)';
            const badgeTextColor = isPre ? '#CCFF00' : '#F59E0B';
            const badgeText = isPre ? 'PRE-WORKOUT' : isPost ? 'POST-WORKOUT' : null;

            return (
              <TouchableOpacity 
                key={meal.id} 
                style={[styles.mealCard, { borderLeftColor: borderColor }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(Routes.Root.MEAL_DETAIL, { mealId: meal.id })}
              >
                <View style={styles.mealCardContent}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealName}>
                      {meal.name.includes(' ') && !meal.name.includes('Emoji') ? meal.name : `🍽️ ${meal.name}`}
                    </Text>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                  
                  <Text style={styles.mealSubtitle}>
                    {meal.description || 'Meal'} · <Text style={{ color: '#CCFF00', fontWeight: '700' }}>{meal.protein_g}g protein</Text> · {meal.calories} kcal
                  </Text>
                  
                  {badgeText && (
                    <View style={[styles.mealBadge, { backgroundColor: badgeColor, borderColor: badgeTextColor }]}>
                      <Text style={[styles.mealBadgeText, { color: badgeTextColor }]}>{badgeText}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
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
  // Active Plan Styles matching Figma
  chartContainer: {
    alignItems: 'center',
    marginTop: Spacing[6],
    marginBottom: Spacing[6],
  },
  largeMacroRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 16,
    borderColor: '#334155', // fallback
    borderTopColor: '#CCFF00', // Protein
    borderRightColor: '#CCFF00', 
    borderBottomColor: '#F59E0B', // Carbs
    borderLeftColor: '#818CF8', // Fat
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  chartTextContainer: {
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
  },
  chartCalories: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
  },
  chartKcal: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  insightText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing[4],
  },
  macroSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[4],
    marginBottom: Spacing[8],
  },
  macroDotGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  macroLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  macroValue: {
    fontWeight: '700',
  },
  hydrationCard: {
    flexDirection: 'row',
    backgroundColor: '#121F2A', // Dark blueish background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    padding: Spacing[4],
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  hydrationEmoji: {
    fontSize: 24,
    marginRight: Spacing[4],
  },
  hydrationInfo: {
    flex: 1,
  },
  hydrationTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  hydrationTip: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: Spacing[6],
  },
  sectionTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: Spacing[4],
  },
  mealCard: {
    backgroundColor: '#161B26',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderLeftWidth: 4, // for the dynamic border
    marginBottom: Spacing[4],
  },
  mealCardContent: {
    padding: Spacing[4],
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  chevron: {
    color: '#64748B',
    fontSize: 20,
    fontWeight: '400',
  },
  mealSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: Spacing[3],
  },
  mealBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  mealBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mealMacros: {
    fontSize: 12,
    color: '#8E9BAE',
    fontWeight: '600',
  },
});

export default TodaysNutritionScreen;
