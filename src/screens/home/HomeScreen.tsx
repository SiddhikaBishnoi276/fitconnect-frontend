import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { useAppSelector, useAppDispatch } from '@store/hooks';
import { selectCurrentUser } from '@store/slices/authSlice';
import { selectUnreadNotificationCount, setUnreadNotificationCount } from '@store/slices/uiSlice';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';
import { Routes } from '@constants/routes';
import { AppButton } from '@components/index';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';

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
  
  const unreadCount = useAppSelector(selectUnreadNotificationCount);

  // UI Action States
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generatingDiet, setGeneratingDiet] = useState(false);

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
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

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
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.primary} />
        }
      >
        {/* --- 1. HEADER --- */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Good morning, {user?.name?.split(' ')[0]}</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>{currentStreak} Keep it going</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.bellButton}
            onPress={() => navigation.navigate(Routes.Root.NOTIFICATIONS)}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* --- 2. ACTIVE SESSION CRASH RECOVERY --- */}
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Session</Text>
            
            {!planData ? (
              // Empty State
              <View style={styles.card}>
                <Text style={styles.emptyTitle}>Your first week isn't built yet</Text>
                <Text style={styles.emptySubtitle}>Let our AI craft a personalized plan based on your goals and schedule.</Text>
                <AppButton 
                  title="Generate My 7-Day Plan →" 
                  onPress={handleGeneratePlan}
                  loading={generatingPlan}
                />
              </View>
            ) : todayPlan?.rest_day ? (
              // Rest Day State
              <View style={styles.card}>
                <Text style={styles.restDayEmoji}>🧘</Text>
                <Text style={styles.restDayTitle}>Recovery day</Text>
                <Text style={styles.restDayDesc}>Light mobility or full rest</Text>
              </View>
            ) : todayPlan ? (
              // Normal Session State
              <View style={styles.card}>
                <Text style={styles.sessionTitle}>Full Body Power</Text>
                <View style={styles.sessionMetaRow}>
                  <Text style={styles.sessionMeta}>⏱️ 45 min</Text>
                  <Text style={styles.sessionMeta}>🔥 High Intensity</Text>
                  <Text style={styles.sessionMeta}>💪 {todayPlan.exercises?.length || 0} Exercises</Text>
                </View>
                <AppButton 
                  title="Start Session →" 
                  onPress={() => navigation.navigate(Routes.Modals.PRE_WORKOUT_MODAL)}
                />
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.emptyTitle}>No session scheduled for today.</Text>
              </View>
            )}
          </View>
        )}

        {/* --- 4. THIS WEEK CHIP STRIP --- */}
        {planData && planData.days && planData.days.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekStrip}>
              {planData.days.map((day, index) => {
                const isToday = index === 0; // simplistic mock
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

        {/* --- 5. NUTRITION MINI-CARD --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition</Text>
          {!dietData ? (
            <View style={[styles.card, styles.rowCard]}>
              <View style={styles.rowCardContent}>
                <Text style={styles.emptyTitle}>No meal plan active</Text>
                <TouchableOpacity onPress={handleGenerateDiet} disabled={generatingDiet}>
                  <Text style={styles.linkText}>
                    {generatingDiet ? 'Generating...' : 'Generate My Meal Plan →'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.largeIcon}>🥗</Text>
            </View>
          ) : (
            <View style={[styles.card, styles.rowCard]}>
              <View style={styles.rowCardContent}>
                <Text style={styles.statValue}>{dietData.total_calories || 0} kcal</Text>
                <Text style={styles.statLabel}>Daily Target</Text>
                <TouchableOpacity onPress={() => navigation.navigate(Routes.Root.TODAYS_NUTRITION)}>
                  <Text style={styles.linkText}>View full meal plan →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.macroRingPlaceholder}>
                <Text>📊</Text>
              </View>
            </View>
          )}
        </View>

        {/* --- 6. QUICK STATS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statBoxValue}>{currentStreak}</Text>
              <Text style={styles.statBoxLabel}>Day Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={styles.statBoxValue}>{tier}</Text>
              <Text style={styles.statBoxLabel}>Rank Tier</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statBoxValue}>{rpTotal}</Text>
              <Text style={styles.statBoxLabel}>Total RP</Text>
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
    backgroundColor: Colors.background.primary,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[8],
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...TextPresets.h2,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  streakEmoji: {
    fontSize: 14,
    marginRight: Spacing[2],
  },
  streakText: {
    ...TextPresets.caption,
    color: '#D97706', // amber
    fontWeight: '600',
  },
  bellButton: {
    padding: Spacing[2],
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    position: 'relative',
  },
  bellIcon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.status.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  badgeText: {
    color: Colors.text.inverse,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Active Session Banner
  activeSessionBanner: {
    backgroundColor: Colors.brand.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  activeSessionContent: {
    flex: 1,
  },
  activeSessionTitle: {
    ...TextPresets.h4,
    color: Colors.text.inverse,
    marginBottom: Spacing[1],
  },
  activeSessionSubtitle: {
    ...TextPresets.body,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  activeSessionIcon: {
    fontSize: 28,
  },

  // Generic Sections
  section: {
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
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCardContent: {
    flex: 1,
  },
  
  // Empty States
  emptyTitle: {
    ...TextPresets.h4,
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  emptySubtitle: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    marginBottom: Spacing[6],
  },
  linkText: {
    ...TextPresets.body,
    color: Colors.brand.primary,
    fontWeight: '600',
    marginTop: Spacing[2],
  },
  largeIcon: {
    fontSize: 40,
  },

  // Session Card
  sessionTitle: {
    ...TextPresets.h3,
    color: Colors.text.primary,
    marginBottom: Spacing[4],
  },
  sessionMetaRow: {
    flexDirection: 'row',
    gap: Spacing[4], // Note: gap might fail in strict older RN types, will fix if needed
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

  // Rest Day
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

  // This Week Strip
  weekStrip: {
    flexDirection: 'row',
    marginHorizontal: -Layout.screenPaddingH,
    paddingHorizontal: Layout.screenPaddingH,
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

  // Nutrition Stats
  statValue: {
    ...TextPresets.h2,
    color: Colors.text.primary,
  },
  statLabel: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing[2],
  },
  macroRingPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Quick Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: Spacing[2],
  },
  statBoxValue: {
    ...TextPresets.h4,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  statBoxLabel: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
