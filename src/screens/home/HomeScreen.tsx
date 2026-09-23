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
import { Alert } from 'react-native';

const HomeScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [planData, setPlanData] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [dietData, setDietData] = useState<DietDay | null>(null);
  const [progressData, setProgressData] = useState<ProgressSummary | null>(null);

  // User explicit generation flags
  // These will be computed from data

  const unreadCount = useAppSelector(selectUnreadNotificationCount);
  const user = useAppSelector(selectCurrentUser);


  // UI Action States
  const [generatePlanStatus, setGeneratePlanStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [generateDietStatus, setGenerateDietStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const insets = useSafeAreaInsets();

  // Removed AsyncStorage generation check, we will compute this from backend data.

  const fetchDashboardData = useCallback(async () => {
    setProgressData(null);
    setPlanData(null);
    setDietData(null);
    setActiveSession(null);
    try {
      const timestamp = Date.now();
      const [planRes, sessionRes, dietRes, progressRes, notifRes] = await Promise.allSettled([
        apiClient.get(`${Endpoints.plans.current}?t=${timestamp}`),
        apiClient.get(`${Endpoints.sessions.active}?t=${timestamp}`),
        apiClient.get(`${Endpoints.diet.today}?t=${timestamp}`),
        apiClient.get(`${Endpoints.progress.me}?t=${timestamp}`),
        apiClient.get(`${Endpoints.notifications.list}?t=${timestamp}`)
      ]);

      if (planRes.status === 'fulfilled') setPlanData(planRes.value.data?.data || null);
      if (sessionRes.status === 'fulfilled') setActiveSession(sessionRes.value.data?.data || null);
      if (dietRes.status === 'fulfilled') setDietData(dietRes.value.data?.data || null);
      if (progressRes.status === 'fulfilled') setProgressData(progressRes.value.data?.data || null);

      if (notifRes.status === 'fulfilled') {
        const notifs = notifRes.value.data?.data || [];
        const safeNotifs = Array.isArray(notifs) ? notifs : [];
        dispatch(setUnreadNotificationCount(safeNotifs.filter((n: any) => !n.is_read).length));
      }

    } catch (error) {
      console.warn('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);

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
    setGeneratePlanStatus('loading');
    console.log('[HOME] Starting POST /plans/generate...');
    try {
      const fetchPromise = apiClient.post(Endpoints.plans.generate).then(res => {
        console.log('[HOME] POST /plans/generate SUCCESS:', JSON.stringify(res.data));
        return res;
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 30000)
      );

      await Promise.race([fetchPromise, timeoutPromise]);
      await fetchDashboardData();
      setGeneratePlanStatus('idle');
    } catch (error: any) {
      console.error('[HOME] Failed to generate plan ERROR:', error.response?.data || error.message);
      if (error.message === 'TIMEOUT_EXCEEDED' || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setGeneratePlanStatus('error');
      } else {
        setGeneratePlanStatus('idle');
        Alert.alert('Generation Failed', error.message || 'Failed to generate plan. Please try again.');
      }
    }
  };

  const handleGenerateDiet = async () => {
    setGenerateDietStatus('loading');
    console.log('[HOME] Starting POST /diet/generate...');
    try {
      const fetchPromise = apiClient.post(Endpoints.diet.generate).then(res => {
        console.log('[HOME] POST /diet/generate SUCCESS:', JSON.stringify(res.data));
        return res;
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 30000)
      );

      await Promise.race([fetchPromise, timeoutPromise]);
      await fetchDashboardData();
      setGenerateDietStatus('idle');
    } catch (error: any) {
      console.error('[HOME] Failed to generate diet ERROR:', error.response?.data || error.message);
      if (error.message === 'TIMEOUT_EXCEEDED' || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        setGenerateDietStatus('error');
      } else {
        setGenerateDietStatus('idle');
        Alert.alert('Generation Failed', error.message || 'Failed to generate meal plan. Please try again.');
      }
    }
  };

  if (loading && !planData) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#CCFF00" />
      </SafeAreaView>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Computed flags based on data
  const isPlanGenerated = !!planData && Array.isArray(planData.days) && planData.days.length > 0;
  const isDietGenerated = !!dietData && (dietData.has_plan || (dietData.data?.target_calories && dietData.data.target_calories > 0));

  // Find today's plan day: prioritize backend is_today, then current_day_index, then day of week
  const currentDayIdx = planData?.current_day_index || (new Date().getDay() === 0 ? 7 : new Date().getDay());
  const todayPlan = planData?.days?.find((day: any) => day.is_today)
    || planData?.days?.find((day: any) => day.day_index === currentDayIdx)
    || planData?.days?.[0];
  
  if (todayPlan && !todayPlan._logged) {
    console.warn('[DEBUG] todayPlan is:', JSON.stringify(todayPlan, null, 2));
    todayPlan._logged = true;
  }

  // Safe fallbacks for progress
  const currentStreak = progressData?.current_streak || 0;
  const rpTotal = (progressData as any)?.rp_total || 0;
  const tier = (progressData as any)?.tier || 'Bronze';

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
              <Text style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'Athlete'}</Text>
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
              onPress={() => navigation.navigate(Routes.Modals.LIVE_WORKOUT_TRACKER, { session: activeSession, sessionData: activeSession })}
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
            <View style={[styles.sessionCard, todayPlan?.is_completed && styles.sessionCardCompleted]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardCategoryLabel, todayPlan?.is_completed && styles.cardCategoryLabelCompleted]}>
                  {todayPlan?.is_completed ? "TODAY'S SESSION · COMPLETED ✓" : "TODAY'S SESSION"}
                </Text>
                {generatePlanStatus === 'loading' && (
                  <View style={styles.generatingBadge}>
                    <ActivityIndicator size="small" color="#CCFF00" style={{ marginRight: 6 }} />
                    <Text style={styles.generatingText}>Balancing your sports...</Text>
                  </View>
                )}
                {generatePlanStatus === 'error' && (
                  <View style={[styles.generatingBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                    <Text style={[styles.generatingText, { color: '#EF4444' }]}>Taking longer than expected</Text>
                  </View>
                )}
              </View>

              {generatePlanStatus === 'loading' ? (
                // Generating / Loading State (Screenshot 2)
                <View style={styles.skeletonContainer}>
                  <View style={styles.skeletonBox} />
                </View>
              ) : generatePlanStatus === 'error' ? (
                // Timeout Error State
                <View style={styles.emptySessionContent}>
                  <Text style={[styles.emptySessionTitle, { color: '#EF4444' }]}>Generation taking too long</Text>
                  <Text style={styles.emptySessionSubtitle}>
                    The AI is still processing your request or it timed out. You can retry.
                  </Text>
                  <TouchableOpacity
                    style={[styles.generatePlanButton, { backgroundColor: '#EF4444' }]}
                    activeOpacity={0.85}
                    onPress={handleGeneratePlan}
                  >
                    <Text style={styles.generatePlanButtonText}>Retry Generation ↺</Text>
                  </TouchableOpacity>
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
              ) : todayPlan?.is_rest_day ? (
                // Rest Day State
                <View style={styles.restDayContainer}>
                  <Text style={styles.restDayEmoji}>🧘</Text>
                  <Text style={styles.restDayTitle}>Recovery day</Text>
                  <Text style={styles.restDayDesc}>Light mobility or full rest</Text>
                </View>
              ) : todayPlan?.is_completed ? (
                // Completed Session State (Workouts done for today)
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={styles.sessionTitle}>{todayPlan.title}</Text>
                      <View style={styles.sessionMetaRow}>
                        <Text style={styles.sessionMetaTime}>⏱ {todayPlan.estimated_duration_min} min</Text>
                        <View style={styles.intensityDots}>
                          <View style={[styles.dot, { backgroundColor: todayPlan.intensity === 'High' ? '#EF4444' : '#64748B' }]} />
                          <View style={[styles.dot, { backgroundColor: todayPlan.intensity === 'High' || todayPlan.intensity === 'Medium' ? '#EF4444' : '#64748B' }]} />
                          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                        </View>
                        <Text style={styles.sessionMetaIntensity}>{todayPlan.intensity}</Text>
                        <Text style={styles.sessionMetaGlobe}>🌎</Text>
                      </View>
                    </View>
                    <View style={[styles.exercisesBadge, styles.exercisesBadgeCompleted]}>
                      <Text style={[styles.exercisesBadgeNumber, { color: '#CCFF00' }]}>✓</Text>
                      <Text style={[styles.exercisesBadgeLabel, { color: '#CCFF00' }]}>DONE</Text>
                    </View>
                  </View>

                  {/* Exercises List showing completed checkmarks */}
                  <View style={styles.exerciseList}>
                    {todayPlan.exercises?.slice(0, 3).map((ex: any, idx: number) => (
                      <View key={idx} style={styles.exerciseRow}>
                        <Text style={[styles.exerciseName, { color: '#94A3B8' }]} numberOfLines={1}>
                          ✓ {ex.exercise_name}
                        </Text>
                        <Text style={[styles.exerciseSets, { color: '#CCFF00', fontWeight: '700' }]}>Finished</Text>
                      </View>
                    ))}
                    {todayPlan.exercises && todayPlan.exercises.length > 3 && (
                      <Text style={[styles.moreExercisesText, { color: '#64748B' }]}>
                        +{todayPlan.exercises.length - 3} more completed
                      </Text>
                    )}
                  </View>

                  {/* Completed Status Box */}
                  <View style={styles.completedSessionBanner}>
                    <Text style={styles.completedSessionBannerIcon}>🎉</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.completedSessionBannerTitle}>Workout Completed for Today!</Text>
                      <Text style={styles.completedSessionBannerSubtitle}>
                        You have completed all exercises. Rest up and see you tomorrow!
                      </Text>
                    </View>
                  </View>
                </View>
              ) : todayPlan ? (
                // Normal Session State
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={styles.sessionTitle}>{todayPlan.title}</Text>
                      <View style={styles.sessionMetaRow}>
                        <Text style={styles.sessionMetaTime}>⏱ {todayPlan.estimated_duration_min} min</Text>
                        <View style={styles.intensityDots}>
                          <View style={[styles.dot, { backgroundColor: todayPlan.intensity === 'High' ? '#EF4444' : '#64748B' }]} />
                          <View style={[styles.dot, { backgroundColor: todayPlan.intensity === 'High' || todayPlan.intensity === 'Medium' ? '#EF4444' : '#64748B' }]} />
                          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                        </View>
                        <Text style={styles.sessionMetaIntensity}>{todayPlan.intensity}</Text>
                        <Text style={styles.sessionMetaGlobe}>🌎</Text>
                      </View>
                    </View>
                    <View style={styles.exercisesBadge}>
                      <Text style={styles.exercisesBadgeNumber}>{todayPlan.exercises?.length}</Text>
                      <Text style={styles.exercisesBadgeLabel}>EXERCISES</Text>
                    </View>
                  </View>

                  {/* Exercises List */}
                  <View style={styles.exerciseList}>
                    {todayPlan.exercises?.slice(0, 3).map((ex: any, idx: number) => (
                      <View key={idx} style={styles.exerciseRow}>
                        <Text style={styles.exerciseName} numberOfLines={1}>{ex.exercise_name}</Text>
                        <Text style={styles.exerciseSets}>{ex.sets} × {ex.reps}</Text>
                      </View>
                    ))}
                    {todayPlan.exercises && todayPlan.exercises.length > 3 && (
                      <Text style={styles.moreExercisesText}>+{todayPlan.exercises.length - 3} more exercises</Text>
                    )}
                  </View>

                  {todayPlan?.is_completed ? (
                    <View style={[styles.startSessionButton, { backgroundColor: '#1A2E1A', borderWidth: 1, borderColor: '#CCFF00', opacity: 0.85 }]}>
                      <Text style={[styles.startSessionButtonText, { color: '#CCFF00' }]}>✓ Session Completed</Text>
                    </View>
                  ) : activeSession ? (
                    // Session already active — resume directly, don't create a new one
                    <TouchableOpacity
                      style={[styles.startSessionButton, { backgroundColor: '#1A2E1A', borderWidth: 1, borderColor: '#CCFF00' }]}
                      onPress={() => navigation.navigate(Routes.Modals.LIVE_WORKOUT_TRACKER, {
                        session: activeSession,
                        sessionData: activeSession
                      })}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.startSessionButtonText}>⏱ Resume Session →</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.startSessionButton}
                      onPress={() => navigation.navigate(Routes.Modals.PRE_WORKOUT_MODAL, {
                        planDayId: todayPlan.plan_day_id || todayPlan.day_id || todayPlan.id,
                        sessionTitle: todayPlan.title,
                        sessionDuration: todayPlan.estimated_duration_min
                      })}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.startSessionButtonText}>Start Session →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <Text style={styles.emptySessionSubtitle}>No session scheduled for today.</Text>
              )}
            </View>
          )}

          {/* --- 4. THIS WEEK CHIP STRIP --- */}
          {isPlanGenerated && planData && planData.days && planData.days.length > 0 && generatePlanStatus !== 'loading' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>This Week</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekStrip}>
                {planData.days.map((day: any, index: number) => {
                  const isToday = day.is_today ?? (day.day_index === currentDayIdx);
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
                        {`Day ${day.day_index || day.day_number || (index + 1)}`}
                      </Text>
                      {day.is_completed && <Text style={styles.dayChipCheck}>✓</Text>}
                      {isToday && !day.is_completed && <View style={styles.todayDot} />}
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
              {generateDietStatus === 'loading' && (
                <View style={styles.generatingBadge}>
                  <ActivityIndicator size="small" color="#F59E0B" style={{ marginRight: 6 }} />
                  <Text style={[styles.generatingText, { color: '#F59E0B' }]}>Crafting macro targets...</Text>
                </View>
              )}
              {generateDietStatus === 'error' && (
                <View style={[styles.generatingBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <Text style={[styles.generatingText, { color: '#EF4444' }]}>Timeout</Text>
                </View>
              )}
            </View>

            {generateDietStatus === 'loading' ? (
              <View style={styles.skeletonContainer}>
                <View style={[styles.skeletonBox, { borderColor: 'rgba(245, 158, 11, 0.2)', backgroundColor: 'rgba(245, 158, 11, 0.04)' }]} />
              </View>
            ) : generateDietStatus === 'error' ? (
              <View style={styles.emptyNutritionContent}>
                <Text style={[styles.emptySessionTitle, { color: '#EF4444', marginBottom: 8 }]}>Request timed out</Text>
                <Text style={styles.emptyNutritionSubtitle}>
                  Please retry generating your meal plan.
                </Text>
                <TouchableOpacity
                  style={[styles.generatePlanButton, { backgroundColor: '#EF4444' }]}
                  activeOpacity={0.8}
                  onPress={handleGenerateDiet}
                >
                  <Text style={styles.generatePlanButtonText}>
                    Retry Generation ↺
                  </Text>
                </TouchableOpacity>
              </View>
            ) : !isDietGenerated ? (
              <View style={styles.emptyNutritionContent}>
                <Text style={styles.emptyNutritionSubtitle}>
                  Meal plan and macro targets will be generated to match your training load.
                </Text>
                <TouchableOpacity
                  style={styles.generatePlanButton}
                  activeOpacity={0.8}
                  onPress={handleGenerateDiet}
                >
                  <Text style={styles.generatePlanButtonText}>
                    Generate Today's Meal Plan →
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.activeNutritionContainer}>
                {/* Chart & Macros Row */}
                <View style={styles.nutritionDataRow}>
                  {/* Circular Chart Placeholder */}
                  <View style={styles.macroChartContainer}>
                    <View style={styles.macroChartRing}>
                      <Text style={styles.chartCalories}>{dietData?.target_calories || dietData?.data?.target_calories || dietData?.data?.total_calories || 0}</Text>
                      <Text style={styles.chartKcal}>kcal</Text>
                    </View>
                  </View>

                  {/* Macro List */}
                  <View style={styles.macroList}>
                    <View style={styles.macroRow}>
                      <View style={styles.macroLabelGroup}>
                        <View style={[styles.macroDot, { backgroundColor: '#CCFF00' }]} />
                        <Text style={styles.macroLabel}>Protein</Text>
                      </View>
                      <Text style={styles.macroValue}>{dietData?.target_protein_g || dietData?.data?.target_protein_g || 0}g</Text>
                    </View>
                    <View style={styles.macroRow}>
                      <View style={styles.macroLabelGroup}>
                        <View style={[styles.macroDot, { backgroundColor: '#F59E0B' }]} />
                        <Text style={styles.macroLabel}>Carbs</Text>
                      </View>
                      <Text style={styles.macroValue}>{dietData?.target_carbs_g || dietData?.data?.target_carbs_g || 0}g</Text>
                    </View>
                    <View style={styles.macroRow}>
                      <View style={styles.macroLabelGroup}>
                        <View style={[styles.macroDot, { backgroundColor: '#818CF8' }]} />
                        <Text style={styles.macroLabel}>Fat</Text>
                      </View>
                      <Text style={styles.macroValue}>{dietData?.target_fat_g || dietData?.data?.target_fat_g || 0}g</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity onPress={() => navigation.navigate(Routes.Root.TODAYS_NUTRITION)}>
                  <Text style={styles.viewPlanLink}>View full meal plan →</Text>
                </TouchableOpacity>
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
    borderColor: 'rgba(204, 255, 0, 0.4)',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161B26',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 50,
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
    color: '#CCFF00',
    fontSize: 12,
    marginTop: 4,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCFF00',
    marginTop: 6,
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

  // --- New Styles for Updated Session UI ---
  exercisesBadge: {
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  exercisesBadgeNumber: {
    color: '#CCFF00',
    fontSize: 18,
    fontWeight: '900',
  },
  exercisesBadgeLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sessionMetaTime: {
    color: '#94A3B8',
    fontSize: 13,
  },
  intensityDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sessionMetaIntensity: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  sessionMetaGlobe: {
    fontSize: 13,
    marginLeft: 2,
  },
  exerciseList: {
    marginTop: 8,
    marginBottom: 20,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  exerciseName: {
    color: '#E2E8F0',
    fontSize: 14,
    flex: 1,
    paddingRight: 10,
  },
  exerciseSets: {
    color: '#64748B',
    fontSize: 14,
  },
  moreExercisesText: {
    color: '#CCFF00',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  startSessionButton: {
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
  startSessionButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // --- New Styles for Updated Nutrition UI ---
  activeNutritionContainer: {
    marginTop: 8,
  },
  nutritionDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  macroChartContainer: {
    marginRight: 24,
  },
  macroChartRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#334155',
    borderTopColor: '#CCFF00',
    borderRightColor: '#F59E0B',
    borderBottomColor: '#818CF8',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-45deg' }], // To stagger the colors roughly like the design
  },
  chartCalories: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    transform: [{ rotate: '45deg' }], // Counter-rotate text
  },
  chartKcal: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    transform: [{ rotate: '45deg' }],
  },
  macroList: {
    flex: 1,
    gap: 10,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  macroLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  macroValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Completed Session Styles
  sessionCardCompleted: {
    borderColor: 'rgba(204, 255, 0, 0.25)',
    backgroundColor: '#121722',
  },
  cardCategoryLabelCompleted: {
    color: '#CCFF00',
    fontWeight: '800',
  },
  exercisesBadgeCompleted: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderColor: 'rgba(204, 255, 0, 0.4)',
  },
  completedSessionBanner: {
    backgroundColor: 'rgba(204, 255, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  completedSessionBannerIcon: {
    fontSize: 26,
  },
  completedSessionBannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  completedSessionBannerSubtitle: {
    color: '#94A3B8',
    fontSize: 12.5,
    lineHeight: 18,
  },
});
