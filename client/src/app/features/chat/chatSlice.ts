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
            console.log("action: ", action.payload);
            state.officeChatMessages = [...action.payload];
            console.log("new chatMessage: ", state.officeChatMessages);
        },
        clearOfficeChat: (state) => {
            state.officeChatMessages = [];
            console.log("chat cleared: ", state.officeChatMessages);
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
            console.log("action: ", action.payload);
            state.globalChatMessages = [...action.payload];
            console.log("new chatMessage: ", state.globalChatMessages);
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
