import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView, ActivityIndicator
} from 'react-native';
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

  // Local tracking stats for summary screen
  const [adaptedCount, setAdaptedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  // 1. Initialization
  useEffect(() => {
    const initializeSession = async () => {
      try {
        let initialData: FullSessionData | null = route.params?.sessionData;
        
        // Crash recovery: if no data was passed in params, try fetching active session
        if (!initialData) {
          const res = await apiClient.get(Endpoints.sessions.active);
          initialData = res.data?.data;
        }

        if (initialData && initialData.exercises) {
          setSession(initialData);
          // Set initial editable values for the first exercise
          const firstEx = initialData.exercises[0];
          setSets(firstEx?.target_sets || 3);
          setReps(firstEx?.target_reps || 10);
          setWeight(firstEx?.target_weight_kg || 0);
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
      setReps(ex.target_reps || 10);
      setWeight(ex.target_weight_kg || 0);
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
              await apiClient.post(Endpoints.sessions.cancel(session.id));
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

  const handleFeedback = async (feedbackType: 'too_hard' | 'too_easy' | 'just_right' | 'skipped') => {
    if (!session || !session.exercises[currentIndex]) return;
    setFeedbackLoading(true);

    try {
      const exId = session.exercises[currentIndex].id;
      const res = await apiClient.post(Endpoints.sessions.feedback(session.id, exId), {
        feedback: feedbackType,
        actual_sets: sets,
        actual_reps: reps,
        actual_weight_kg: weight,
      });

      // Backend returns adjusted remaining exercise list
      // Depending on API design, it might return the whole session or just the exercises
      const updatedSession = res.data?.data;
      if (updatedSession && updatedSession.exercises) {
        setSession(updatedSession);
      }

      if (feedbackType === 'too_hard' || feedbackType === 'too_easy') {
        setAdaptedCount(prev => prev + 1);
      }
      
      Toast.show({ type: 'success', text1: 'Feedback logged', text2: 'Plan adjusted in real-time!' });

      if (feedbackType === 'skipped') {
        setSkippedCount(prev => prev + 1);
        proceedToNext();
      }
    } catch (err) {
      console.error('Failed to send feedback:', err);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to log feedback' });
    } finally {
      setFeedbackLoading(false);
    }
  };

  const proceedToNext = async () => {
    if (!session || !session.exercises) return;

    if (currentIndex < session.exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // It was the last exercise, complete the session
      setCompleting(true);
      try {
        const res = await apiClient.post(Endpoints.sessions.complete(session.id));
        
        Toast.show({ type: 'success', text1: 'Workout Complete!', text2: 'Awesome job!' });
        
        navigation.navigate(Routes.Modals.SESSION_COMPLETE, {
          summaryData: res.data?.data || {},
          adaptedCount,
          skippedCount
        });
      } catch (err) {
        console.error('Failed to complete session:', err);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to complete session' });
      } finally {
        setCompleting(false);
      }
    }
  };

  if (loading || !session || !session.exercises) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  const currentExercise = session.exercises[currentIndex];
  const isLast = currentIndex === session.exercises.length - 1;

  // Render Stepper Helper
  const renderStepper = (label: string, value: number, setter: (val: number) => void, step: number = 1, suffix: string = '') => (
    <View style={styles.stepperContainer}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity style={styles.stepButton} onPress={() => setter(Math.max(0, value - step))}>
          <Text style={styles.stepButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{value}{suffix}</Text>
        <TouchableOpacity style={styles.stepButton} onPress={() => setter(value + step)}>
          <Text style={styles.stepButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel Workout</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout</Text>
        <View style={{ width: 100 }} /> {/* balance flex space */}
      </View>

      {/* Progress Dots */}
      <View style={styles.progressContainer}>
        {session.exercises.map((_, idx) => (
          <View 
            key={idx} 
            style={[
              styles.progressDot,
              idx === currentIndex && styles.progressDotActive,
              idx < currentIndex && styles.progressDotCompleted,
            ]} 
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercise Info */}
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
          <Text style={styles.muscleGroup}>{currentExercise.target_muscle_group}</Text>
        </View>

        {/* Media Placeholder */}
        <View style={styles.mediaContainer}>
          <Text style={styles.mediaPlaceholder}>🎬 Video / Image Demo</Text>
        </View>

        {/* Editables */}
        <View style={styles.steppersCard}>
          {renderStepper('Sets', sets, setSets, 1)}
          {renderStepper('Reps', reps, setReps, 1)}
          {renderStepper('Weight', weight, setWeight, 2.5, ' kg')}
        </View>

        {/* Feedback Area */}
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>How did this feel?</Text>
          <View style={styles.feedbackRow}>
            <TouchableOpacity 
              style={[styles.feedbackButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
              onPress={() => handleFeedback('too_hard')}
              disabled={feedbackLoading}
            >
              <Text style={styles.feedbackEmoji}>🥵</Text>
              <Text style={[styles.feedbackText, { color: Colors.status.error }]}>Too Hard</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.feedbackButton, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}
              onPress={() => handleFeedback('just_right')}
              disabled={feedbackLoading}
            >
              <Text style={styles.feedbackEmoji}>😎</Text>
              <Text style={[styles.feedbackText, { color: Colors.status.success }]}>Just Right</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.feedbackButton, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}
              onPress={() => handleFeedback('too_easy')}
              disabled={feedbackLoading}
            >
              <Text style={styles.feedbackEmoji}>🥱</Text>
              <Text style={[styles.feedbackText, { color: '#3B82F6' }]}>Too Easy</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => handleFeedback('skipped')}
            disabled={feedbackLoading}
          >
            <Text style={styles.skipText}>Skip Exercise</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        <AppButton 
          title={isLast ? "Done — Finish Workout 🎉" : "Done — Next Exercise →"} 
          onPress={proceedToNext}
          loading={completing}
          disabled={feedbackLoading || completing}
        />
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing[4],
    gap: Spacing[2],
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.background.tertiary,
  },
  progressDotActive: {
    backgroundColor: Colors.brand.primary,
    width: 12,
  },
  progressDotCompleted: {
    backgroundColor: Colors.status.success,
  },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[10],
  },
  exerciseHeader: {
    marginBottom: Spacing[4],
    alignItems: 'center',
  },
  exerciseName: {
    ...TextPresets.h2,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing[1],
  },
  muscleGroup: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mediaContainer: {
    height: 200,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[6],
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  mediaPlaceholder: {
    ...TextPresets.body,
    color: Colors.text.tertiary,
  },
  steppersCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[8],
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.primary,
  },
  stepperLabel: {
    ...TextPresets.h4,
    color: Colors.text.primary,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  stepButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepButtonText: {
    ...TextPresets.h3,
    color: Colors.text.primary,
  },
  stepperValue: {
    ...TextPresets.h3,
    color: Colors.brand.primary,
    width: 80,
    textAlign: 'center',
  },
  feedbackSection: {
    marginBottom: Spacing[6],
  },
  feedbackTitle: {
    ...TextPresets.h4,
    color: Colors.text.primary,
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  feedbackButton: {
    flex: 1,
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  feedbackEmoji: {
    fontSize: 24,
    marginBottom: Spacing[2],
  },
  feedbackText: {
    ...TextPresets.caption,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  skipText: {
    ...TextPresets.body,
    color: Colors.text.tertiary,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[8],
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  }
});
