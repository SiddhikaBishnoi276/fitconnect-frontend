export interface LeaderboardUser {
  user_id: string;
  name: string;
  photo_url?: string;
  tier: string;
  rp_total: number;
  rank: number;
  global_rank?: number;
  is_following?: boolean;
}

