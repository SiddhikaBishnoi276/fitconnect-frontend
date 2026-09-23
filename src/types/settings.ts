export interface SettingsInjury {
  id?: string;
  body_part: string;
  condition: string;
  occurred_months_ago?: number | null;
  recovery_status: string;
  notes?: string | null;
  created_at?: string;
}

export interface SettingsData {
  id: string;
  name: string;
  email: string;
  phone: string;
  auth_provider: string;
  photo_url?: string;
  age: number;
  weight_kg: string;
  height_cm: string;
  gender: string;
  diet_preference: string;
  regional_cuisine?: string;
  privacy: string;
  notifications_enabled: boolean;
  injuries: SettingsInjury[];
}

export interface UpdateProfilePayload {
  name?: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  photo_url?: string | null;
}

export interface PreferencesPayload {
  diet_preference?: string;
  regional_cuisine?: string;
  privacy?: string;
  notifications_enabled?: boolean;
}

