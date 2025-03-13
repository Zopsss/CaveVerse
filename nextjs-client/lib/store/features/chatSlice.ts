// import { phaserGame } from "@/app/game/main";
import { game as game2 } from "@/app/game/PhaserGame";
import { GameScene } from "@/app/game/scenes/GameScene";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Game } from "phaser";

type MessageType = "PLAYER_JOINED" | "PLAYER_LEFT" | "REGULAR_MESSAGE";

interface ChatMessageType {
    username: string;
    message: string;
}

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        chatMessage: new Array<{
            messageType: MessageType;
            chatMessage: ChatMessageType;
        }>(),
        focused: false,
        showChat: false,
    },
    reducers: {
        pushNewMessage: (state, action: PayloadAction<ChatMessageType>) => {
            state.chatMessage.push({
                messageType: "REGULAR_MESSAGE",
                chatMessage: action.payload,
            });
        },
        playerJoinedMessage: (state, action: PayloadAction<string>) => {
            state.chatMessage.push({
                messageType: "PLAYER_JOINED",
                chatMessage: {
                    username: action.payload,
                    message: "Joined main office room chat",
                },
            });
        },
        playerLeftMessage: (state, action: PayloadAction<string>) => {
            state.chatMessage.push({
                messageType: "PLAYER_LEFT",
                chatMessage: {
                    username: action.payload,
                    message: "Left main office room chat",
                },
            });
        },
        setFocused: (state, action: PayloadAction<boolean>) => {
            const game = game2.current.scene.keys.GameScene as GameScene;
            action.payload ? game.disableKeys() : game.enableKeys();
            console.log("action.payload: ", action.payload);
            state.focused = action.payload;
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
    setFocused,
    setShowChat,
} = chatSlice.actions;

export default chatSlice.reducer;
