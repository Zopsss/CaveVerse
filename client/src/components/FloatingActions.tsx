import store from "../app/store";
import { useAppSelector } from "../app/hooks";
import { Button } from "./ui/button";
import { Camera, CameraOff, Mic, MicOff, ScreenShare } from "lucide-react";
import { toggleMic, toggleWebcam } from "../app/features/webRtc/webcamSlice";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import phaserGame from "../game/main";
import { GameScene } from "../game/scenes/GameScene";
import { toast } from "sonner";

const FloatingActions = ({
    setScreenDialogOpen,
}: {
    setScreenDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    const myWebcamStream = useAppSelector(
        (state) => state.webcam.myWebcamStream
    );
    const isWebcamOn = useAppSelector((state) => state.webcam.isWebcamOn);
    const isMicOn = useAppSelector((state) => state.webcam.isMicOn);

    return (
        <motion.div
            key="media-bar"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{
                duration: 0.6,
                ease: [0.25, 0.8, 0.25, 1],
                delay: 0.3,
            }}
            className="absolute bottom-7 left-[40%] p-4 flex gap-4 bg-[#121214]/50 backdrop-blur-xs shadow-black/30 shadow-lg rounded-lg"
        >
            <TooltipProvider>
                {/* Screen Sharing */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            className="cursor-pointer "
                            onClick={() => {
                                setScreenDialogOpen(true);
                            }}
                        >
                            <ScreenShare />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-black">Screen Sharing</p>
                    </TooltipContent>
                </Tooltip>

                {myWebcamStream ? (
                    // Player has given access to his webcam
                    <>
                        {/* Webcam */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="cursor-pointer transition-all ease-in-out"
                                    onClick={() => {
                                        store.dispatch(toggleWebcam());
                                    }}
                                >
                                    <AnimatePresence
                                        mode="wait"
                                        initial={false}
                                    >
                                        {isWebcamOn ? (
                                            <motion.div
                                                key="webcam"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Camera />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="mic-off"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <CameraOff />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-black">
                                    {isWebcamOn
                                        ? "Turn off camera"
                                        : "Turn on camera"}
                                </p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Mic */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="cursor-pointer transition-all ease-in-out"
                                    onClick={() => {
                                        store.dispatch(toggleMic());
                                    }}
                                >
                                    <AnimatePresence
                                        mode="wait"
                                        initial={false}
                                    >
                                        {isMicOn ? (
                                            <motion.div
                                                key="mic"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <Mic />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="mic-off"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <MicOff />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-black">
                                    {isMicOn ? "Turn off mic" : "Turn on mic"}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </>
                ) : (
                    // Player has not given access to his webcam
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                className="cursor-pointer transition-all ease-in-out"
                                onClick={async () => {
                                    const gameInstance = phaserGame.scene.keys
                                        .GameScene as GameScene;
                                    await gameInstance.network.startWebcam();
                                    toast(
                                        <div className="font-semibold">
                                            Started Webcam
                                        </div>
                                    );
                                }}
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key="mic-off"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <CameraOff />
                                    </motion.div>
                                </AnimatePresence>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-black">
                                {isWebcamOn
                                    ? "Turn off camera"
                                    : "Turn on camera"}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </TooltipProvider>
        </motion.div>
    );
};

export default FloatingActions;
