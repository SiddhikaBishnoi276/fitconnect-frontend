/**
 * FitConnect — Formatters
 *
 * Pure functions to format dates, numbers, and strings for display.
 */

import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

// ─── Date Formatters ──────────────────────────────────────────────────────────

/** Format a date as "2 hours ago", "Yesterday", etc. */
export const formatRelativeTime = (date: string | Date): string => {
  const d = new Date(date);
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd MMM yyyy');
};

/** Format a date for display (e.g., "14 Sep 2026") */
export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'dd MMM yyyy');
};

/** Format time (e.g., "10:30 AM") */
export const formatTime = (date: string | Date): string => {
  return format(new Date(date), 'hh:mm a');
};

// ─── Number Formatters ────────────────────────────────────────────────────────

/** Format currency (INR) */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/** Format large numbers (e.g., 1200 → "1.2K") */
export const formatCompactNumber = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

/** Parse numeric strings (e.g., from Postgres) to numbers safely */
export const parseNumeric = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// ─── String Formatters ────────────────────────────────────────────────────────

/** Capitalize first letter of each word */
export const toTitleCase = (str: string): string => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

/** Truncate text to N characters */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
};

/** Get initials from a full name (e.g., "John Doe" → "JD") */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};
