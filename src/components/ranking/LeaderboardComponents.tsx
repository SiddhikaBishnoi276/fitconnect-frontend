import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Colors, Spacing, TextPresets, BorderRadius, Layout } from '@theme/index';
import { LeaderboardUser } from '@t/ranking';
import FollowButton from '@components/social/FollowButton';

// ------------------------------------------------------------------
// Helper
// ------------------------------------------------------------------
const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getTierColor = (tier: string) => {
  const t = tier.toLowerCase();
  if (t === 'elite' || t === 'diamond') return '#4A47A3'; // Purple/Blue
  if (t === 'gold') return '#B45309'; // Golden Orange
  if (t === 'silver') return '#4B5563'; // Gray/Silver
  if (t === 'bronze') return '#92400E'; // Bronze/Brown
  return '#374151'; // Default Dark Gray
};

const getTierIcon = (tier: string) => {
  const t = tier.toLowerCase();
  if (t === 'elite' || t === 'diamond') return '💎';
  if (t === 'gold') return '🥇';
  if (t === 'silver') return '🥈';
  if (t === 'bronze') return '🥉';
  return '🏅';
};

// ------------------------------------------------------------------
// 1. LeaderboardRow
// ------------------------------------------------------------------
interface LeaderboardRowProps {
  user: LeaderboardUser;
  displayRank?: number;
  isCurrentUser: boolean;
  isFriendTab?: boolean;
  onPress?: () => void;
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ user, displayRank, isCurrentUser, isFriendTab, onPress }) => {
  const tierBgColor = getTierColor(user.tier);
  const initials = getInitials(user.name);

  return (
    <TouchableOpacity 
      style={[styles.rowContainer, isCurrentUser && styles.rowCurrentUser]}
      onPress={onPress}
      disabled={isCurrentUser || !onPress}
      activeOpacity={0.7}
    >
      {/* Rank Column */}
      <View style={styles.rankCol}>
        <Text style={[styles.rankText, isCurrentUser && { color: '#B45309' }]}>
          {displayRank ?? user.rank}
        </Text>
      </View>

      {/* Athlete Column */}
      <View style={styles.athleteCol}>
        <View style={styles.avatarContainer}>
          {user.photo_url ? (
            <Image source={{ uri: user.photo_url }} style={styles.avatarImg} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: tierBgColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={styles.nameContainer}>
          <Text
            style={[styles.athleteName, isCurrentUser && { color: '#B45309' }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user.name} {isCurrentUser ? '(You)' : ''}
          </Text>
          {isCurrentUser ? (
            <Text style={styles.subtitleText}>⟲ Percentile-normalised</Text>
          ) : !isFriendTab && (
            <View style={{ marginTop: 4 }}>
              <FollowButton 
                userId={user.user_id} 
                initialIsFollowing={user.is_following || false} 
                small 
              />
            </View>
          )}
        </View>
      </View>

      {/* RP / Tier Column */}
      <View style={styles.rpCol}>
        <Text style={styles.rpText}>
          {user.rp_total.toLocaleString()} <Text style={styles.rpLabel}>RP</Text>
        </Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierBadgeIcon}>{getTierIcon(user.tier)}</Text>
          <Text style={styles.tierBadgeText}>{user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ------------------------------------------------------------------
// 2. TierFilter
// ------------------------------------------------------------------
interface TierFilterProps {
  activeTier: string | null;
  onSelectTier: (tier: string | null) => void;
}

const TIERS = ['Elite', 'Diamond', 'Gold', 'Silver', 'Bronze'];

export const TierFilter: React.FC<TierFilterProps> = ({ activeTier, onSelectTier }) => {
  return (
    <View style={styles.filterWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        <TouchableOpacity
          style={[styles.filterBtn, !activeTier && styles.filterBtnActive]}
          onPress={() => onSelectTier(null)}
        >
          <Text style={[styles.filterBtnText, !activeTier && styles.filterBtnTextActive]}>All Tiers</Text>
        </TouchableOpacity>
        
        {TIERS.map(tier => {
          const isActive = activeTier?.toLowerCase() === tier.toLowerCase();
          return (
            <TouchableOpacity
              key={tier}
              style={[styles.filterBtn, isActive && styles.filterBtnActive]}
              onPress={() => onSelectTier(tier)}
            >
              <Text style={[styles.filterBtnText, isActive && styles.filterBtnTextActive]}>{tier}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ------------------------------------------------------------------
// Styles
// ------------------------------------------------------------------
const styles = StyleSheet.create({
  // Row Styles
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowCurrentUser: {
    borderColor: Colors.brand.primary,
    backgroundColor: 'rgba(204, 255, 0, 0.05)', // slight neon tint
  },
  rankCol: {
    width: 30,
    alignItems: 'center',
    marginRight: Spacing[2],
  },
  rankText: {
    ...TextPresets.h3,
    color: Colors.text.secondary,
    fontWeight: 'bold',
  },
  athleteCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: Spacing[3],
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.tertiary,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...TextPresets.body,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  nameContainer: {
    flex: 1,
  },
  athleteName: {
    ...TextPresets.body,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitleText: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    fontSize: 10,
    marginTop: 2,
  },
  rpCol: {
    alignItems: 'flex-end',
    width: 90,
  },
  rpText: {
    ...TextPresets.body,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  rpLabel: {
    fontSize: 10,
    color: Colors.text.secondary,
    fontWeight: 'normal',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tierBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  tierBadgeText: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    fontSize: 10,
  },
  // Filter Styles
  filterWrapper: {
    marginBottom: Spacing[4],
  },
  filterScroll: {
    paddingHorizontal: Layout.screenPaddingH,
    gap: Spacing[2],
  },
  filterBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  filterBtnActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  filterBtnText: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    fontWeight: 'bold',
  },
  filterBtnTextActive: {
    color: '#000',
  }
});
