import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { ProfileSummary, PersonalRecord, Post, SocialUser } from '@t/profile';

// ─── Main Profile Hook ────────────────────────────────────────────────────────
export const useProfile = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [records, setRecords] = useState<PersonalRecord[]>([]);

  const fetchProfileData = useCallback(async () => {
    try {
      const [profileRes, recordsRes] = await Promise.all([
        apiClient.get(`${Endpoints.profile.me}?page=1&limit=20`).catch(e => e.response || e),
        apiClient.get(Endpoints.profile.records).catch(e => e.response || e)
      ]);

      if (profileRes?.data?.success) {
        setProfile(profileRes.data.data);
      }
      if (recordsRes?.data?.success) {
        setRecords(recordsRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch profile data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  return {
    profile,
    records,
    loading,
    refreshing,
    fetchProfileData,
    onRefresh
  };
};

// ─── Profile Posts Hook ───────────────────────────────────────────────────────
export const useProfilePosts = (initialPosts: Post[] = []) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Sync state if parent refetches data (e.g. on pull-to-refresh)
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const deletePost = useCallback(async (postId: string) => {
    // Optimistic UI Update: Delete immediately without waiting
    let removedPost: Post | undefined;
    setPosts(prev => {
      removedPost = prev.find(p => p.id === postId);
      return prev.filter(p => p.id !== postId);
    });

    // Background API call
    try {
      const response = await apiClient.delete(Endpoints.social.deletePost(postId));
      if (response.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Post deleted',
          position: 'bottom',
          visibilityTime: 2000,
        });
      } else {
        // Revert on failure
        if (removedPost) setPosts(prev => [removedPost!, ...prev]);
        Toast.show({ type: 'error', text1: 'Failed to delete post', position: 'bottom' });
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      // Revert on failure
      if (removedPost) setPosts(prev => [removedPost!, ...prev]);
      Toast.show({ type: 'error', text1: 'Failed to delete post', position: 'bottom' });
    }
  }, []);

  const addPost = useCallback((newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  }, []);

  return {
    posts,
    isDeleting,
    deletePost,
    addPost,
  };
};

// ─── Social Connections Hook ──────────────────────────────────────────────────
export const useSocialConnections = (initialTab: 'followers' | 'following') => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [data, setData] = useState<SocialUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async (tab: 'followers' | 'following') => {
    setLoading(true);
    try {
      const endpoint = tab === 'followers' ? Endpoints.social.followers : Endpoints.social.following;
      const response = await apiClient.get(endpoint);
      if (response.data?.success) {
        setData(response.data.data || []);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch social data", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections(activeTab);
  }, [activeTab, fetchConnections]);

  return {
    activeTab,
    setActiveTab,
    data,
    loading,
    fetchConnections
  };
};
