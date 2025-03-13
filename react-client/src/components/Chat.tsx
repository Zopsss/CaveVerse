import { useEffect, useRef } from "react";
import { Input } from "./ui/input";
import SentIcon from "./icons/SentIcon";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { GameScene } from "../game/scenes/GameScene";
import phaserGame from "../game/main";
import { addVideoStream, addPeer } from "../app/features/webRtc/webRtcSlice";
import { setMyStream } from "../app/features/webRtc/webRtcSlice";
import Peer from "peerjs";

const VideoPlayer: React.FC<{ stream: MediaProvider }> = ({ stream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current
                .play()
                .catch((err) => console.error("Error playing video:", err));
        }
    }, [stream]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: "100%", borderRadius: "8px" }}
        />
    );
};

const Chat = () => {
    const dispatch = useAppDispatch();
    const focused = useAppSelector((state) => state.chat.focused);
    const chatMessages = useAppSelector((state) => state.chat.chatMessage);
    // const myPeer = useAppSelector((state) => state.webrtc.myPeer);
    // const streams = useAppSelector((state) => state.webrtc.streams);

    console.log("chatMessages: ", chatMessages);

    const handleSubmit = (e) => {
        e.preventDefault();
        const input = inputRef.current.value;
        if (input.trim() === "") {
            return;
        }
        const gameInstance = phaserGame.scene.keys.GameScene as GameScene;
        gameInstance.addNewMessage(inputRef.current.value);
        inputRef.current.value = "";
    };

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (focused) {
            inputRef.current.focus();
        }
    }, [focused]);

    // console.log("videos: ", streams);

    const { connectedPeers } = useAppSelector((state) => state.webrtc);

    // useEffect(() => {
    //     // Create and initialize Peer instance
    //     const peer = new Peer();

    //     peer.on("open", (id) => {
    //         console.log("My peer ID is:", id);
    //         // Here you would typically join a room or notify your server
    //         // roomJoin(id, roomId);
    //     });

    //     dispatch(setMyPeer(peer));

    //     // Clean up function
    //     return () => {
    //         peer.destroy();
    //     };
    // }, [dispatch]);

    // useEffect(() => {
    //     if (!myPeer) return;

    //     const getMediaStream = async () => {
    //         try {
    //             const stream = await navigator.mediaDevices.getUserMedia({
    //                 audio: true,
    //                 video: true,
    //             });

    //             dispatch(setMyStream(stream));
    //             // dispatch(addVideoStream({ stream }));

    //             console.log("finished setting up getMediaStream in chat");
    //             // Set up the call handler
    //             // myPeer.on("call", (call) => {
    //             //     console.log("Received call from:", call.peer);

    //             //     // Answer the call with our stream
    //             //     call.answer(stream);

    //             //     // Handle the stream from the caller
    //             //     call.on("stream", (userVideoStream) => {
    //             //         console.log("Received stream from caller:", call.peer);
    //             //         dispatch(addVideoStream({ stream: userVideoStream }));
    //             //     });
    //             // });

    //             // Here, you would typically handle user connections
    //             // For example, when a new user joins the room:
    //             // socket.on('user-connected', userId => {
    //             //     dispatch(connectToNewUser(userId));
    //             // });
    //         } catch (error) {
    //             console.error("Error accessing media devices:", error);
    //         }
    //     };

    //     getMediaStream();
    // }, [myPeer, dispatch]);

    return (
        <>
            <div className="absolute left-0 w-[200px] h-[200px] object-cover">
                {/* <video ref={currentPlayerVideoRef} />
                <video ref={remotePlayerVideoRef} /> */}
                {/* {connectedPeers.map((peer, index) => {
                    return <VideoPlayer key={index} stream={peer.stream} />;
                })} */}
                {/* {streams.map((stream, index) => (
                    <div key={index} className="video-container">
                        <video
                            ref={(node) => {
                                if (node) {
                                    node.srcObject = stream;
                                    node.play().catch((error) => {
                                        console.error(
                                            "Error playing video:",
                                            error
                                        );
                                    });
                                }
                            }}
                            muted={stream === myStream} // Mute our own video
                            autoPlay
                        />
                    </div>
                ))} */}
            </div>
            <div className="absolute right-0 w-72 lg:w-96 h-screen rounded-sm border bg-indigo-950 border-indigo-500 text-white flex flex-col px-2">
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
