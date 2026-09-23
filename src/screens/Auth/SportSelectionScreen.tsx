import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, StatusBar, useWindowDimensions, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { OnboardingProgressBar, SelectableCard } from '@components/index';
import { Routes } from '@constants/routes';
import type { Sport, ApiSuccessResponse } from '@t/api';
import type { AuthNavigationProp } from '@t/navigation';

import { useOnboarding } from '../../context/OnboardingContext';



const ICONS: Record<string, string> = {
  football: '⚽',
  gym: '🏋️',
  basketball: '🏀',
  running: '🏃',
  swimming: '🏊',
  badminton: '🏸',
  boxing: '🥊',
  cycling: '🚴',
  tennis: '🎾',
  cricket: '🏏',
};

const getIconForSlug = (slug: string): string => {
  const normalizedSlug = slug.toLowerCase();
  for (const [key, icon] of Object.entries(ICONS)) {
    if (normalizedSlug.includes(key)) return icon;
  }
  return '🏅';
};

const SportSelectionScreen = (): React.JSX.Element => {
  const { state, updateState } = useOnboarding();
  const navigation = useNavigation<AuthNavigationProp<'SportSelection'>>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallScreen = height < 720;
  const isTablet = width >= 768;

  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize selected from context if returning to this screen
  const [selectedIds, setSelectedIds] = useState<number[]>(state.sports || []);

  const fetchSports = async () => {
    try {
      setLoading(true);
      
      const targetUrl = Endpoints.sports.list;
      console.log('SPORTS FETCH URL:', apiClient.defaults.baseURL + targetUrl);
      
      const response = await apiClient.get<ApiSuccessResponse<Sport[]>>(targetUrl);
      if (response.data?.data && response.data.data.length > 0) {
        setSports(response.data.data);
        const validIds = response.data.data.map(s => s.id);
        setSelectedIds(prev => prev.filter(id => validIds.includes(id)));
      }
    } catch (err) {
      console.error('SPORTS FETCH ERROR:', err);
      setSports([]);
      setSelectedIds([]);
      Alert.alert('Error', 'Could not load sports from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSports();
  }, []);

  const toggleSport = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    if (selectedIds.length === 0) return;
    updateState({ sports: selectedIds });
    navigation.navigate(Routes.Auth.INJURY_INPUT);
  };

  const isFormValid = selectedIds.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />

      <View style={styles.outerWrapper}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 90,
              paddingTop: isSmallScreen ? 10 : 16,
            }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.responsiveContainer}>

            {/* 1. Progress Bar (Step 3 of 7) */}
            <View style={styles.progressBarWrapper}>
              <OnboardingProgressBar currentStep={3} totalSteps={7} />
            </View>

            {/* 2. Header & Subtitle */}
            <View style={[styles.headerSection, isSmallScreen && { marginBottom: 14 }]}>
              <Text
                style={[
                  styles.heading,
                  isSmallScreen && styles.headingSmall,
                  isTablet && styles.headingTablet,
                ]}
              >
                Which sports do you play?
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  isSmallScreen && styles.subtitleSmall,
                ]}
              >
                Pick all that apply — plans cover every sport you train for, equally.
              </Text>
            </View>

            {/* Loading / Error Indicator */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#CCFF00" />
              </View>
            ) : errorMsg ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchSports}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* 3. Responsive Sports Grid */
              <View style={styles.grid}>
                {sports.map((sport) => (
                  <View key={sport.id} style={styles.gridItem}>
                    <SelectableCard
                      label={sport.name}
                      icon={getIconForSlug(sport.slug)}
                      selected={selectedIds.includes(sport.id)}
                      onToggle={() => toggleSport(sport.id)}
                    />
                  </View>
                ))}
              </View>
            )}

          </View>
        </ScrollView>

        {/* 4. Bottom Sticky Action Area */}
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              paddingTop: 10,
            }
          ]}
        >
          <View style={styles.footerInner}>
            <Text style={styles.note}>
              No single 'primary' sport — all selected sports get equal plan coverage.
            </Text>

            <TouchableOpacity
              style={[
                styles.continueButton,
                !isFormValid && styles.continueButtonDisabled
              ]}
              activeOpacity={isFormValid ? 0.85 : 1}
              onPress={handleContinue}
              disabled={!isFormValid}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  !isFormValid && styles.continueButtonTextDisabled
                ]}
              >
                Continue →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  outerWrapper: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 20,
    backgroundColor: '#0B0F17',
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },

  // Progress Bar
  progressBarWrapper: {
    marginBottom: 8,
  },

  // Header
  headerSection: {
    marginBottom: 18,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headingSmall: {
    fontSize: 24,
    marginBottom: 4,
  },
  headingTablet: {
    fontSize: 32,
  },
  subtitle: {
    color: '#94A3B8', // Slate-gray
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '400',
    maxWidth: 420,
  },
  subtitleSmall: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Loading & Error
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#CCFF00',
    fontWeight: '600',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0B0F17',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 20,
  },
  footerInner: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  note: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  continueButton: {
    backgroundColor: '#CCFF00', // Vibrant Neon Lime
    height: 54,
    borderRadius: 27, // Full pill
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  continueButtonTextDisabled: {
    color: '#4B5563',
  },
});

export default SportSelectionScreen;
