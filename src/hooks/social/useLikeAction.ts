import { useState } from 'react';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';

export const useLikeAction = () => {
  const [isLikeLoading, setIsLikeLoading] = useState<Record<string, boolean>>({});

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    setIsLikeLoading(prev => ({ ...prev, [postId]: true }));
    try {
      if (currentlyLiked) {
        await apiClient.delete(Endpoints.social.likePost(postId));
      } else {
        await apiClient.post(Endpoints.social.likePost(postId));
      }
      return true;
    } catch (err) {
      console.error('Like action failed:', err);
      return false;
    } finally {
      setIsLikeLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  return { toggleLike, isLikeLoading };
};

