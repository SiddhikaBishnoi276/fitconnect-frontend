import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, ImageLibraryOptions, Asset } from 'react-native-image-picker';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { Colors } from '@theme/index';

const CreatePostModal = (): React.JSX.Element => {
  const navigation = useNavigation();
  const [caption, setCaption] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectImage = async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
    };

    try {
      const response = await launchImageLibrary(options);
      if (response.didCancel) {
        return;
      }
      if (response.errorMessage) {
        Alert.alert('Error', response.errorMessage);
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setPhotoUri(response.assets[0].uri || null);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handlePost = async () => {
    if (!caption.trim() && !photoUri) {
      Alert.alert('Empty Post', 'Please write a caption or select a photo.');
      return;
    }

    setLoading(true);
    try {
      let finalPhotoUrl = null;

      if (photoUri) {
        try {
          // Request upload URL from backend
          const uploadUrlRes = await apiClient.post(Endpoints.media.uploadUrl, {
            contentType: 'image/jpeg',
          });
          
          if (uploadUrlRes.data?.url) {
            // Upload to S3/Cloud
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
            // Fallback for now if backend is not fully ready
            finalPhotoUrl = photoUri;
          }
        } catch (err) {
          console.warn('Upload failed, using local URI for now', err);
          finalPhotoUrl = photoUri; // Mock fallback
        }
      }

      await apiClient.post(Endpoints.social.createPost, {
        type: finalPhotoUrl ? 'photo' : 'session',
        caption: caption.trim(),
        photo_url: finalPhotoUrl,
        session_id: null,
        pr_id: null,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <TouchableOpacity 
            onPress={handlePost} 
            style={[styles.headerBtn, (!caption.trim() && !photoUri) && styles.headerBtnDisabled]}
            disabled={(!caption.trim() && !photoUri) || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.brand.accent} />
            ) : (
              <Text style={[styles.headerBtnText, styles.postBtnText]}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor="#64748B"
            multiline
            autoFocus
            value={caption}
            onChangeText={setCaption}
            textAlignVertical="top"
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  headerBtn: {
    padding: 8,
  },
  headerBtnDisabled: {
    opacity: 0.5,
  },
  headerBtnText: {
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  postBtnText: {
    color: Colors.brand.accent,
  },
  headerTitle: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  input: {
    color: Colors.text.primary,
    fontSize: 18,
    minHeight: 120,
    lineHeight: 26,
  },
  uploadBtn: {
            marginTop: 24,
            height: 120,
            backgroundColor: Colors.background.secondary,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: Colors.border.secondary,
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
          },
          uploadIcon: {
            fontSize: 24,
            marginBottom: 8,
          },
          uploadText: {
            color: Colors.text.tertiary,
            fontSize: 14,
            fontWeight: '500',
          },
          imageContainer: {
            marginTop: 24,
            position: 'relative',
            borderRadius: 12,
            overflow: 'hidden',
          },
          previewImage: {
            width: '100%',
            height: 200,
            backgroundColor: Colors.background.secondary,
          },
          removeImageBtn: {
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: 'rgba(0,0,0,0.6)',
            width: 32,
            height: 32,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
          },
          removeImageText: {
            color: '#FFF',
            fontWeight: '700',
            fontSize: 16,
          },
        });

export default CreatePostModal;
