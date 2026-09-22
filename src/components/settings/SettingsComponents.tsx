import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppTextInput } from '@components/index';
import { Colors, Spacing, TextPresets, BorderRadius } from '@theme/index';

// ------------------------------------------------------------------
// 1. SettingsSection
// ------------------------------------------------------------------
interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.sectionCard}>
        {children}
      </View>
    </View>
  );
};

// ------------------------------------------------------------------
// 2. SettingsInput
// ------------------------------------------------------------------
interface SettingsInputProps extends React.ComponentProps<typeof AppTextInput> {
  label: string;
  error?: string;
}

export const SettingsInput: React.FC<SettingsInputProps> = ({ label, error, ...props }) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <AppTextInput 
        {...props} 
        style={[styles.inputBox, props.style]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

// ------------------------------------------------------------------
// 3. DietSelector
// ------------------------------------------------------------------
interface DietOption {
  id: string;
  label: string;
}

interface DietSelectorProps {
  options: DietOption[];
  selectedValue?: string;
  onSelect: (id: string) => void;
  error?: string;
}

export const DietSelector: React.FC<DietSelectorProps> = ({ options, selectedValue, onSelect, error }) => {
  return (
    <View style={styles.dietContainer}>
      <View style={styles.dietRow}>
        {options.map((opt) => {
          const isSelected = selectedValue === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.pill,
                isSelected && styles.pillSelected
              ]}
              onPress={() => onSelect(opt.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.pillText,
                isSelected && styles.pillTextSelected
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

// ------------------------------------------------------------------
// Styles
// ------------------------------------------------------------------
const styles = StyleSheet.create({
  // SettingsSection Styles
  sectionContainer: {
    marginBottom: Spacing[8],
  },
  sectionTitle: {
    ...TextPresets.caption,
    color: Colors.text.secondary,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: Spacing[3],
    marginLeft: Spacing[2],
  },
  sectionCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
  },

  // SettingsInput Styles
  inputContainer: {
    marginBottom: Spacing[4],
  },
  inputLabel: {
    ...TextPresets.caption,
    color: Colors.text.primary,
    fontWeight: 'bold',
    marginBottom: Spacing[2],
  },
  inputBox: {
    backgroundColor: Colors.background.tertiary,
    borderWidth: 0,
  },

  // DietSelector Styles
  dietContainer: {
    marginVertical: Spacing[2],
  },
  dietRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  pill: {
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: '#CCFF00', // Lime green
  },
  pillText: {
    ...TextPresets.body,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: '#000000',
  },

  // Shared
  errorText: {
    ...TextPresets.caption,
    color: Colors.status.error,
    marginTop: Spacing[1],
  }
});

