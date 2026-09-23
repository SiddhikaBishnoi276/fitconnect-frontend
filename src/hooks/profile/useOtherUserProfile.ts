import { useState, useCallback, useEffect } from 'react';
import apiClient from '@api/client';
import { OtherUserProfile } from '@t/social';

export const useOtherUserProfile = (userId: string) => {
  const [profile, setProfile] = useState<OtherUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // The API endpoint is likely /profile/:userId as specified in the backend doc
      const response = await apiClient.get(`/profile/${userId}?page=1&limit=20`);
      if (response.data?.success) {
        setProfile(response.data.data);
      } else {
        setError('Failed to load profile');
      }
    } catch (err) {
      console.error('Error fetching other user profile:', err);
      setError('An error occurred while fetching the profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => fetchProfile(true);

  // Expose a method to manually update followers count and follow state
  // This is used by the UI when the follow/unfollow API succeeds
  const updateLocalFollowState = (isFollowingNow: boolean) => {
    setProfile(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        is_following: isFollowingNow,
        followers_count: prev.followers_count + (isFollowingNow ? 1 : -1)
      };
    });
  };

  return { profile, loading, refreshing, error, onRefresh, updateLocalFollowState, refetch: fetchProfile };
};
