import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type CourseView = "coordinator" | "instructor";

interface CourseViewState {
  activeView: CourseView;
}

const initialState: CourseViewState = {
  activeView: "coordinator",
};

const courseViewSlice = createSlice({
  name: "courseView",
  initialState,
  reducers: {
    setCourseView(state, action: PayloadAction<CourseView>) {
      state.activeView = action.payload;
    },
  },
});

export const { setCourseView } = courseViewSlice.actions;
export default courseViewSlice.reducer;
