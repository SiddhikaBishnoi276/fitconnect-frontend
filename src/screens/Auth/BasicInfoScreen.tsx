import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  KeyboardAvoidingView, Platform, TouchableOpacity 
} from 'react-native';
import { Colors, Spacing, Layout, TextPresets } from '@theme/index';
import { Routes } from '@constants/routes';
import { AppButton, AppTextInput, OnboardingProgressBar, GenderPickerModal } from '@components/index';
import { useOnboarding } from '../../context/OnboardingContext';
import { useNavigation } from '@react-navigation/native';
import type { AuthNavigationProp } from '@t/navigation';

const BasicInfoScreen = () => {
  const { state, updateState } = useOnboarding();
  const navigation = useNavigation<AuthNavigationProp<'BasicInfo'>>();

  const [name, setName] = useState(state.name || '');
  const [username, setUsername] = useState(state.username || '');
  const [email, setEmail] = useState(state.email || '');
  const [password, setPassword] = useState(state.password || '');
  const [age, setAge] = useState(state.age?.toString() || '');
  const [weight, setWeight] = useState(state.weight_kg || '');
  const [height, setHeight] = useState(state.height_cm || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | undefined>(state.gender);
  
  const [isGenderModalVisible, setGenderModalVisible] = useState(false);

  // Validation
  const isFormValid = 
    name.trim().length > 0 &&
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    email.includes('@') &&
    password.length >= 8 &&
    age.trim().length > 0 &&
    weight.trim().length > 0 &&
    height.trim().length > 0;

  const handleContinue = () => {
    if (!isFormValid) return;

    updateState({
      name: name.trim(),
      username: username.trim(),
      email: email.trim(),
      password,
      age: parseInt(age, 10),
      weight_kg: weight.trim(),
      height_cm: height.trim(),
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <OnboardingProgressBar currentStep={2} totalSteps={7} />

          <Text style={[TextPresets.h2, styles.heading]}>Tell us about you</Text>
          <Text style={[TextPresets.body, styles.subtitle]}>
            Used to personalise your training load and nutrition targets.
          </Text>

          <View style={styles.form}>
            <AppTextInput
              label="Your name"
              placeholder="e.g. Jane Doe"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <AppTextInput
              label="Username"
              placeholder="e.g. janedoe123"
              value={username}
              onChangeText={setUsername}
              helperText="This is how others find you — can't be changed later"
              autoCapitalize="none"
            />

            <AppTextInput
              label="Email"
              placeholder="e.g. jane@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AppTextInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              helperText="At least 8 characters"
            />

            <View style={styles.row}>
              <View style={[styles.flex1, { marginRight: Spacing[2] }]}>
                <AppTextInput
                  label="Age"
                  placeholder="e.g. 25"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.flex1, { marginHorizontal: Spacing[2] }]}>
                <AppTextInput
                  label="Weight (kg)"
                  placeholder="e.g. 70"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={[styles.flex1, { marginLeft: Spacing[2] }]}>
                <AppTextInput
                  label="Height (cm)"
                  placeholder="e.g. 175"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[TextPresets.label, styles.label]}>Gender (optional)</Text>
              <TouchableOpacity 
                style={styles.pickerButton} 
                onPress={() => setGenderModalVisible(true)}
              >
                <Text style={[
                  TextPresets.body, 
                  gender ? styles.pickerTextSelected : styles.pickerTextPlaceholder
                ]}>
                  {gender ? displayGender() : 'Select Gender'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton 
            title="Continue →" 
            onPress={handleContinue} 
            disabled={!isFormValid} 
          />
        </View>

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
    backgroundColor: Colors.background.primary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
  },
  heading: {
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  subtitle: {
    color: Colors.text.secondary,
    marginBottom: Spacing[8],
  },
  form: {
    // using component internal margins
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing[4],
  },
  label: {
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  pickerButton: {
    height: Layout.inputHeight,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: 8, // Using BorderRadius.sm doesn't seem directly available as a number, assume theme has it or use 8
    justifyContent: 'center',
    paddingHorizontal: Spacing[4],
  },
  pickerTextPlaceholder: {
    color: Colors.text.tertiary,
  },
  pickerTextSelected: {
    color: Colors.text.primary,
  },
  footer: {
    padding: Layout.screenPaddingH,
    paddingBottom: Layout.bottomSafeArea || Spacing[8],
    backgroundColor: Colors.background.primary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.primary,
  },
});

export default BasicInfoScreen;
