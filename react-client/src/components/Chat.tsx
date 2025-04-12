import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import SentIcon from "./icons/SentIcon";
import { useAppSelector } from "../app/hooks";
import { GameScene } from "../game/scenes/GameScene";
import phaserGame from "../game/main";
import { Button } from "./ui/button";
import { MessageCircle, X } from "lucide-react";

const Chat = () => {
    const focused = useAppSelector((state) => state.chat.focused);
    const [activeChat, setActiveChat] = useState<"Global" | "OfficeSpecific">(
        "Global"
    );
    const [showChat, setShowChat] = useState(true);
    const officeChatMessages = useAppSelector(
        (state) => state.chat.officeChatMessages
    );
    const globalChatMessages = useAppSelector(
        (state) => state.chat.globalChatMessages
    );
    const showOfficeChat = useAppSelector((state) => state.chat.showOfficeChat);

    const handleSubmit = (e) => {
        e.preventDefault();
        const input = inputRef.current.value;
        if (input.trim() === "") {
            return;
        }

        const gameInstance = phaserGame.scene.keys.GameScene as GameScene;
        if (activeChat === "Global") {
            gameInstance.addNewGlobalChatMessage(inputRef.current.value);
        } else {
            gameInstance.addNewMessage(inputRef.current.value);
        }

        inputRef.current.value = "";
    };

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (focused) {
            inputRef.current.focus();
        }
    }, [focused]);

    useEffect(() => {
        if (showOfficeChat) {
            setActiveChat("OfficeSpecific");
        } else {
            setActiveChat("Global");
        }
    }, [showOfficeChat]);

    const buttonCss =
        "font-semibold text-lg text-center grow cursor-default rounded-xs bg-indigo-800/30 text-indigo-50 cursor-pointer hover:bg-white hover:text-indigo-500";
    const activeChatCss = "bg-indigo-500 text-indigo-50";

    if (!showChat) {
        return (
            <div className="absolute bottom-10 right-7">
                <Button
                    variant="ghost"
                    className="w-14 p-7 bg-white rounded-full cursor-pointer shadow-black/30 shadow-lg"
                    onClick={() => setShowChat(true)}
                >
                    <MessageCircle />
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="absolute right-0 w-fit lg:w-96 h-screen rounded-sm border bg-indigo-950 border-indigo-500 text-white flex flex-col px-2">
                <div className="flex items-center justify-around gap-1">
                    {showOfficeChat ? (
                        <div className="flex items-center justify-between gap-1 w-full mt-3">
                            <Button
                                className={`${buttonCss} ${
                                    activeChat === "Global" && activeChatCss
                                }`}
                                onClick={() => setActiveChat("Global")}
                            >
                                Global Chat
                            </Button>
                            <Button
                                className={`${buttonCss} ${
                                    activeChat === "OfficeSpecific" &&
                                    activeChatCss
                                }`}
                                onClick={() => setActiveChat("OfficeSpecific")}
                            >
                                Office Chat
                            </Button>
                            <Button
                                variant="secondary"
                                className="rounded-xs cursor-pointer"
                                onClick={() => {
                                    setShowChat(false);
                                }}
                            >
                                <X />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-1 w-full mt-3">
                            <Button className="font-semibold text-lg text-center grow cursor-default rounded-xs bg-indigo-500 text-indigo-50 hover:bg-indigo-500">
                                Global Chat
                            </Button>
                            <Button
                                variant="secondary"
                                className="rounded-xs cursor-pointer"
                                onClick={() => {
                                    setShowChat(false);
                                }}
                            >
                                <X />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex-1 w-full flex flex-col items-start justify-end mx-1 my-2 rounded-sm overflow-y-auto">
                    <div className="overflow-auto w-full">
                        {/* {Array.from({ length: 50 }).map((_, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                            <p className="font-semibold">Nency:</p>
                            <p>Hello Madam jiii {i}</p>
                        </div>
                    ))} */}

                        {activeChat === "Global"
                            ? globalChatMessages.map((msg, i) => {
                                  return (
                                      <div
                                          key={i}
                                          className={`flex gap-2 text-sm ${
                                              msg.type === "REGULAR_MESSAGE"
                                                  ? "text-white"
                                                  : msg.type === "PLAYER_JOINED"
                                                  ? "text-green-400"
                                                  : "text-red-400"
                                          }`}
                                      >
                                          <p className="font-semibold">
                                              {msg.username}:
                                          </p>
                                          <p>{msg.message}</p>
                                      </div>
                                  );
                              })
                            : officeChatMessages.map((msg, i) => {
                                  return (
                                      <div
                                          key={i}
                                          className={`flex gap-2 text-sm ${
                                              msg.type === "REGULAR_MESSAGE"
                                                  ? "text-white"
                                                  : msg.type === "PLAYER_JOINED"
                                                  ? "text-green-400"
                                                  : "text-red-400"
                                          }`}
                                      >
                                          <p className="font-semibold">
                                              {msg.username}:
                                          </p>
                                          <p>{msg.message}</p>
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
                            const gameInstance = phaserGame.scene.keys
                                .GameScene as GameScene;
                            gameInstance.disableKeys();
                        }}
                        onBlur={() => {
                            const gameInstance = phaserGame.scene.keys
                                .GameScene as GameScene;
                            gameInstance.enableKeys();
                        }}
                        ref={inputRef}
                    />
                    <button className="absolute right-6" type="submit">
                        <SentIcon />
                    </button>
                </form>
            </div>
        </>
    );
};

export default Chat;
