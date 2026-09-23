import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Image, StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Routes } from '@constants/routes';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { setUnreadNotificationCount } from '@store/slices/uiSlice';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { useProfile, useProfilePosts } from '@hooks/profile/useProfile';
import PostCard from '@components/profile/PostCard';
import CreatePostModal from '@components/profile/CreatePostModal';

const ProfileScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const unreadCount = useSelector((state: RootState) => state.ui.unreadNotificationCount);

  const [isPostModalVisible, setPostModalVisible] = useState(false);

  // Hook for main profile data
  const { profile, records, loading, refreshing, fetchProfileData, onRefresh } = useProfile();

  // Custom hook for managing posts
  const { posts, isDeleting, deletePost, addPost } = useProfilePosts(profile?.posts || []);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();

      // Fetch unread count quietly
      apiClient.get(Endpoints.notifications.unreadCount)
        .then(res => {
          if (res.data?.success) {
            dispatch(setUnreadNotificationCount(res.data.data.unread_count || 0));
          }
        })
        .catch(err => console.log('Error fetching unread count', err));

    }, [fetchProfileData, dispatch])
  );

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return '1w ago';
    const months = Math.floor(days / 30);
    if (months >= 1) return `${months}mo ago`;
    return `${weeks}w ago`;
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />

      <View style={styles.responsiveContainer}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate(Routes.Root.NOTIFICATIONS)}
            >
              <Text style={styles.headerIconText}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate(Routes.Root.SETTINGS)}
            >
              <Text style={styles.headerIconText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 20) + 20 }
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CCFF00" />}
          showsVerticalScrollIndicator={false}
        >
          {/* --- Profile Header Info --- */}
          <View style={styles.profileInfoSection}>
            <View style={styles.avatarContainer}>
              {profile?.photo_url ? (
                <Image source={{ uri: profile.photo_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{profile?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                </View>
              )}
              {/* Mock Edit Icon */}
              <View style={styles.editIconBadge}>
                <Text style={styles.editIconText}>✏️</Text>
              </View>
            </View>

            <View style={styles.infoDetails}>
              <Text style={styles.name}>{profile?.name || 'User'}</Text>
              <Text style={styles.username}>@{profile?.username || 'username'}</Text>

              {/* Sports Badges */}
              {profile?.sports && profile.sports.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportsScroll}>
                  {profile.sports.map((sport) => (
                    <View key={sport.sport_id} style={styles.sportBadge}>
                      <Text style={styles.sportBadgeText}>{sport.name}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          {/* Followers / Following */}
          <View style={styles.socialStats}>
            <TouchableOpacity
              style={styles.statBox}
              onPress={() => navigation.navigate(Routes.Root.FOLLOWERS_FOLLOWING, { initialTab: 'followers' })}
            >
              <Text style={styles.statCount}>{profile?.followers_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statBox}
              onPress={() => navigation.navigate(Routes.Root.FOLLOWERS_FOLLOWING, { initialTab: 'following' })}
            >
              <Text style={styles.statCount}>{profile?.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>

          {/* --- Updates Cards (Streak, Tier, Total RP) --- */}
          <View style={styles.updatesContainer}>
            <View style={[styles.updateCard, { borderColor: '#f97316' }]}>
              <Text style={styles.updateIcon}>🔥</Text>
              <Text style={styles.updateValue}>{profile?.current_streak || 0}d</Text>
              <Text style={styles.updateLabel}>STREAK</Text>
            </View>
            <View style={[styles.updateCard, { borderColor: '#eab308' }]}>
              <Text style={styles.updateIcon}>🏅</Text>
              <View style={styles.tierBadgeBox}>
                <Text style={styles.tierBadgeText}>{profile?.tier || 'Bronze'}</Text>
              </View>
              <Text style={styles.updateLabel}>TIER</Text>
            </View>
            <View style={[styles.updateCard, { borderColor: '#eab308' }]}>
              <Text style={styles.updateIcon}>⚡</Text>
              <Text style={styles.updateValue}>{profile?.rp_total?.toLocaleString() || 0}</Text>
              <Text style={styles.updateLabel}>TOTAL RP</Text>
            </View>
          </View>

          {/* --- Personal Records --- */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PERSONAL RECORDS</Text>
            {records.length === 0 ? (
              <Text style={styles.emptyText}>No personal records yet.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prScrollContent}>
                {records.map((pr) => (
                  <View key={pr.id} style={styles.prCard}>
                    <View style={styles.prSportHeader}>
                      <Text style={styles.prSportIcon}>🏋️</Text>
                      <Text style={styles.prSportName}>GYM</Text>
                    </View>
                    <Text style={styles.prValue}>{parseFloat(pr.value)} kg</Text>
                    <Text style={styles.prExerciseName}>{pr.exercise_name}</Text>
                    <Text style={styles.prDate}>{timeAgo(pr.created_at)}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* --- Posts Section --- */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>POSTS</Text>
              <TouchableOpacity style={styles.addPostBtn} onPress={() => setPostModalVisible(true)}>
                <Text style={styles.addPostIcon}>+</Text>
              </TouchableOpacity>
            </View>

            {posts.length === 0 ? (
              <Text style={styles.emptyText}>No posts yet.</Text>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDelete={deletePost}
                  isDeleting={isDeleting === post.id}
                />
              ))
            )}
          </View>

        </ScrollView>
      </View>

      <CreatePostModal
        visible={isPostModalVisible}
        onClose={() => setPostModalVisible(false)}
        onSuccess={(newPost) => addPost(newPost)}
      />
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
    maxWidth: 520,
    alignSelf: 'center',
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
  },
  headerTitle: {
    ...TextPresets.h2,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconBtn: {
    padding: Spacing[2],
    marginLeft: Spacing[2],
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: Colors.status.error,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.text.inverse,
    fontSize: 9,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[10],
  },

  // Profile Info
  profileInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing[4],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: Colors.background.tertiary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0B0F17',
  },
  editIconText: {
    fontSize: 12,
  },
  infoDetails: {
    flex: 1,
  },
  name: {
    ...TextPresets.h3,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  username: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    marginBottom: Spacing[2],
  },
  sportsScroll: {
    flexDirection: 'row',
  },
  sportBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderColor: 'rgba(74, 222, 128, 0.3)',
    borderWidth: 1,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    marginRight: Spacing[2],
  },
  sportBadgeText: {
    ...TextPresets.caption,
    color: '#4ADE80',
    fontWeight: 'bold',
  },

  // Social Stats
  socialStats: {
    flexDirection: 'row',
    marginBottom: Spacing[8],
  },
  statBox: {
    marginRight: Spacing[6],
    alignItems: 'center',
  },
  statCount: {
    ...TextPresets.h4,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  statLabel: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
  },

  // Updates Cards
  updatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[8],
  },
  updateCard: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    marginHorizontal: Spacing[1],
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    minHeight: 90,
  },
  updateIcon: {
    fontSize: 20,
    marginBottom: Spacing[2],
  },
  updateValue: {
    ...TextPresets.h4,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  tierBadgeBox: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  tierBadgeText: {
    ...TextPresets.caption,
    color: '#EAB308',
    fontWeight: 'bold',
  },
  updateLabel: {
    ...TextPresets.caption,
    color: Colors.text.tertiary,
    fontSize: 10,
    marginTop: Spacing[2],
    letterSpacing: 1,
  },

  // Sections
  section: {
    marginBottom: Spacing[8],
  },
  sectionTitle: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: Spacing[4],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  addPostBtn: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPostIcon: {
    color: '#CCFF00',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // PR Cards
  prScrollContent: {
    paddingRight: Spacing[4],
  },
  prCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginRight: Spacing[3],
    width: 130,
    borderTopWidth: 2,
    borderColor: '#818CF8', // Indigo
  },
  prSportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  prSportIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  prSportName: {
    ...TextPresets.caption,
    color: '#818CF8',
    fontWeight: 'bold',
    fontSize: 10,
  },
  prValue: {
    ...TextPresets.h4,
    color: Colors.text.inverse,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prExerciseName: {
    ...TextPresets.body,
    color: Colors.text.primary,
    marginBottom: Spacing[3],
  },
  prDate: {
    ...TextPresets.caption,
    color: Colors.text.tertiary,
    fontSize: 10,
  },

  emptyText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
  }
});

export default ProfileScreen;
