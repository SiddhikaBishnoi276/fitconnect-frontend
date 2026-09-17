import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator
} from 'react-native';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { AppButton, OnboardingProgressBar, SelectableCard } from '@components/index';
import { Routes } from '@constants/routes';
import type { Sport, ApiSuccessResponse } from '@t/api';
import type { AuthNavigationProp } from '@t/navigation';
import { Colors, Spacing, Layout, TextPresets } from '@theme/index';

import { useOnboarding } from '../../context/OnboardingContext';

const ICONS: Record<string, string> = {
  football: '⚽',
  gym: '🏋️',
  swimming: '🏊',
  running: '🏃',
  badminton: '🏸',
};

const getIconForSlug = (slug: string): string => {
  return ICONS[slug] || '🏅';
};

const SportSelectionScreen = () => {
  const { state, updateState } = useOnboarding();
  const navigation = useNavigation<AuthNavigationProp<'SportSelection'>>();

  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize selected from context if returning to this screen
  const [selectedIds, setSelectedIds] = useState<number[]>(state.sports || []);

  const fetchSports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<ApiSuccessResponse<Sport[]>>(Endpoints.sports.list);
      setSports(response.data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sports. Please try again.');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <OnboardingProgressBar currentStep={3} totalSteps={7} />
          <Text style={[TextPresets.h2, styles.heading]}>Which sports do you play?</Text>
          <Text style={[TextPresets.body, styles.subtitle]}>
            Pick all that apply — plans cover every sport you train for, equally.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={[TextPresets.body, styles.errorText]}>{error}</Text>
            <AppButton title="Retry" onPress={fetchSports} size="small" variant="outline" />
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
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
          </ScrollView>
        )}

        <View style={styles.footer}>
          <Text style={[TextPresets.caption, styles.note]}>
            No single 'primary' sport — all selected sports get equal plan coverage.
          </Text>
          <AppButton 
            title="Continue →" 
            onPress={handleContinue} 
            disabled={selectedIds.length === 0 || loading || !!error} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
  },
  heading: {
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  subtitle: {
    color: Colors.text.secondary,
    marginBottom: Spacing[6],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  errorText: {
    color: Colors.status.error,
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[6],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing[2],
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: Spacing[2],
    marginBottom: Spacing[4],
  },
  footer: {
    padding: Layout.screenPaddingH,
    paddingBottom: Layout.bottomSafeArea || Spacing[8],
    backgroundColor: Colors.background.primary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.primary,
    paddingTop: Spacing[4],
  },
  note: {
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing[4],
  },
});

export default SportSelectionScreen;
