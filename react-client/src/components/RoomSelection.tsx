import phaserGame from "../game/main";
import { Input } from "./ui/input";
import { Bootstrap } from "../game/scenes/Bootstrap";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { useAppSelector } from "../app/hooks";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "./ui/carousel";
import { type CarouselApi } from "./ui/carousel";

const RoomSelection = () => {
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap;
    const [selectedCharacter, setSelectedCharacter] = useState("nancy");
    const [api, setApi] = useState<CarouselApi>();
    const [username2, setUsername2] = useState("");
    const [username3, setUsername3] = useState("");
    const [username4, setUsername4] = useState("");
    const [roomName, setRoomName] = useState("");
    const [roomPassword, setRoomPassword] = useState<string>();
    const [roomId, setRoomId] = useState("");
    const [roomPassword2, setRoomPassword2] = useState<string>();

    const availableRooms = useAppSelector((state) => state.room.availableRooms);

    const handlePublicRoomJoin = (e) => {
        e.preventDefault();
        console.log(selectedCharacter);

        bootstrap.network
            .joinOrCreatePublicRoom(username2, selectedCharacter)
            .then(() => {
                bootstrap.launchGame();
            });
    };

    const handlePrivateRoomCreate = (e) => {
        e.preventDefault();

        bootstrap.network
            .createPrivateRoom(
                username3,
                roomName,
                roomPassword,
                selectedCharacter
            )
            .then(() => {
                bootstrap.launchGame();
            });
    };

    const handlePrivateRoomJoin = (e) => {
        e.preventDefault();

        bootstrap.network
            .joinPrivateRoom(
                username4,
                roomId,
                roomPassword2,
                selectedCharacter
            )
            .then(() => {
                bootstrap.launchGame();
            });
    };

    useEffect(() => {
        if (api) {
            api.on("select", () => {
                switch (api.selectedScrollSnap()) {
                    case 0:
                        setSelectedCharacter("nancy");
                        break;
                    case 1:
                        setSelectedCharacter("ash");
                        break;
                    case 2:
                        setSelectedCharacter("lucy");
                        break;
                    case 3:
                        setSelectedCharacter("adam");
                        break;
                }
            });
        }
    }, [api]);

    return (
        <div className="w-screen h-screen bg-amber-200 absolute left-0 top-0 flex flex-col gap-2 items-center justify-center">
            <Carousel setApi={setApi} opts={{ loop: true }}>
                <CarouselContent>
                    <CarouselItem>
                        <div className="w-full flex items-center justify-center bg-amber-500 p-3 rounded-md">
                            <img
                                src="assets/characters/single/Nancy_idle_anim_20.png"
                                alt="Nancy"
                            />
                        </div>
                    </CarouselItem>
                    <CarouselItem>
                        <div className="w-full flex items-center justify-center bg-amber-500 p-3 rounded-md">
                            <img
                                src="assets/characters/single/Ash_idle_anim_20.png"
                                alt="Ash"
                            />
                        </div>
                    </CarouselItem>
                    <CarouselItem>
                        <div className="w-full flex items-center justify-center bg-amber-500 p-3 rounded-md">
                            <img
                                src="assets/characters/single/Lucy_idle_anim_20.png"
                                alt="Lucy"
                            />
                        </div>
                    </CarouselItem>
                    <CarouselItem>
                        <div className="w-full flex items-center justify-center bg-amber-500 p-3 rounded-md">
                            <img
                                src="assets/characters/single/Adam_idle_anim_20.png"
                                alt="Adam"
                            />
                        </div>
                    </CarouselItem>
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
            <h1>Public Lobby:</h1>
            <form
                className="bg-white drop-shadow-md rounded-md p-5 flex flex-col gap-1 items-center justify-center"
                onSubmit={handlePublicRoomJoin}
            >
                <Input
                    required
                    placeholder="Username"
                    value={username2}
                    onChange={(e) => setUsername2(e.target.value)}
                />
                <Button variant="secondary" className="cursor-pointer">
                    Join or Create
                </Button>
            </form>
            <h1>Create Private Lobby:</h1>
            <form
                className="bg-white drop-shadow-md rounded-md p-5 flex flex-col gap-1 items-center justify-center"
                onSubmit={handlePrivateRoomCreate}
            >
                <Input
                    required
                    placeholder="Username"
                    value={username3}
                    onChange={(e) => setUsername3(e.target.value)}
                />
                <Input
                    required
                    placeholder="Room Name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                />
                <Input
                    placeholder="Room Password"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                />
                <Button variant="secondary" className="cursor-pointer">
                    Create Private Room
                </Button>
            </form>
            <h1>Join Private Lobby: </h1>
            <form
                className="bg-white drop-shadow-md rounded-md p-5 flex flex-col gap-1 items-center justify-center"
                onSubmit={handlePrivateRoomJoin}
            >
                <Input
                    required
                    placeholder="Username"
                    value={username4}
                    onChange={(e) => setUsername4(e.target.value)}
                />
                <Input
                    required
                    placeholder="Room Id"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                />
                <Input
                    placeholder="Password"
                    value={roomPassword2}
                    onChange={(e) => setRoomPassword2(e.target.value)}
                />
                <Button variant="secondary" className="cursor-pointer">
                    Join
                </Button>
            </form>
            {availableRooms.map((room, _) => {
                return (
                    <div key={_}>
                        <span>Room Name: {room.roomName}</span>{" "}
                        <span>Room Id: {room.roomId}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default RoomSelection;
