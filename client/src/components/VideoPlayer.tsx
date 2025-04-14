import { useEffect, useRef } from "react";

interface VideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    stream: MediaProvider;
    className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    stream,
    className,
    ...props
}) => {
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
            {...props}
        />
    );
};
