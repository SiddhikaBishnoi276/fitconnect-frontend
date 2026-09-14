/**
 * FitConnect — UI Slice
 *
 * Global UI state: loading overlays, toast messages.
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  type: ToastType;
  title: string;
  message?: string;
}

interface UiState {
  isGlobalLoading: boolean;
  toast: ToastMessage | null;
}

const initialState: UiState = {
  isGlobalLoading: false,
  toast: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showGlobalLoader: state => {
      state.isGlobalLoading = true;
    },
    hideGlobalLoader: state => {
      state.isGlobalLoading = false;
    },
    showToast: (state, action: PayloadAction<ToastMessage>) => {
      state.toast = action.payload;
    },
    clearToast: state => {
      state.toast = null;
    },
  },
});

export const { showGlobalLoader, hideGlobalLoader, showToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectIsGlobalLoading = (state: { ui: UiState }) => state.ui.isGlobalLoading;
export const selectToast = (state: { ui: UiState }) => state.ui.toast;
