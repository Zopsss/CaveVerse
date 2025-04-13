import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
    roomJoined: false,
    availableRooms: new Array<{
        roomName: string;
        roomId: string;
        hasPassword: boolean;
    }>(),
};

const roomSlice = createSlice({
    name: "room",
    initialState,
    reducers: {
        setRoomJoined: (state, action: PayloadAction<boolean>) => {
            state.roomJoined = action.payload;
        },
        addAvailableRooms: (
            state,
            action: PayloadAction<{
                roomName: string;
                roomId: string;
                hasPassword: boolean;
            }>
        ) => {
            state.availableRooms.push(action.payload);
        },
        removeFromAvailableRooms: (state, action: PayloadAction<string>) => {
            state.availableRooms = state.availableRooms.filter(
                (room) => room.roomId !== action.payload
            );
        },
    },
});

export const { setRoomJoined, addAvailableRooms, removeFromAvailableRooms } =
    roomSlice.actions;

export default roomSlice.reducer;
