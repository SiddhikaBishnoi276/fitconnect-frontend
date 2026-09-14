/**
 * FitConnect — User Entity Types
 */

export type UserRole = 'user' | 'trainer' | 'admin';
export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'endurance' | 'flexibility' | 'general';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string;
  role: UserRole;
  fitnessGoal?: FitnessGoal;
  fitnessLevel?: FitnessLevel;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trainer extends User {
  role: 'trainer';
  specializations: string[];
  experience: number;       // years
  rating: number;           // 0-5
  totalSessions: number;
  hourlyRate: number;
  isVerified: boolean;
}
