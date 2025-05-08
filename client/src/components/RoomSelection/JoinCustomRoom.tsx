import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Bootstrap } from "../../game/scenes/Bootstrap";
import { Button } from "../ui/button";
import { ArrowLeft, LoaderIcon, OctagonAlert } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import phaserGame from "../../game/main";
import { useAppSelector } from "../../app/hooks";
import CharacterCarousel from "./CharacterCarousel";
import { VideoPlayer } from "../VideoPlayer";
import videoCalling from "../../game/service/VideoCalling";
import { WebcamButtons } from "../FloatingActions";
import store from "../../app/store";
import { disconnectFromVideoCall } from "../../app/features/webRtc/webcamSlice";
import { setIsLoading } from "../../app/features/room/roomSlice";
import { PasswordInput } from "./PasswordInput";

const JoinCustomRoom = ({
    roomName,
    roomId,
    roomHasPassword,
    setCarouselApi,
    getSelectedCharacter,
    setShowCreateOrJoinCustomRoom,
    setShowJoinRoom,
}: {
    roomName: string;
    roomId: string;
    roomHasPassword: boolean;
    setCarouselApi: () => void;
    getSelectedCharacter: () => "nancy" | "ash" | "lucy" | "adam";
    setShowCreateOrJoinCustomRoom: React.Dispatch<
        React.SetStateAction<boolean>
    >;
    setShowJoinRoom: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap;
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [alert, setAlert] = useState<string | null>(null);
    const isLoading = useAppSelector((state) => state.room.isLoading);
    const myWebcamStream = useAppSelector(
        (state) => state.webcam.myWebcamStream
    );

    const handleRoomJoin = (e) => {
        e.preventDefault();

        const character = getSelectedCharacter();
        bootstrap.network
            .joinCustomRoom(username.trim(), roomId, password, character)
            .then(() => {
                bootstrap.launchGame();
            })
            .catch((e) => {
                setAlert("Incorrect password");
                store.dispatch(setIsLoading(false));
            });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="relative text-2xl text-center">
                    <ArrowLeft
                        className="cursor-pointer text-zinc-500 absolute left-0"
                        onClick={() => {
                            setShowCreateOrJoinCustomRoom(true);
                            setShowJoinRoom(false);
                            {
                                myWebcamStream &&
                                    store.dispatch(disconnectFromVideoCall());
                            }
                        }}
                    />
                    Join {roomName}
                </CardTitle>
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
                    <form className="grid gap-2" onSubmit={handleRoomJoin}>
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
                        {roomHasPassword && (
                            <>
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    value={password}
                                    alert={alert}
                                    setAlert={setAlert}
                                    setPassword={setPassword}
                                />

                                {alert && (
                                    <h1 className="flex items-center gap-2 text-xs font-semibold text-red-500 mt-1 mb-2">
                                        <OctagonAlert size={17} />
                                        {alert}
                                    </h1>
                                )}
                            </>
                        )}
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

export default JoinCustomRoom;
