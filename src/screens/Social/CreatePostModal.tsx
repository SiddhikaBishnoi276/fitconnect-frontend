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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { Colors } from '@theme/index';

const CreatePostModal = (): React.JSX.Element => {
  const navigation = useNavigation();
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!caption.trim()) {
      Alert.alert('Empty Post', 'Please write a caption.');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement photo upload when media endpoint is available.
      // Currently defaulting to type: 'photo' with caption only.
      await apiClient.post(Endpoints.social.createPost, {
        type: 'photo',
        caption: caption.trim(),
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
            style={[styles.headerBtn, !caption.trim() && styles.headerBtnDisabled]}
            disabled={!caption.trim() || loading}
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

          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>
              Photo upload coming soon
            </Text>
          </View>
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
  photoPlaceholder: {
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
  photoPlaceholderText: {
    color: Colors.text.tertiary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CreatePostModal;
