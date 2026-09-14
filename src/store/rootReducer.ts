/**
 * FitConnect — Root Reducer
 *
 * Combines all slices into a single reducer.
 * Add new slices here.
 */

import { combineReducers } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import userReducer from './slices/userSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  user: userReducer,
  // Add new slices below:
  // feed: feedReducer,
  // sessions: sessionsReducer,
  // trainers: trainersReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
