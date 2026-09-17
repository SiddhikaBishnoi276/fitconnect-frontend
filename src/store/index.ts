/**
 * FitConnect — Redux Store Configuration
 *
 * - Configures Redux Toolkit store
 * - Adds Redux Persist (persists auth slice to AsyncStorage)
 * - Exports typed hooks for use across the app
 */

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import type { Storage } from 'redux-persist';

import { Storage as MMKVStorageWrapper } from '@utils/storage';

import { rootReducer } from './rootReducer';
import type { RootState } from './rootReducer';

// ─── Persist Config ───────────────────────────────────────────────────────────
const reduxStorage: Storage = {
  setItem: (key, value) => {
    MMKVStorageWrapper.setString(key, value);
    return Promise.resolve(true);
  },
  getItem: (key) => {
    const value = MMKVStorageWrapper.getString(key);
    return Promise.resolve(value);
  },
  removeItem: (key) => {
    MMKVStorageWrapper.delete(key);
    return Promise.resolve();
  },
};

const persistConfig = {
  key: 'fitconnect-root',
  version: 1,
  storage: reduxStorage,
  whitelist: ['auth'], // Only persist auth slice; everything else resets on app restart
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ─── Store ────────────────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Required by redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__, // Enable Redux DevTools in dev mode only
});

export const persistor = persistStore(store);

// ─── Types ────────────────────────────────────────────────────────────────────
export type AppDispatch = typeof store.dispatch;
export type { RootState };
