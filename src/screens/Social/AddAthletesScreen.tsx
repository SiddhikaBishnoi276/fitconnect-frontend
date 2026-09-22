import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { Routes } from '@constants/routes';
import { Colors } from '@theme/index';
import type { RootStackParamList } from '@t/navigation';
import type { FollowUser } from '@t/social';
import { useAppSelector } from '@store/hooks';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AddAthletesScreen = (): React.JSX.Element => {
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAppSelector(state => state.auth.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      if (debouncedQuery.trim()) {
        const res = await apiClient.get(`${Endpoints.social.followSearch}?q=${encodeURIComponent(debouncedQuery)}`);
        setUsers(res.data?.data || []);
      } else {
        const res = await apiClient.get(Endpoints.social.followRecommendations);
        setUsers(res.data?.data || []);
      }
    } catch (err) {
      // ignore
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFollowToggle = async (user: FollowUser) => {
    const isCurrentlyFollowing = user.is_following;
    
    // Optimistic update
    setUsers(prev => prev.map(u => 
      u.id === user.id ? { ...u, is_following: !isCurrentlyFollowing } : u
    ));

    try {
      if (!isCurrentlyFollowing) {
        await apiClient.post(Endpoints.social.follow(user.id));
      } else {
        await apiClient.delete(Endpoints.social.follow(user.id));
      }
    } catch (err) {
      // Revert on error
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, is_following: isCurrentlyFollowing } : u
      ));
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      await Share.share({
        message: 'Join me on FitConnect! Let\'s train together. https://fitconnect.in/download',
      });
    } catch (error) {
      // ignore
    }
  };

  const navigateToProfile = (userId: string) => {
    if (userId === currentUser?.id) return; // Optional logic: redirect to profile tab if own
    navigation.navigate(Routes.Root.OTHER_USER_PROFILE, { userId });
  };

  const renderItem = ({ item }: { item: FollowUser }) => (
    <View style={styles.userRow}>
      <TouchableOpacity style={styles.userInfo} onPress={() => navigateToProfile(item.id)}>
        <View style={styles.avatar}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarInitials}>{item.name.charAt(0)}</Text>
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          {item.sport && <Text style={styles.userSport}>{item.sport}</Text>}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.followBtn, item.is_following && styles.followingBtn]}
        onPress={() => handleFollowToggle(item)}
      >
        <Text style={[styles.followBtnText, item.is_following && styles.followingBtnText]}>
          {item.is_following ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          {debouncedQuery.trim() 
            ? `No athletes found matching '${debouncedQuery}'`
            : "No suggestions yet — check back once more athletes join!"}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Athletes</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or username..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShareWhatsApp}>
          <Text style={styles.actionBtnText}>Invite via WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDisabled]} disabled>
          <Text style={styles.actionBtnDisabledText}>QR Code (Coming soon)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {debouncedQuery.trim() ? "SEARCH RESULTS" : "SUGGESTED FOR YOU"}
        </Text>
      </View>

      {loading && users.length === 0 ? (
        <ActivityIndicator size="large" color="#CCFF00" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 24,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    color: '#FFF',
    fontSize: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#CCFF00',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#CCFF00',
    fontWeight: '600',
    fontSize: 14,
  },
  actionBtnDisabled: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  actionBtnDisabledText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: '#CCFF00',
    fontSize: 18,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userSport: {
    color: '#94A3B8',
    fontSize: 13,
  },
  followBtn: {
    backgroundColor: '#CCFF00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#334155',
  },
  followBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  followingBtnText: {
    color: '#FFF',
  },
  emptyState: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default AddAthletesScreen;
