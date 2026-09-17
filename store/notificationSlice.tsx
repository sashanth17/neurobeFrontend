import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notification',
  initialState: { applicationCount: -1 }, // -1 = not overridden, use API value
  reducers: {
    clearApplicationCount: (state) => {
      state.applicationCount = 0;
    },
    resetApplicationCount: (state) => {
      state.applicationCount = -1;
    },
  },
});

export const { clearApplicationCount, resetApplicationCount } = notificationSlice.actions;
export default notificationSlice.reducer;
