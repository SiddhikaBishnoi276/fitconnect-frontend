import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

import { AppButton } from '@components/index';
import { Routes } from '@constants/routes';
import type { SessionCompleteResponse } from '@t/api';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';

const SessionCompleteScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Extract from params (expecting the full SessionCompleteResponse payload)
  const sessionData = route.params?.sessionData as SessionCompleteResponse | undefined;
  
  // Extract data from backend response payload safely
  const rpEarned = sessionData?.gamification_rewards?.rp_earned_today || 0;
  const streak = sessionData?.gamification_rewards?.streak_updated?.current_streak || 0;
  const prsBroken = sessionData?.session_summary?.prs_broken_count || 0;
  
  const exercisesCompleted = sessionData?.exercises_performance?.length || 0;
  const durationDisplay = sessionData?.session_summary?.total_duration_display || '0 mins';

  // These might still be passed separately if tracked locally, or we calculate from feedback
  const { adaptedCount = 0, skippedCount = 0 } = route.params || {};

  const handleFinish = () => {
    // Navigate back to Home
    navigation.navigate(Routes.Root.MAIN, { screen: Routes.Main.HOME, params: { refresh: true } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Celebration Area */}
        <View style={styles.celebrationContainer}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.title}>Session Complete!</Text>
          
          {prsBroken > 0 && (
            <View style={styles.prBadge}>
              <Text style={styles.prBadgeText}>🏆 {prsBroken} New Personal Record{prsBroken > 1 ? 's' : ''}!</Text>
            </View>
          )}
        </View>

        {/* RP & Streak Display */}
        <View style={styles.rewardsCard}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardValue}>+{rpEarned}</Text>
            <Text style={styles.rewardLabel}>RP Earned</Text>
          </View>
          
          <View style={styles.rewardDivider} />
          
          <View style={styles.rewardItem}>
            <Text style={styles.rewardValue}>🔥 {streak}</Text>
            <Text style={styles.rewardLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Workout Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{durationDisplay.replace(' mins', 'm')}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{exercisesCompleted}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{adaptedCount}</Text>
            <Text style={styles.statLabel}>Adapted</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{skippedCount}</Text>
            <Text style={styles.statLabel}>Skipped</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton title="Done — Back to Home →" onPress={handleFinish} />
      </View>
    </SafeAreaView>
  );
};

export default SessionCompleteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[10],
    paddingBottom: Spacing[10],
    alignItems: 'center',
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  celebrationEmoji: {
    fontSize: 72,
    marginBottom: Spacing[4],
  },
  title: {
    ...TextPresets.h1,
    color: Colors.brand.primary,
    marginBottom: Spacing[4],
  },
  prBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  prBadgeText: {
    ...TextPresets.body,
    color: '#D97706',
    fontWeight: 'bold',
  },
  rewardsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[6],
    width: '100%',
    marginBottom: Spacing[8],
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  rewardItem: {
    flex: 1,
    alignItems: 'center',
  },
  rewardValue: {
    ...TextPresets.h1,
    color: Colors.brand.primary,
    marginBottom: Spacing[2],
  },
  rewardLabel: {
    ...TextPresets.body,
    color: Colors.text.secondary,
  },
  rewardDivider: {
    width: 1,
    backgroundColor: Colors.border.primary,
    marginHorizontal: Spacing[4],
  },
  sectionTitle: {
    ...TextPresets.h3,
    color: Colors.text.primary,
    width: '100%',
    marginBottom: Spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[4],
    width: '100%',
  },
  statBox: {
    flexBasis: '47%', // roughly half width minus gap
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    alignItems: 'center',
  },
  statValue: {
    ...TextPresets.h2,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  statLabel: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
  },
  footer: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[8],
    backgroundColor: Colors.background.primary,
  }
});
