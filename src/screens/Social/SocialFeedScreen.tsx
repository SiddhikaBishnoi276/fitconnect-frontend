import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { Routes } from '@constants/routes';
import { Colors } from '@theme/index';
import { useAppSelector } from '@store/hooks';
import type { Post } from '@t/social';
import type { MainTabParamList, RootStackParamList } from '@t/navigation';

type SocialScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Social'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const SocialFeedScreen = (): React.JSX.Element => {
  const navigation = useNavigation<SocialScreenNavigationProp>();
  const currentUser = useAppSelector(state => state.auth.user);

  const [activeTab, setActiveTab] = useState<'global' | 'following'>('global');
  const [filter, setFilter] = useState<'all' | 'prs' | 'streaks'>('all');
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = async (pageNum: number, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      // Note: Backend endpoint uses ?tab=global but also supports &page=1&limit=20
      const baseUrl = activeTab === 'global' ? Endpoints.social.feedGlobal : Endpoints.social.feedFollowing;
      const url = `${baseUrl}&page=${pageNum}&limit=20`;
      
      const response = await apiClient.get(url);
      const fetchedPosts: Post[] = response.data?.data?.posts || response.data?.data || [];
      
      if (isRefresh || pageNum === 1) {
        setPosts(fetchedPosts);
      } else {
        setPosts(prev => [...prev, ...fetchedPosts]);
      }
      
      setHasMore(fetchedPosts.length === 20);
    } catch (error) {
      if (pageNum === 1) {
        Alert.alert('Error', 'Failed to load feed.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchPosts(1, false);
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setPage(1);
    fetchPosts(1, true);
  }, [activeTab]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };

  const handleLike = async (post: Post) => {
    // Optimistic update
    const isLiking = !post.liked_by_me;
    setPosts(prev =>
      prev.map(p =>
        p.id === post.id
          ? {
              ...p,
              liked_by_me: isLiking,
              like_count: p.like_count + (isLiking ? 1 : -1),
            }
          : p
      )
    );

    try {
      if (isLiking) {
        await apiClient.post(Endpoints.social.likePost(post.id));
      } else {
        await apiClient.delete(Endpoints.social.likePost(post.id));
      }
    } catch (err) {
      // Revert on failure
      setPosts(prev =>
        prev.map(p =>
          p.id === post.id
            ? {
                ...p,
                liked_by_me: !isLiking,
                like_count: p.like_count + (!isLiking ? 1 : -1),
              }
            : p
        )
      );
    }
  };

  const navigateToProfile = (userId: string) => {
    if (userId === currentUser?.id) {
      navigation.navigate(Routes.Main.PROFILE);
    } else {
      navigation.navigate(Routes.Root.OTHER_USER_PROFILE, { userId });
    }
  };

  const getFilteredPosts = () => {
    if (filter === 'prs') {
      return posts.filter(p => p.type === 'pr');
    }
    if (filter === 'streaks') {
      // Approximate streak filter based on type or caption keywords
      return posts.filter(p => p.caption?.toLowerCase().includes('streak'));
    }
    return posts;
  };

  const filteredPosts = getFilteredPosts();

  const renderPost = ({ item }: { item: Post }) => {
    // Basic relative time formatter
    const diff = new Date(item.created_at).getTime() - new Date().getTime();
    const diffMins = Math.round(diff / (1000 * 60));
    const timeStr = diffMins > -60 ? `${Math.abs(diffMins)} min ago` : `${Math.abs(Math.round(diffMins/60))} hr ago`;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <TouchableOpacity style={styles.authorInfo} onPress={() => navigateToProfile(item.author?.id)}>
            <View style={styles.avatar}>
              {item.author?.avatar_url ? (
                <Image source={{ uri: item.author.avatar_url }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitials}>{item.author?.name?.charAt(0) || '?'}</Text>
              )}
            </View>
            <View>
              <Text style={styles.authorName}>{item.author?.name || 'Unknown'}</Text>
              <Text style={styles.timeText}>{timeStr}</Text>
            </View>
          </TouchableOpacity>
          {item.type === 'pr' && (
            <View style={styles.prBadge}>
              <Text style={styles.prBadgeText}>NEW PR</Text>
            </View>
          )}
          {item.type === 'session' && (
            <View style={styles.sessionBadge}>
              <Text style={styles.sessionBadgeText}>🏃 Workout</Text>
            </View>
          )}
        </View>

        {item.caption && <Text style={styles.caption}>{item.caption}</Text>}

        {item.photo_url && (
          <Image source={{ uri: item.photo_url }} style={styles.postImage} resizeMode="cover" />
        )}

        <View style={styles.postFooter}>
          <TouchableOpacity style={styles.likeBtn} onPress={() => handleLike(item)}>
            <Text style={[styles.likeIcon, item.liked_by_me && styles.likeIconActive]}>
              {item.liked_by_me ? '♥' : '♡'}
            </Text>
            <Text style={styles.likeCount}>{item.like_count}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {activeTab === 'global' 
            ? "No posts yet — be the first to share!" 
            : "You're not following anyone yet — find athletes to follow!"}
        </Text>
        {activeTab === 'following' && (
          <TouchableOpacity 
            style={styles.addAthletesBtn} 
            onPress={() => navigation.navigate(Routes.Root.ADD_ATHLETES)}
          >
            <Text style={styles.addAthletesBtnText}>Add Athletes</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Social</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.squadBtn} disabled>
            <Text style={styles.squadBtnText}>Squad (Coming soon)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.createBtn}
            onPress={() => navigation.navigate(Routes.Modals.CREATE_POST)}
          >
            <Text style={styles.createBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'global' && styles.tabActive]}
          onPress={() => setActiveTab('global')}
        >
          <Text style={[styles.tabText, activeTab === 'global' && styles.tabTextActive]}>Global</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'following' && styles.tabActive]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>Following</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {(['all', 'prs', 'streaks'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'prs' ? 'PRs' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading && page === 1 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#CCFF00" />
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item, index) => item.id || `post-${index}`}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CCFF00" />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore && posts.length > 0 ? (
              <ActivityIndicator size="small" color="#CCFF00" style={{ marginVertical: 16 }} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  squadBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    opacity: 0.6,
  },
  squadBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  createBtn: {
    backgroundColor: '#CCFF00',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#000',
    fontSize: 24,
    fontWeight: '600',
    marginTop: -2,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 20,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#CCFF00',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#CCFF00',
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  filterChipActive: {
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#CCFF00',
  },
  filterText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#CCFF00',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  addAthletesBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addAthletesBtnText: {
    color: '#CCFF00',
    fontWeight: '700',
  },
  // Post Card Styles
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: '#CCFF00',
    fontWeight: '700',
    fontSize: 16,
  },
  authorName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  prBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  prBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '800',
  },
  sessionBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sessionBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
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

export default SocialFeedScreen;
