import { useNavigation, useRoute } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';

import { AppButton } from '@components/index';
import { Routes } from '@constants/routes';
import type { SessionCompleteResponse } from '@t/api';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';

const SessionCompleteScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Extract from params (support both sessionData and summaryData param keys)
  const sessionData = (route.params?.sessionData || route.params?.summaryData) as SessionCompleteResponse | undefined;

  // Extract data from backend response payload safely
  const rpEarned = sessionData?.rp_awarded || 0;
  const streak = sessionData?.new_current_streak || 0;
  const prsBroken = sessionData?.new_prs?.length || 0;

  const exercisesCompleted = sessionData?.exercises_completed || 0;
  const totalExercises = route.params?.totalExercises || exercisesCompleted;
  const durationDisplay = sessionData?.duration_min ? `${sessionData.duration_min} min` : '0 min';

  // Prioritize backend payload values for adaptation/skips over local params
  const { adaptedCount: paramAdaptedCount = 0, skippedCount: paramSkippedCount = 0 } = route.params || {};
  const adaptedCount = sessionData?.adapted_count ?? paramAdaptedCount;
  const skippedCount = sessionData?.skipped_count ?? paramSkippedCount;

  const handleFinish = () => {
    navigation.navigate(Routes.Root.MAIN, { screen: Routes.Main.HOME, params: { refresh: true } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.flagIcon}>🏁</Text>
          <Text style={styles.title}>Session Complete!</Text>
          <Text style={styles.subtitle}>Sprint Intervals + Agility · Today</Text>
        </View>

        {/* PR Card */}
        {prsBroken > 0 && (
          <View style={styles.prCard}>
            <View style={styles.prBadgeContainer}>
              <Text style={styles.prBadgeText}>NEW PR</Text>
            </View>
            <Text style={styles.prTitle}>{prsBroken} Personal Record{prsBroken > 1 ? 's' : ''}</Text>
          </View>
        )}

        {/* RP & Streak Display */}
        <View style={styles.rewardsCard}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardValue}>+{rpEarned}</Text>
            <Text style={styles.rewardLabel}>RP Earned</Text>
          </View>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardValue}>🔥 {streak}d</Text>
            <Text style={styles.rewardLabel}>Streak</Text>
          </View>
        </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>⏱</Text>
              <Text style={styles.statValue}>{durationDisplay.replace(' mins', ' min')}</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statValue}>{exercisesCompleted} / {totalExercises}</Text>
              <Text style={styles.statLabel}>Exercises Done</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>🤖</Text>
              <Text style={styles.statValue}>{adaptedCount} exercises</Text>
              <Text style={styles.statLabel}>AI Adapted</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>⏭</Text>
              <Text style={styles.statValue}>{skippedCount}</Text>
              <Text style={styles.statLabel}>Skipped</Text>
            </View>
          </View>

          {/* RP Banner */}
          <View style={styles.rpBanner}>
            <Text style={styles.rpEarnedText}>⚡ +{rpEarned} RP earned</Text>
            <Text style={styles.streakBonusText}>Streak bonus: ×1.5</Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.homeButton} onPress={handleFinish}>
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default SessionCompleteScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F141E',
  },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[10],
    paddingBottom: Spacing[10],
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  flagIcon: {
    fontSize: 48,
    marginBottom: Spacing[4],
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: Spacing[2],
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
  },
  prCard: {
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.2)',
    borderRadius: 16,
    padding: Spacing[5],
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  prBadgeContainer: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: Spacing[3],
  },
  prBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  prTitle: {
    color: '#CCFF00',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing[2],
  },
  prSubtitle: {
    color: '#64748B',
    fontSize: 13,
  },
  rewardsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    width: '100%',
    marginBottom: Spacing[6],
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardValue: {
    color: '#CCFF00',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  rewardLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
    marginBottom: Spacing[8],
  },
  statBox: {
    width: '47%',
    backgroundColor: '#161B26',
    borderRadius: 16,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statIcon: {
    fontSize: 18,
    marginBottom: Spacing[2],
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  rpBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: Spacing[4],
    width: '100%',
    marginBottom: Spacing[6],
  },
  rpEarnedText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '800',
  },
  streakBonusText: {
    color: '#64748B',
    fontSize: 12,
  },
  homeButton: {
    backgroundColor: '#CCFF00',
    width: '100%',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  }
});
