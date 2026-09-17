import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator 
} from 'react-native';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { useAppDispatch } from '@store/hooks';
import { setUnreadNotificationCount, decrementUnreadCount } from '@store/slices/uiSlice';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';

interface NotificationPayload {
  from_user_name?: string;
  streak_days?: number;
  bonus_rp?: number;
  [key: string]: any;
}

interface AppNotification {
  id: string;
  type: 'post_liked' | 'streak_milestone' | 'tier_promotion' | 'followed_user_pr' | 'pr_disputed' | string;
  read: boolean;
  created_at: string;
  payload?: NotificationPayload;
}

const NotificationsScreen = (): React.JSX.Element => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = useCallback(async (pageNum: number = 1, shouldRefresh: boolean = false) => {
    try {
      const res = await apiClient.get(`${Endpoints.notifications.list}?page=${pageNum}&limit=20`);
      const newNotifs: AppNotification[] = res.data?.data || [];
      
      if (shouldRefresh) {
        setNotifications(newNotifs);
      } else {
        setNotifications(prev => [...prev, ...newNotifs]);
      }

      setHasMore(newNotifs.length === 20);

      // Update global unread count based on current first page if refreshing, 
      // or total unread in the loaded list. Better to just recount from the fetched set.
      if (shouldRefresh) {
        const unreadCount = newNotifs.filter(n => !n.read).length;
        dispatch(setUnreadNotificationCount(unreadCount));
      }

    } catch (err) {
      console.error('Failed to fetch notifications:', err);
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

  const renderNotification = ({ item }: { item: AppNotification }) => {
    let icon = '🔔';
    let text = 'You have a new notification';

    switch (item.type) {
      case 'post_liked':
        icon = '❤️';
        text = `${item.payload?.from_user_name || 'Someone'} liked your post`;
        break;
      case 'streak_milestone':
        icon = '🔥';
        text = `${item.payload?.streak_days || 0}-day streak! +${item.payload?.bonus_rp || 0} RP`;
        break;
      case 'tier_promotion':
        icon = '🏆';
        text = 'Tier promotion'; // Fallback
        break;
      case 'followed_user_pr':
        icon = '🏅';
        text = 'Friend hit a new PR';
        break;
      case 'pr_disputed':
        icon = '⚠️';
        text = 'PR verification disputed';
        break;
      default:
        // Generic fallback formatter (e.g. 'new_message' -> 'New message')
        icon = '📌';
        text = item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        onPress={() => handleMarkRead(item.id, item.read)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{icon}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.notificationText, !item.read && styles.unreadText]}>
            {text}
          </Text>
          <Text style={styles.timeText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
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
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>You're all caught up!</Text>
          </View>
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
    backgroundColor: Colors.background.primary,
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backText: {
    ...TextPresets.body,
    color: Colors.brand.primary,
  },
  headerTitle: {
    ...TextPresets.h4,
    color: Colors.text.primary,
  },
  markAllText: {
    ...TextPresets.caption,
    color: Colors.brand.primary,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[4],
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
    borderColor: Colors.border.primary,
  },
  unreadCard: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  iconContainer: {
    position: 'relative',
    marginRight: Spacing[4],
  },
  icon: {
    fontSize: 24,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.status.error,
    borderWidth: 2,
    borderColor: Colors.background.secondary,
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    marginBottom: Spacing[1],
  },
  unreadText: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  timeText: {
    ...TextPresets.caption,
    color: Colors.text.tertiary,
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing[10],
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing[4],
  },
  emptyText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
  }
});

export default NotificationsScreen;
