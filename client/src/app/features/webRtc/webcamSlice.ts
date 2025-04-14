import { sanitizeUserIdForVideoCalling } from "../../../lib/utils";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MediaConnection } from "peerjs";

interface InitialState {
    myWebcamStream: MediaStream;
    peerStreams: Map<string, { call: MediaConnection; stream: MediaStream }>;
    isWebcamOn: boolean;
    isMicOn: boolean;
}

const initialState: InitialState = {
    myWebcamStream: null,
    peerStreams: new Map(),
    isWebcamOn: false,
    isMicOn: false,
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

            peer.call.close();
            state.peerStreams.delete(sanitizedId);
        },
        /**
         * disconnect all the connected peers with current player
         * and stops his stream when he leaves the office.
         */
        removeAllPeerConnectionsForVideoCalling: (state) => {
            if (state.myWebcamStream) {
                state.myWebcamStream.getVideoTracks()[0].enabled = false;
                state.myWebcamStream.getAudioTracks()[0].enabled = false;
                state.isWebcamOn = false;
                state.isMicOn = false;
            }

            state.peerStreams.forEach((peer) => {
                peer.call.close();
            });

            state.peerStreams.clear();
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
} = webcamSlice.actions;

export default webcamSlice.reducer;
