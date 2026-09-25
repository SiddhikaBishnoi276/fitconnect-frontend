import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  KeyboardAvoidingView, Platform, Keyboard, ScrollView, StatusBar, useWindowDimensions 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { AppTextInput } from '@components/index';
import { Routes } from '@constants/routes';
import { loginStart, loginSuccess, loginFailure } from '@store/slices/authSlice';
import type { AuthNavigationProp } from '@t/navigation';

const LoginScreen = (): React.JSX.Element => {
  const navigation = useNavigation<AuthNavigationProp<'Login'>>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallScreen = height < 720;
  const isTablet = width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  const handleLogin = async () => {
    if (!isFormValid) return;

    Keyboard.dismiss();
    setLoading(true);
    setErrorMsg(null);
    dispatch(loginStart());

    try {
      const deviceInfo = `${Platform.OS} device`;
      
      const response = await apiClient.post(Endpoints.auth.login, {
        email: email.trim(),
        password,
        deviceInfo,
      });

      dispatch(loginSuccess(response.data.data));
    } catch (err: any) {
      const status = err.response?.status;
      const responseData = err.response?.data;

      if (status === 401) {
        setErrorMsg('Invalid email or password');
      } else if (status === 400) {
        setErrorMsg(responseData?.message || 'Validation error. Please check your inputs.');
      } else {
        setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
      }
      
      dispatch(loginFailure(err.message || 'Login failed'));
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
              paddingTop: isSmallScreen ? 16 : 32,
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.responsiveContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{marginBottom: 16, alignSelf: 'flex-start'}}>
              <Text style={{color: '#CCFF00', fontSize: 16, fontWeight: '700'}}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.headerSection}>
              <Text 
                style={[
                  styles.title,
                  isSmallScreen && styles.titleSmall,
                  isTablet && styles.titleTablet,
                ]}
              >
                Welcome Back
              </Text>
              <Text style={styles.subtitle}>
                Log in to continue your training
              </Text>
            </View>

            {/* Error Message */}
            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.form}>
              <AppTextInput
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <AppTextInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                isPassword
              />

              <TouchableOpacity 
                style={[
                  styles.loginButton,
                  (!isFormValid || loading) && styles.loginButtonDisabled
                ]}
                activeOpacity={isFormValid ? 0.85 : 1}
                onPress={handleLogin}
                disabled={!isFormValid || loading}
              >
                <Text 
                  style={[
                    styles.loginButtonText,
                    !isFormValid && styles.loginButtonTextDisabled
                  ]}
                >
                  {loading ? 'Logging in...' : 'Log In →'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer Sign Up Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate(Routes.Auth.WELCOME)}>
                <Text style={styles.footerLink}>Sign up</Text>
              </TouchableOpacity>
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
  headerSection: {
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  titleSmall: {
    fontSize: 28,
  },
  titleTablet: {
    fontSize: 38,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '400',
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
  },
  form: {
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#CCFF00',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  loginButtonTextDisabled: {
    color: '#4B5563',
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

export default LoginScreen;
