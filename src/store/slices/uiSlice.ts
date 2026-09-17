import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

interface UiState {
  unreadNotificationCount: number;
}

const initialState: UiState = {
  unreadNotificationCount: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setUnreadNotificationCount: (state, action: PayloadAction<number>) => {
      state.unreadNotificationCount = action.payload;
    },
    decrementUnreadCount: (state) => {
      if (state.unreadNotificationCount > 0) {
        state.unreadNotificationCount -= 1;
      }
    },
    clearUnreadCount: (state) => {
      state.unreadNotificationCount = 0;
    }
  },
});

export const { setUnreadNotificationCount, decrementUnreadCount, clearUnreadCount } = uiSlice.actions;

export const selectUnreadNotificationCount = (state: { ui: UiState }) => state.ui.unreadNotificationCount;

export default uiSlice.reducer;
