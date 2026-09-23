export interface Sport {
  sport_id: number;
  slug: string;
  name: string;
}

export interface Post {
  id: string;
  type: string;
  caption: string;
  photo_url?: string;
  likes_count: number;
  liked_by_me?: boolean;
  created_at: string;
  exercise_name?: string;
}

export interface ProfileSummary {
  id: string;
  name: string;
  username: string;
  photo_url?: string;
  tier: string;
  rp_total: number;
  current_streak: number;
  followers_count: number;
  following_count: number;
  sports?: Sport[];
  posts?: Post[];
}

export interface PersonalRecord {
  id: string;
  exercise_name: string;
  sport_id?: string;
  metric: string;
  value: string;
  previous_best?: string;
  created_at: string;
}

export interface SocialUser {
  id: string;
  name: string;
  username: string;
  tier: string;
  photo_url?: string;
  is_following?: boolean;
}

