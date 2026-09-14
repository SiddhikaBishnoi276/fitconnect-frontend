/**
 * FitConnect — Shadow System
 *
 * Cross-platform shadow presets (iOS uses shadow*, Android uses elevation).
 */

import { Platform } from 'react-native';

const createShadow = (
  elevation: number,
  color = '#000000',
  opacity = 0.3,
  radius = 8,
  offsetY = 4,
) => ({
  ...Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation,
    },
  }),
});

export const Shadows = {
  none: {},
  xs: createShadow(2, '#000000', 0.15, 2, 1),
  sm: createShadow(4, '#000000', 0.2, 4, 2),
  md: createShadow(8, '#000000', 0.25, 8, 4),
  lg: createShadow(16, '#000000', 0.3, 12, 6),
  xl: createShadow(24, '#000000', 0.35, 16, 8),
  card: createShadow(6, '#00D4AA', 0.1, 8, 3),  // Brand glow
  button: createShadow(8, '#00D4AA', 0.25, 12, 4),
} as const;
