import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard 
} from 'react-native';
import { useDispatch } from 'react-redux';

import apiClient from '@api/client';
import { Endpoints } from '@api/endpoints';
import { AppTextInput, AppButton } from '@components/index';
import { Routes } from '@constants/routes';
import { loginStart, loginSuccess, loginFailure } from '@store/slices/authSlice';
import type { AuthNavigationProp } from '@t/navigation';
import { Colors, Spacing, Layout, TextPresets } from '@theme/index';

const LoginScreen = () => {
  const navigation = useNavigation<AuthNavigationProp<'Login'>>();
  const dispatch = useDispatch();

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

      // response.data.data contains { accessToken, refreshToken, user }
      dispatch(loginSuccess(response.data.data));

      // Navigation to Main is handled automatically by RootNavigator based on isAuthenticated state
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={[TextPresets.h1, styles.title]}>Welcome Back</Text>
          <Text style={[TextPresets.body, styles.subtitle]}>
            Log in to continue your training
          </Text>

          <View style={styles.form}>
            <AppTextInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errorMsg && !errorMsg.includes('Validation') ? undefined : undefined}
            />

            <AppTextInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              error={errorMsg || undefined}
            />

            <AppButton 
              title="Log In →" 
              onPress={handleLogin} 
              disabled={!isFormValid || loading} 
              loading={loading}
              style={styles.loginButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[TextPresets.body, styles.footerText]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate(Routes.Auth.WELCOME)}>
              <Text style={[TextPresets.body, styles.footerLink]}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.screenPaddingH,
    justifyContent: 'center',
    paddingBottom: Spacing[10], // Offset to keep it vertically centered
  },
  title: {
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  subtitle: {
    color: Colors.text.secondary,
    marginBottom: Spacing[8],
  },
  form: {
    marginBottom: Spacing[6],
  },
  loginButton: {
    marginTop: Spacing[4],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[6],
  },
  footerText: {
    color: Colors.text.secondary,
  },
  footerLink: {
    color: Colors.brand.primary,
    fontFamily: TextPresets.h4.fontFamily,
  },
});

export default LoginScreen;
