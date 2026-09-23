import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { Colors, Spacing, TextPresets, BorderRadius, Layout } from '@theme/index';
import { Post } from '@t/profile';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (post: Post) => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ visible, onClose, onSuccess }) => {
  const [caption, setCaption] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock function to select image. In a real app, use react-native-image-picker
  const handleSelectImage = () => {
    // For demonstration, just setting a dummy URI
    setPhotoUri('https://via.placeholder.com/400x300.png?text=Selected+Image');
  };

  const handleSubmit = async () => {
    if (!caption && !photoUri) {
      Alert.alert("Error", "Please add a caption or an image.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPhotoUrl = photoUri;

      // 1. If photo selected, hit /media/upload-url (Mocked for now as we don't have real file upload logic without native fetch)
      if (photoUri) {
        // const uploadUrlRes = await apiClient.post(Endpoints.media.uploadUrl, { contentType: 'image/jpeg' });
        // // Do actual fetch PUT to uploadUrlRes.data.url...
        // finalPhotoUrl = uploadUrlRes.data.finalUrl; // Mocked
        finalPhotoUrl = photoUri;
      }

      // 2. Create the post
      const response = await apiClient.post(Endpoints.social.posts, {
        type: photoUri ? 'photo' : 'text',
        caption: caption,
        photo_url: finalPhotoUrl,
      });

      if (response.data?.success) {
        onSuccess(response.data.data as Post);
        handleClose();
      } else {
        Alert.alert("Error", "Failed to create post.");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCaption('');
    setPhotoUri(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <TouchableOpacity onPress={handleSubmit} style={styles.headerBtn} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.brand.primary} />
            ) : (
              <Text style={[styles.headerBtnText, styles.headerBtnSubmit]}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor={Colors.text.tertiary}
            multiline
            value={caption}
            onChangeText={setCaption}
            autoFocus
          />

          {photoUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setPhotoUri(null)}>
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBtn} onPress={handleSelectImage}>
              <Text style={styles.uploadIcon}>📸</Text>
              <Text style={styles.uploadText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
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
  headerTitle: {
    ...TextPresets.h3,
    color: Colors.text.primary,
  },
  headerBtn: {
    padding: Spacing[2],
  },
  headerBtnText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
  },
  headerBtnSubmit: {
    color: Colors.brand.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: Layout.screenPaddingH,
  },
  input: {
    ...TextPresets.body,
    color: Colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Spacing[4],
  },
  uploadBtn: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderStyle: 'dashed',
    padding: Spacing[6],
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 24,
    marginBottom: Spacing[2],
  },
  uploadText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.background.tertiary,
  },
  removeImageBtn: {
    position: 'absolute',
    top: Spacing[2],
    right: Spacing[2],
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },
});

export default CreatePostModal;

