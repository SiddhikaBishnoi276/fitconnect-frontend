/**
 * FitConnect — Spacing Scale
 *
 * Based on a 4pt grid system.
 * Usage: Spacing[4] = 16px, Spacing[6] = 24px
 */

export const Spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

/** Common layout values */
export const Layout = {
  screenPaddingH: Spacing[4],   // 16 — horizontal screen padding
  screenPaddingV: Spacing[6],   // 24 — vertical screen padding
  cardPadding: Spacing[4],      // 16
  inputHeight: 52,
  buttonHeight: 52,
  tabBarHeight: 60,
  headerHeight: 56,
  bottomSafeArea: 34,
} as const;
