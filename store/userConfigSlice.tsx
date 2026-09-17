import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userData: "",
};

const userConfigSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    userData(state, { payload }) {
      state.userData = payload;
    },
  },
});

export const { userData } = userConfigSlice.actions;

export default userConfigSlice.reducer;
