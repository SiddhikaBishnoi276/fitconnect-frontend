/**
 * FitConnect — Storage Utility
 *
 * Wrapper over MMKV for synchronous, fast key-value storage.
 * Use this for non-sensitive app data (preferences, cache).
 * For sensitive data (tokens), use react-native-keychain.
 */

import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'fitconnect-storage',
});

export const Storage = {
  /** Store a string value */
  setString: (key: string, value: string): void => {
    storage.set(key, value);
  },

  /** Get a string value */
  getString: (key: string): string | undefined => {
    return storage.getString(key);
  },

  /** Store a boolean value */
  setBool: (key: string, value: boolean): void => {
    storage.set(key, value);
  },

  /** Get a boolean value */
  getBool: (key: string): boolean | undefined => {
    return storage.getBoolean(key);
  },

  /** Store any JSON-serializable object */
  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },

  /** Get and parse a JSON object */
  getObject: <T>(key: string): T | null => {
    const raw = storage.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /** Remove a key */
  delete: (key: string): void => {
    storage.delete(key);
  },

  /** Clear all storage */
  clearAll: (): void => {
    storage.clearAll();
  },

  /** Check if a key exists */
  contains: (key: string): boolean => {
    return storage.contains(key);
  },
};
