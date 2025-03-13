import React, { useEffect, useRef } from "react";
import { Input } from "./ui/input";
import SentIcon from "./icons/SentIcon";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setFocused } from "@/lib/store/features/chatSlice";
import { GameScene } from "@/app/game/scenes/GameScene";
import { game } from "@/app/game/PhaserGame";

const Chat = () => {
    const dispatch = useAppDispatch();
    const focused = useAppSelector((state) => state.chat.focused);
    const chatMessages = useAppSelector((state) => state.chat.chatMessage);

    console.log("chatMessages: ", chatMessages);

    const handleSubmit = (e) => {
        e.preventDefault();
        const input = inputRef.current.value;
        if (input.trim() === "") {
            return;
        }
        dispatch(setFocused(false));
        const gameInstance = game.current.scene.keys.GameScene as GameScene;
        gameInstance.addNewMessage(inputRef.current.value);
        inputRef.current.value = "";
    };

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (focused) {
            inputRef.current.focus();
        }
    }, [focused]);

    return (
        <div className="absolute right-0 w-96 h-screen rounded-sm border bg-indigo-950 border-indigo-500 text-white flex flex-col px-2">
            <h1 className="font-semibold text-lg text-center mt-3">
                Main Office
            </h1>
            <div className="flex-1 w-full flex flex-col items-start justify-end mx-1 my-2 rounded-sm overflow-y-auto">
                <div className="overflow-auto w-full">
                    {/* {Array.from({ length: 50 }).map((_, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                            <p className="font-semibold">Nency:</p>
                            <p>Hello Madam jiii {i}</p>
                        </div>
                    ))} */}

                    {chatMessages.map((msg, i) => {
                        return (
                            <div
                                key={i}
                                className={`flex gap-2 text-sm ${
                                    msg.messageType === "REGULAR_MESSAGE"
                                        ? "text-white"
                                        : msg.messageType === "PLAYER_JOINED"
                                        ? "text-green-400"
                                        : "text-zinc-400"
                                }`}
                            >
                                <p className="font-semibold">
                                    {msg.chatMessage.username}:
                                </p>
                                <p>{msg.chatMessage.message}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
            <form
                className="mb-5 w-full flex items-center"
                onSubmit={handleSubmit}
            >
                <Input
                    className="pr-[35px]"
                    placeholder="type here...."
                    onFocus={() => {
                        if (!focused) {
                            dispatch(setFocused(true));
                        }
                    }}
                    onBlur={() => {
                        dispatch(setFocused(false));
                    }}
                    ref={inputRef}
                />
                <button className="absolute right-6" type="submit">
                    <SentIcon />
                </button>
            </form>
        </div>
    );
};

export default Chat;
