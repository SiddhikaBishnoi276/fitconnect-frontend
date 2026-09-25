import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { Colors, Spacing, TextPresets, BorderRadius, Layout } from '@theme/index';
import { useNavigation } from '@react-navigation/native';

import { useLeaderboard } from '@hooks/ranking/useLeaderboard';
import { LeaderboardRow, TierFilter } from '@components/ranking/LeaderboardComponents';
import { selectCurrentUser } from '@store/slices/authSlice';

const LeaderboardScreen = (): React.JSX.Element => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const currentUser = useSelector(selectCurrentUser);

  const {
    activeTab,
    setActiveTab,
    activeTierFilter,
    setActiveTierFilter,
    filteredData,
    loading,
    refreshing,
    error,
    onRefresh,
    refetch
  } = useLeaderboard();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.responsiveContainer}>
        {/* Header - Fixed */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 60 }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#CCFF00" // Lime green loader
              colors={['#CCFF00']}
            />
          }
        >
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
              onPress={() => setActiveTab('friends')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>Friends</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'global' && styles.tabActive]}
              onPress={() => setActiveTab('global')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'global' && styles.tabTextActive]}>Global / Tier</Text>
            </TouchableOpacity>
          </View>

          {/* Tier Filter Row */}
          <TierFilter
            activeTier={activeTierFilter}
            onSelectTier={(tier: any) => setActiveTierFilter(tier)}
          />

          {/* List Header */}
          <View style={styles.listHeader}>
            <View style={styles.colRank}><Text style={styles.listHeaderText}>#</Text></View>
            <View style={styles.colAthlete}><Text style={styles.listHeaderText}>ATHLETE</Text></View>
            <View style={styles.colRp}><Text style={styles.listHeaderText}>RP / TIER</Text></View>
          </View>

          {/* List Content */}
          {loading && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#CCFF00" />
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => refetch(false)}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredData.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No athletes found in this tier.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredData.map((user, index) => (
                <LeaderboardRow
                  key={user.user_id || index.toString()}
                  user={user}
                  displayRank={index + 1}
                  isCurrentUser={currentUser?.id === user.user_id}
                  isFriendTab={activeTab === 'friends'}
                  onPress={() => (navigation as any).navigate('OtherUserProfile', { userId: user.user_id })}
                />
              ))}
            </View>
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[4],
  },
  headerTitle: {
    ...TextPresets.h2,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: Layout.screenPaddingH,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing[4],
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabActive: {
    backgroundColor: '#CCFF00', // Lime green
  },
  tabText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#000',
  },
  listHeader: {
    flexDirection: 'row',
    paddingHorizontal: Layout.screenPaddingH + Spacing[2],
    paddingVertical: Spacing[3],
    marginTop: Spacing[2],
  },
  listHeaderText: {
    ...TextPresets.caption,
    fontSize: 10,
    color: Colors.text.secondary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  colRank: {
    width: 30,
    alignItems: 'center',
    marginRight: Spacing[2],
  },
  colAthlete: {
    flex: 1,
    paddingLeft: Spacing[3],
  },
  colRp: {
    width: 90,
    alignItems: 'flex-end',
  },
  listContainer: {
    paddingHorizontal: Layout.screenPaddingH,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  errorText: {
    ...TextPresets.body,
    color: Colors.status.error,
    marginBottom: Spacing[4],
  },
  retryBtn: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing[4],
  },
  emptyText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
  }
});

export default LeaderboardScreen;

