import { combineReducers, configureStore } from '@reduxjs/toolkit';
import themeConfigSlice from './themeConfigSlice';
import userConfigSlice from './userConfigSlice';
import notificationSlice from './notificationSlice';
import courseViewSlice from './courseViewSlice';

const rootReducer = combineReducers({
    themeConfig: themeConfigSlice,
    userConfig: userConfigSlice,
    notification: notificationSlice,
    courseView: courseViewSlice,
});

export default configureStore({
    reducer: rootReducer,
});

export type IRootState = ReturnType<typeof rootReducer>;
