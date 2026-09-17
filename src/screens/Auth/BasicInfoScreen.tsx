import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  KeyboardAvoidingView, Platform, TouchableOpacity, StatusBar, useWindowDimensions 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput, GenderPickerModal } from '@components/index';
import { Routes } from '@constants/routes';
import type { AuthNavigationProp } from '@t/navigation';

import { useOnboarding } from '../../context/OnboardingContext';

const BasicInfoScreen = (): React.JSX.Element => {
  const { state, updateState } = useOnboarding();
  const navigation = useNavigation<AuthNavigationProp<'BasicInfo'>>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isSmallScreen = height < 720;
  const isVerySmallScreen = height < 650;
  const isTablet = width >= 768;

  const [name, setName] = useState(state.name || '');
  const [username, setUsername] = useState(state.username || '');
  const [email, setEmail] = useState(state.email || '');
  const [password, setPassword] = useState(state.password || '');
  const [age, setAge] = useState(state.age?.toString() || '');
  const [weight, setWeight] = useState(state.weight_kg || '');
  const [heightVal, setHeightVal] = useState(state.height_cm || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | undefined>(state.gender);
  
  const [isGenderModalVisible, setGenderModalVisible] = useState(false);

  // Form Validation
  const isFormValid = 
    name.trim().length > 0 &&
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    email.includes('@') &&
    password.length >= 8 &&
    age.trim().length > 0 &&
    weight.trim().length > 0 &&
    heightVal.trim().length > 0;

  const handleContinue = () => {
    if (!isFormValid) return;

    updateState({
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
      password,
      age: parseInt(age, 10),
      weight_kg: weight.trim(),
      height_cm: heightVal.trim(),
      gender,
    });

    navigation.navigate(Routes.Auth.SPORT_SELECTION);
  };

  const displayGender = () => {
    switch (gender) {
      case 'male': return 'Male';
      case 'female': return 'Female';
      case 'other': return 'Other';
      default: return '';
    }
  };

  const inputHeight = isVerySmallScreen ? 46 : isSmallScreen ? 48 : 52;
  const fieldSpacing = isVerySmallScreen ? 8 : isSmallScreen ? 10 : 12;

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
              paddingBottom: Math.max(insets.bottom, 16),
              paddingTop: isSmallScreen ? 10 : 16,
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.responsiveContainer}>
            
            {/* Top Content Area */}
            <View style={styles.mainContent}>
              
              {/* Header & Subtitle */}
              <View style={[styles.headerSection, isSmallScreen && { marginBottom: 14 }]}>
                <Text 
                  style={[
                    styles.heading,
                    isSmallScreen && styles.headingSmall,
                    isTablet && styles.headingTablet,
                  ]}
                >
                  Tell us about you
                </Text>
                <Text 
                  style={[
                    styles.subtitle,
                    isSmallScreen && styles.subtitleSmall,
                  ]}
                >
                  Used to personalise your training load and nutrition targets.
                </Text>
              </View>

              {/* Form Fields */}
              <View style={styles.formContainer}>
                
                {/* 1. Your Name */}
                <AppTextInput
                  label="Your name"
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  containerStyle={{ marginBottom: fieldSpacing }}
                  inputContainerStyle={{ height: inputHeight }}
                />

                {/* 2. Username */}
                <AppTextInput
                  label="Username"
                  placeholder="e.g. janedoe123"
                  value={username}
                  onChangeText={setUsername}
                  helperText="This is how others find you — can't be changed later"
                  autoCapitalize="none"
                  containerStyle={{ marginBottom: fieldSpacing }}
                  inputContainerStyle={{ height: inputHeight }}
                />

                {/* 3. Email */}
                <AppTextInput
                  label="Email"
                  placeholder="e.g. jane@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  containerStyle={{ marginBottom: fieldSpacing }}
                  inputContainerStyle={{ height: inputHeight }}
                />

                {/* 4. Password */}
                <AppTextInput
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  helperText="At least 8 characters"
                  containerStyle={{ marginBottom: fieldSpacing }}
                  inputContainerStyle={{ height: inputHeight }}
                />

                {/* 5. Age, Weight, Height (3 Columns) */}
                <View style={[styles.metricsRow, { marginBottom: fieldSpacing }]}>
                  <View style={styles.metricColumn}>
                    <AppTextInput
                      label="Age"
                      placeholder="e.g. 25"
                      value={age}
                      onChangeText={setAge}
                      keyboardType="numeric"
                      containerStyle={styles.noMarginBottom}
                      inputContainerStyle={{ height: inputHeight }}
                    />
                  </View>

                  <View style={styles.metricColumn}>
                    <AppTextInput
                      label="Weight (kg)"
                      placeholder="e.g. 70"
                      value={weight}
                      onChangeText={setWeight}
                      keyboardType="decimal-pad"
                      containerStyle={styles.noMarginBottom}
                      inputContainerStyle={{ height: inputHeight }}
                    />
                  </View>

                  <View style={styles.metricColumn}>
                    <AppTextInput
                      label="Height (cm)"
                      placeholder="e.g. 175"
                      value={heightVal}
                      onChangeText={setHeightVal}
                      keyboardType="decimal-pad"
                      containerStyle={styles.noMarginBottom}
                      inputContainerStyle={{ height: inputHeight }}
                    />
                  </View>
                </View>

                {/* 6. Gender (optional) */}
                <View style={[styles.genderInputGroup, { marginBottom: fieldSpacing }]}>
                  <Text style={styles.inputLabel}>Gender (optional)</Text>
                  <TouchableOpacity 
                    style={[styles.pickerButton, { height: inputHeight }]} 
                    activeOpacity={0.8}
                    onPress={() => setGenderModalVisible(true)}
                  >
                    <Text style={gender ? styles.pickerTextSelected : styles.pickerTextPlaceholder}>
                      {gender ? displayGender() : 'Select Gender'}
                    </Text>
                    <Text style={styles.pickerChevron}>⌄</Text>
                  </TouchableOpacity>
                </View>

              </View>

            </View>

            {/* Bottom Action Area (Within ScrollView with space-between) */}
            <View style={[styles.footerSection, isSmallScreen && { paddingTop: 12 }]}>
              <TouchableOpacity 
                style={[
                  styles.continueButton,
                  isVerySmallScreen && { height: 48, borderRadius: 24 },
                  !isFormValid && styles.continueButtonDisabled
                ]}
                activeOpacity={isFormValid ? 0.85 : 1}
                onPress={handleContinue}
                disabled={!isFormValid}
              >
                <Text 
                  style={[
                    styles.continueButtonText,
                    !isFormValid && styles.continueButtonTextDisabled
                  ]}
                >
                  Continue →
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>

        {/* Gender Selection Modal */}
        <GenderPickerModal
          visible={isGenderModalVisible}
          onClose={() => setGenderModalVisible(false)}
          onSelect={setGender}
          selected={gender}
        />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#0B0F17',
  },
  responsiveContainer: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  mainContent: {
    width: '100%',
  },

  // Header Section
  headerSection: {
    marginBottom: 18,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headingSmall: {
    fontSize: 24,
    marginBottom: 4,
  },
  headingTablet: {
    fontSize: 32,
  },
  subtitle: {
    color: '#94A3B8', // Slate-gray
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '400',
    maxWidth: 420,
  },
  subtitleSmall: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Form Section
  formContainer: {
    width: '100%',
  },

  // Metrics Row
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricColumn: {
    flex: 1,
  },
  noMarginBottom: {
    marginBottom: 0,
  },

  // Gender Input
  genderInputGroup: {},
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6, // 6px tight connection
  },
  pickerButton: {
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  pickerTextPlaceholder: {
    color: '#6B7280',
    fontSize: 15,
  },
  pickerTextSelected: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  pickerChevron: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2,
  },

  // Footer Action Area
  footerSection: {
    width: '100%',
    paddingTop: 16,
    paddingBottom: 4,
  },
  continueButton: {
    backgroundColor: '#CCFF00', // Vibrant Neon Lime
    height: 54,
    borderRadius: 27, // Full pill
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#CCFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#161B26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  continueButtonTextDisabled: {
    color: '#4B5563',
  },
});

export default BasicInfoScreen;
