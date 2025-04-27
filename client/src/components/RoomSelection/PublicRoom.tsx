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
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "../ui/carousel";
import phaserGame from "../../game/main";
import { ArrowLeft, LoaderIcon } from "lucide-react";
import { useAppSelector } from "../../app/hooks";

const PublicRoom = ({
    setShowPublicRoom,
    setShowCreateOrJoinCustomRoom,
}: {
    setShowPublicRoom: React.Dispatch<React.SetStateAction<boolean>>;
    setShowCreateOrJoinCustomRoom: React.Dispatch<
        React.SetStateAction<boolean>
    >;
}) => {
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap;
    const [api, setApi] = useState<CarouselApi>();
    const [username, setUsername] = useState<string>();
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

    const handlePublicRoomJoin = (e) => {
        e.preventDefault();
        const selectedCharacter = getSelectedCharacter();
        console.log(selectedCharacter);

        bootstrap.network
            .joinOrCreatePublicRoom(username, selectedCharacter)
            .then(() => {
                bootstrap.launchGame();
            });
    };

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="relative text-2xl flex items-center justify-start gap-2">
                    <ArrowLeft
                        className="cursor-pointer text-zinc-500"
                        onClick={() => {
                            setShowCreateOrJoinCustomRoom(false);
                            setShowPublicRoom(false);
                        }}
                    />
                    Join Public Room
                </CardTitle>
                <CardDescription>
                    Public rooms are for meeting new people and getting
                    familiarized with the website.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid place-items-center">
                    <Carousel
                        setApi={setApi}
                        opts={{ loop: true }}
                        className="w-[60%]"
                    >
                        <CarouselContent>
                            <CarouselItem>
                                <div className="flex items-center justify-center bg-zinc-200 p-3 rounded-md">
                                    <img
                                        src="assets/characters/single/Nancy_idle_anim_20.png"
                                        alt="Nancy"
                                        width={50}
                                        height={50}
                                    />
                                </div>
                            </CarouselItem>
                            <CarouselItem>
                                <div className="flex items-center justify-center bg-zinc-200 p-3 rounded-md">
                                    <img
                                        src="assets/characters/single/Ash_idle_anim_20.png"
                                        alt="Ash"
                                        width={50}
                                        height={50}
                                    />
                                </div>
                            </CarouselItem>
                            <CarouselItem>
                                <div className="flex items-center justify-center bg-zinc-200 p-3 rounded-md">
                                    <img
                                        src="assets/characters/single/Lucy_idle_anim_20.png"
                                        alt="Lucy"
                                        width={50}
                                        height={50}
                                    />
                                </div>
                            </CarouselItem>
                            <CarouselItem>
                                <div className="flex items-center justify-center bg-zinc-200 p-3 rounded-md">
                                    <img
                                        src="assets/characters/single/Adam_idle_anim_20.png"
                                        alt="Adam"
                                        width={50}
                                        height={50}
                                    />
                                </div>
                            </CarouselItem>
                        </CarouselContent>
                        <CarouselPrevious className="cursor-pointer" />
                        <CarouselNext className="cursor-pointer" />
                    </Carousel>
                </div>
                <form className="grid gap-2" onSubmit={handlePublicRoomJoin}>
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
            </CardContent>
        </Card>
    );
};

export default PublicRoom;
