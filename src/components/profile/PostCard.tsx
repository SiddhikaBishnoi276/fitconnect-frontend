import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors, Spacing, TextPresets, BorderRadius } from '@theme/index';
import { Post } from '@t/profile';
import { useLikeAction } from '@hooks/social/useLikeAction';

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  isMe?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onDelete, isDeleting, isMe = true }) => {
  const [showOptions, setShowOptions] = useState(false);
  const { toggleLike } = useLikeAction();
  
  const [liked, setLiked] = useState(post.liked_by_me || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  useEffect(() => {
    setLiked(post.liked_by_me || false);
    setLikesCount(post.likes_count);
  }, [post.liked_by_me, post.likes_count]);

  const handleDelete = () => {
    setShowOptions(false);
    if (onDelete) onDelete(post.id);
  };

  const handleLike = async () => {
    const isLiking = !liked;
    // Optimistic update
    setLiked(isLiking);
    setLikesCount(prev => isLiking ? prev + 1 : prev - 1);
    
    const success = await toggleLike(post.id, !isLiking);
    if (!success) {
      // Revert if failed
      setLiked(!isLiking);
      setLikesCount(prev => isLiking ? prev - 1 : prev + 1);
    }
  };

  // Convert time to "ago" 
  const timeAgo = () => {
    const diff = Date.now() - new Date(post.created_at).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return '1 week ago';
    return `${weeks} weeks ago`;
  };

  return (
    <View style={styles.card}>
      {/* Header / Options */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        {isMe && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionsBtn}
              onPress={() => setShowOptions(!showOptions)}
              disabled={isDeleting}
            >
              <Text style={styles.optionsIcon}>⋮</Text>
            </TouchableOpacity>

            {showOptions && (
              <View style={styles.optionsMenu}>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.deleteText}>Delete Post</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Image */}
      {post.photo_url ? (
        <Image source={{ uri: post.photo_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderEmoji}>🏋️‍♂️</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {post.exercise_name && (
          <Text style={styles.exerciseName}>{post.exercise_name}</Text>
        )}
        <Text style={styles.caption}>{post.caption}</Text>

        <View style={styles.footer}>
          <Text style={styles.date}>{timeAgo()}</Text>
          <TouchableOpacity style={styles.likes} onPress={handleLike} activeOpacity={0.7}>
            <Text style={[styles.likeIcon, liked && styles.likeIconActive]}>
              {liked ? '♥' : '♡'}
            </Text>
            <Text style={styles.likeCount}>{likesCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border.primary,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[1],
    zIndex: 10,
    minHeight: 40,
  },
  headerLeft: {
    flex: 1,
  },
  optionsContainer: {
    position: 'relative',
  },
  optionsBtn: {
    padding: Spacing[1],
  },
  optionsIcon: {
    fontSize: 20,
    color: Colors.text.secondary,
    fontWeight: 'bold',
  },
  optionsMenu: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.sm,
    padding: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 20,
  },
  deleteBtn: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
  },
  deleteText: {
    ...TextPresets.body,
    color: Colors.status.error,
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.background.tertiary,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  content: {
    padding: Spacing[4],
  },
  exerciseName: {
    ...TextPresets.body,
    color: Colors.brand.primary,
    fontWeight: 'bold',
    marginBottom: Spacing[2],
  },
  caption: {
    ...TextPresets.body,
    color: Colors.text.primary,
    marginBottom: Spacing[3],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    ...TextPresets.caption,
    color: Colors.text.tertiary,
  },
  likes: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[2],
  },
  likeIcon: {
    fontSize: 18,
    marginRight: Spacing[1],
    color: Colors.text.secondary,
  },
  likeIconActive: {
    color: Colors.status.error,
  },
  likeCount: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    fontWeight: 'bold',
  },
});

export default PostCard;

