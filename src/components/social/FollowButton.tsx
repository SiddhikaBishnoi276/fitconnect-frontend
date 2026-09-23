import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@theme/index';
import { useFollowAction } from '@hooks/social/useFollowAction';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  onStateChange?: (isFollowing: boolean) => void;
  style?: any;
  small?: boolean;
}

const FollowButton: React.FC<FollowButtonProps> = ({ 
  userId, 
  initialIsFollowing, 
  onStateChange,
  style,
  small = false
}) => {
  const { toggleFollow } = useFollowAction();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handlePress = async () => {
    const isNowFollowing = !isFollowing;
    
    // Optimistic Update
    setIsFollowing(isNowFollowing);
    if (onStateChange) onStateChange(isNowFollowing);
    
    setLoading(true);
    const success = await toggleFollow(userId, !isNowFollowing);
    setLoading(false);
    
    if (!success) {
      // Revert if failed
      setIsFollowing(!isNowFollowing);
      if (onStateChange) onStateChange(!isNowFollowing);
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

