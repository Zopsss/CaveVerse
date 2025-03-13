import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatMessageType {
    username: string;
    message: string;
    type: "PLAYER_JOINED" | "PLAYER_LEFT" | "REGULAR_MESSAGE";
}

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        chatMessage: new Array<ChatMessageType>(),
        focused: false,
        showChat: false,
    },
    reducers: {
        pushNewMessage: (state, action: PayloadAction<ChatMessageType>) => {
            state.chatMessage.push(action.payload);
        },
        playerJoinedMessage: (state, action: PayloadAction<string>) => {
            state.chatMessage.push({
                username: action.payload,
                message: "Joined main office room chat",
                type: "PLAYER_JOINED",
            });
        },
        playerLeftMessage: (state, action: PayloadAction<string>) => {
            state.chatMessage.push({
                username: action.payload,
                message: "Left main office room chat",
                type: "PLAYER_LEFT",
            });
        },
        clearChat: (state) => {
            state.chatMessage = [];
            console.log("chat cleared: ", state.chatMessage);
        },
        addChat: (state, action: PayloadAction<ChatMessageType[]>) => {
            console.log("action: ", action.payload);
            state.chatMessage = [...action.payload];
            console.log("new chatMessage: ", state.chatMessage);
        },
        setShowChat: (state, action: PayloadAction<boolean>) => {
            state.showChat = action.payload;
        },
    },
});

export const {
    pushNewMessage,
    playerJoinedMessage,
    playerLeftMessage,
    clearChat,
    addChat,
    setShowChat,
} = chatSlice.actions;

export default chatSlice.reducer;
