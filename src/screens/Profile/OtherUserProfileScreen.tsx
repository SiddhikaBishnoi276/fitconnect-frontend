import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image, StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';
import { useOtherUserProfile } from '@hooks/profile/useOtherUserProfile';
import { useFollowAction } from '@hooks/social/useFollowAction';
import PostCard from '@components/profile/PostCard';
import { RootStackParamList } from '@t/navigation';
import { Post } from '@t/profile';

type OtherUserProfileRouteProp = RouteProp<RootStackParamList, 'OtherUserProfile'>;

const OtherUserProfileScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  const route = useRoute<OtherUserProfileRouteProp>();
  const { userId } = route.params;
  const insets = useSafeAreaInsets();

  const { profile, loading, refreshing, error, onRefresh, updateLocalFollowState, refetch } = useOtherUserProfile(userId);
  const { toggleFollow, isFollowLoading } = useFollowAction();

  // Create formatted title (e.g., "Lakshman Profile")
  const screenTitle = useMemo(() => {
    if (!profile?.name) return 'Profile';
    const firstName = profile.name.split(' ')[0];
    const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    return `${capitalized} Profile`;
  }, [profile?.name]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    const isNowFollowing = !profile.is_following;
    // Optimistically update
    updateLocalFollowState(isNowFollowing);
    const success = await toggleFollow(userId, !isNowFollowing);
    if (!success) {
      // Revert if API fails
      updateLocalFollowState(!isNowFollowing);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch(false)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {screenTitle}
        </Text>
        <View style={styles.placeholderIcon} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.primary} />
        }
      >
        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile.photo_url ? (
              <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{profile.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>{profile.tier.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>

          <View style={styles.followBtnContainer}>
            <TouchableOpacity 
              style={[
                styles.followBtn, 
                profile.is_following && styles.followingBtn
              ]} 
              onPress={handleFollowToggle}
              disabled={isFollowLoading[userId]}
            >
              <Text style={[
                styles.followBtnText,
                profile.is_following && styles.followingBtnText
              ]}>
                {profile.is_following ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.rp_total}</Text>
              <Text style={styles.statLabel}>RP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.current_streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statDivider} />
            {/* Click does nothing for other users */}
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.followers_count}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.following_count}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* PRs Section */}
        {profile.prs && profile.prs.length > 0 && (
          <View style={styles.prsSection}>
            <Text style={styles.sectionTitle}>Personal Records</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prsScroll}>
              {profile.prs.map((pr: any, index: number) => (
                <View key={pr.id || index.toString()} style={styles.prCard}>
                  <Text style={styles.prExercise}>{pr.exercise_name}</Text>
                  <Text style={styles.prValue}>
                    {pr.value} {pr.metric === 'time_min' ? 'min' : pr.metric}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Posts</Text>
          {profile.posts && profile.posts.length > 0 ? (
            profile.posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post as unknown as Post} 
                isMe={false} 
              />
            ))
          ) : (
            <View style={styles.emptyPosts}>
              <Text style={styles.emptyPostsText}>No posts yet.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0F17',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backBtn: {
    padding: Spacing[2],
  },
  backIcon: {
    color: Colors.text.primary,
    fontSize: 24,
  },
  headerTitle: {
    ...TextPresets.h3,
    color: Colors.text.inverse,
    flex: 1,
    textAlign: 'center',
  },
  placeholderIcon: {
    width: 40, // Match backBtn width for centering
  },
  scrollContent: {
    flexGrow: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing[4],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.background.tertiary,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  tierBadge: {
    position: 'absolute',
    bottom: -5,
    alignSelf: 'center',
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing[3],
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0B0F17',
  },
  tierText: {
    ...TextPresets.caption,
    color: '#000',
    fontWeight: 'bold',
    fontSize: 10,
  },
  name: {
    ...TextPresets.h2,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  username: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    marginBottom: Spacing[4],
  },
  followBtnContainer: {
    width: '100%',
    paddingHorizontal: Layout.screenPaddingH * 2,
    marginBottom: Spacing[6],
  },
  followBtn: {
    backgroundColor: Colors.brand.primary,
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  followBtnText: {
    ...TextPresets.body,
    color: '#000',
    fontWeight: 'bold',
  },
  followingBtnText: {
    color: Colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing[4],
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...TextPresets.h3,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  statLabel: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border.primary,
  },
  prsSection: {
    paddingVertical: Spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  sectionTitle: {
    ...TextPresets.h4,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    paddingHorizontal: Layout.screenPaddingH,
    marginBottom: Spacing[4],
  },
  prsScroll: {
    paddingHorizontal: Layout.screenPaddingH,
    gap: Spacing[4],
  },
  prCard: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing[4],
    borderRadius: BorderRadius.md,
    minWidth: 120,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  prExercise: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing[1],
  },
  prValue: {
    ...TextPresets.h4,
    color: Colors.brand.primary,
    fontWeight: 'bold',
  },
  postsSection: {
    paddingVertical: Spacing[6],
    paddingHorizontal: Layout.screenPaddingH,
  },
  emptyPosts: {
    padding: Spacing[6],
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
  },
  emptyPostsText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
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
  }
});

export default OtherUserProfileScreen;

