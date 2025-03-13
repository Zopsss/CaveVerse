"use client";

import { useRef, useState } from "react";
import { IRefPhaserGame, PhaserGame } from "./game/PhaserGame";
import Chat from "@/components/Chat";
import { useAppSelector } from "@/lib/store/hooks";

function App() {
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const showChat = useAppSelector((state) => state.chat.showChat);

    return (
        <div
            id="app"
            className="flex gap-1 items-center justify-center h-screen bg-black"
        >
            <PhaserGame ref={phaserRef} />
            {showChat && <Chat />}
        </div>
    );
}

export default App;
