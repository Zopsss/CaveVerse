import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Bootstrap } from "../../game/scenes/Bootstrap";
import { Button } from "../ui/button";
import { ArrowLeft, LoaderIcon } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "../ui/carousel";
import phaserGame from "../../game/main";
import { useAppSelector } from "../../app/hooks";

const JoinCustomRoom = ({
    roomName,
    roomId,
    roomHasPassowrd,
    setShowCreateOrJoinCustomRoom,
    setShowJoinRoom,
}: {
    roomName: string;
    roomId: string;
    roomHasPassowrd: boolean;
    setShowCreateOrJoinCustomRoom: React.Dispatch<
        React.SetStateAction<boolean>
    >;
    setShowJoinRoom: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap;
    const [api, setApi] = useState<CarouselApi>();
    const [username, setUsername] = useState<string>();
    const [password, setPassword] = useState<string>(null);
    const isLoading = useAppSelector((state) => state.room.isLoading);

    const getSelectedCharacter = () => {
        switch (api.selectedScrollSnap()) {
            case 0:
                return "nancy";
            case 1:
                return "ash";
            case 2:
                return "lucy";
            case 3:
                return "adam";
        }
    };

    const handleRoomJoin = (e) => {
        e.preventDefault();

        const character = getSelectedCharacter();
        bootstrap.network
            .joinCustomRoom(username.trim(), roomId, password, character)
            .then(() => {
                bootstrap.launchGame();
            });
    };
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="relative text-2xl text-center">
                    <ArrowLeft
                        className="cursor-pointer text-zinc-500 absolute left-0"
                        onClick={() => {
                            setShowCreateOrJoinCustomRoom(true);
                            setShowJoinRoom(false);
                        }}
                    />
                    Join {roomName}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div className="grid place-items-center">
                    <Carousel
                        setApi={setApi}
                        opts={{ loop: true }}
                        className="w-[70%]"
                    >
                        <CarouselContent>
                            <CarouselItem>
                                <div className="flex items-center justify-center bg-zinc-200 p-3 rounded-md">
                                    <img
                                        src="assets/characters/single/Nancy_idle_anim_20.png"
                                        alt="Nancy"
                                        width={100}
                                        height={100}
                                    />
                                </div>
                            </CarouselItem>
                            <CarouselItem>
                                <div className="flex items-center justify-center bg-zinc-200 p-3 rounded-md">
                                    <img
                                        src="assets/characters/single/Ash_idle_anim_20.png"
                                        alt="Ash"
                                        width={100}
                                        height={100}
                                    />
                                </div>
                            </CarouselItem>
                            <CarouselItem>
                                <div className="flex items-center justify-center bg-zinc-200 p-3 rounded-md">
                                    <img
                                        src="assets/characters/single/Lucy_idle_anim_20.png"
                                        alt="Lucy"
                                        width={100}
                                        height={100}
                                    />
                                </div>
                            </CarouselItem>
                            <CarouselItem>
                                <div className="flex items-center justify-center bg-zinc-200 p-3 rounded-md">
                                    <img
                                        src="assets/characters/single/Adam_idle_anim_20.png"
                                        alt="Adam"
                                        width={100}
                                        height={100}
                                    />
                                </div>
                            </CarouselItem>
                        </CarouselContent>
                        <CarouselPrevious className="cursor-pointer" />
                        <CarouselNext className="cursor-pointer" />
                    </Carousel>
                </div>
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
                    {roomHasPassowrd && (
                        <>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                }}
                            />
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
            </CardContent>
        </Card>
    );
};

export default JoinCustomRoom;
