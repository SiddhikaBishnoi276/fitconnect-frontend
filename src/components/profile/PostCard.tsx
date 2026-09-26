import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { Colors, Spacing, TextPresets, BorderRadius } from '@theme/index';
import { Post } from '@t/profile';
import { useLikeAction } from '@hooks/social/useLikeAction';

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  isMe?: boolean;
  authorName?: string;
  authorAvatar?: string;
  onAuthorPress?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onDelete, isDeleting, isMe = true, authorName = 'User', authorAvatar, onAuthorPress }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
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
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={onAuthorPress}
          activeOpacity={onAuthorPress ? 0.7 : 1}
        >
          <View style={styles.avatar}>
            {authorAvatar ? (
              <Image source={{ uri: authorAvatar }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitials}>{authorName.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.authorName}>{authorName}</Text>
        </TouchableOpacity>
        {isMe && (
          <View style={styles.optionsContainer}>
            {showOptions && (
              <TouchableOpacity style={styles.inlineDeleteBtn} onPress={() => { setShowOptions(false); setDeleteModalVisible(true); }}>
                <Text style={styles.inlineDeleteText}>🗑️ Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.optionsBtn}
              onPress={() => setShowOptions(!showOptions)}
              disabled={isDeleting}
            >
              <Text style={styles.optionsIcon}>⋮</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Post?</Text>
            <Text style={styles.modalText}>Are you sure you want to delete this post? This action cannot be undone.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDeleteBtn} onPress={() => { setDeleteModalVisible(false); if (onDelete) onDelete(post.id); }}>
                <Text style={styles.modalDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Image */}
      {(() => {
        const imageUrl = post.photo_url || (post as any).photoUrl || (post as any).media_url || (post as any).image_url || (post as any).image || (post as any).photo || (post as any).media;
        return imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>🏋️‍♂️</Text>
          </View>
        );
      })()}

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
              {liked ? '❤️' : '🤍'}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  authorName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  optionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionsBtn: {
    padding: Spacing[1],
  },
  optionsIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  inlineDeleteBtn: {
    marginRight: 15,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineDeleteText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  modalTitle: {
    ...TextPresets.h3,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: Colors.background.tertiary,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalDeleteText: {
    color: '#FFF',
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
    color: '#FFFFFF',
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

