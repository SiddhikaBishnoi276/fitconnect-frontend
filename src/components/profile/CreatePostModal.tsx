import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { Colors, Spacing, TextPresets, BorderRadius, Layout } from '@theme/index';
import { Post } from '@t/profile';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (post: Post) => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ visible, onClose, onSuccess }) => {
  const [caption, setCaption] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectImage = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
    };

    try {
      const response = await launchImageLibrary(options);
      if (response.didCancel || response.errorMessage) {
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setPhotoUri(response.assets[0].uri || null);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleSubmit = async () => {
    if (!caption.trim() && !photoUri) {
      Alert.alert("Error", "Please add a caption or select a photo.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalPhotoUrl = null;

      if (photoUri) {
        try {
          const uploadUrlRes = await apiClient.post(Endpoints.media.uploadUrl, {
            contentType: 'image/jpeg',
          });
          
          if (uploadUrlRes.data?.url) {
            const imageFile = await fetch(photoUri);
            const imageBlob = await imageFile.blob();
            
            await fetch(uploadUrlRes.data.url, {
              method: 'PUT',
              headers: {
                'Content-Type': 'image/jpeg',
              },
              body: imageBlob,
            });
            
            finalPhotoUrl = uploadUrlRes.data.finalUrl || photoUri;
          } else {
            finalPhotoUrl = photoUri;
          }
        } catch (err) {
          finalPhotoUrl = photoUri;
        }
      }

      const response = await apiClient.post(Endpoints.social.createPost, {
        type: finalPhotoUrl ? 'photo' : 'session',
        caption: caption.trim(),
        photo_url: finalPhotoUrl,
        session_id: null,
        pr_id: null,
      });

      if (response.data) {
        const newPost = response.data.data || response.data.post || response.data;
        onSuccess(newPost as Post);
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
            <Text style={styles.headerBtnTextCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.headerBtnSubmitContainer, (!caption.trim() && !photoUri) && { opacity: 0.5 }]} 
            disabled={(!caption.trim() && !photoUri) || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.headerBtnSubmit}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.captionTitle}>Caption</Text>
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
  headerBtnTextCancel: {
    ...TextPresets.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerBtnSubmitContainer: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnSubmit: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: Layout.screenPaddingH,
  },
  captionTitle: {
    ...TextPresets.h4,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: Spacing[2],
  },
  input: {
    ...TextPresets.body,
    color: Colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Spacing[4],
    backgroundColor: Colors.background.secondary,
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
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
