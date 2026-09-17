import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';

interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  isPassword?: boolean;
}

export const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  error,
  helperText,
  isPassword = false,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(isPassword);

  return (
    <View style={styles.container}>
      {label && <Text style={[TextPresets.label, styles.label]}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          isFocused ? styles.inputFocused : undefined,
          error ? styles.inputError : undefined,
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
            {/* Custom eye icon: simple text fallback for now if no vector-icons */}
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
    marginBottom: Spacing[4],
  },
  label: {
    color: Colors.text.primary,
    marginBottom: Spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.inputHeight,
    backgroundColor: Colors.background.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing[4],
  },
  inputFocused: {
    borderColor: Colors.border.focus,
  },
  inputError: {
    borderColor: Colors.status.error,
  },
  input: {
    flex: 1,
    color: Colors.text.primary,
    fontFamily: TextPresets.body.fontFamily,
    fontSize: TextPresets.body.fontSize,
    height: '100%',
  },
  eyeIcon: {
    marginLeft: Spacing[2],
  },
  errorText: {
    color: Colors.status.error,
    marginTop: Spacing[1],
  },
  helperText: {
    color: Colors.text.tertiary,
    marginTop: Spacing[1],
  },
});
