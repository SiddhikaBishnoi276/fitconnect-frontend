import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Colors, Spacing, TextPresets, BorderRadius } from '@theme/index';
import { LeaderboardUser } from '@t/ranking';

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
  isCurrentUser: boolean;
}

export const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ user, isCurrentUser }) => {
  const tierBgColor = getTierColor(user.tier);
  const initials = getInitials(user.name);

  return (
    <View style={[styles.rowContainer, isCurrentUser && styles.rowCurrentUser]}>
      {/* Rank Column */}
      <View style={styles.rankCol}>
        <Text style={[styles.rankText, isCurrentUser && { color: '#B45309' }]}>
          {user.rank}
        </Text>
      </View>

      {/* Athlete Column */}
      <View style={styles.athleteCol}>
        {user.photo_url ? (
          <Image source={{ uri: user.photo_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: tierBgColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.nameContainer}>
          <Text
            style={[styles.athleteName, isCurrentUser && { color: '#B45309' }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user.name} {isCurrentUser ? '(You)' : ''}
          </Text>
          {isCurrentUser && (
            <Text style={styles.subtitleText}>⟲ Percentile-normalised</Text>
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
    </View>
  );
};

// ------------------------------------------------------------------
// 2. TierFilter
// ------------------------------------------------------------------
interface TierFilterProps {
  activeTier: string;
  onSelectTier: (tier: string) => void;
}

const TIERS = ['All', 'Elite', 'Gold', 'Silver', 'Bronze'];

export const TierFilter: React.FC<TierFilterProps> = ({ activeTier, onSelectTier }) => {
  return (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {TIERS.map((tier) => {
          const isActive = activeTier === tier;
          return (
            <TouchableOpacity
              key={tier}
              style={[styles.filterBtn, isActive && styles.filterBtnActive]}
              onPress={() => onSelectTier(tier)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {tier !== 'All' ? getTierIcon(tier) + ' ' : ''}{tier}
              </Text>
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
  // LeaderboardRow
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.primary,
  },
  rowCurrentUser: {
    backgroundColor: 'rgba(180, 83, 9, 0.1)', // subtle orange
    borderWidth: 1,
    borderColor: 'rgba(180, 83, 9, 0.3)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[3],
    marginVertical: Spacing[1],
  },
  rankCol: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...TextPresets.h4,
    color: Colors.text.primary, // Default white/gray
    fontWeight: 'bold',
  },
  athleteCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
  },
  avatar: {
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
    color: '#FFF',
    ...TextPresets.body,
    fontWeight: 'bold',
  },
  nameContainer: {
    flex: 1,
    marginLeft: Spacing[3],
  },
  athleteName: {
    ...TextPresets.body,
    color: Colors.text.inverse,
    fontWeight: 'bold',
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
    color: Colors.text.inverse,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing[1],
  },
  tierBadgeIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  tierBadgeText: {
    ...TextPresets.caption,
    fontSize: 10,
    color: Colors.text.secondary,
    fontWeight: 'bold',
  },

  // TierFilter
  filterContainer: {
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  filterScroll: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
  },
  filterBtn: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.background.secondary,
  },
  filterBtnActive: {
    borderColor: '#B45309', // Gold outline
    backgroundColor: 'rgba(180, 83, 9, 0.1)',
  },
  filterText: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: '#B45309', // Gold text
  },
});

