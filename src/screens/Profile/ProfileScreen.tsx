import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';
import { Routes } from '@constants/routes';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';

interface ProfileSummary {
  name: string;
  photo_url?: string;
  tier: string;
  rp_total: number;
  current_streak: number;
  sports?: string[];
}

interface PersonalRecord {
  id: string;
  exercise_name: string;
  sport_id?: string;
  metric: string;
  value: string;
  previous_best?: string;
  verification_status: 'unverified' | 'genuine' | 'disputed';
  achieved_at: string;
}

interface ProgressSummary {
  rp_total: number;
  tier: string;
  rp_breakdown: {
    streak_milestone?: number;
    [key: string]: any;
  };
}

// Utility to safely parse numeric strings
const parseNumeric = (val?: string): number => {
  if (!val) return 0;
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

const ProfileScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, recordsRes, progressRes] = await Promise.allSettled([
        apiClient.get(Endpoints.profile.me),
        apiClient.get(Endpoints.profile.records),
        apiClient.get(Endpoints.progress.me)
      ]);

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data?.data);
      if (recordsRes.status === 'fulfilled') setRecords(recordsRes.value.data?.data || []);
      if (progressRes.status === 'fulfilled') setProgress(progressRes.value.data?.data);
      
    } catch (err) {
      console.error('Failed to fetch profile data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  // Calculate Tier Progress Client-Side
  const rpTotal = progress?.rp_total || profile?.rp_total || 0;
  const thresholds = [
    { name: 'Bronze', min: 0, max: 499 },
    { name: 'Silver', min: 500, max: 1499 },
    { name: 'Gold', min: 1500, max: 2999 },
    { name: 'Elite', min: 3000, max: Infinity }
  ];
  const currentTierObj = thresholds.find(t => rpTotal >= t.min && rpTotal <= t.max) || thresholds[3];
  
  const isMaxTier = currentTierObj.name === 'Elite';
  const progressPct = isMaxTier 
    ? 100 
    : ((rpTotal - currentTierObj.min) / (currentTierObj.max - currentTierObj.min)) * 100;
  
  const nextTierName = isMaxTier ? 'Max Tier' : thresholds[thresholds.indexOf(currentTierObj) + 1].name;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsBtn}
          onPress={() => navigation.navigate(Routes.Root.SETTINGS)}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Profile Header --- */}
        <View style={styles.profileHeader}>
          {profile?.photo_url ? (
            <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{profile?.name?.charAt(0) || 'U'}</Text>
            </View>
          )}
          <Text style={styles.name}>{profile?.name || 'User'}</Text>
          <Text style={styles.tierText}>🏆 {profile?.tier || 'Bronze'} Tier</Text>
        </View>

        {/* --- Tier Progress --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ranking Progress</Text>
          <View style={styles.card}>
            <View style={styles.tierRow}>
              <Text style={styles.tierLabel}>Current: {currentTierObj.name}</Text>
              <Text style={styles.tierLabel}>{rpTotal} RP</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(0, progressPct))}%` }]} />
            </View>
            <View style={styles.tierRow}>
              <Text style={styles.tierSubtext}>Streak Bonus: {progress?.rp_breakdown?.streak_milestone ?? 0} RP</Text>
              {!isMaxTier && (
                <Text style={styles.tierSubtext}>Next: {nextTierName} ({currentTierObj.max + 1} RP)</Text>
              )}
            </View>
          </View>
        </View>

        {/* --- Personal Records --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Records</Text>
          
          {records.length === 0 ? (
            <View style={[styles.card, styles.center]}>
              <Text style={styles.emptyIcon}>🏅</Text>
              <Text style={styles.emptyText}>No personal records yet — complete a workout to set your first PR!</Text>
            </View>
          ) : (
            records.map((pr) => {
              const val = parseNumeric(pr.value);
              const prev = parseNumeric(pr.previous_best);
              const diff = prev > 0 ? val - prev : 0;
              
              return (
                <View key={pr.id} style={styles.prCard}>
                  <View style={styles.prHeader}>
                    <Text style={styles.prExercise}>{pr.exercise_name}</Text>
                    {pr.verification_status === 'genuine' && <Text style={styles.verifiedIcon}>✅</Text>}
                    {pr.verification_status === 'disputed' && <Text style={styles.disputedIcon}>⚠️</Text>}
                    {pr.verification_status === 'unverified' && (
                      <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
                    )}
                  </View>
                  
                  <View style={styles.prDetails}>
                    <Text style={styles.prValue}>{val} {pr.metric}</Text>
                    {diff > 0 && (
                      <Text style={styles.prDiff}>+{diff} {pr.metric}</Text>
                    )}
                  </View>
                  <Text style={styles.prDate}>
                    {new Date(pr.achieved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  headerTitle: {
    ...TextPresets.h3,
    color: Colors.text.primary,
  },
  settingsBtn: {
    padding: Spacing[2],
  },
  settingsIcon: {
    fontSize: 24,
  },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
  },
  
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing[4],
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  avatarInitial: {
    fontSize: 48,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  name: {
    ...TextPresets.h2,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  tierText: {
    ...TextPresets.body,
    color: '#D97706',
    fontWeight: '600',
  },

  // Sections
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
  
  // Progress
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  tierLabel: {
    ...TextPresets.body,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  tierSubtext: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: Colors.background.tertiary,
    borderRadius: 6,
    marginBottom: Spacing[3],
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.brand.primary,
  },

  // PRs
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing[3],
  },
  emptyText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing[4],
  },
  prCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  prExercise: {
    ...TextPresets.body,
    color: Colors.text.primary,
    fontWeight: 'bold',
    flex: 1,
  },
  verifiedIcon: {
    fontSize: 16,
    marginLeft: Spacing[2],
  },
  disputedIcon: {
    fontSize: 16,
    marginLeft: Spacing[2],
  },
  newBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing[2],
  },
  newBadgeText: {
    ...TextPresets.caption,
    fontSize: 10,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  prDetails: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing[1],
  },
  prValue: {
    ...TextPresets.h3,
    color: Colors.brand.primary,
    marginRight: Spacing[3],
  },
  prDiff: {
    ...TextPresets.caption,
    color: Colors.status.success,
    fontWeight: 'bold',
  },
  prDate: {
    ...TextPresets.caption,
    color: Colors.text.tertiary,
  }
});

export default ProfileScreen;
