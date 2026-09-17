import React, { useState } from 'react';
import type { TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { Colors, Spacing, TextPresets, BorderRadius } from '@theme/index';

interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
}

export const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  error,
  helperText,
  isPassword = false,
  style,
  containerStyle,
  inputContainerStyle,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(isPassword);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[TextPresets.label, styles.label]}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          isFocused ? styles.inputFocused : undefined,
          error ? styles.inputError : undefined,
          inputContainerStyle,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.text.tertiary}
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
        
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setIsSecure(!isSecure)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Text style={{ fontSize: 16 }}>{isSecure ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={[TextPresets.caption, styles.errorText]}>{error}</Text>
      ) : helperText ? (
        <Text style={[TextPresets.caption, styles.helperText]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing[3.5], // ~14px spacing
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6, // 6px tight responsive connection
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#161B26', // Deep blue-dark
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.input, // 12px
    paddingHorizontal: Spacing[4],
  },
  inputFocused: {
    borderColor: Colors.border.focus, // Lime accent
  },
  inputError: {
    borderColor: Colors.status.error,
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontFamily: TextPresets.body.fontFamily,
    fontSize: 15,
    height: '100%',
  },
  eyeIcon: {
    marginLeft: Spacing[2],
  },
  errorText: {
    color: Colors.status.error,
    marginTop: 4,
    fontSize: 12,
  },
  helperText: {
    color: '#94A3B8', // Slate-gray
    marginTop: 5,
    fontSize: 12,
    lineHeight: 16,
  },
});
