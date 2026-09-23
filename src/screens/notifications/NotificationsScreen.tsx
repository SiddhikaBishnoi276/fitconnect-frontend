import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { Colors, Spacing, TextPresets, Layout, BorderRadius } from '@theme/index';
import { setUnreadNotificationCount, decrementUnreadCount } from '@store/slices/uiSlice';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';

interface AppNotification {
  id: string;
  type: string;
  payload: any;
  read: boolean;
  created_at: string;
}

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      setError(null);

      // Using the generic list endpoint
      const res = await apiClient.get(`${Endpoints.notifications.list}?page=${pageNum}&limit=20`);
      
      const newNotifs: AppNotification[] = res.data?.data?.notifications || res.data?.data || [];
      const unreadCount = res.data?.data?.unread_count || 0;
      
      dispatch(setUnreadNotificationCount(unreadCount));

      if (isRefresh) {
        setNotifications(newNotifs);
      } else {
        setNotifications(prev => [...prev, ...newNotifs]);
      }

      setHasMore(newNotifs.length === 20);
    } catch (err: any) {
      console.error('Fetch notifications err', err);
      setError(err?.response?.data?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1, true);
    }, [fetchNotifications])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchNotifications(1, true);
  };

  const onLoadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const handleMarkRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return;
    
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    dispatch(decrementUnreadCount());

    try {
      await apiClient.patch(Endpoints.notifications.markRead(id));
    } catch (err) {
      // Revert on fail
      console.error('Failed to mark read', err);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
    }
  };

  const handleMarkAllRead = async () => {
    // Optimistic
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    dispatch(setUnreadNotificationCount(0));

    try {
      await apiClient.patch(Endpoints.notifications.markAllRead);
    } catch (err) {
      console.error('Failed to mark all read', err);
      onRefresh(); // easiest revert is to refetch
    }
  };

  // Convert time to relative (e.g. "5 min ago", "Today", "Yesterday", "Mon")
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const mins = Math.floor(diff / (1000 * 60));
    
    if (mins < 60) return `${Math.max(1, mins)} min ago`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return 'Last week';
  };

  const renderNotification = ({ item }: { item: AppNotification }) => {
    let icon = '🔔';
    let text = 'You have a new notification';

    switch (item.type) {
      case 'new_follower':
        icon = '👤';
        text = `${item.payload?.follower_name || 'Someone'} started following you`;
        break;
      case 'post_liked':
        icon = '👍';
        text = `${item.payload?.liker_name || item.payload?.from_user_name || 'Someone'} liked your post`;
        break;
      case 'streak_milestone':
        icon = '🔥';
        text = `You've completed a ${item.payload?.streak_days || 0}-day training streak`;
        break;
      case 'tier_promotion':
        icon = '🏅';
        text = `You've been promoted to ${item.payload?.tier || 'a new'} tier!`;
        break;
      case 'rp_alert':
        icon = '⚡';
        text = `Your weekly RP summary: +${item.payload?.rp || 0} RP this week`;
        break;
      default:
        // Generic fallback formatter (e.g. 'new_message' -> 'New message')
        icon = '📌';
        text = item.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    }

    return (
      <View style={[styles.notificationCard, !item.read && styles.unreadCard]}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.notificationText, !item.read && styles.unreadText]}>
            {text}
          </Text>
          <Text style={styles.timeText}>
            {timeAgo(item.created_at)}
          </Text>
        </View>

        {!item.read && (
          <View style={styles.rightActions}>
            <View style={styles.unreadDot} />
            <TouchableOpacity 
              style={styles.readBtn}
              onPress={() => handleMarkRead(item.id, item.read)}
              activeOpacity={0.7}
            >
              <Text style={styles.readBtnText}>Read</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.brand.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Read All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>⚠️</Text>
              <Text style={[styles.emptyText, { marginBottom: Spacing[2] }]}>Could not load notifications</Text>
              <Text style={[TextPresets.caption, { color: Colors.text.tertiary, textAlign: 'center', marginBottom: Spacing[6], paddingHorizontal: Spacing[4] }]}>
                {error}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchNotifications(1, true)}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={[styles.emptyText, { fontSize: 18, fontWeight: 'bold', color: Colors.text.inverse }]}>No notifications found</Text>
              <Text style={[styles.emptyText, { marginTop: 8 }]}>You're all caught up!</Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color={Colors.brand.primary} style={{ marginVertical: Spacing[4] }} />
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17', // Match the dark Figma background
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[4],
  },
  backBtn: {
    padding: Spacing[2],
    marginLeft: -Spacing[2],
  },
  backIcon: {
    fontSize: 24,
    color: Colors.text.inverse,
  },
  headerTitle: {
    ...TextPresets.h3,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
  markAllText: {
    ...TextPresets.body,
    color: Colors.brand.primary,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[2],
    paddingBottom: Spacing[10],
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: Spacing[4],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand.primary,
    borderColor: 'rgba(204, 255, 0, 0.1)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  unreadText: {
    color: Colors.text.inverse,
    fontWeight: '600',
  },
  timeText: {
    ...TextPresets.caption,
    color: Colors.text.tertiary,
    fontSize: 11,
  },
  rightActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: Spacing[3],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brand.primary, // Lime green dot
    marginBottom: 8,
  },
  readBtn: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  readBtnText: {
    ...TextPresets.caption,
    color: Colors.brand.primary,
    fontWeight: 'bold',
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing[10],
    marginTop: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing[4],
    opacity: 0.5,
  },
  emptyText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
  },
  retryButton: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.full,
  },
  retryButtonText: {
    ...TextPresets.button,
    color: Colors.brand.primary,
    fontSize: 14,
  },
});

export default NotificationsScreen;

