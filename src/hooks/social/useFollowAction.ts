import { useState } from 'react';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';

export const useFollowAction = () => {
  const [isFollowLoading, setIsFollowLoading] = useState<Record<string, boolean>>({});

  const toggleFollow = async (userId: string, currentlyFollowing: boolean) => {
    setIsFollowLoading(prev => ({ ...prev, [userId]: true }));
    try {
      if (currentlyFollowing) {
        await apiClient.delete(Endpoints.social.follow(userId));
      } else {
        await apiClient.post(Endpoints.social.follow(userId));
      }
      return true;
    } catch (err) {
      console.error('Follow action failed:', err);
      return false;
    } finally {
      setIsFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  return { toggleFollow, isFollowLoading };
};

