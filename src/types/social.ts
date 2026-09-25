export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar_url?: string;
    privacy?: string;
  };
  type: 'photo' | 'session_complete' | 'pr' | 'achievement';
  caption?: string;
  photo_url?: string;
  session_id?: string;
  pr_id?: string;
  created_at: string;
  like_count: number;
  liked_by_me: boolean;
}

export interface FollowUser {
  id: string;
  name: string;
  username?: string;
  avatar_url?: string;
  sport?: string;
  tier?: string;
  activity_level?: string;
  is_following: boolean;
}

export interface OtherUserProfile {
  id: string;
  name: string;
  username: string;
  photo_url?: string;
  tier: string;
  current_streak: number;
  longest_streak: number;
  rp_total: number;
  followers_count: number;
  following_count: number;
  sports: Array<{ id: number; name: string }>;
  is_following: boolean;
  is_followed_by?: boolean;
  prs: Array<any>;
  posts: Post[];
}
