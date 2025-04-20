import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatMessageType {
    username: string;
    message: string;
    type: "PLAYER_JOINED" | "PLAYER_LEFT" | "REGULAR_MESSAGE";
}

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        officeChatMessages: new Array<ChatMessageType>(),
        globalChatMessages: new Array<ChatMessageType>(),
        focused: false,
        showOfficeChat: false,
    },
    reducers: {
        /* For office specific chat messages */
        pushNewOfficeMessage: (
            state,
            action: PayloadAction<ChatMessageType>
        ) => {
            state.officeChatMessages.push(action.payload);
        },
        addOfficeChat: (state, action: PayloadAction<ChatMessageType[]>) => {
            state.officeChatMessages = [...action.payload];
        },
        clearOfficeChat: (state) => {
            state.officeChatMessages = [];
        },
        setShowOfficeChat: (state, action: PayloadAction<boolean>) => {
            state.showOfficeChat = action.payload;
        },

        /* For global chat messages */
        pushNewGlobalMessage: (
            state,
            action: PayloadAction<ChatMessageType>
        ) => {
            state.globalChatMessages.push(action.payload);
        },
        addGlobalChat: (state, action: PayloadAction<ChatMessageType[]>) => {
            state.globalChatMessages = [...action.payload];
        },
    },
});

export const {
    pushNewOfficeMessage,
    clearOfficeChat,
    addOfficeChat,
    setShowOfficeChat,
    pushNewGlobalMessage,
    addGlobalChat,
} = chatSlice.actions;

export default chatSlice.reducer;
