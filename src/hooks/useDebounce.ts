/**
 * FitConnect — useDebounce Hook
 *
 * Delays updating a value until after a specified delay.
 * Useful for search inputs to avoid excessive API calls.
 *
 * Usage:
 *   const debouncedQuery = useDebounce(searchQuery, 500);
 */

import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
