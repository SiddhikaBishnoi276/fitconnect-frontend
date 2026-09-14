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
