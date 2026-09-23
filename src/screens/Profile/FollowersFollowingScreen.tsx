import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Colors, Spacing, TextPresets, BorderRadius, Layout } from '@theme/index';
import { RootStackParamList } from '@t/navigation';
import { SocialUser } from '@t/profile';
import { useSocialConnections } from '@hooks/profile/useProfile';
import { Routes } from '@constants/routes';
import FollowButton from '@components/social/FollowButton';

type ScreenRouteProp = RouteProp<RootStackParamList, 'FollowersFollowing'>;

const FollowersFollowingScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ScreenRouteProp>();
  const initialTab = route.params?.initialTab || 'followers';

  const { activeTab, setActiveTab, data, loading } = useSocialConnections(initialTab);

  const renderItem = ({ item }: { item: SocialUser }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => navigation.navigate(Routes.Root.OTHER_USER_PROFILE, { userId: item.id })}
      activeOpacity={0.7}
    >
      {item.photo_url ? (
        <Image source={{ uri: item.photo_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userHandle}>@{item.username}</Text>
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{item.tier.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <FollowButton
        userId={item.id}
        initialIsFollowing={item.is_following || activeTab === 'following'}
        small
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activeTab === 'followers' ? 'Followers' : 'Following'}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>Following</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No users found.</Text>
            </View>
          }
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[4],
  },
  backBtn: {
    padding: Spacing[2],
    marginRight: Spacing[2],
  },
  backIcon: {
    fontSize: 24,
    color: Colors.text.primary,
  },
  headerTitle: {
    ...TextPresets.h3,
    color: Colors.text.primary,
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.brand.primary,
  },
  tabText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.brand.primary,
  },
  listContent: {
    padding: Layout.screenPaddingH,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[3],
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing[3],
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  avatarInitial: {
    ...TextPresets.h4,
    color: Colors.text.inverse,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...TextPresets.body,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  userHandle: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
  },
  tierBadge: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)', // Bronze-ish default fallback
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tierText: {
    ...TextPresets.caption,
    color: '#D97706',
    fontWeight: 'bold',
    fontSize: 10,
  },
  emptyText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
  }
});

export default FollowersFollowingScreen;

