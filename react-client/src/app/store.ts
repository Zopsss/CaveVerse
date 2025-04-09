import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import chatReducer from "./features/chat/chatSlice";
import roomReducer from "./features/room/roomSlice";
import screenReducer from "./features/webRtc/screenSlice";
import { enableMapSet } from "immer";

// Error: [Immer] The plugin for 'MapSet' has not been loaded into Immer.
// To enable the plugin, import and call `enableMapSet()` when initializing your application.
enableMapSet();

const store = configureStore({
    reducer: {
        chat: chatReducer,
        room: roomReducer,
        screen: screenReducer,
    },

    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

// Define the AppThunk type
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>;

export default store;
