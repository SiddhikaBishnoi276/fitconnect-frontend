import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl 
} from 'react-native';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { AppButton } from '@components/index';
import { Routes } from '@constants/routes';
import { useAppDispatch } from '@store/hooks';
import { setUnreadNotificationCount } from '@store/slices/uiSlice';
import type { HomeDashboardResponse } from '@t/api';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';

const HomeScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<HomeDashboardResponse | null>(null);

  // UI Action States
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generatingDiet, setGeneratingDiet] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await apiClient.get(Endpoints.home.get);
      if (res.data?.success) {
        const data: HomeDashboardResponse = res.data.data;
        setDashboardData(data);
        dispatch(setUnreadNotificationCount(data.header.unread_notifications_count));
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

  if (loading && !dashboardData) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  const { header, today_session, today_nutrition, stats } = dashboardData || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.primary} />
        }
      >
        {/* --- 1. HEADER --- */}
        {header && (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{header.display_greeting}</Text>
              <View style={styles.streakBadge}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakText}>{header.streak_text}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.bellButton}
              onPress={() => navigation.navigate(Routes.Root.NOTIFICATIONS)}
            >
              <Text style={styles.bellIcon}>🔔</Text>
              {header.unread_notifications_count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {header.unread_notifications_count > 9 ? '9+' : header.unread_notifications_count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* --- 2. ACTIVE SESSION CRASH RECOVERY --- */}
        {today_session?.status === 'IN_PROGRESS' && (
          <TouchableOpacity 
            style={styles.activeSessionBanner}
            onPress={() => navigation.navigate(Routes.Modals.LIVE_WORKOUT_TRACKER)}
          >
            <View style={styles.activeSessionContent}>
              <Text style={styles.activeSessionTitle}>Workout in progress</Text>
              <Text style={styles.activeSessionSubtitle}>Resume your workout →</Text>
            </View>
            <Text style={styles.activeSessionIcon}>⏱️</Text>
          </TouchableOpacity>
        )}

        {/* --- 3. TODAY'S SESSION CARD --- */}
        {today_session?.status !== 'IN_PROGRESS' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Session</Text>
            
            {!today_session?.has_plan ? (
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
            ) : !today_session.today_workout || today_session.today_workout.total_exercises === 0 ? (
              <View style={styles.card}>
                <Text style={styles.restDayEmoji}>🧘</Text>
                <Text style={styles.restDayTitle}>{today_session.title || "Rest Day"}</Text>
                <Text style={styles.restDayDesc}>Light mobility or full rest</Text>
              </View>
            ) : (
              // Normal Session State
              <View style={styles.card}>
                <Text style={styles.sessionTitle}>{today_session.title}</Text>
                <View style={styles.sessionMetaRow}>
                  <Text style={styles.sessionMeta}>⏱️ {today_session.estimated_duration_min} min</Text>
                  <Text style={styles.sessionMeta}>🔥 {today_session.intensity}</Text>
                  <Text style={styles.sessionMeta}>💪 {today_session.today_workout?.total_exercises || 0} Exercises</Text>
                </View>
                <AppButton 
                  title={today_session.action_button || "Start Session →"} 
                  onPress={() => navigation.navigate(Routes.Modals.PRE_WORKOUT_MODAL)}
                />
              </View>
            )}
          </View>
        )}

        {/* --- 4. NUTRITION MINI-CARD --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition</Text>
          {!today_nutrition?.has_plan ? (
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
                <Text style={styles.statValue}>{today_nutrition.calories_target || 0} kcal</Text>
                <Text style={styles.statLabel}>Daily Target</Text>
                <TouchableOpacity onPress={() => navigation.navigate(Routes.Root.TODAYS_NUTRITION)}>
                  <Text style={styles.linkText}>{today_nutrition.action_button || "View full meal plan →"}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.macroRingPlaceholder}>
                <Text>📊</Text>
              </View>
            </View>
          )}
        </View>

        {/* --- 5. QUICK STATS --- */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statEmoji}>🔥</Text>
                <Text style={styles.statBoxValue}>{stats.streak.display}</Text>
                <Text style={styles.statBoxLabel}>{stats.streak.label}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statEmoji}>🏆</Text>
                <Text style={styles.statBoxValue}>{stats.tier.display}</Text>
                <Text style={styles.statBoxLabel}>{stats.tier.label}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statEmoji}>⭐</Text>
                <Text style={styles.statBoxValue}>{stats.total_rp.display}</Text>
                <Text style={styles.statBoxLabel}>{stats.total_rp.label}</Text>
              </View>
            </View>
          </View>
        )}

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
  }
});
