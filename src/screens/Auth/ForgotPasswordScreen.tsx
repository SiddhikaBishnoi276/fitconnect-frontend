import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TextInput } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { AppTextInput } from '@components/index';
import { Routes } from '@constants/routes';
import { Colors } from '@theme/index';
import type { AuthNavigationProp, AuthRouteProp } from '@t/navigation';
import {
  validateEmail,
  validateResetPassword,
  validateConfirmPassword,
  getPasswordStrength,
  formatTimeMMSS,
} from '@utils/validators';

type StepType = 1 | 2 | 3 | 4;

const OTP_COUNTDOWN_SECONDS = 600; // 10 minutes

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const errorObj = error as { message?: unknown; response?: { data?: { message?: unknown; error?: { message?: unknown } } } };
    const responseMsg = errorObj.response?.data?.error?.message ?? errorObj.response?.data?.message;
    if (typeof responseMsg === 'string' && responseMsg.trim().length > 0) {
      return responseMsg;
    }
    if (typeof errorObj.message === 'string' && errorObj.message.trim().length > 0) {
      return errorObj.message;
    }
  }
  return fallback;
};

export const ForgotPasswordScreen = (): React.JSX.Element => {
  const navigation = useNavigation<AuthNavigationProp<'ForgotPassword'>>();
  const route = useRoute<AuthRouteProp<'ForgotPassword'>>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallScreen = height < 720;
  const isTablet = width >= 768;

  // ─── Step Management ────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<StepType>(
    route.params?.initialStep ?? 1,
  );

  // ─── Shared Form State ──────────────────────────────────────────────────────
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ─── UI / Loading / Error States ────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // ─── OTP Countdown Timer ───────────────────────────────────────────────────
  const [timerSeconds, setTimerSeconds] = useState(OTP_COUNTDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  // ─── Refs & Animations ─────────────────────────────────────────────────────
  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Trigger smooth step transition animation
  const animateToStep = useCallback((nextStep: StepType) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -15,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(nextStep);
      setApiError(null);
      slideAnim.setValue(15);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  // ─── Timer Effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (currentStep === 2 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStep, timerSeconds]);

  // Focus first empty OTP box when entering Step 2
  useEffect(() => {
    if (currentStep === 2) {
      const timeout = setTimeout(() => {
        const firstEmptyIndex = otpDigits.findIndex(d => !d);
        const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
        otpInputRefs.current[targetIndex]?.focus();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [currentStep, otpDigits]);

  // ─── Step 1: Request Password Reset Handler ─────────────────────────────────
  const emailValidationError = emailTouched ? validateEmail(email) : undefined;
  const isEmailFormValid = email.trim() !== '' && !validateEmail(email);

  const handleRequestReset = async () => {
    setEmailTouched(true);
    const err = validateEmail(email);
    if (err) {
      setApiError(err);
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);
    setApiError(null);

    try {
      const payload = { email: email.trim().toLowerCase() };
      const response = await apiClient.post(Endpoints.auth.forgotPassword, payload);

      const successMsg =
        response.data?.message ??
        'Password reset OTP has been sent to your email';

      Toast.show({
        type: 'success',
        text1: 'OTP Sent Successfully',
        text2: successMsg,
        position: 'top',
        visibilityTime: 4000,
      });

      // Reset timer and transition to Step 2
      setTimerSeconds(OTP_COUNTDOWN_SECONDS);
      animateToStep(2);
    } catch (err: unknown) {
      const message = extractErrorMessage(
        err,
        'No user account found with this email address or server error.',
      );
      setApiError(message);
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: message,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2: OTP Verification Handlers ─────────────────────────────────────
  const fullOtpString = otpDigits.join('');
  const isOtpComplete = fullOtpString.length === 6 && /^\d{6}$/.test(fullOtpString);

  const handleOtpChange = (text: string, index: number) => {
    setApiError(null);

    // Handle Paste support (multiple digits)
    const cleanedText = text.replace(/\D/g, '');
    if (cleanedText.length > 1) {
      const newDigits = [...otpDigits];
      const digitsToFill = cleanedText.slice(0, 6);
      for (let i = 0; i < 6; i++) {
        if (i < digitsToFill.length) {
          newDigits[i] = digitsToFill[i];
        }
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(digitsToFill.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    // Single digit input
    const singleDigit = cleanedText.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = singleDigit;
    setOtpDigits(newDigits);

    if (singleDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleResendOtp = async () => {
    if (timerSeconds > 0 || isResending) return;

    Keyboard.dismiss();
    setIsResending(true);
    setApiError(null);

    try {
      const payload = { email: email.trim().toLowerCase() };
      const response = await apiClient.post(Endpoints.auth.forgotPassword, payload);

      const successMsg =
        response.data?.message ??
        'A fresh 6-digit OTP has been sent to your email';

      Toast.show({
        type: 'success',
        text1: 'New Code Sent',
        text2: successMsg,
        position: 'top',
        visibilityTime: 4000,
      });

      // Reset state & timer
      setTimerSeconds(OTP_COUNTDOWN_SECONDS);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const message = extractErrorMessage(
        err,
        'Failed to resend OTP. Please try again later.',
      );
      setApiError(message);
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: message,
        position: 'top',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!isOtpComplete) {
      setApiError('Please enter all 6 digits of your verification code.');
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);
    setApiError(null);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        otp: fullOtpString,
      };

      const response = await apiClient.post(Endpoints.auth.verifyOtp, payload);

      Toast.show({
        type: 'success',
        text1: 'Code Verified',
        text2: response.data?.message ?? 'Verification successful. You can now set your new password.',
        position: 'top',
        visibilityTime: 3000,
      });

      animateToStep(3);
    } catch (err: unknown) {
      const message = extractErrorMessage(
        err,
        'Invalid or expired verification code. Please check and try again.',
      );
      setApiError(message);
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: message,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 3: Set New Password Handlers ─────────────────────────────────────
  const passwordStrength = getPasswordStrength(newPassword);
  const passwordError = passwordTouched
    ? validateResetPassword(newPassword)
    : undefined;
  const confirmPasswordError = confirmPasswordTouched
    ? validateConfirmPassword(newPassword, confirmPassword)
    : undefined;

  const isResetFormValid =
    newPassword.length >= 6 &&
    confirmPassword.length >= 6 &&
    newPassword === confirmPassword;

  const handleResetPassword = async () => {
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);

    const pErr = validateResetPassword(newPassword);
    if (pErr) {
      setApiError(pErr);
      return;
    }

    const cErr = validateConfirmPassword(newPassword, confirmPassword);
    if (cErr) {
      setApiError(cErr);
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);
    setApiError(null);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        otp: fullOtpString,
        newPassword,
      };

      const response = await apiClient.post(Endpoints.auth.resetPassword, payload);

      Toast.show({
        type: 'success',
        text1: 'Password Reset',
        text2: response.data?.message ?? 'Password has been reset successfully!',
        position: 'top',
        visibilityTime: 4000,
      });

      animateToStep(4);
    } catch (err: unknown) {
      const message = extractErrorMessage(
        err,
        'Failed to reset password. The code might have expired. Please try again.',
      );
      setApiError(message);
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: message,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render Step Progress Indicator ────────────────────────────────────────
  const renderStepIndicator = () => {
    if (currentStep === 4) return null;

    const steps = [
      { num: 1 as const, label: 'Email' },
      { num: 2 as const, label: 'Verify' },
      { num: 3 as const, label: 'Password' },
    ];

    return (
      <View style={styles.stepperContainer}>
        {steps.map((step, idx) => {
          const isActive = currentStep === step.num;
          const isCompleted = currentStep > step.num;

          return (
            <React.Fragment key={step.num}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isActive && styles.stepCircleActive,
                    isCompleted && styles.stepCircleCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      isActive && styles.stepNumberActive,
                      isCompleted && styles.stepNumberCompleted,
                    ]}
                  >
                    {isCompleted ? '✓' : step.num}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                    isCompleted && styles.stepLabelCompleted,
                  ]}
                >
                  {step.label}
                </Text>
              </View>

              {idx < steps.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    currentStep > idx + 1 && styles.stepLineCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  // ─── Render Error Banner ────────────────────────────────────────────────────
  const renderErrorBanner = () => {
    if (!apiError) return null;
    return (
      <View style={styles.errorBanner}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorBannerText}>{apiError}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.background.primary}
        translucent={false}
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(insets.bottom, 24),
              paddingTop: isSmallScreen ? 12 : 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.responsiveContainer, isTablet && styles.containerTablet]}>
            {/* Top Navigation Bar */}
            {currentStep !== 4 && (
              <View style={styles.topNav}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    if (currentStep === 1) {
                      navigation.navigate(Routes.Auth.LOGIN);
                    } else if (currentStep === 2) {
                      animateToStep(1);
                    } else if (currentStep === 3) {
                      animateToStep(2);
                    }
                  }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate(Routes.Auth.LOGIN)}
                >
                  <Text style={styles.cancelText}>Login</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Stepper Header */}
            {renderStepIndicator()}

            {/* Glassmorphic Card */}
            <View style={styles.glassCard}>
              <Animated.View
                style={[
                  styles.animatedStepContent,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {renderErrorBanner()}

                {/* ═════════════════════════════════════════════════════════════
                    STEP 1: EMAIL REQUEST
                ══════════════════════════════════════════════════════════════ */}
                {currentStep === 1 && (
                  <View style={styles.stepContent}>
                    <View style={styles.iconBadge}>
                      <Text style={styles.iconEmoji}>🔐</Text>
                    </View>

                    <Text
                      style={[
                        styles.heading,
                        isSmallScreen && styles.headingSmall,
                      ]}
                    >
                      Forgot Password
                    </Text>
                    <Text style={styles.subheading}>
                      Enter your registered email address and we'll send a 6-digit
                      verification code to reset your password.
                    </Text>

                    <View style={styles.formGroup}>
                      <AppTextInput
                        label="Registered Email"
                        placeholder="user@example.com"
                        value={email}
                        onChangeText={text => {
                          setEmail(text);
                          setApiError(null);
                        }}
                        onBlur={() => setEmailTouched(true)}
                        error={emailValidationError}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect={false}
                        autoFocus
                      />

                      <TouchableOpacity
                        style={[
                          styles.primaryBtn,
                          (!isEmailFormValid || isLoading) &&
                            styles.primaryBtnDisabled,
                        ]}
                        activeOpacity={isEmailFormValid ? 0.85 : 1}
                        onPress={handleRequestReset}
                        disabled={!isEmailFormValid || isLoading}
                      >
                        {isLoading ? (
                          <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" color="#000000" />
                            <Text style={styles.primaryBtnText}>
                              Sending Code...
                            </Text>
                          </View>
                        ) : (
                          <Text
                            style={[
                              styles.primaryBtnText,
                              !isEmailFormValid && styles.primaryBtnTextDisabled,
                            ]}
                          >
                            Send Reset Code →
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    <View style={styles.footerRow}>
                      <TouchableOpacity
                        style={styles.backToLoginBtn}
                        onPress={() => navigation.navigate(Routes.Auth.LOGIN)}
                      >
                        <Text style={styles.backToLoginText}>
                          Remember your password?{' '}
                          <Text style={styles.linkHighlight}>Log In</Text>
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ═════════════════════════════════════════════════════════════
                    STEP 2: OTP VERIFICATION
                ══════════════════════════════════════════════════════════════ */}
                {currentStep === 2 && (
                  <View style={styles.stepContent}>
                    <View style={styles.iconBadge}>
                      <Text style={styles.iconEmoji}>🛡️</Text>
                    </View>

                    <Text
                      style={[
                        styles.heading,
                        isSmallScreen && styles.headingSmall,
                      ]}
                    >
                      Enter Verification Code
                    </Text>

                    <Text style={styles.subheading}>
                      We sent a 6-digit security code to
                    </Text>
                    <View style={styles.emailChipRow}>
                      <Text style={styles.emailHighlighted}>{email}</Text>
                      <TouchableOpacity
                        onPress={() => animateToStep(1)}
                        style={styles.editEmailBtn}
                      >
                        <Text style={styles.editEmailText}>Edit</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 6 OTP Input Boxes */}
                    <View style={styles.otpBoxesRow}>
                      {otpDigits.map((digit, index) => {
                        const isFilled = digit.length > 0;
                        const hasError = Boolean(apiError);

                        return (
                          <RNTextInput
                            key={index}
                            ref={el => {
                              otpInputRefs.current[index] = el;
                            }}
                            style={[
                              styles.otpBox,
                              isFilled && styles.otpBoxFilled,
                              hasError && styles.otpBoxError,
                            ]}
                            value={digit}
                            onChangeText={text => handleOtpChange(text, index)}
                            onKeyPress={({ nativeEvent }) =>
                              handleOtpKeyPress(nativeEvent.key, index)
                            }
                            keyboardType="number-pad"
                            maxLength={6}
                            selectTextOnFocus
                            textContentType="oneTimeCode"
                            selectionColor="#CCFF00"
                          />
                        );
                      })}
                    </View>

                    {/* Timer & Resend Section */}
                    <View style={styles.timerSection}>
                      {timerSeconds > 0 ? (
                        <View style={styles.countdownRow}>
                          <Text style={styles.timerIcon}>⏳</Text>
                          <Text style={styles.timerText}>
                            Code expires in:{' '}
                            <Text style={styles.timerDigits}>
                              {formatTimeMMSS(timerSeconds)}
                            </Text>
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.countdownRow}>
                          <Text style={styles.timerExpiredText}>
                            Code expired. Request a new one below.
                          </Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.resendBtn,
                          timerSeconds > 0 && styles.resendBtnDisabled,
                        ]}
                        disabled={timerSeconds > 0 || isResending}
                        onPress={handleResendOtp}
                      >
                        {isResending ? (
                          <ActivityIndicator size="small" color="#CCFF00" />
                        ) : (
                          <Text
                            style={[
                              styles.resendBtnText,
                              timerSeconds > 0 && styles.resendBtnTextDisabled,
                            ]}
                          >
                            {timerSeconds > 0
                              ? `Resend Code in ${formatTimeMMSS(timerSeconds)}`
                              : '🔄 Resend OTP Code'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Verify Button */}
                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        (!isOtpComplete || isLoading) &&
                          styles.primaryBtnDisabled,
                      ]}
                      activeOpacity={isOtpComplete ? 0.85 : 1}
                      onPress={handleVerifyOtp}
                      disabled={!isOtpComplete || isLoading}
                    >
                      {isLoading ? (
                        <View style={styles.loadingRow}>
                          <ActivityIndicator size="small" color="#000000" />
                          <Text style={styles.primaryBtnText}>
                            Verifying Code...
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[
                            styles.primaryBtnText,
                            !isOtpComplete && styles.primaryBtnTextDisabled,
                          ]}
                        >
                          Verify Code →
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* ═════════════════════════════════════════════════════════════
                    STEP 3: SET NEW PASSWORD
                ══════════════════════════════════════════════════════════════ */}
                {currentStep === 3 && (
                  <View style={styles.stepContent}>
                    <View style={styles.iconBadge}>
                      <Text style={styles.iconEmoji}>🔑</Text>
                    </View>

                    <Text
                      style={[
                        styles.heading,
                        isSmallScreen && styles.headingSmall,
                      ]}
                    >
                      Reset Password
                    </Text>
                    <Text style={styles.subheading}>
                      Enter your new secure password below (minimum 6
                      characters).
                    </Text>

                    <View style={styles.formGroup}>
                      <AppTextInput
                        label="New Password"
                        placeholder="Enter new password (min. 6 chars)"
                        value={newPassword}
                        onChangeText={text => {
                          setNewPassword(text);
                          setApiError(null);
                        }}
                        onBlur={() => setPasswordTouched(true)}
                        error={passwordError}
                        isPassword
                        autoCapitalize="none"
                      />

                      {/* Password Strength Indicator */}
                      {newPassword.length > 0 && (
                        <View style={styles.strengthContainer}>
                          <View style={styles.strengthHeaderRow}>
                            <Text style={styles.strengthLabelTitle}>
                              Password Strength:
                            </Text>
                            <Text
                              style={[
                                styles.strengthValueBadge,
                                passwordStrength.strength === 'weak' &&
                                  styles.strengthWeak,
                                passwordStrength.strength === 'medium' &&
                                  styles.strengthMedium,
                                passwordStrength.strength === 'strong' &&
                                  styles.strengthStrong,
                              ]}
                            >
                              {passwordStrength.label}
                            </Text>
                          </View>

                          {/* 3-Segment Progress Bar */}
                          <View style={styles.strengthBarsRow}>
                            <View
                              style={[
                                styles.strengthBarSegment,
                                passwordStrength.score >= 1 &&
                                  (passwordStrength.strength === 'weak'
                                    ? styles.barWeak
                                    : passwordStrength.strength === 'medium'
                                    ? styles.barMedium
                                    : styles.barStrong),
                              ]}
                            />
                            <View
                              style={[
                                styles.strengthBarSegment,
                                passwordStrength.score >= 2 &&
                                  (passwordStrength.strength === 'medium'
                                    ? styles.barMedium
                                    : styles.barStrong),
                              ]}
                            />
                            <View
                              style={[
                                styles.strengthBarSegment,
                                passwordStrength.score >= 3 && styles.barStrong,
                              ]}
                            />
                          </View>

                          {/* Checklist */}
                          <View style={styles.checklistContainer}>
                            <Text
                              style={[
                                styles.checklistItem,
                                passwordStrength.hasMinLength
                                  ? styles.checkSuccess
                                  : styles.checkPending,
                              ]}
                            >
                              {passwordStrength.hasMinLength ? '✓' : '○'} At
                              least 6 characters
                            </Text>
                            <Text
                              style={[
                                styles.checklistItem,
                                passwordStrength.hasNumber
                                  ? styles.checkSuccess
                                  : styles.checkPending,
                              ]}
                            >
                              {passwordStrength.hasNumber ? '✓' : '○'} Contains
                              a number
                            </Text>
                            <Text
                              style={[
                                styles.checklistItem,
                                confirmPassword.length > 0 &&
                                newPassword === confirmPassword
                                  ? styles.checkSuccess
                                  : styles.checkPending,
                              ]}
                            >
                              {confirmPassword.length > 0 &&
                              newPassword === confirmPassword
                                ? '✓'
                                : '○'}{' '}
                              Passwords match
                            </Text>
                          </View>
                        </View>
                      )}

                      <AppTextInput
                        label="Confirm New Password"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChangeText={text => {
                          setConfirmPassword(text);
                          setApiError(null);
                        }}
                        onBlur={() => setConfirmPasswordTouched(true)}
                        error={confirmPasswordError}
                        isPassword
                        autoCapitalize="none"
                      />

                      <TouchableOpacity
                        style={[
                          styles.primaryBtn,
                          (!isResetFormValid || isLoading) &&
                            styles.primaryBtnDisabled,
                        ]}
                        activeOpacity={isResetFormValid ? 0.85 : 1}
                        onPress={handleResetPassword}
                        disabled={!isResetFormValid || isLoading}
                      >
                        {isLoading ? (
                          <View style={styles.loadingRow}>
                            <ActivityIndicator size="small" color="#000000" />
                            <Text style={styles.primaryBtnText}>
                              Resetting Password...
                            </Text>
                          </View>
                        ) : (
                          <Text
                            style={[
                              styles.primaryBtnText,
                              !isResetFormValid &&
                                styles.primaryBtnTextDisabled,
                            ]}
                          >
                            Reset Password ✓
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ═════════════════════════════════════════════════════════════
                    STEP 4: SUCCESS SCREEN
                ══════════════════════════════════════════════════════════════ */}
                {currentStep === 4 && (
                  <View style={styles.successContent}>
                    <View style={styles.successIconBadge}>
                      <Text style={styles.successEmoji}>🎉</Text>
                    </View>

                    <Text style={styles.successTitle}>
                      Password Reset Successfully!
                    </Text>
                    <Text style={styles.successSubtitle}>
                      Your account security has been updated. You can now log in
                      using your new password.
                    </Text>

                    <View style={styles.successInfoCard}>
                      <Text style={styles.successAccountText}>
                        Account: <Text style={styles.emailBold}>{email}</Text>
                      </Text>
                      <Text style={styles.successSecurityText}>
                        Status: Active & Secured
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate(Routes.Auth.LOGIN)}
                    >
                      <Text style={styles.primaryBtnText}>Proceed to Login →</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0E1A',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#0A0E1A',
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  containerTablet: {
    maxWidth: 480,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelText: {
    color: '#CCFF00',
    fontSize: 15,
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161B26',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    borderColor: '#CCFF00',
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  stepCircleCompleted: {
    backgroundColor: '#CCFF00',
    borderColor: '#CCFF00',
  },
  stepNumber: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#CCFF00',
  },
  stepNumberCompleted: {
    color: '#000000',
  },
  stepLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#CCFF00',
    fontWeight: '700',
  },
  stepLabelCompleted: {
    color: '#94A3B8',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 8,
    marginBottom: 16,
  },
  stepLineCompleted: {
    backgroundColor: '#CCFF00',
  },
  glassCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  animatedStepContent: {
    width: '100%',
  },
  stepContent: {
    width: '100%',
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(204, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 28,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  headingSmall: {
    fontSize: 22,
  },
  subheading: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorBannerText: {
    flex: 1,
    color: '#F87171',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  formGroup: {
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: '#CCFF00',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 12,
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  primaryBtnTextDisabled: {
    color: '#4B5563',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  backToLoginBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  backToLoginText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  linkHighlight: {
    color: '#CCFF00',
    fontWeight: '700',
  },
  emailChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'center',
    marginBottom: 24,
    gap: 8,
  },
  emailHighlighted: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editEmailBtn: {
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  editEmailText: {
    color: '#CCFF00',
    fontSize: 12,
    fontWeight: '700',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  otpBox: {
    flex: 1,
    height: 54,
    backgroundColor: '#161B26',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    padding: 0,
  },
  otpBoxFilled: {
    borderColor: '#CCFF00',
    backgroundColor: 'rgba(204, 255, 0, 0.04)',
  },
  otpBoxError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerIcon: {
    fontSize: 14,
  },
  timerText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  timerDigits: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerExpiredText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  resendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendBtnDisabled: {
    opacity: 0.7,
  },
  resendBtnText: {
    color: '#CCFF00',
    fontSize: 13,
    fontWeight: '700',
  },
  resendBtnTextDisabled: {
    color: '#6B7280',
    fontWeight: '500',
  },
  strengthContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  strengthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabelTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  strengthValueBadge: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  strengthWeak: {
    color: '#EF4444',
  },
  strengthMedium: {
    color: '#F59E0B',
  },
  strengthStrong: {
    color: '#CCFF00',
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  strengthBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  barWeak: {
    backgroundColor: '#EF4444',
  },
  barMedium: {
    backgroundColor: '#F59E0B',
  },
  barStrong: {
    backgroundColor: '#CCFF00',
  },
  checklistContainer: {
    gap: 4,
  },
  checklistItem: {
    fontSize: 12,
    lineHeight: 16,
  },
  checkSuccess: {
    color: '#10B981',
    fontWeight: '600',
  },
  checkPending: {
    color: '#6B7280',
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    borderWidth: 2,
    borderColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  successEmoji: {
    fontSize: 40,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  successInfoCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 6,
  },
  successAccountText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  emailBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successSecurityText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
