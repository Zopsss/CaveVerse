import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const FullScreenPlayer = ({
    username,
    stream,
    setIsFullScreen,
}: {
    username: string;
    stream: MediaStream;
    setIsFullScreen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
        }
    }, [stream]);
    return (
        <div className="absolute w-screen h-screen flex items-center justify-center bg-black/50">
            <div className="relative flex flex-col items-center justify-center gap-2 bg-white w-[70%] py-3 px-5 rounded-sm drop-shadow-lg animate-fade-in-scale">
                <div className="flex items-center justify-center text-nowrap w-full mb-1">
                    <h1 className="font-semibold text-lg w-full text-center">
                        {username}'s Screen
                    </h1>
                    <div className="flex items-center justify-end">
                        <div className="hover:outline hover:bg-zinc-50 rounded-sm">
                            <X
                                className="cursor-pointer text-gray-700"
                                onClick={() => setIsFullScreen(false)}
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <video
                        controls
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className={`rounded-sm`}
                    />
                </div>
            </div>
        </div>
    );
};

export default FullScreenPlayer;
