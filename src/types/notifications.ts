export type NotificationType = 'new_follower' | 'post_liked' | 'streak_milestone' | 'tier_promotion' | string;

export interface NotificationPayload {
  follower_id?: string;
  follower_name?: string;
  liker_id?: string;
  liker_name?: string;
  post_id?: string;
  streak_days?: number;
  tier?: string;
  user_id?: string;
  name?: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  payload: NotificationPayload;
  read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unread_count: number;
}

