import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';

import { AppButton, AppTextInput } from '@components/index';
import { Routes } from '@constants/routes';
import type { SessionCompleteResponse } from '@t/api';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';

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

  const [draftState, setDraftState] = useState<'idle' | 'loading_draft' | 'editing' | 'posting' | 'success'>('idle');
  const [draftCaption, setDraftCaption] = useState('');
  const [prId, setPrId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const sessionId = route.params?.sessionId || route.params?.id || (sessionData as any)?.id || (sessionData as any)?.session_id || 'unknown';

  const handleShareTap = async () => {
    try {
      setErrorText(null);
      setDraftState('loading_draft');
      const payloadSessionId = sessionId === 'unknown' ? null : sessionId;
      const response = await apiClient.post(`${Endpoints.social.createPost}/draft`, { session_id: payloadSessionId });
      let caption = response.data?.caption || '';
      const prIdReturned = response.data?.pr_id || null;
      
      if (prsBroken > 0 && sessionData?.new_prs?.length) {
        const firstPr = sessionData.new_prs[0];
        const exName = firstPr.exercise_name || firstPr.name || firstPr.exercise?.name || 'an exercise';
        const prValue = firstPr.value || '';
        const prUnit = firstPr.unit || 'kg';
        
        if (!caption || !caption.includes('PR') || !caption.includes(exName)) {
           caption = `Just finished today's session — new PR on ${exName}: ${prValue}${prUnit}! 🎉\n\n${caption}`.trim();
        }
        setPrId(firstPr.id || firstPr.pr_id || prIdReturned);
      } else {
        setPrId(prIdReturned);
      }

      setDraftCaption(caption);
      setDraftState('editing');
    } catch (err) {
      // Fallback if endpoint doesn't exist yet
      let caption = "Just crushed a session on FitConnect! 💪";
      if (prsBroken > 0 && sessionData?.new_prs?.length) {
        const firstPr = sessionData.new_prs[0];
        const exName = firstPr.exercise_name || firstPr.name || firstPr.exercise?.name || 'an exercise';
        const prValue = firstPr.value || '';
        const prUnit = firstPr.unit || 'kg';
        caption = `Just finished today's session — new PR on ${exName}: ${prValue}${prUnit}! 🎉`;
        setPrId(firstPr.id || firstPr.pr_id);
      }
      setDraftCaption(caption);
      setDraftState('editing');
    }
  };

  const handlePost = async () => {
    try {
      setErrorText(null);
      setDraftState('posting');
      const type = (prsBroken > 0 && prId) ? 'pr' : 'session_complete';
      const payloadSessionId = sessionId === 'unknown' ? null : sessionId;
      
      await apiClient.post(Endpoints.social.createPost, {
        type,
        caption: draftCaption,
        session_id: payloadSessionId,
        pr_id: prId || null,
      });
      setDraftState('success');
    } catch (err: any) {
      console.warn('Post error:', err.response?.data || err.message);
      setErrorText('Failed to share to feed. Please try again.');
      setDraftState('editing');
    }
  };

  const handleFinish = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: Routes.Root.MAIN }],
    });
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

          {/* Share Section */}
          {draftState === 'idle' && (
            <TouchableOpacity 
              style={[styles.homeButton, { backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.primary, marginBottom: 12 }]} 
              onPress={handleShareTap}
            >
              <Text style={[styles.homeButtonText, { color: Colors.text.primary }]}>
                {prsBroken > 0 ? 'Post with PR →' : 'Share this session →'}
              </Text>
            </TouchableOpacity>
          )}
          {draftState === 'loading_draft' && (
            <TouchableOpacity 
              style={[styles.homeButton, { backgroundColor: Colors.background.secondary, borderWidth: 1, borderColor: Colors.border.primary, marginBottom: 12 }]} 
              disabled
            >
              <ActivityIndicator color={Colors.brand.primary} />
            </TouchableOpacity>
          )}
          {draftState === 'editing' && (
            <View style={styles.shareCard}>
              <Text style={styles.shareCardTitle}>Share this?</Text>
              <View style={{ marginBottom: 16 }}>
                <AppTextInput
                  value={draftCaption}
                  onChangeText={(val) => {
                    setDraftCaption(val);
                    if (errorText) setErrorText(null);
                  }}
                  multiline
                  placeholder="Write a caption..."
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
              </View>
              {errorText && (
                <Text style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{errorText}</Text>
              )}
              {/* TODO: Optional photo-attach button if media-upload endpoint exists later */}
              <View style={styles.shareActions}>
                <TouchableOpacity style={[styles.shareBtn, styles.shareBtnCancel]} onPress={() => { setDraftState('idle'); setErrorText(null); }}>
                  <Text style={styles.shareBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.shareBtn, styles.shareBtnPost]} onPress={handlePost}>
                  <Text style={styles.shareBtnPostText}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {draftState === 'posting' && (
             <View style={styles.shareCard}>
              <ActivityIndicator color={Colors.brand.primary} style={{ marginVertical: 20 }} />
            </View>
          )}
          {draftState === 'success' && (
            <View style={[styles.shareCard, { alignItems: 'center', paddingVertical: 20 }]}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successText}>Shared to your feed</Text>
            </View>
          )}

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
  },
  shareCard: {
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: Spacing[4],
    width: '100%',
    marginBottom: 12,
  },
  shareCardTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: Spacing[3],
  },
  shareActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing[3],
    gap: 12,
  },
  shareBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  shareBtnCancel: {
    backgroundColor: Colors.background.tertiary,
  },
  shareBtnCancelText: {
    color: Colors.text.secondary,
    fontWeight: '700',
  },
  shareBtnPost: {
    backgroundColor: Colors.brand.primary,
  },
  shareBtnPostText: {
    color: '#000',
    fontWeight: '800',
  },
  successIcon: {
    color: Colors.brand.primary,
    fontSize: 24,
    marginBottom: 8,
  },
  successText: {
    color: Colors.text.primary,
    fontWeight: '700',
    fontSize: 16,
  }
});
