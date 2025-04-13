import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// if we decide to use redux instead of raw html for video calling service, then use this slice for it.
// might need to rename slice.
const webcamSlice = createSlice({
    name: "webcam",
    initialState: {
        myWebcamStream: new MediaStream(),
        isWebcamOn: false,
        isMicOn: false,
    },
    reducers: {
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
    },
});

export const {
    setMyWebcamStream,
    toggleWebcam,
    toggleMic,
    turnOffWebcamAndMic,
} = webcamSlice.actions;

export default webcamSlice.reducer;
