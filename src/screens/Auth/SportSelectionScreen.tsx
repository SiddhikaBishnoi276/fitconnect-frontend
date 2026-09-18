import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, 
  TouchableOpacity, StatusBar, useWindowDimensions 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { OnboardingProgressBar, SelectableCard } from '@components/index';
import { Routes } from '@constants/routes';
import type { Sport, ApiSuccessResponse } from '@t/api';
import type { AuthNavigationProp } from '@t/navigation';

import { useOnboarding } from '../../context/OnboardingContext';

const DEFAULT_SPORTS: Sport[] = [
  { id: 1, slug: 'football', name: 'Football', category: 'team' },
  { id: 2, slug: 'gym', name: 'Gym Training', category: 'individual' },
  { id: 3, slug: 'basketball', name: 'Basketball', category: 'team' },
  { id: 4, slug: 'running', name: 'Running', category: 'individual' },
  { id: 5, slug: 'swimming', name: 'Swimming', category: 'individual' },
  { id: 6, slug: 'badminton', name: 'Badminton', category: 'racquet' },
  { id: 7, slug: 'boxing', name: 'Boxing', category: 'combat' },
  { id: 8, slug: 'cycling', name: 'Cycling', category: 'individual' },
  { id: 9, slug: 'tennis', name: 'Tennis', category: 'racquet' },
  { id: 10, slug: 'cricket', name: 'Cricket', category: 'team' },
];

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
  return ICONS[slug] || '🏅';
};

const SportSelectionScreen = (): React.JSX.Element => {
  const { state, updateState } = useOnboarding();
  const navigation = useNavigation<AuthNavigationProp<'SportSelection'>>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallScreen = height < 720;
  const isTablet = width >= 768;

  const [sports, setSports] = useState<Sport[]>(DEFAULT_SPORTS);
  const [loading, setLoading] = useState(false);

  // Initialize selected from context if returning to this screen
  const [selectedIds, setSelectedIds] = useState<number[]>(state.sports || []);

  const fetchSports = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<ApiSuccessResponse<Sport[]>>(Endpoints.sports.list);
      if (response.data?.data && response.data.data.length > 0) {
        setSports(response.data.data);
      }
    } catch {
      // Gracefully use default sports if network / backend is unreachable
      setSports(DEFAULT_SPORTS);
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

            {/* Loading Indicator */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#CCFF00" />
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

  // Loading
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
