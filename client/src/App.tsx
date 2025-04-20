import Chat from "./components/Chat";
import { useAppSelector } from "./app/hooks";
import RoomSelection from "./components/RoomSelection/RoomSelection";
import ScreenShare from "./components/ScreenShare";
import { useState } from "react";
import FloatingActions from "./components/FloatingActions";
import { AnimatePresence } from "framer-motion";
import VideoCall from "./components/VideoCall";

function App() {
    const roomJoined = useAppSelector((state) => state.room.roomJoined);
    const showOfficeChat = useAppSelector((state) => state.chat.showOfficeChat);
    const [screenDialogOpen, setScreenDialogOpen] = useState(false);

    return (
        <>
            {!roomJoined && <RoomSelection />}
            {roomJoined && (
                <>
                    <Chat />
                    <VideoCall />
                    <AnimatePresence mode="wait">
                        <FloatingActions
                            key="floating-buttons"
                            isInsideOffice={showOfficeChat}
                            setScreenDialogOpen={setScreenDialogOpen}
                        />
                    </AnimatePresence>
                </>
            )}

            {showOfficeChat && (
                <>
                    <ScreenShare
                        screenDialogOpen={screenDialogOpen}
                        setScreenDialogOpen={setScreenDialogOpen}
                    />
                </>
            )}
        </>
    );
}

export default App;
