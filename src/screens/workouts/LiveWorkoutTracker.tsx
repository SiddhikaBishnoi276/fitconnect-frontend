import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { AppButton } from '@components/index';
import { Routes } from '@constants/routes';
import type { Session, Exercise } from '@t/api';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';

// Extended interface to include targets
interface SessionExercise extends Exercise {
  target_sets?: number;
  target_reps?: number;
  target_weight_kg?: number;
}

interface FullSessionData extends Session {
  exercises: SessionExercise[];
  created_at?: string;
}

export const LiveWorkoutTracker = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<FullSessionData | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Editable fields for the current exercise
  const [sets, setSets] = useState(0);
  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);

  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Local tracking stats for summary screen
  const [adaptedCount, setAdaptedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  // Minimum duration (5 mins) tracking
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [waitingForMinDuration, setWaitingForMinDuration] = useState(false);

  // Active workout timer: count elapsed seconds from session start
  useEffect(() => {
    if (!session?.id) return;

    let initialSec = 0;
    if (session.created_at) {
      const createdTime = new Date(session.created_at).getTime();
      if (!isNaN(createdTime) && createdTime > 0) {
        initialSec = Math.max(0, Math.floor((Date.now() - createdTime) / 1000));
      }
    }
    
    // Only set initial offset if we haven't started counting yet
    setElapsedSeconds(prev => prev > 0 ? prev : initialSec);

    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.id]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 1. Initialization
  useEffect(() => {
    const initializeSession = async () => {
      try {
        let initialData: FullSessionData | null = route.params?.sessionData || route.params?.session;

        // Crash recovery: if no data was passed in params, try fetching active session
        if (!initialData) {
          const res = await apiClient.get(Endpoints.sessions.active);
          initialData = res.data?.data;
        }

        if (initialData && initialData.exercises) {
          setSession(initialData);
          // On resume: find the first pending (not yet completed) exercise
          const resumeIndex = initialData.exercises.findIndex(
            (ex: any) => ex.status === 'pending' || !ex.status
          );
          
          if (resumeIndex === -1 && initialData.exercises.length > 0) {
            // All exercises are completed, go straight to finish/cooldown
            setCurrentIndex(initialData.exercises.length - 1);
            setWaitingForMinDuration(true);
          } else {
            const startIndex = resumeIndex >= 0 ? resumeIndex : 0;
            setCurrentIndex(startIndex);
            // Set initial editable values for the resume exercise
            const startEx = initialData.exercises[startIndex];
            if (startEx) {
              setSets(startEx.target_sets || 3);
              // Backend sends target_reps_min / target_reps_max — use min as the target
              setReps(startEx.target_reps_min ?? startEx.target_reps ?? 10);
              setWeight(startEx.target_weight_kg || 0);
            }
          }
        } else {
          // No active session found
          Alert.alert('Error', 'No active session found.', [
            { text: 'OK', onPress: () => navigation.navigate(Routes.Root.MAIN) }
          ]);
        }
      } catch (error) {
        console.error('Failed to initialize live workout:', error);
        Alert.alert('Error', 'Could not load session.');
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [route.params?.sessionData]);

  // Update editables when currentIndex changes
  useEffect(() => {
    if (session && session.exercises && session.exercises[currentIndex]) {
      const ex = session.exercises[currentIndex];
      setSets(ex.target_sets || 3);
      // Backend sends target_reps_min / target_reps_max — use min as the target
      setReps((ex as any).target_reps_min ?? (ex as any).target_reps ?? 10);
      setWeight((ex as any).target_weight_kg || 0);
    }
  }, [currentIndex, session]);

  // 2. Actions
  const handleCancel = () => {
    Alert.alert(
      'Cancel Workout?',
      'You will lose all progress for this session and get 0 RP.',
      [
        { text: 'No, keep going', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            if (!session) return;
            try {
              const sessionId = session.id || (session as any).session_id;
              await apiClient.post(Endpoints.sessions.cancel(sessionId));
              Toast.show({
                type: 'info',
                text1: 'Workout Cancelled',
                text2: '0 RP awarded. Keep your streak alive tomorrow!',
              });
              navigation.navigate(Routes.Root.MAIN);
            } catch (err) {
              console.error('Failed to cancel session:', err);
              Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to cancel session' });
            }
          }
        }
      ]
    );
  };

  const handleFeedback = (feedbackType: 'too_hard' | 'too_easy' | 'just_right' | 'skipped') => {
    if (!session || !session.exercises[currentIndex]) return;

    const exId = session.exercises[currentIndex]?.exercise_id || session.exercises[currentIndex]?.id;
    const orderIdx = session.exercises[currentIndex]?.order_index;
    const sessionId = session.id || (session as any).session_id;

    if (!sessionId || !exId) return;

    // 1. Instantly hide feedback and update local counts
    setShowFeedback(false);
    if (feedbackType === 'too_hard' || feedbackType === 'too_easy') {
      setAdaptedCount(prev => prev + 1);
    }
    if (feedbackType === 'skipped') {
      setSkippedCount(prev => prev + 1);
    }

    // 2. Instantly proceed to next exercise or cooldown screen
    proceedToNext();

    // 3. Fire API call in background
    (async () => {
      try {
        const res = await apiClient.post(Endpoints.sessions.feedback(sessionId, exId), {
          feedback: feedbackType,
          order_index: orderIdx,
          actual_sets: sets,
          actual_reps: reps,
          actual_weight_kg: weight,
        });

        const updatedSession = res.data?.data;
        if (updatedSession && updatedSession.exercises) {
          setSession(updatedSession);
        }
        Toast.show({ type: 'success', text1: 'Feedback logged', text2: 'Plan adjusted in real-time!' });
      } catch (err) {
        console.error('Failed to send feedback:', err);
      }
    })();
  };

  const finishSession = async () => {
    if (!session || completing) return;
    setCompleting(true);
    try {
      const durationMin = Math.max(2, Math.round(elapsedSeconds / 60));
      const sessionId = session.id || (session as any).session_id;
      const res = await apiClient.post(Endpoints.sessions.complete(sessionId), {
        duration_min: durationMin,
      });

      Toast.show({ type: 'success', text1: 'Workout Complete!', text2: 'Awesome job!' });

      navigation.navigate(Routes.Modals.SESSION_COMPLETE, {
        sessionData: res.data?.data || {},
        summaryData: res.data?.data || {},
        adaptedCount,
        skippedCount,
        totalExercises: session.exercises.length
      });
    } catch (err: any) {
      console.error('Failed to complete session:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to complete session';
      Toast.show({ type: 'error', text1: 'Error', text2: errMsg });
    } finally {
      setCompleting(false);
    }
  };

  const proceedToNext = (sessionOverride?: FullSessionData) => {
    const activeSession = sessionOverride || session;
    if (!activeSession || !activeSession.exercises) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex < activeSession.exercises.length) {
      setCurrentIndex(nextIndex);
    } else {
      // It was the last exercise, immediately show cooldown screen
      setWaitingForMinDuration(true);
      // Let the cooldown screen's own effects or button presses handle finishSession
      // If they already met 120s, the "Complete Workout" button will be ready to tap.
    }
  };

  if (loading || !session || !session.exercises) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top', 'left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  const isFinishedByShrink = session.exercises && currentIndex >= session.exercises.length;

  if (waitingForMinDuration || isFinishedByShrink) {
    const remainingSec = Math.max(0, 120 - elapsedSeconds);
    const canFinishNow = remainingSec === 0;

    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.cooldownContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.cooldownHeader}>
            <Text style={styles.cooldownEmoji}>🧘</Text>
            <Text style={styles.cooldownTitle}>Active Cool-Down & Rest</Text>
            <Text style={styles.cooldownSubtitle}>
              All exercises completed! To ensure physiological recovery and earn full RP, each session requires a minimum duration of 2 minutes.
            </Text>
          </View>

          {/* Large Countdown Box */}
          <View style={[styles.timerCircle, canFinishNow && styles.timerCircleReady]}>
            <Text style={[styles.timerLargeText, canFinishNow && styles.timerLargeTextReady]}>
              {canFinishNow ? '00:00' : formatTime(remainingSec)}
            </Text>
            <Text style={styles.timerSubText}>
              {canFinishNow ? 'Minimum 2 minutes reached! Ready to finish' : 'Remaining until completion unlocks'}
            </Text>
          </View>

          {/* Recovery Guidance */}
          <View style={styles.cooldownTipsCard}>
            <Text style={styles.cooldownTipsTitle}>💡 While You Wait:</Text>
            <Text style={styles.cooldownTipItem}>• Take slow, deep breaths to bring heart rate back to resting</Text>
            <Text style={styles.cooldownTipItem}>• Rehydrate with water or electrolytes</Text>
            <Text style={styles.cooldownTipItem}>• Perform light static stretches for worked muscle groups</Text>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.doneButton,
                canFinishNow ? styles.doneButtonReady : styles.doneButtonDisabled
              ]}
              disabled={!canFinishNow || completing}
              onPress={finishSession}
              activeOpacity={0.85}
            >
              {completing ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={[styles.doneButtonText, !canFinishNow && styles.doneButtonTextDisabled]}>
                  {canFinishNow ? 'Complete Workout & Claim RP 🎉' : `Finish Unlocks in ${formatTime(remainingSec)} ⏱`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
      </SafeAreaView>
    );
  }

  const currentExercise = session.exercises[currentIndex];
  const isLast = currentIndex === session.exercises.length - 1;

  // Safety guard: if currentExercise is somehow undefined, show a loading state
  if (!currentExercise) {
    // If we can't find the exercise, it might be due to a backend sync issue.
    // Instead of infinite loading, force the cooldown/finish screen so the user is not stuck.
    if (!waitingForMinDuration) {
      setTimeout(() => setWaitingForMinDuration(true), 0);
    }
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="small" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  // Render Stepper Helper (Square Card Style)
  const renderStepper = (label: string, value: number, setter: (val: number) => void, step: number = 1) => (
    <View style={styles.stepperCard}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <Text style={styles.stepperValue}>{value}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity style={styles.stepButton} onPress={() => setter(Math.max(0, value - step))}>
          <Text style={styles.stepButtonText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stepButton} onPress={() => setter(value + step)}>
          <Text style={styles.stepButtonTextPlus}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleDonePress = () => {
    setShowFeedback(true);
  };

  if (showFeedback) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.feedbackScreenContainer}>
          <TouchableOpacity onPress={() => setShowFeedback(false)} style={{alignSelf: 'flex-start', marginBottom: 16}}>
            <Text style={{color: '#CCFF00', fontSize: 16, fontWeight: '700'}}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.feedbackPill}>
            <Text style={styles.feedbackPillText}>✓ {currentExercise.name.toUpperCase()} — DONE</Text>
          </View>

          <Text style={styles.feedbackScreenTitle}>How did that feel?</Text>
          <Text style={styles.feedbackScreenSubtitle}>
            Your answer adjusts the rest of today's session in real time.
          </Text>

          <View style={styles.feedbackCardsContainer}>
            <TouchableOpacity
              style={[styles.feedbackCard, { borderColor: '#CCFF00', backgroundColor: 'rgba(204, 255, 0, 0.05)' }]}
              onPress={() => handleFeedback('too_easy')}
              disabled={feedbackLoading}
            >
              <Text style={[styles.feedbackCardIcon, { color: '#CCFF00' }]}>↑</Text>
              <View>
                <Text style={[styles.feedbackCardTitle, { color: '#CCFF00' }]}>Too Easy</Text>
                <Text style={styles.feedbackCardSubtitle}>Ramp it up</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.feedbackCard, { borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.05)' }]}
              onPress={() => handleFeedback('just_right')}
              disabled={feedbackLoading}
            >
              <Text style={[styles.feedbackCardIcon, { color: '#38BDF8' }]}>✓</Text>
              <View>
                <Text style={[styles.feedbackCardTitle, { color: '#38BDF8' }]}>Just Right</Text>
                <Text style={styles.feedbackCardSubtitle}>Keep going</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.feedbackCard, { borderColor: '#F97316', backgroundColor: 'rgba(249, 115, 22, 0.05)' }]}
              onPress={() => handleFeedback('too_hard')}
              disabled={feedbackLoading}
            >
              <Text style={[styles.feedbackCardIcon, { color: '#F97316' }]}>↓</Text>
              <View>
                <Text style={[styles.feedbackCardTitle, { color: '#F97316' }]}>Too Hard</Text>
                <Text style={styles.feedbackCardSubtitle}>Scale it back</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.feedbackSkipContainer}>
            <TouchableOpacity onPress={() => handleFeedback('skipped')}>
              <Text style={styles.feedbackSkipLink}>Skip — no feedback</Text>
            </TouchableOpacity>
            <Text style={styles.feedbackSkipWarning}>Skipping reduces AI accuracy for future plans</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }



  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 16 }]}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel Workout</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout</Text>
        <View style={[styles.timerBadge, elapsedSeconds >= 120 && styles.timerBadgeReady]}>
          <Text style={[styles.timerBadgeText, elapsedSeconds >= 120 && styles.timerBadgeTextReady]}>
            ⏱ {formatTime(elapsedSeconds)}
          </Text>
        </View>
      </View>

      {/* Top Progress Bar */}
      <View style={styles.topProgressContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / session.exercises.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Exercise {currentIndex + 1} of {session.exercises.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercise Info Card */}
        <View style={styles.exerciseCard}>
          <View style={styles.exerciseCardLeftBorder} />
          <View style={styles.exerciseCardContent}>
            <View style={styles.sessionMetaRow}>
              <Text style={styles.sessionMetaGlobe}>🌎</Text>
              <Text style={styles.sessionMetaText}> · {(session as any).estimated_duration_min || 45} min · {(session as any).intensity || 'High'} intensity</Text>
            </View>
            <Text style={styles.exerciseName}>{currentExercise.name}</Text>
            <Text style={styles.exerciseTargetText}>
              {currentExercise.target_sets || 3} × {currentExercise.target_reps || 10} reps
            </Text>
          </View>
        </View>

        {/* Editables - 3 Cards side-by-side */}
        <View style={styles.steppersRow}>
          {renderStepper('SETS', sets, setSets, 1)}
          {renderStepper('REPS', reps, setReps, 1)}
          {renderStepper('WEIGHT (KG)', weight, setWeight, 2.5)}
        </View>

      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDonePress}
          disabled={completing}
        >
          <Text style={styles.doneButtonText}>
            {isLast ? "Done — Finish Workout 🎉" : "Done — Next Exercise →"}
          </Text>
        </TouchableOpacity>
        {isLast && elapsedSeconds < 120 && (
          <Text style={styles.minDurationHint}>
            ⏱ Min 2 min workout required ({formatTime(Math.max(0, 120 - elapsedSeconds))} remaining)
          </Text>
        )}
        {!isLast && session.exercises[currentIndex + 1] && (
          <Text style={styles.nextExerciseText}>Next: {session.exercises[currentIndex + 1].name}</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default LiveWorkoutTracker;

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
  cancelText: {
    ...TextPresets.body,
    color: Colors.status.error,
  },
  headerTitle: {
    ...TextPresets.h4,
    color: Colors.text.primary,
  },
  // UI Styles matching Figma
  topProgressContainer: {
    paddingHorizontal: Layout.screenPaddingH,
    marginBottom: Spacing[6],
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginBottom: 8,
    flexDirection: 'row',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  progressText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[10],
  },
  exerciseCard: {
    backgroundColor: '#161B26',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: Spacing[8],
  },
  exerciseCardLeftBorder: {
    width: 6,
    backgroundColor: '#CCFF00',
  },
  exerciseCardContent: {
    flex: 1,
    padding: 20,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionMetaGlobe: {
    fontSize: 13,
  },
  sessionMetaText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  exerciseTargetText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  steppersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: Spacing[8],
  },
  stepperCard: {
    flex: 1,
    backgroundColor: '#161B26',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  stepperLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  stepperValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepButton: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stepButtonTextPlus: {
    color: '#CCFF00',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Feedback Screen Styles
  feedbackScreenContainer: {
    flex: 1,
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: 16,
    alignItems: 'center',
  },
  feedbackPill: {
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: Spacing[8],
  },
  feedbackPillText: {
    color: '#CCFF00',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  feedbackScreenTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: Spacing[2],
  },
  feedbackScreenSubtitle: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing[10],
    paddingHorizontal: Spacing[4],
  },
  feedbackCardsContainer: {
    width: '100%',
    gap: Spacing[4],
    marginBottom: Spacing[10],
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[5],
    borderRadius: 16,
    borderWidth: 1,
  },
  feedbackCardIcon: {
    fontSize: 24,
    fontWeight: '800',
    width: 40,
    textAlign: 'center',
    marginRight: Spacing[3],
  },
  feedbackCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  feedbackCardSubtitle: {
    color: '#64748B',
    fontSize: 14,
  },
  feedbackSkipContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: Spacing[10],
  },
  feedbackSkipLink: {
    color: '#64748B',
    fontSize: 14,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    marginBottom: Spacing[2],
  },
  feedbackSkipWarning: {
    color: '#334155',
    fontSize: 12,
  },
  feedbackLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 20, 30, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[8],
    paddingTop: Spacing[4],
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
  },
  doneButton: {
    backgroundColor: '#F59E0B',
    width: '100%',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  doneButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },
  nextExerciseText: {
    color: '#64748B',
    fontSize: 14,
  },

  // Timer & Minimum Duration Styles
  timerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timerBadgeReady: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderColor: 'rgba(204, 255, 0, 0.4)',
  },
  timerBadgeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  timerBadgeTextReady: {
    color: '#CCFF00',
    fontWeight: '800',
  },
  minDurationHint: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
    textAlign: 'center',
  },
  cooldownContainer: {
    flex: 1,
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[8],
  },
  cooldownHeader: {
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  cooldownEmoji: {
    fontSize: 44,
    marginBottom: 10,
  },
  cooldownTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  cooldownSubtitle: {
    color: '#94A3B8',
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
  },
  timerCircle: {
    backgroundColor: '#161B26',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 20,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[6],
  },
  timerCircleReady: {
    borderColor: '#CCFF00',
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
  },
  timerLargeText: {
    color: '#F59E0B',
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },
  timerLargeTextReady: {
    color: '#CCFF00',
  },
  timerSubText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  cooldownTipsCard: {
    backgroundColor: '#161B26',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cooldownTipsTitle: {
    color: '#CCFF00',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  cooldownTipItem: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 22,
  },
  doneButtonReady: {
    backgroundColor: '#CCFF00',
  },
  doneButtonDisabled: {
    backgroundColor: '#1E293B',
    opacity: 0.7,
  },
  doneButtonTextDisabled: {
    color: '#64748B',
  },
});
