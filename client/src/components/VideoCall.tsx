import { useAppSelector } from "../app/hooks";
import { VideoPlayer } from "./VideoPlayer";

const VideoCall = () => {
    const myWebcamStream = useAppSelector(
        (state) => state.webcam.myWebcamStream
    );
    const peerStreams = useAppSelector((state) => state.webcam.peerStreams);
    const isDisconnectedFromVideoCalls = useAppSelector(
        (state) => state.webcam.isDisconnectedFromVideoCalls
    );

    // if user is disconnected from video calls then do not show any webcams
    if (isDisconnectedFromVideoCalls) return;

    return (
        <div className="absolute left-[35px] top-[10px] max-h-screen flex flex-col flex-wrap gap-2">
            {myWebcamStream && (
                <VideoPlayer
                    stream={myWebcamStream}
                    className="w-48 border-2"
                    // muting own video
                    muted
                />
            )}
            {Array.from(peerStreams.entries()).map(([key, value]) => {
                return (
                    <VideoPlayer
                        stream={value.stream}
                        className="w-48 border-2"
                        key={key}
                    />
                );
            })}
        </div>
    );
};

export default VideoCall;
