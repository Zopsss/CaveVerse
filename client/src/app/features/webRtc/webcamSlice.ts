import { sanitizeUserIdForVideoCalling } from "../../../lib/utils";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MediaConnection } from "peerjs";

interface InitialState {
    myWebcamStream: MediaStream;
    peerStreams: Map<string, { call: MediaConnection; stream: MediaStream }>;
    isWebcamOn: boolean;
    isMicOn: boolean;
    isDisconnectedFromVideoCalls: boolean;
}

const initialState: InitialState = {
    myWebcamStream: null,
    peerStreams: new Map(),
    isWebcamOn: false,
    isMicOn: false,
    isDisconnectedFromVideoCalls: false,
};

const webcamSlice = createSlice({
    name: "webcam",
    initialState,
    reducers: {
        /* For FloatingActions.tsx */
        setMyWebcamStream: (state, action: PayloadAction<MediaStream>) => {
            state.myWebcamStream = action.payload;
            state.isWebcamOn = true;
            state.isMicOn = true;
            state.isDisconnectedFromVideoCalls = false;
        },
        toggleWebcam: (state) => {
            state.myWebcamStream.getVideoTracks()[0].enabled =
                !state.myWebcamStream.getVideoTracks()[0].enabled;
            state.isWebcamOn = state.myWebcamStream.getVideoTracks()[0].enabled;
        },
        toggleMic: (state) => {
            state.myWebcamStream.getAudioTracks()[0].enabled =
                !state.myWebcamStream.getAudioTracks()[0].enabled;
            state.isMicOn = state.myWebcamStream.getAudioTracks()[0].enabled;
        },
        turnOffWebcamAndMic: (state) => {
            state.myWebcamStream.getVideoTracks()[0].enabled = false;
            state.myWebcamStream.getAudioTracks()[0].enabled = false;
            state.isWebcamOn = false;
            state.isMicOn = false;
        },

        /* For GameScene.tsx */
        addWebcamStream: (
            state,
            action: PayloadAction<{
                peerId: string;
                call: MediaConnection;
                userStream: MediaStream;
            }>
        ) => {
            const { peerId, call, userStream: stream } = action.payload;
            state.peerStreams.set(peerId, { call, stream });
        },
        /** disconnect remote player when he leaves the office. */
        disconnectUserForVideoCalling: (
            state,
            action: PayloadAction<string>
        ) => {
            const sanitizedId = sanitizeUserIdForVideoCalling(action.payload);
            const peer = state.peerStreams.get(sanitizedId);

            if (peer) {
                peer.call.close();
                state.peerStreams.delete(sanitizedId);
            }
        },
        /**
         * Disconnect all the connected peers with current player.
         *
         * Used when player leaves an office.
         */
        removeAllPeerConnectionsForVideoCalling: (state) => {
            state.peerStreams.forEach((peer) => {
                peer.call.close();
            });

            state.peerStreams.clear();
        },
        /**
         * disconnect all the connected peers with current player.
         *
         * Used when player clicks on "Disconnect from video calls" button.
         */
        disconnectFromVideoCall: (state) => {
            if (state.myWebcamStream) {
                const tracks = state.myWebcamStream.getTracks();
                tracks.forEach((track) => track.stop());

                state.myWebcamStream = null;
                state.isWebcamOn = false;
                state.isMicOn = false;
            }

            state.peerStreams.forEach((peer) => {
                peer.call.close();
            });

            state.peerStreams.clear();

            state.isDisconnectedFromVideoCalls = true;
        },
    },
});

export const {
    setMyWebcamStream,
    toggleWebcam,
    toggleMic,
    turnOffWebcamAndMic,
    addWebcamStream,
    disconnectUserForVideoCalling,
    removeAllPeerConnectionsForVideoCalling,
    disconnectFromVideoCall,
} = webcamSlice.actions;

export default webcamSlice.reducer;
