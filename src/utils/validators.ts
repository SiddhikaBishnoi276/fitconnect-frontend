/**
 * FitConnect — Form Validators
 *
 * Reusable validation functions for form fields.
 * Returns an error message string, or undefined if valid.
 */

/** Validate email format */
export const validateEmail = (email: string): string | undefined => {
  if (!email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email address';
  return undefined;
};

/** Validate password strength */
export const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Must contain at least one number';
  return undefined;
};

/** Validate password confirmation */
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string,
): string | undefined => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return undefined;
};

/** Validate a required field */
export const validateRequired = (value: string, fieldName = 'This field'): string | undefined => {
  if (!value?.trim()) return `${fieldName} is required`;
  return undefined;
};

/** Validate phone number (Indian format) */
export const validatePhone = (phone: string): string | undefined => {
  if (!phone) return 'Phone number is required';
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) return 'Invalid phone number';
  return undefined;
};

/** Validate OTP */
export const validateOtp = (otp: string): string | undefined => {
  if (!otp) return 'OTP is required';
  if (otp.length !== 6 || !/^\d{6}$/.test(otp)) return 'OTP must be 6 digits';
  return undefined;
};

/** Validate password for reset (minimum 6 characters) */
export const validateResetPassword = (password: string): string | undefined => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return undefined;
};

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong';

export interface PasswordStrengthResult {
  strength: PasswordStrengthLevel;
  score: number; // 0 to 3
  label: string;
  hasMinLength: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
  hasSpecialChar: boolean;
}

/** Calculate password strength score and checklist */
export const getPasswordStrength = (password: string): PasswordStrengthResult => {
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/]/.test(password);

  if (!password || password.length === 0) {
    return {
      strength: 'weak',
      score: 0,
      label: 'Weak',
      hasMinLength: false,
      hasNumber: false,
      hasUppercase: false,
      hasSpecialChar: false,
    };
  }

  let score = 0;
  if (hasMinLength) score += 1;
  if (password.length >= 8 && (hasNumber || hasUppercase)) score += 1;
  if (hasNumber && (hasUppercase || hasSpecialChar) && password.length >= 8) score += 1;

  let strength: PasswordStrengthLevel = 'weak';
  let label = 'Weak';
  if (score === 2) {
    strength = 'medium';
    label = 'Medium';
  } else if (score >= 3) {
    strength = 'strong';
    label = 'Strong';
  }

  return {
    strength,
    score,
    label,
    hasMinLength,
    hasNumber,
    hasUppercase,
    hasSpecialChar,
  };
};

/** Format seconds to MM:SS string */
export const formatTimeMMSS = (totalSeconds: number): string => {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.max(0, totalSeconds) % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

