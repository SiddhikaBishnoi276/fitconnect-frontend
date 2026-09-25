import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { AppTextInput } from '@components/index';
import { Routes } from '@constants/routes';
import type { AuthNavigationProp } from '@t/navigation';
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
    const err = error as {
      message?: string;
      response?: {
        data?: {
          message?: string;
          error?: { message?: string };
        };
      };
    };
    const responseMsg =
      err.response?.data?.error?.message || err.response?.data?.message;
    if (responseMsg) {
      return responseMsg;
    }
    if (err.message) {
      return err.message;
    }
  }
  return fallback;
};

const ForgotPasswordScreen = (): React.JSX.Element => {
  const navigation = useNavigation<AuthNavigationProp<'ForgotPassword'>>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallScreen = height < 720;
  const isTablet = width >= 768;

  // ─── Step & Form State ──────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<StepType>(1);
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ─── UI & Error States ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  // ─── OTP Countdown Timer ───────────────────────────────────────────────────
  const [timerSeconds, setTimerSeconds] = useState(OTP_COUNTDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);

  // ─── OTP Input Box Refs ────────────────────────────────────────────────────
  const otpRef0 = useRef<TextInput>(null);
  const otpRef1 = useRef<TextInput>(null);
  const otpRef2 = useRef<TextInput>(null);
  const otpRef3 = useRef<TextInput>(null);
  const otpRef4 = useRef<TextInput>(null);
  const otpRef5 = useRef<TextInput>(null);

  const getOtpRef = (index: number) => {
    switch (index) {
      case 0: return otpRef0;
      case 1: return otpRef1;
      case 2: return otpRef2;
      case 3: return otpRef3;
      case 4: return otpRef4;
      case 5: return otpRef5;
      default: return otpRef0;
    }
  };

  // Step Transition
  const goToStep = (nextStep: StepType) => {
    setCurrentStep(nextStep);
    setErrorMsg(null);
  };

  // Timer Effect
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

  // Focus OTP box when entering Step 2
  useEffect(() => {
    if (currentStep === 2) {
      const timeout = setTimeout(() => {
        otpRef0.current?.focus();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [currentStep]);

  // ─── Step 1: Request Password Reset Handler ─────────────────────────────────
  const emailValidationError = emailTouched ? validateEmail(email) : undefined;
  const isEmailValid = email.trim() !== '' && !validateEmail(email);

  const handleRequestReset = async () => {
    setEmailTouched(true);
    const err = validateEmail(email);
    if (err) {
      setErrorMsg(err);
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = { email: email.trim().toLowerCase() };
      const response = await apiClient.post(Endpoints.auth.forgotPassword, payload);

      const msg =
        response.data?.message ||
        'Password reset OTP has been sent to your email';
      setSuccessNotice(msg);
      setTimerSeconds(OTP_COUNTDOWN_SECONDS);
      goToStep(2);
    } catch (err: unknown) {
      const msg = extractErrorMessage(
        err,
        'No user account found with this email address.',
      );
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: OTP Verification Handlers ─────────────────────────────────────
  const fullOtpString = otpDigits.join('');
  const isOtpComplete = fullOtpString.length === 6 && /^\d{6}$/.test(fullOtpString);

  const handleOtpChange = (text: string, index: number) => {
    setErrorMsg(null);
    const cleaned = text.replace(/\D/g, '');

    // Handle Paste
    if (cleaned.length > 1) {
      const newDigits = [...otpDigits];
      const digitsToFill = cleaned.slice(0, 6);
      for (let i = 0; i < 6; i++) {
        if (i < digitsToFill.length) {
          newDigits[i] = digitsToFill[i];
        }
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(digitsToFill.length, 5);
      getOtpRef(nextFocus).current?.focus();
      return;
    }

    // Single digit
    const digit = cleaned.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      getOtpRef(index + 1).current?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        getOtpRef(index - 1).current?.focus();
      }
    }
  };

  const handleResendOtp = async () => {
    if (timerSeconds > 0 || isResending) return;

    Keyboard.dismiss();
    setIsResending(true);
    setErrorMsg(null);

    try {
      const payload = { email: email.trim().toLowerCase() };
      const response = await apiClient.post(Endpoints.auth.forgotPassword, payload);

      const msg =
        response.data?.message ||
        'A fresh 6-digit OTP has been sent to your email';
      setSuccessNotice(msg);
      setTimerSeconds(OTP_COUNTDOWN_SECONDS);
      setOtpDigits(['', '', '', '', '', '']);
      otpRef0.current?.focus();
    } catch (err: unknown) {
      const msg = extractErrorMessage(
        err,
        'Failed to resend OTP. Please try again later.',
      );
      setErrorMsg(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!isOtpComplete) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        otp: fullOtpString,
      };

      await apiClient.post(Endpoints.auth.verifyOtp, payload);
      setSuccessNotice(null);
      goToStep(3);
    } catch (err: unknown) {
      const msg = extractErrorMessage(
        err,
        'Invalid or expired verification code. Please check and try again.',
      );
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Set New Password Handlers ─────────────────────────────────────
  const passwordStrength = getPasswordStrength(newPassword);
  const passwordError = passwordTouched ? validateResetPassword(newPassword) : undefined;
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
      setErrorMsg(pErr);
      return;
    }

    const cErr = validateConfirmPassword(newPassword, confirmPassword);
    if (cErr) {
      setErrorMsg(cErr);
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        otp: fullOtpString,
        newPassword,
      };

      await apiClient.post(Endpoints.auth.resetPassword, payload);
      goToStep(4);
    } catch (err: unknown) {
      const msg = extractErrorMessage(
        err,
        'Failed to reset password. Please try again.',
      );
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F17" translucent={false} />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(insets.bottom, 24),
              paddingTop: isSmallScreen ? 16 : 28,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.responsiveContainer, isTablet ? styles.containerTablet : undefined]}>
            {/* Top Navigation */}
            {currentStep !== 4 ? (
              <View style={styles.topNav}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    if (currentStep === 1) {
                      navigation.navigate(Routes.Auth.LOGIN);
                    } else if (currentStep === 2) {
                      goToStep(1);
                    } else if (currentStep === 3) {
                      goToStep(2);
                    }
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate(Routes.Auth.LOGIN)}>
                  <Text style={styles.cancelText}>Login</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Stepper Dots */}
            {currentStep !== 4 ? (
              <View style={styles.stepperContainer}>
                {[1, 2, 3].map((stepNum, idx) => {
                  const isActive = currentStep === stepNum;
                  const isDone = currentStep > stepNum;
                  const labels = ['Email', 'Verify', 'Password'];

                  return (
                    <React.Fragment key={stepNum}>
                      <View style={styles.stepItem}>
                        <View
                          style={[
                            styles.stepCircle,
                            isActive ? styles.stepCircleActive : undefined,
                            isDone ? styles.stepCircleCompleted : undefined,
                          ]}
                        >
                          <Text
                            style={[
                              styles.stepNumber,
                              isActive ? styles.stepNumberActive : undefined,
                              isDone ? styles.stepNumberCompleted : undefined,
                            ]}
                          >
                            {isDone ? '✓' : stepNum}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.stepLabel,
                            isActive ? styles.stepLabelActive : undefined,
                            isDone ? styles.stepLabelCompleted : undefined,
                          ]}
                        >
                          {labels[idx]}
                        </Text>
                      </View>
                      {idx < 2 ? (
                        <View
                          style={[
                            styles.stepLine,
                            currentStep > idx + 1 ? styles.stepLineCompleted : undefined,
                          ]}
                        />
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </View>
            ) : null}

            {/* Main Card */}
            <View style={styles.card}>
              {/* Success Notice Banner */}
              {successNotice && currentStep !== 4 ? (
                <View style={styles.successBanner}>
                  <Text style={styles.successBannerText}>✓ {successNotice}</Text>
                </View>
              ) : null}

              {/* Error Banner */}
              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
                </View>
              ) : null}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 1: EMAIL INPUT
              ────────────────────────────────────────────────────────────── */}
              {currentStep === 1 ? (
                <View style={styles.stepSection}>
                  <View style={styles.headerSection}>
                    <Text style={[styles.title, isSmallScreen ? styles.titleSmall : undefined]}>
                      Forgot Password
                    </Text>
                    <Text style={styles.subtitle}>
                      Enter your email to receive a 6-digit verification code.
                    </Text>
                  </View>

                  <View style={styles.form}>
                    <AppTextInput
                      label="Email Address"
                      placeholder="user@example.com"
                      value={email}
                      onChangeText={setEmail}
                      onBlur={() => setEmailTouched(true)}
                      error={emailValidationError}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        !isEmailValid || loading ? styles.primaryButtonDisabled : undefined,
                      ]}
                      activeOpacity={isEmailValid ? 0.85 : 1}
                      onPress={handleRequestReset}
                      disabled={!isEmailValid || loading}
                    >
                      <Text
                        style={[
                          styles.primaryButtonText,
                          !isEmailValid ? styles.primaryButtonTextDisabled : undefined,
                        ]}
                      >
                        {loading ? 'Sending Code...' : 'Send Reset Code →'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerText}>Remember your password? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate(Routes.Auth.LOGIN)}>
                      <Text style={styles.footerLink}>Log In</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 2: OTP VERIFICATION
              ────────────────────────────────────────────────────────────── */}
              {currentStep === 2 ? (
                <View style={styles.stepSection}>
                  <View style={styles.headerSection}>
                    <Text style={[styles.title, isSmallScreen ? styles.titleSmall : undefined]}>
                      Enter Verification Code
                    </Text>
                    <Text style={styles.subtitle}>
                      Enter the 6-digit code sent to{' '}
                      <Text style={styles.emailHighlighted}>{email}</Text>
                    </Text>
                    <TouchableOpacity onPress={() => goToStep(1)} style={styles.editEmailRow}>
                      <Text style={styles.editEmailLink}>Wrong email? Change</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 6 Digit Boxes */}
                  <View style={styles.otpContainer}>
                    {[0, 1, 2, 3, 4, 5].map(index => {
                      const isFilled = otpDigits[index].length > 0;
                      return (
                        <TextInput
                          key={index}
                          ref={getOtpRef(index)}
                          style={[styles.otpInput, isFilled ? styles.otpInputFilled : undefined]}
                          value={otpDigits[index]}
                          onChangeText={text => handleOtpChange(text, index)}
                          onKeyPress={({ nativeEvent }) =>
                            handleOtpKeyPress(nativeEvent.key, index)
                          }
                          keyboardType="number-pad"
                          maxLength={6}
                          selectTextOnFocus
                          selectionColor="#CCFF00"
                        />
                      );
                    })}
                  </View>

                  {/* Timer & Resend */}
                  <View style={styles.timerContainer}>
                    {timerSeconds > 0 ? (
                      <Text style={styles.timerText}>
                        Code expires in: <Text style={styles.timerBold}>{formatTimeMMSS(timerSeconds)}</Text>
                      </Text>
                    ) : (
                      <Text style={styles.timerExpiredText}>Code expired. Request a new one.</Text>
                    )}

                    <TouchableOpacity
                      disabled={timerSeconds > 0 || isResending}
                      onPress={handleResendOtp}
                      style={styles.resendTouch}
                    >
                      {isResending ? (
                        <ActivityIndicator size="small" color="#CCFF00" />
                      ) : (
                        <Text
                          style={[
                            styles.resendText,
                            timerSeconds > 0 ? styles.resendTextDisabled : undefined,
                          ]}
                        >
                          {timerSeconds > 0
                            ? `Resend in ${formatTimeMMSS(timerSeconds)}`
                            : 'Resend OTP Code'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      !isOtpComplete || loading ? styles.primaryButtonDisabled : undefined,
                    ]}
                    activeOpacity={isOtpComplete ? 0.85 : 1}
                    onPress={handleVerifyOtp}
                    disabled={!isOtpComplete || loading}
                  >
                    <Text
                      style={[
                        styles.primaryButtonText,
                        !isOtpComplete ? styles.primaryButtonTextDisabled : undefined,
                      ]}
                    >
                      {loading ? 'Verifying...' : 'Verify Code →'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 3: SET NEW PASSWORD
              ────────────────────────────────────────────────────────────── */}
              {currentStep === 3 ? (
                <View style={styles.stepSection}>
                  <View style={styles.headerSection}>
                    <Text style={[styles.title, isSmallScreen ? styles.titleSmall : undefined]}>
                      Reset Password
                    </Text>
                    <Text style={styles.subtitle}>
                      Enter your new password below (min. 6 characters).
                    </Text>
                  </View>

                  <View style={styles.form}>
                    <AppTextInput
                      label="New Password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      onBlur={() => setPasswordTouched(true)}
                      error={passwordError}
                      isPassword
                    />

                    {/* Password Strength Meter */}
                    {newPassword.length > 0 ? (
                      <View style={styles.strengthBox}>
                        <View style={styles.strengthHeader}>
                          <Text style={styles.strengthTitle}>Password Strength:</Text>
                          <Text
                            style={[
                              styles.strengthBadge,
                              passwordStrength.strength === 'weak'
                                ? styles.badgeWeak
                                : passwordStrength.strength === 'medium'
                                ? styles.badgeMedium
                                : styles.badgeStrong,
                            ]}
                          >
                            {passwordStrength.label}
                          </Text>
                        </View>

                        {/* 3 Strength Bars */}
                        <View style={styles.strengthBars}>
                          <View
                            style={[
                              styles.bar,
                              passwordStrength.score >= 1
                                ? passwordStrength.strength === 'weak'
                                  ? styles.barWeak
                                  : passwordStrength.strength === 'medium'
                                  ? styles.barMedium
                                  : styles.barStrong
                                : undefined,
                            ]}
                          />
                          <View
                            style={[
                              styles.bar,
                              passwordStrength.score >= 2
                                ? passwordStrength.strength === 'medium'
                                  ? styles.barMedium
                                  : styles.barStrong
                                : undefined,
                            ]}
                          />
                          <View
                            style={[
                              styles.bar,
                              passwordStrength.score >= 3 ? styles.barStrong : undefined,
                            ]}
                          />
                        </View>

                        {/* Requirements */}
                        <Text
                          style={[
                            styles.reqItem,
                            passwordStrength.hasMinLength ? styles.reqMet : styles.reqUnmet,
                          ]}
                        >
                          {passwordStrength.hasMinLength ? '✓' : '○'} At least 6 characters
                        </Text>
                        <Text
                          style={[
                            styles.reqItem,
                            passwordStrength.hasNumber ? styles.reqMet : styles.reqUnmet,
                          ]}
                        >
                          {passwordStrength.hasNumber ? '✓' : '○'} Contains a number
                        </Text>
                        <Text
                          style={[
                            styles.reqItem,
                            confirmPassword.length > 0 && newPassword === confirmPassword
                              ? styles.reqMet
                              : styles.reqUnmet,
                          ]}
                        >
                          {confirmPassword.length > 0 && newPassword === confirmPassword
                            ? '✓'
                            : '○'}{' '}
                          Passwords match
                        </Text>
                      </View>
                    ) : null}

                    <AppTextInput
                      label="Confirm New Password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onBlur={() => setConfirmPasswordTouched(true)}
                      error={confirmPasswordError}
                      isPassword
                    />

                    <TouchableOpacity
                      style={[
                        styles.primaryButton,
                        !isResetFormValid || loading ? styles.primaryButtonDisabled : undefined,
                      ]}
                      activeOpacity={isResetFormValid ? 0.85 : 1}
                      onPress={handleResetPassword}
                      disabled={!isResetFormValid || loading}
                    >
                      <Text
                        style={[
                          styles.primaryButtonText,
                          !isResetFormValid ? styles.primaryButtonTextDisabled : undefined,
                        ]}
                      >
                        {loading ? 'Resetting...' : 'Reset Password ✓'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 4: SUCCESS SCREEN
              ────────────────────────────────────────────────────────────── */}
              {currentStep === 4 ? (
                <View style={styles.successSection}>
                  <View style={styles.successIconBadge}>
                    <Text style={styles.successEmoji}>🎉</Text>
                  </View>

                  <Text style={styles.title}>Password Reset Successfully!</Text>
                  <Text style={styles.subtitle}>
                    Your account password has been updated. You can now log in with your new credentials.
                  </Text>

                  <View style={styles.accountCard}>
                    <Text style={styles.accountText}>
                      Account: <Text style={styles.emailBold}>{email}</Text>
                    </Text>
                    <Text style={styles.statusSecuredText}>Status: Secured & Ready</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate(Routes.Auth.LOGIN)}
                  >
                    <Text style={styles.primaryButtonText}>Proceed to Login →</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
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
    backgroundColor: '#0B0F17',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#0B0F17',
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
    paddingVertical: 6,
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
    marginBottom: 20,
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
  card: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  stepSection: {
    width: '100%',
  },
  headerSection: {
    marginBottom: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  titleSmall: {
    fontSize: 24,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  emailHighlighted: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  editEmailRow: {
    marginTop: 6,
  },
  editEmailLink: {
    color: '#CCFF00',
    fontSize: 13,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    lineHeight: 18,
  },
  form: {
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#CCFF00',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  primaryButtonTextDisabled: {
    color: '#4B5563',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  otpInput: {
    flex: 1,
    height: 52,
    backgroundColor: '#161B26',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    padding: 0,
    marginHorizontal: 3,
  },
  otpInputFilled: {
    borderColor: '#CCFF00',
    backgroundColor: 'rgba(204, 255, 0, 0.05)',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 6,
  },
  timerBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  timerExpiredText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  resendTouch: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  resendText: {
    color: '#CCFF00',
    fontSize: 13,
    fontWeight: '700',
  },
  resendTextDisabled: {
    color: '#6B7280',
    fontWeight: '500',
  },
  strengthBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    marginTop: -4,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  strengthBadge: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badgeWeak: {
    color: '#EF4444',
  },
  badgeMedium: {
    color: '#F59E0B',
  },
  badgeStrong: {
    color: '#CCFF00',
  },
  strengthBars: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 2,
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
  reqItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  reqMet: {
    color: '#10B981',
    fontWeight: '600',
  },
  reqUnmet: {
    color: '#6B7280',
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(204, 255, 0, 0.15)',
    borderWidth: 2,
    borderColor: '#CCFF00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  successEmoji: {
    fontSize: 36,
  },
  accountCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    marginBottom: 20,
  },
  accountText: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 4,
  },
  emailBold: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusSecuredText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  footerLink: {
    color: '#CCFF00',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ForgotPasswordScreen;
