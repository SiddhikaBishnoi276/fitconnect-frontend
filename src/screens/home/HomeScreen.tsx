import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { AppButton } from '@components/index';
import { Routes } from '@constants/routes';
import { useAppSelector, useAppDispatch } from '@store/hooks';
import { selectCurrentUser } from '@store/slices/authSlice';
import { selectUnreadNotificationCount, setUnreadNotificationCount } from '@store/slices/uiSlice';
import type { PlanDay, Session, DietDay, ProgressSummary, Notification } from '@t/api';

// --- Missing API Types for this screen ---
interface CurrentPlan {
  id: string;
  name: string;
  days: (PlanDay & { date?: string; day_label?: string; is_completed?: boolean })[];
}

const HomeScreen = (): React.JSX.Element => {
  const user = useAppSelector(selectCurrentUser);
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [planData, setPlanData] = useState<CurrentPlan | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [dietData, setDietData] = useState<DietDay | null>(null);
  const [progressData, setProgressData] = useState<ProgressSummary | null>(null);

  // User explicit generation flags
  // These will be computed from data
  
  const unreadCount = useAppSelector(selectUnreadNotificationCount);

  // UI Action States
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generatingDiet, setGeneratingDiet] = useState(false);

  const insets = useSafeAreaInsets();

  // Removed AsyncStorage generation check, we will compute this from backend data.

  const fetchDashboardData = useCallback(async () => {
    try {
      const [
        planRes,
        sessionRes,
        dietRes,
        progressRes,
        notifRes
      ] = await Promise.allSettled([
        apiClient.get(Endpoints.plans.current),
        apiClient.get(Endpoints.sessions.active),
        apiClient.get(Endpoints.diet.today),
        apiClient.get(Endpoints.progress.me),
        apiClient.get(Endpoints.notifications.list)
      ]);

      if (planRes.status === 'fulfilled') {
        setPlanData(planRes.value.data.data || null);
      } else {
        setPlanData(null);
      }

      if (sessionRes.status === 'fulfilled') {
        setActiveSession(sessionRes.value.data.data || null);
      } else {
        setActiveSession(null);
      }

      if (dietRes.status === 'fulfilled') {
        setDietData(dietRes.value.data.data || null);
      } else {
        setDietData(null);
      }

      if (progressRes.status === 'fulfilled') {
        setProgressData(progressRes.value.data.data || null);
      } else {
        setProgressData(null);
      }

      if (notifRes.status === 'fulfilled') {
        const notifications: Notification[] = notifRes.value.data.data || [];
        const unread = notifications.filter(n => !n.read).length;
        dispatch(setUnreadNotificationCount(unread));
      }

      // TODO: FCM integration
      // @react-native-firebase/messaging is not installed yet.
      // When installed, grab fcm_token here and POST /notifications/device-tokens { fcm_token, platform: 'android' }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    try {
      await apiClient.post(Endpoints.plans.generate);
      await fetchDashboardData();
    } catch (error) {
      console.error('Failed to generate plan:', error);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleGenerateDiet = async () => {
    setGeneratingDiet(true);
    try {
      await apiClient.post(Endpoints.diet.generate);
      await fetchDashboardData();
    } catch (error) {
      console.error('Failed to generate diet:', error);
    } finally {
      setGeneratingDiet(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#CCFF00" />
      </SafeAreaView>
    );
  }

  // Computed flags based on data
  const isPlanGenerated = !!planData && Array.isArray(planData.days) && planData.days.length > 0;
  const isDietGenerated = !!dietData && (dietData.has_plan || (dietData.target_calories && dietData.target_calories > 0));

  // Find today's plan day
  const todayDateStr = new Date().toISOString().split('T')[0]; // Simple YYYY-MM-DD
  const todayPlan = planData?.days?.find(
    (day) => day.date === todayDateStr || day.day_number === new Date().getDay() || !day.date // Fallback logic
  );
  
  // Safe fallbacks for progress
  const currentStreak = progressData?.current_streak || 0;
  const rpTotal = progressData?.total_volume_kg || 0; // Using volume as RP for now
  const tier = rpTotal > 10000 ? 'Gold' : rpTotal > 5000 ? 'Silver' : 'Bronze';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 30 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CCFF00" />
        }
      >
        <View style={styles.responsiveContainer}>
          {/* --- 1. HEADER --- */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Good morning, {user?.name?.split(' ')[0] || 'Rohan'}</Text>
              <View style={styles.streakRow}>
                <Text style={styles.streakFlame}>🔥</Text>
                <Text style={styles.streakHighlight}>{currentStreak}-day streak</Text>
                <Text style={styles.streakDot}> · </Text>
                <Text style={styles.streakMessage}>Keep it going</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.bellButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(Routes.Root.NOTIFICATIONS)}
            >
              <Text style={styles.bellIcon}>🔔</Text>
              {(unreadCount > 0 || unreadCount === 0) && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : '3'}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* --- 2. ACTIVE SESSION BANNER --- */}
          {activeSession && (
            <TouchableOpacity 
              style={styles.activeSessionBanner}
              onPress={() => console.log('Navigate to Live Workout Tracker')}
            >
              <View style={styles.activeSessionContent}>
                <Text style={styles.activeSessionTitle}>Workout in progress</Text>
                <Text style={styles.activeSessionSubtitle}>Resume your workout →</Text>
              </View>
              <Text style={styles.activeSessionIcon}>⏱️</Text>
            </TouchableOpacity>
          )}

          {/* --- 3. TODAY'S SESSION CARD --- */}
          {!activeSession && (
            <View style={styles.sessionCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardCategoryLabel}>TODAY'S SESSION</Text>
                {generatingPlan && (
                  <View style={styles.generatingBadge}>
                    <ActivityIndicator size="small" color="#CCFF00" style={{ marginRight: 6 }} />
                    <Text style={styles.generatingText}>Balancing your sports...</Text>
                  </View>
                )}
              </View>
              
              {generatingPlan ? (
                // Generating / Loading State (Screenshot 2)
                <View style={styles.skeletonContainer}>
                  <View style={styles.skeletonBox} />
                </View>
              ) : !isPlanGenerated ? (
                // Empty State before generation (Screenshot 1)
                <View style={styles.emptySessionContent}>
                  <Text style={styles.emptySessionTitle}>Your first week isn't built yet</Text>
                  <Text style={styles.emptySessionSubtitle}>
                    Tap below to generate your personalised 7-day training plan. Takes about 5 seconds.
                  </Text>
                  <TouchableOpacity 
                    style={styles.generatePlanButton}
                    activeOpacity={0.85}
                    onPress={handleGeneratePlan}
                  >
                    <Text style={styles.generatePlanButtonText}>Generate My 7-Day Plan →</Text>
                  </TouchableOpacity>
                </View>
              ) : todayPlan?.rest_day ? (
                // Rest Day State
                <View style={styles.restDayContainer}>
                  <Text style={styles.restDayEmoji}>🧘</Text>
                  <Text style={styles.restDayTitle}>Recovery day</Text>
                  <Text style={styles.restDayDesc}>Light mobility or full rest</Text>
                </View>
              ) : todayPlan ? (
                // Normal Session State
                <View>
                  <Text style={styles.sessionTitle}>Full Body Power</Text>
                  <View style={styles.sessionMetaRow}>
                    <Text style={styles.sessionMeta}>⏱️ 45 min</Text>
                    <Text style={styles.sessionMeta}>🔥 High Intensity</Text>
                    <Text style={styles.sessionMeta}>💪 {todayPlan.exercises?.length || 0} Exercises</Text>
                  </View>
                  <AppButton 
                    title="Start Session →" 
                    onPress={() => navigation.navigate(Routes.Modals.PRE_WORKOUT_MODAL, { planDayId: (todayPlan as any).plan_day_id })}
                  />
                </View>
              ) : (
                <Text style={styles.emptySessionSubtitle}>No session scheduled for today.</Text>
              )}
            </View>
          )}

          {/* --- 4. THIS WEEK CHIP STRIP --- */}
          {isPlanGenerated && planData && planData.days && planData.days.length > 0 && !generatingPlan && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>This Week</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekStrip}>
                {planData.days.map((day, index) => {
                  const isToday = index === 0;
                  return (
                    <View 
                      key={index} 
                      style={[
                        styles.dayChip, 
                        isToday && styles.dayChipToday,
                        day.is_completed && styles.dayChipCompleted
                      ]}
                    >
                      <Text style={[
                        styles.dayChipText, 
                        isToday && styles.dayChipTextToday,
                        day.is_completed && styles.dayChipTextCompleted
                      ]}>
                        {day.day_label || `Day ${day.day_number}`}
                      </Text>
                      {day.is_completed && <Text style={styles.dayChipCheck}>✓</Text>}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* --- 5. TODAY'S NUTRITION CARD --- */}
          <View style={styles.nutritionCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardCategoryLabel}>TODAY'S NUTRITION</Text>
              {generatingDiet && (
                <View style={styles.generatingBadge}>
                  <ActivityIndicator size="small" color="#F59E0B" style={{ marginRight: 6 }} />
                  <Text style={[styles.generatingText, { color: '#F59E0B' }]}>Crafting macro targets...</Text>
                </View>
              )}
            </View>

            {generatingDiet ? (
              <View style={styles.skeletonContainer}>
                <View style={[styles.skeletonBox, { borderColor: 'rgba(245, 158, 11, 0.2)', backgroundColor: 'rgba(245, 158, 11, 0.04)' }]} />
              </View>
            ) : !isDietGenerated ? (
              <View style={styles.emptyNutritionContent}>
                <Text style={styles.emptyNutritionSubtitle}>
                  Meal plan and macro targets will be generated to match your training load.
                </Text>
                <TouchableOpacity 
                  style={styles.generateMealButton} 
                  activeOpacity={0.8}
                  onPress={handleGenerateDiet} 
                  disabled={generatingDiet}
                >
                  <Text style={styles.generateMealButtonText}>
                    Generate My Meal Plan →
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.activeNutritionRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nutritionStatValue}>
                    {dietData?.target_calories || dietData?.total_calories || 0} kcal
                  </Text>
                  <Text style={styles.nutritionStatLabel}>Daily Target</Text>
                  <TouchableOpacity onPress={() => navigation.navigate(Routes.Root.TODAYS_NUTRITION)}>
                    <Text style={styles.viewPlanLink}>View full meal plan →</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.macroRingPlaceholder}>
                  <Text style={{ fontSize: 24 }}>🥗</Text>
                </View>
              </View>
            )}
          </View>

          {/* --- 6. STATS ROW (STREAK, TIER, TOTAL RP) --- */}
          <View style={styles.statsContainer}>
            {/* Streak Card */}
            <View style={styles.statCard}>
              <Text style={styles.statCardEmoji}>🔥</Text>
              <Text style={styles.statCardValue}>{currentStreak}d</Text>
              <Text style={styles.statCardLabel}>STREAK</Text>
            </View>

            {/* Tier Card */}
            <View style={styles.statCard}>
              <Text style={styles.statCardEmoji}>🏅</Text>
              <Text style={[styles.statCardValue, { color: '#FBBF24' }]}>{tier}</Text>
              <Text style={styles.statCardLabel}>TIER</Text>
            </View>

            {/* Total RP Card */}
            <View style={styles.statCard}>
              <Text style={styles.statCardEmoji}>⚡</Text>
              <Text style={[styles.statCardValue, { color: '#F59E0B' }]}>
                {rpTotal.toLocaleString()}
              </Text>
              <Text style={styles.statCardLabel}>TOTAL RP</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakFlame: {
    fontSize: 14,
    marginRight: 4,
  },
  streakHighlight: {
    color: '#F59E0B',
    fontSize: 13.5,
    fontWeight: '700',
  },
  streakDot: {
    color: '#64748B',
    fontSize: 13.5,
  },
  streakMessage: {
    color: '#94A3B8',
    fontSize: 13.5,
    fontWeight: '400',
  },
  bellButton: {
    width: 44,
    height: 44,
    backgroundColor: '#161B26',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0B0F17',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Active Session Banner
  activeSessionBanner: {
    backgroundColor: '#CCFF00',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  activeSessionContent: {
    flex: 1,
  },
  activeSessionTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  activeSessionSubtitle: {
    color: '#000000',
    fontSize: 13,
    opacity: 0.85,
  },
  activeSessionIcon: {
    fontSize: 26,
  },

  // Session Card
  sessionCard: {
    backgroundColor: '#161B26',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardCategoryLabel: {
    color: '#64748B',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  generatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  generatingText: {
    color: '#CCFF00',
    fontSize: 13,
    fontWeight: '700',
  },
  skeletonContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  skeletonBox: {
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  emptySessionContent: {
    marginTop: 4,
  },
  emptySessionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  emptySessionSubtitle: {
    color: '#94A3B8',
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 20,
  },
  generatePlanButton: {
    backgroundColor: '#CCFF00',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  generatePlanButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // Normal Session Layout
  sessionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 4,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  sessionMeta: {
    color: '#94A3B8',
    fontSize: 12,
    backgroundColor: '#0F141E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },

  // Rest Day
  restDayContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restDayEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  restDayTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  restDayDesc: {
    color: '#94A3B8',
    fontSize: 13,
  },

  // This Week Strip
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  weekStrip: {
    flexDirection: 'row',
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B26',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dayChipToday: {
    borderColor: '#CCFF00',
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
  },
  dayChipCompleted: {
    backgroundColor: '#0F141E',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  dayChipText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  dayChipTextToday: {
    color: '#CCFF00',
    fontWeight: 'bold',
  },
  dayChipTextCompleted: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  dayChipCheck: {
    marginLeft: 4,
    color: '#CCFF00',
    fontSize: 12,
  },

  // Nutrition Card
  nutritionCard: {
    backgroundColor: '#161B26',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  emptyNutritionContent: {
    marginTop: 4,
  },
  emptyNutritionSubtitle: {
    color: '#94A3B8',
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 18,
  },
  generateMealButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderWidth: 1.5,
    borderColor: '#D97706',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateMealButtonText: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '700',
  },
  activeNutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  nutritionStatValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  nutritionStatLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  viewPlanLink: {
    color: '#CCFF00',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  macroRingPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0F141E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats Row
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#161B26',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statCardValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statCardLabel: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
