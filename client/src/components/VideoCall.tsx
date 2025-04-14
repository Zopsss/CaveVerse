import { useAppSelector } from "../app/hooks";
import { VideoPlayer } from "./VideoPlayer";

const VideoCall = () => {
    const myWebcamStream = useAppSelector(
        (state) => state.webcam.myWebcamStream
    );
    const peerStreams = useAppSelector((state) => state.webcam.peerStreams);

    return (
        <div className="absolute left-[35px] top-[10px] h-screen flex flex-col flex-wrap gap-2">
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
                    />
                );
            })}
        </div>
    );
};

export default VideoCall;
