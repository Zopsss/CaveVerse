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
import { ArrowLeft, LoaderIcon, OctagonAlert } from "lucide-react";
import { useAppSelector } from "../../app/hooks";
import { VideoPlayer } from "../VideoPlayer";
import { WebcamButtons } from "../FloatingActions";
import videoCalling from "../../game/service/VideoCalling";
import store from "../../app/store";
import { disconnectFromVideoCall } from "../../app/features/webRtc/webcamSlice";
import CharacterCarousel from "./CharacterCarousel";
import { PasswordInput } from "./PasswordInput";

const CreateCustomRoom = ({
    setCarouselApi,
    getSelectedCharacter,
    setShowCreateOrJoinCustomRoom,
    setShowCreateRoom,
}: {
    setCarouselApi: () => void;
    getSelectedCharacter: () => "nancy" | "ash" | "lucy" | "adam";
    setShowCreateOrJoinCustomRoom: React.Dispatch<
        React.SetStateAction<boolean>
    >;
    setShowCreateRoom: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap;
    const [username, setUsername] = useState("");
    const [roomName, setRoomName] = useState("");
    const [password, setPassword] = useState("");
    const [alert, setAlert] = useState<string | null>(null);
    const isLoading = useAppSelector((state) => state.room.isLoading);
    const myWebcamStream = useAppSelector(
        (state) => state.webcam.myWebcamStream
    );

    const handleRoomCreation = (e) => {
        e.preventDefault();

        const character = getSelectedCharacter();
        const finalPassword = password !== "" ? password : null;

        bootstrap.network
            .createCustomRoom(
                username.trim(),
                roomName.trim(),
                finalPassword,
                character
            )
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
                            setShowCreateOrJoinCustomRoom(true);
                            setShowCreateRoom(false);
                            {
                                myWebcamStream &&
                                    store.dispatch(disconnectFromVideoCall());
                            }
                        }}
                    />
                    Create Custom Room
                </CardTitle>
                <CardDescription className="text-center">
                    Custom rooms can be created with or without password!
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
                    <form className="grid gap-2" onSubmit={handleRoomCreation}>
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="Username"
                            required
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                            }}
                        />
                        <Label htmlFor="roomName">Room name</Label>
                        <Input
                            id="roomName"
                            type="text"
                            placeholder="Nancy's Room"
                            required
                            value={roomName}
                            onChange={(e) => {
                                setRoomName(e.target.value);
                            }}
                        />
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
                        <Button
                            className="w-full cursor-pointer mt-2"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    Creating Room{" "}
                                    <LoaderIcon className="ml-2 h-4 w-4 animate-spin" />
                                </>
                            ) : (
                                "Create Room"
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

export default CreateCustomRoom;
