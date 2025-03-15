import phaserGame from "../game/main";
import { Input } from "./ui/input";
import { Bootstrap } from "../game/scenes/Bootstrap";
import { Button } from "./ui/button";
import { useState } from "react";
import { GameScene } from "@/game/scenes/GameScene";

const RoomSelection = () => {
    const game = phaserGame.scene.keys.GameScene as GameScene;
    const [username, setUsername] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        game.setUsername(username);
        const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap;
        bootstrap.launcGame();
    };

    return (
        <div className="w-screen h-screen bg-amber-200 flex items-center justify-center">
            <form
                className="bg-white drop-shadow-md rounded-md p-5 flex flex-col items-center justify-center"
                onSubmit={handleSubmit}
            >
                <Input
                    required
                    value={username}
                    placeholder="Username"
                    onChange={(e) => setUsername(e.target.value)}
                />
                <Button variant="outline" className="cursor-pointer">
                    Submit
                </Button>
            </form>
        </div>
    );
};

export default RoomSelection;
