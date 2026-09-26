import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { Routes } from '@constants/routes';
import { Colors } from '@theme/index';
import type { RootStackParamList } from '@t/navigation';
import type { OtherUserProfile, Post } from '@t/social';
import { useAppSelector } from '@store/hooks';

type ScreenRouteProp = RouteProp<RootStackParamList, 'OtherUserProfile'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const OtherUserProfileScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const currentUser = useAppSelector(state => state.auth.user);

  const { userId } = route.params;

  const [profile, setProfile] = useState<OtherUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiClient.get(Endpoints.profile.otherUser(userId));
      setProfile(res.data?.data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId === currentUser?.id) {
      // Note: Actually navigating to a Tab requires casting or using Tab methods.
      // Easiest is to go back and navigate to 'Profile' if supported by RootNav
      // We'll just replace with MAIN -> PROFILE if needed, but going to Profile tab:
      navigation.goBack();
      setTimeout(() => {
        navigation.navigate(Routes.Root.MAIN as any, { screen: Routes.Main.PROFILE });
      }, 0);
      return;
    }
    fetchProfile();
  }, [userId, currentUser, fetchProfile, navigation]);

  useEffect(() => {
    const subFollow = DeviceEventEmitter.addListener('follow_status_changed', (data) => {
      if (data.userId === userId) {
        setProfile(prev => prev ? { ...prev, is_following: data.isFollowing } : prev);
      }
    });

    const subLike = DeviceEventEmitter.addListener('post_liked', (data) => {
      setProfile(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          posts: prev.posts.map(p => {
            if (p.id === data.postId) {
              return { ...p, liked_by_me: data.liked_by_me, like_count: data.like_count };
            }
            return p;
          })
        };
      });
    });

    return () => {
      subFollow.remove();
      subLike.remove();
    };
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    const isCurrentlyFollowing = profile.is_following;

    // Optimistic
    setProfile(prev => prev ? { ...prev, is_following: !isCurrentlyFollowing } : prev);
    DeviceEventEmitter.emit('follow_status_changed', { userId, isFollowing: !isCurrentlyFollowing });

    try {
      if (!isCurrentlyFollowing) {
        await apiClient.post(Endpoints.social.follow(userId));
      } else {
        await apiClient.delete(Endpoints.social.follow(userId));
      }
    } catch (err) {
      // Revert
      setProfile(prev => prev ? { ...prev, is_following: isCurrentlyFollowing } : prev);
      DeviceEventEmitter.emit('follow_status_changed', { userId, isFollowing: isCurrentlyFollowing });
    }
  };

  const handleLike = async (post: Post) => {
    if (!profile) return;
    const isLiking = !post.liked_by_me;

    // Optimistic
    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: prev.posts.map(p => {
          if (p.id === post.id) {
            let currentLikes = p.like_count ?? (p as any).likes_count ?? (p as any).likes ?? (p as any).likeCount ?? 0;
            if (p.liked_by_me && currentLikes === 0) currentLikes = 1;
            const newLikeCount = Math.max(0, currentLikes + (isLiking ? 1 : -1));

            DeviceEventEmitter.emit('post_liked', {
              postId: p.id,
              liked_by_me: isLiking,
              like_count: newLikeCount
            });

            return { ...p, liked_by_me: isLiking, like_count: newLikeCount };
          }
          return p;
        })
      };
    });

    try {
      let res;
      if (isLiking) {
        res = await apiClient.post(Endpoints.social.likePost(post.id));
      } else {
        res = await apiClient.delete(Endpoints.social.likePost(post.id));
      }

      if (res.data) {
        setProfile(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            posts: prev.posts.map(p => {
              if (p.id === post.id) {
                const updatedLiked = res.data.liked_by_me ?? p.liked_by_me;
                const updatedLikes = res.data.like_count ?? res.data.likes_count ?? res.data.likes ?? res.data.likeCount ?? p.like_count;

                DeviceEventEmitter.emit('post_liked', {
                  postId: p.id,
                  liked_by_me: updatedLiked,
                  like_count: updatedLikes
                });

                return {
                  ...p,
                  liked_by_me: updatedLiked,
                  like_count: updatedLikes,
                };
              }
              return p;
            })
          };
        });
      }
    } catch (err) {
      // Revert
      setProfile(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          posts: prev.posts.map(p => {
            if (p.id === post.id) {
              let currentLikes = p.like_count ?? (p as any).likes_count ?? (p as any).likes ?? (p as any).likeCount ?? 0;
              const revertedLikes = Math.max(0, currentLikes + (!isLiking ? 1 : -1));

              DeviceEventEmitter.emit('post_liked', {
                postId: p.id,
                liked_by_me: !isLiking,
                like_count: revertedLikes
              });

              return { ...p, liked_by_me: !isLiking, like_count: revertedLikes };
            }
            return p;
          })
        };
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#CCFF00" />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load profile.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchProfile}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtnAbsolute} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const getTierDetails = (tierName: string = 'Bronze') => {
    const lower = tierName.toLowerCase();
    if (lower === 'gold') return { icon: '🥇', color: '#EAB308' };
    if (lower === 'silver') return { icon: '🥈', color: '#94A3B8' };
    return { icon: '🥉', color: '#D97706' };
  };
  const tierDetails = getTierDetails(profile?.tier);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Profile
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            {profile.photo_url ? (
              <Image source={{ uri: profile.photo_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitials}>{profile.name.charAt(0)}</Text>
            )}
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>

          {profile.is_followed_by && (
            <View style={styles.followsYouTag}>
              <Text style={styles.followsYouText}>Follows you</Text>
            </View>
          )}

          {profile.sports && profile.sports.length > 0 && (
            <View style={styles.sportTags}>
              {profile.sports.map(s => (
                <View key={s.id} style={styles.sportChip}>
                  <Text style={styles.sportChipText}>{s.name}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.followBtn, profile.is_following && styles.followingBtn]}
            onPress={handleFollowToggle}
          >
            <Text style={[styles.followBtnText, profile.is_following && styles.followingBtnText]}>
              {profile.is_following ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts / Followers / Following */}
        <View style={styles.socialStats}>
          <View style={styles.socialStatBox}>
            <Text style={styles.socialStatCount}>{profile.posts?.length || (profile as any).posts_count || 0}</Text>
            <Text style={styles.socialStatLabel}>Posts</Text>
          </View>
          <View style={styles.socialStatBox}>
            <Text style={styles.socialStatCount}>{profile.followers_count || 0}</Text>
            <Text style={styles.socialStatLabel}>Followers</Text>
          </View>
          <View style={styles.socialStatBox}>
            <Text style={styles.socialStatCount}>{profile.following_count || 0}</Text>
            <Text style={styles.socialStatLabel}>Following</Text>
          </View>
        </View>

        {/* --- Updates Cards (Streak, Tier, Total RP) --- */}
        <View style={styles.updatesContainer}>
          <View style={[styles.updateCard, { borderColor: '#f97316' }]}>
            <Text style={styles.updateIcon}>🔥</Text>
            <Text style={styles.updateValue}>{profile.current_streak || 0}d</Text>
            <Text style={styles.updateLabel}>STREAK</Text>
          </View>
          <View style={[styles.updateCard, { borderColor: tierDetails.color }]}>
            <Text style={styles.updateIcon}>{tierDetails.icon}</Text>
            <View style={[styles.tierBadgeBox, { backgroundColor: `${tierDetails.color}33` }]}>
              <Text style={[styles.tierBadgeText, { color: tierDetails.color }]}>{profile.tier || 'Bronze'}</Text>
            </View>
            <Text style={styles.updateLabel}>TIER</Text>
          </View>
          <View style={[styles.updateCard, { borderColor: '#eab308' }]}>
            <Text style={styles.updateIcon}>⚡</Text>
            <Text style={styles.updateValue}>{profile.rp_total?.toLocaleString() || 0}</Text>
            <Text style={styles.updateLabel}>TOTAL RP</Text>
          </View>
        </View>

        {/* PRs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERSONAL RECORDS</Text>
          {!profile.prs || profile.prs.length === 0 ? (
            <Text style={styles.emptyStateText}>No personal records yet</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prScroll}>
              {profile.prs.map((pr, idx) => (
                <View key={idx} style={styles.prCard}>
                  <Text style={styles.prExercise}>{pr.exercise_name}</Text>
                  <Text style={styles.prValue}>
                    {pr.value} {pr.metric === 'time_min' ? 'min' : (pr.metric === '1_kg' ? 'kg' : pr.metric.replace('_', ' '))}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Posts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>POSTS</Text>
          {!profile.posts || profile.posts.length === 0 ? (
            <Text style={styles.emptyStateText}>No posts yet</Text>
          ) : (
            <View style={styles.postsList}>
              {profile.posts.map(post => {
                const diff = new Date(post.created_at).getTime() - new Date().getTime();
                const diffMins = Math.round(diff / (1000 * 60));
                const timeStr = diffMins > -60 ? `${Math.abs(diffMins)} min ago` : `${Math.abs(Math.round(diffMins / 60))} hr ago`;

                const authorObj = post.author || (post as any).user || (post as any).author_info || {
                  name: profile.name || profile.username || 'Unknown',
                  avatar_url: profile.photo_url || undefined
                };

                const authorAvatar = authorObj.avatar_url || (authorObj as any).photo_url || (authorObj as any).avatarUrl;
                let likeCount = post.like_count ?? (post as any).likes_count ?? (post as any).likes ?? (post as any).likeCount ?? 0;
                if (post.liked_by_me && likeCount === 0) likeCount = 1;

                let postImageUrl = post.photo_url || (post as any).media_url || (post as any).image_url;
                if (typeof postImageUrl === 'string' && !postImageUrl.startsWith('http')) {
                  postImageUrl = undefined;
                }

                return (
                  <View key={post.id} style={styles.postCard}>
                    <View style={styles.postHeader}>
                      <View style={styles.authorInfo}>
                        <View style={styles.postAvatar}>
                          {authorAvatar ? (
                            <Image source={{ uri: authorAvatar }} style={styles.avatarImg} />
                          ) : (
                            <Text style={styles.postAvatarInitials}>{(authorObj.name || 'U').charAt(0)}</Text>
                          )}
                        </View>
                        <View>
                          <Text style={styles.postAuthorName}>{authorObj.name}</Text>
                          <Text style={styles.timeText}>{timeStr}</Text>
                        </View>
                      </View>
                    </View>

                    {post.caption && <Text style={styles.caption}>{post.caption}</Text>}

                    {postImageUrl && (
                      <Image source={{ uri: postImageUrl }} style={styles.postImage} resizeMode="cover" />
                    )}

                    <View style={styles.postFooter}>
                      <TouchableOpacity style={styles.likeBtn} onPress={() => handleLike(post)}>
                        <Text style={[styles.likeIcon, post.liked_by_me && styles.likeIconActive]}>
                          {post.liked_by_me ? '♥' : '♡'}
                        </Text>
                        <Text style={styles.likeCount}>{likeCount}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
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
    backgroundColor: Colors.background.primary,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backBtnAbsolute: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 24,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: '#CCFF00',
    fontSize: 36,
    fontWeight: '800',
  },
  name: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  username: {
    color: '#94A3B8',
    fontSize: 15,
    marginBottom: 12,
  },
  followsYouTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  followsYouText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  sportTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sportChip: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sportChipText: {
    color: Colors.brand.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  followBtn: {
    backgroundColor: Colors.brand.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border.secondary,
  },
  followBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  followingBtnText: {
    color: '#FFF',
  },

  socialStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    marginHorizontal: 20,
  },
  socialStatBox: {
    alignItems: 'center',
  },
  socialStatCount: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  socialStatLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  updatesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    marginHorizontal: 20,
  },
  updateCard: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    minHeight: 90,
  },
  updateIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  updateValue: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  tierBadgeBox: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tierBadgeText: {
    fontSize: 12,
    color: '#EAB308',
    fontWeight: 'bold',
  },
  updateLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 8,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  emptyStateText: {
    color: '#64748B',
    fontSize: 14,
    paddingHorizontal: 20,
    fontStyle: 'italic',
  },
  prScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  prCard: {
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    minWidth: 140,
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand.accent,
  },
  prExercise: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 8,
  },
  prValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  postsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  // Post Card (Reused styles)
  postCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  postAvatarInitials: {
    color: Colors.brand.accent,
    fontWeight: '700',
    fontSize: 16,
  },
  postAuthorName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  caption: {
    color: '#E2E8F0',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  likeIcon: {
    fontSize: 20,
    color: '#94A3B8',
    marginRight: 6,
    lineHeight: 22,
  },
  likeIconActive: {
    color: '#EF4444',
  },
  likeCount: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default OtherUserProfileScreen;
