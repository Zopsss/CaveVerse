import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
    roomJoined: false,
};

const roomSlice = createSlice({
    name: "room",
    initialState,
    reducers: {
        setRoomJoined: (state, action: PayloadAction<boolean>) => {
            state.roomJoined = action.payload;
        },
    },
});

export const { setRoomJoined } = roomSlice.actions;

export default roomSlice.reducer;
