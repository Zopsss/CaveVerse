import { ScreenShareIcon, ScreenShareOff } from "lucide-react";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import phaserGame from "../game/main";
import { GameScene } from "../game/scenes/GameScene";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { toast } from "sonner";
import { useAppSelector } from "../app/hooks";
import { VideoPlayer } from "./VideoPlayer";
import FullScreenPlayer from "./FullScreenPlayer";
import store from "../app/store";
import { stopScreenSharing } from "../app/features/webRtc/screenSlice";

const ScreenShare = () => {
    const peerStreams = useAppSelector((state) => state.screen.peerStreams);
    const myStream = useAppSelector((state) => state.screen.myScreenStream);
    const [open, setOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [streamToDisplay, setStreamToDisplay] = useState<MediaStream>();
    const [username, setUsername] = useState("");
    const [key, setKey] = useState("");

    const handleScreenSharing = async () => {
        const gameInstance = phaserGame.scene.keys.GameScene as GameScene;
        await gameInstance.handleScreenSharing();
        setOpen(false);
        toast(<div className="font-semibold">Started Screen Sharing</div>);
    };

    const handleStopScreenSharing = () => {
        store.dispatch(stopScreenSharing());
        toast(<div className="font-semibold">Stopped Screen Sharing</div>);
    };

    const handleFullScreenVideo = (
        stream: MediaStream,
        username: string,
        key: string
    ) => {
        setIsFullScreen(true);
        setStreamToDisplay(stream);
        setUsername(username);
        setKey(key);
    };

    // checking if the current full screened video player left the room
    // if he did then close that full screened video.
    useEffect(() => {
        if (isFullScreen) {
            if (!peerStreams.has(key)) {
                setIsFullScreen(false);
            }
        }
    }, [peerStreams]);

    if (isFullScreen) {
        return (
            <FullScreenPlayer
                username={username}
                stream={streamToDisplay}
                setIsFullScreen={setIsFullScreen}
            />
        );
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        className="cursor-pointer absolute left-7 bottom-7"
                    >
                        Screen Sharing
                    </Button>
                </DialogTrigger>
                <DialogContent className="h-[50%] flex flex-col justify-between">
                    <DialogHeader className="mt-3">
                        <DialogTitle className="text-center">
                            Shared Screens
                        </DialogTitle>
                    </DialogHeader>
                    <div
                        className={`grid ${
                            peerStreams.size > 0 || myStream
                                ? "grid-cols-2 auto-rows-max"
                                : "text-center place-items-center"
                        } h-full overflow-auto gap-2 mt-2 py-2`}
                    >
                        {peerStreams.size > 0 || myStream ? (
                            <>
                                {myStream && (
                                    <Card className="">
                                        <CardHeader>
                                            <CardTitle className="truncate">
                                                Your Screen
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="px-3">
                                            <VideoPlayer stream={myStream} />
                                        </CardContent>
                                    </Card>
                                )}
                                {Array.from(peerStreams.entries()).map(
                                    ([key, value]) => {
                                        return (
                                            <Card
                                                className="cursor-pointer"
                                                key={key}
                                                onClick={() =>
                                                    handleFullScreenVideo(
                                                        value.stream,
                                                        value.username,
                                                        key
                                                    )
                                                }
                                            >
                                                <CardHeader>
                                                    <CardTitle className="truncate">
                                                        {value.username}'s
                                                        Screen
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="px-3">
                                                    <VideoPlayer
                                                        stream={value.stream}
                                                    />
                                                </CardContent>
                                            </Card>
                                        );
                                    }
                                )}
                            </>
                        ) : (
                            <div>
                                <h1 className="font-semibold text-lg">
                                    No screen is being streamed {">_<"}
                                </h1>
                                <h1 className="font-semibold text-sm mt-2">
                                    Start streaming your screen now, by clicking
                                    below button 👇🏻
                                </h1>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="sm:justify-center">
                        {myStream ? (
                            <Button
                                className="cursor-pointer"
                                onClick={handleStopScreenSharing}
                            >
                                Stop Screen Sharing
                                <ScreenShareOff />
                            </Button>
                        ) : (
                            <Button
                                className="cursor-pointer"
                                onClick={handleScreenSharing}
                            >
                                Share Your Screen
                                <ScreenShareIcon />
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Toaster position="bottom-center" closeButton />
        </>
    );
};

export default ScreenShare;
