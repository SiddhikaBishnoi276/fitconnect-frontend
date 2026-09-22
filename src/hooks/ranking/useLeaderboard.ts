import { useState, useCallback, useEffect } from 'react';
import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { LeaderboardUser } from '@t/ranking';

export const useLeaderboard = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'global'>('friends');
  const [activeTierFilter, setActiveTierFilter] = useState<string>('All');
  
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const response = await apiClient.get(Endpoints.ranking.leaderboard(activeTab));
      if (response.data?.success) {
        setLeaderboardData(response.data.data);
      } else {
        setLeaderboardData([]);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const onRefresh = () => fetchLeaderboard(true);

  const filteredData = leaderboardData.filter(user => {
    if (activeTierFilter === 'All') return true;
    return user.tier.toLowerCase() === activeTierFilter.toLowerCase();
  });

  return {
    activeTab,
    setActiveTab,
    activeTierFilter,
    setActiveTierFilter,
    filteredData,
    loading,
    refreshing,
    error,
    onRefresh,
    refetch: fetchLeaderboard
  };
};

