import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
    roomJoined: false,
    availableRooms: new Array<{
        roomName: string;
        roomId: string;
        hasPassword: boolean;
    }>(),
    isLoading: true,
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
        setIsLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
    },
});

export const {
    setRoomJoined,
    addAvailableRooms,
    removeFromAvailableRooms,
    setIsLoading,
} = roomSlice.actions;

export default roomSlice.reducer;
