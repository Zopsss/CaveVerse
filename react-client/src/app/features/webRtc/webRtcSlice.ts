// Updated webrtcSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Peer, { MediaConnection } from "peerjs";

interface InitialStateType {
    myPeer: Peer;
    myStream: MediaStream | null;
    streams: MediaProvider[];
    connectedPeers: Array<{ userId: string; stream: MediaConnection }>;
}

const initialState: InitialStateType = {
    myPeer: null,
    myStream: null,
    streams: [],
    connectedPeers: new Array<{ userId: string; stream: MediaConnection }>(),
};

const webrtcSlice = createSlice({
    name: "webrtc",
    initialState,
    reducers: {
        setMyPeer: (state, action: PayloadAction<Peer>) => {
            state.myPeer = action.payload;
        },
        setMyStream: (state, action: PayloadAction<MediaStream>) => {
            state.myStream = action.payload;
        },
        stopMyStream: (state) => {
            if (state.myStream) {
                const videoTracks = state.myStream.getVideoTracks();
                const audioTracks = state.myStream.getAudioTracks();

                if (videoTracks.length > 0) {
                    videoTracks[0].enabled = false;
                }

                if (audioTracks.length > 0) {
                    audioTracks[0].enabled = false;
                }
            }
        },
        addVideoStream: (
            state,
            action: PayloadAction<{ userId: string; stream: MediaConnection }>
        ) => {
            state.connectedPeers.push({
                userId: action.payload.userId,
                stream: action.payload.stream,
            });
        },
        addPeer: (
            state,
            action: PayloadAction<{
                userId: string;
                call: MediaConnection;
            }>
        ) => {
            const { userId, call } = action.payload;
            // state.connectedPeers.set(userId, call);
            state.connectedPeers.push({ userId, stream: call });
        },
        deleteVideoStream: (state, action: PayloadAction<string>) => {
            state.connectedPeers = state.connectedPeers.filter(
                (peer) => peer.userId !== action.payload
            );
        },
    },
});

export const { addPeer, addVideoStream, setMyStream, setMyPeer, stopMyStream } =
    webrtcSlice.actions;

export default webrtcSlice.reducer;
