import phaserGame from "../../../game/main";
import { sanitizeUserIdForScreenSharing } from "../../../lib/utils";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MediaConnection } from "peerjs";
import { GameScene } from "../../../game/scenes/GameScene";

interface ScreenSharingState {
    playerNameMap: Map<string, string>;
    peerStreams: Map<
        string,
        { call: MediaConnection; stream: MediaStream; username: string }
    >;
    myScreenStream: MediaStream;
}

const initialState: ScreenSharingState = {
    playerNameMap: new Map(),
    peerStreams: new Map(),
    myScreenStream: null,
};

const screenReducer = createSlice({
    name: "screen-sharing",
    initialState,
    reducers: {
        /** For screen sharing */
        setMyScreenStream: (state, action: PayloadAction<MediaStream>) => {
            state.myScreenStream = action.payload;
        },
        addScreenStream: (
            state,
            action: PayloadAction<{
                peerId: string;
                call: MediaConnection;
                userStream: MediaStream;
            }>
        ) => {
            const { peerId, call, userStream: stream } = action.payload;
            const username = state.playerNameMap.get(peerId);
            state.peerStreams.set(peerId, { call, stream, username });
        },
        /** disconnect remote player when he leaves the office. */
        disconnectUserForScreenSharing: (
            state,
            action: PayloadAction<string>
        ) => {
            const sanitizedId = sanitizeUserIdForScreenSharing(action.payload);

            const peer = state.peerStreams.get(sanitizedId);
            peer.call.close();
            state.peerStreams.delete(sanitizedId);
        },
        /**
         * disconnect all the connected peers with current player
         * and stops his stream when he leaves the office.
         */
        removeAllPeerConnectionsForScreenSharing: (state) => {
            if (state.myScreenStream) {
                const tracks = state.myScreenStream.getTracks();
                tracks.forEach((track) => track.stop());
                state.myScreenStream = null;
            }

            state.peerStreams.forEach((peer) => {
                peer.call.close();
            });

            state.peerStreams.clear();
        },
        stopScreenSharing: (state) => {
            const tracks = state.myScreenStream.getTracks();
            tracks.forEach((track) => {
                track.stop();
            });
            state.myScreenStream = null;
            const gameInstance = phaserGame.scene.keys.GameScene as GameScene;
            gameInstance.playerStoppedScreenSharing();
        },

        /** For playerNameMap */
        // currently this map is maintained office-wise,
        // it will contain peerId-username of only players which are present in the current office.
        // TODO: make this Map global, so it will store peerId-username of all players present in the game instead of following office-wise approach.
        setPlayerNameMap: (
            state,
            action: PayloadAction<{ peerId: string; username: string }>
        ) => {
            state.playerNameMap.set(
                action.payload.peerId,
                action.payload.username
            );
        },
        removePlayerNameMap: (state, action: PayloadAction<string>) => {
            state.playerNameMap.delete(action.payload);
        },
        clearPlayerNameMap: (state) => {
            state.playerNameMap.clear();
        },
    },
});

export const {
    setMyScreenStream,
    addScreenStream,
    disconnectUserForScreenSharing,
    removeAllPeerConnectionsForScreenSharing,
    stopScreenSharing,
    setPlayerNameMap,
    removePlayerNameMap,
    clearPlayerNameMap,
} = screenReducer.actions;

export default screenReducer.reducer;
