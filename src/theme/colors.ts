/**
 * FitConnect — App Color Palette
 *
 * All colors used across the app come from here.
 * NEVER use hex codes directly in components — always import from theme.
 */

export const Colors = {
  // ─── Brand ──────────────────────────────────────────────────
  brand: {
    primary: '#00D4AA',    // FitConnect teal-green
    secondary: '#7B61FF',  // Purple accent
    tertiary: '#FF6B6B',   // Coral energy
    accent: '#C4F135',     // Lime accent
  },

  // ─── Background ─────────────────────────────────────────────
  background: {
    primary: '#0A0E1A',    // Deep dark navy
    secondary: '#111827',  // Card background
    tertiary: '#1C2233',   // Input / elevated
    overlay: 'rgba(0, 0, 0, 0.6)',
    welcome: '#0F1419',    // Deep charcoal-navy for Welcome Screen
  },

  // ─── Text ───────────────────────────────────────────────────
  text: {
    primary: '#FFFFFF',
    secondary: '#9CA3AF',
    tertiary: '#6B7280',
    inverse: '#0A0E1A',
    link: '#00D4AA',
  },

  // ─── Status ──────────────────────────────────────────────────
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // ─── Border ──────────────────────────────────────────────────
  border: {
    primary: '#1F2937',
    secondary: '#374151',
    focus: '#00D4AA',
  },

  // ─── Gradient stops (for LinearGradient) ────────────────────
  gradient: {
    brand: ['#00D4AA', '#7B61FF'] as const,
    energy: ['#FF6B6B', '#FF9A3C'] as const,
    dark: ['#0A0E1A', '#111827'] as const,
    card: ['#1C2233', '#111827'] as const,
  },

  // ─── Misc ────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = typeof Colors;
