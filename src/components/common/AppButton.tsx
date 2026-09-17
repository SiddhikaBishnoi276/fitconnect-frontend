import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Spacing, Layout, TextPresets, BorderRadius } from '@theme/index';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return Colors.background.tertiary;
    switch (variant) {
      case 'primary': return Colors.brand.primary;
      case 'secondary': return Colors.background.secondary;
      case 'outline': return 'transparent';
      case 'text': return 'transparent';
      default: return Colors.brand.primary;
    }
  };

  const getBorderColor = () => {
    if (disabled) return 'transparent';
    if (variant === 'outline') return Colors.border.primary;
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return Colors.text.tertiary;
    switch (variant) {
      case 'primary': return Colors.text.inverse;
      case 'secondary': return Colors.text.primary;
      case 'outline': return Colors.text.primary;
      case 'text': return Colors.brand.primary;
      default: return Colors.text.inverse;
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'small': return 36;
      case 'medium': return 44;
      case 'large': return Layout.buttonHeight;
      default: return Layout.buttonHeight;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
          height: getHeight(),
          opacity: disabled ? 0.7 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text style={[TextPresets.button, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
  },
});
