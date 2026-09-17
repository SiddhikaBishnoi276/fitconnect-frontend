/**
 * FitConnect — Register Screen (Placeholder)
 *
 * Replace this with the Figma UI implementation.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Routes } from '@constants/routes';
import type { AuthNavigationProp } from '@t/navigation';
import { Colors, Spacing, TextPresets } from '@theme/index';


interface Props {
  navigation: AuthNavigationProp<'Register'>;
}

const RegisterScreen = ({ navigation }: Props): React.JSX.Element => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>FitConnect</Text>
        <Text style={styles.subtitle}>Register Screen</Text>
        <Text style={styles.hint}>Replace with Figma UI</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate(Routes.Auth.LOGIN)}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[4],
  },
  title: {
    ...TextPresets.h1,
    color: Colors.brand.primary,
    marginBottom: Spacing[2],
  },
  subtitle: {
    ...TextPresets.h3,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  hint: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    marginBottom: Spacing[6],
  },
  button: {
    backgroundColor: Colors.brand.secondary,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: 12,
  },
  buttonText: {
    ...TextPresets.button,
    color: Colors.white,
  },
});
