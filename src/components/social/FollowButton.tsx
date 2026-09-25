import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@theme/index';
import { useFollowAction } from '@hooks/social/useFollowAction';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  onStateChange?: (isFollowing: boolean) => void;
  style?: any;
  small?: boolean;
}

// Global in-memory cache for follow status across screens
export const globalFollowCache: Record<string, boolean> = {};

export const updateGlobalFollowCache = (userId: string, isFollowing: boolean) => {
  globalFollowCache[userId] = isFollowing;
};

const FollowButton: React.FC<FollowButtonProps> = ({ 
  userId, 
  initialIsFollowing, 
  onStateChange,
  style,
  small = false
}) => {
  const { toggleFollow } = useFollowAction();
  
  // If API explicitly says true, trust it and cache it.
  if (initialIsFollowing) {
    globalFollowCache[userId] = true;
  }

  const [isFollowing, setIsFollowing] = useState(globalFollowCache[userId] ?? initialIsFollowing);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only override local state if the prop says true OR we don't have a cached value
    if (initialIsFollowing || globalFollowCache[userId] === undefined) {
      globalFollowCache[userId] = initialIsFollowing;
      setIsFollowing(initialIsFollowing);
    }
  }, [initialIsFollowing, userId]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('follow_status_changed', (data) => {
      globalFollowCache[data.userId] = data.isFollowing;
      if (data.userId === userId) {
        setIsFollowing(data.isFollowing);
        if (onStateChange) onStateChange(data.isFollowing);
      }
    });
    return () => sub.remove();
  }, [userId, onStateChange]);

  const handlePress = async () => {
    const isNowFollowing = !isFollowing;
    
    // Optimistic Update
    setIsFollowing(isNowFollowing);
    if (onStateChange) onStateChange(isNowFollowing);
    DeviceEventEmitter.emit('follow_status_changed', { userId, isFollowing: isNowFollowing });
    
    setLoading(true);
    const success = await toggleFollow(userId, !isNowFollowing);
    setLoading(false);
    
    if (!success) {
      // Revert if failed
      setIsFollowing(!isNowFollowing);
      if (onStateChange) onStateChange(!isNowFollowing);
      DeviceEventEmitter.emit('follow_status_changed', { userId, isFollowing: !isNowFollowing });
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        small && styles.buttonSmall,
        isFollowing && styles.followingBtn,
        style
      ]} 
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isFollowing ? Colors.text.primary : '#000'} />
      ) : (
        <Text style={[
          styles.text, 
          small && styles.textSmall,
          isFollowing && styles.followingText
        ]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  buttonSmall: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    minWidth: 70,
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  text: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  textSmall: {
    fontSize: 12,
  },
  followingText: {
    color: Colors.text.primary,
  },
});

export default FollowButton;

