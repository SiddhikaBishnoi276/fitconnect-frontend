/**
 * FitConnect — Typography System
 *
 * Font sizes, weights, and line heights follow a
 * consistent modular scale.
 *
 * Font: Inter (bundled in src/assets/fonts/)
 */

import { Platform } from 'react-native';

export const FontFamily = {
  regular: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular' })!,
  medium: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' })!,
  semiBold: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' })!,
  bold: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold' })!,
  extraBold: Platform.select({ ios: 'Inter-ExtraBold', android: 'Inter-ExtraBold' })!,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 40,
  display: 48,
} as const;

export const LineHeight = {
  xs: 16,
  sm: 20,
  base: 22,
  md: 26,
  lg: 28,
  xl: 32,
  '2xl': 36,
  '3xl': 42,
  '4xl': 48,
  display: 56,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

/** Pre-composed text style presets — use these in StyleSheet */
export const TextPresets = {
  display: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize.display,
    lineHeight: LineHeight.display,
    fontWeight: FontWeight.extraBold,
  },
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['3xl'],
    lineHeight: LineHeight['3xl'],
    fontWeight: FontWeight.bold,
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    lineHeight: LineHeight['2xl'],
    fontWeight: FontWeight.bold,
  },
  h3: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xl,
    lineHeight: LineHeight.xl,
    fontWeight: FontWeight.semiBold,
  },
  h4: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
    fontWeight: FontWeight.semiBold,
  },
  bodyLarge: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: FontWeight.regular,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    lineHeight: LineHeight.base,
    fontWeight: FontWeight.regular,
  },
  bodySmall: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: FontWeight.regular,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    lineHeight: LineHeight.xs,
    fontWeight: FontWeight.regular,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: FontWeight.medium,
  },
  button: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    lineHeight: LineHeight.base,
    fontWeight: FontWeight.semiBold,
  },
} as const;
