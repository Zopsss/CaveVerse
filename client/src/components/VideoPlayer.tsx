import { useEffect, useRef } from "react";

export const VideoPlayer: React.FC<{
    stream: MediaProvider;
    className?: string;
}> = ({ stream, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`rounded-lg ${className && className}`}
        />
    );
};
