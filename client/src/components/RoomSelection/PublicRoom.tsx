import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Bootstrap } from "../../game/scenes/Bootstrap";
import { useState } from "react";
import { Button } from "../ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import phaserGame from "../../game/main";
import { ArrowLeft, LoaderIcon } from "lucide-react";
import { VideoPlayer } from "../VideoPlayer";
import videoCalling from "../../game/service/VideoCalling";
import store from "../../app/store";
import { disconnectFromVideoCall } from "../../app/features/webRtc/webcamSlice";
import { WebcamButtons } from "../FloatingActions";
import CharacterCarousel from "./CharacterCarousel";
import { useAppSelector } from "../../app/hooks";

const PublicRoom = ({
    setCarouselApi,
    getSelectedCharacter,
    setShowPublicRoom,
    setShowCreateOrJoinCustomRoom,
}: {
    setCarouselApi: () => void;
    getSelectedCharacter: () => "nancy" | "ash" | "lucy" | "adam";
    setShowPublicRoom: React.Dispatch<React.SetStateAction<boolean>>;
    setShowCreateOrJoinCustomRoom: React.Dispatch<
        React.SetStateAction<boolean>
    >;
}) => {
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap;
    const [username, setUsername] = useState("");
    const isLoading = useAppSelector((state) => state.room.isLoading);
    const myWebcamStream = useAppSelector(
        (state) => state.webcam.myWebcamStream
    );

    const handlePublicRoomJoin = (e) => {
        e.preventDefault();
        const selectedCharacter = getSelectedCharacter();

        bootstrap.network
            .joinOrCreatePublicRoom(username, selectedCharacter)
            .then(() => {
                bootstrap.launchGame();
            });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="relative text-2xl text-center">
                    <ArrowLeft
                        className="cursor-pointer text-zinc-500 absolute left-0"
                        onClick={() => {
                            setShowCreateOrJoinCustomRoom(false);
                            setShowPublicRoom(false);
                            {
                                myWebcamStream &&
                                    store.dispatch(disconnectFromVideoCall());
                            }
                        }}
                    />
                    Join Public Room
                </CardTitle>
                <CardDescription className="text-center">
                    Public rooms are for meeting new people and getting
                    familiarized with the website.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4 items-center">
                {myWebcamStream && (
                    <Card className="flex items-center justify-center">
                        <CardContent>
                            <VideoPlayer
                                stream={myWebcamStream}
                                className="w-48"
                                muted
                            />
                        </CardContent>
                    </Card>
                )}
                <div>
                    <CharacterCarousel setApi={setCarouselApi} />
                    <form
                        className="grid gap-2"
                        onSubmit={handlePublicRoomJoin}
                    >
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            required
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                            }}
                        />
                        <Button
                            className="w-full cursor-pointer mt-2"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    Joining Room{" "}
                                    <LoaderIcon className="ml-2 h-4 w-4 animate-spin" />
                                </>
                            ) : (
                                "Join Room"
                            )}
                        </Button>
                    </form>
                    {!myWebcamStream ? (
                        <Button
                            className="w-full cursor-pointer mt-2"
                            variant="outline"
                            onClick={async () => {
                                await videoCalling.getUserMedia();
                            }}
                        >
                            Start Webcam
                        </Button>
                    ) : (
                        <div className="flex gap-3 items-center justify-center mt-2">
                            <WebcamButtons shouldShowDisconnectButton={false} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default PublicRoom;
