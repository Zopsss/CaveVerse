import phaserGame from "../game/main";
import { Input } from "./ui/input";
import { Bootstrap } from "../game/scenes/Bootstrap";
import { Button } from "./ui/button";
import { useState } from "react";
import { GameScene } from "@/game/scenes/GameScene";
import { useAppSelector } from "../app/hooks";

const RoomSelection = () => {
    const game = phaserGame.scene.keys.GameScene as GameScene;
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap;
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

        bootstrap.network.joinOrCreatePublicRoom().then(() => {
            game.setUsername(username2);
            bootstrap.launchGame();
        });
    };

    const handlePrivateRoomCreate = (e) => {
        e.preventDefault();

        bootstrap.network.createPrivateRoom(roomName, roomPassword).then(() => {
            game.setUsername(username3);
            bootstrap.launchGame();
        });
    };

    const handlePrivateRoomJoin = (e) => {
        e.preventDefault();

        bootstrap.network.joinPrivateRoom(roomId, roomPassword2).then(() => {
            game.setUsername(username4);
            bootstrap.launchGame();
        });
    };

    return (
        <div className="w-screen h-screen bg-amber-200 absolute left-0 top-0 flex flex-col gap-2 items-center justify-center">
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
