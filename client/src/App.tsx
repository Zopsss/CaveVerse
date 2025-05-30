import Chat from "./components/Chat";
import { useAppSelector } from "./app/hooks";
import RoomSelection from "./components/RoomSelection/RoomSelection";
import ScreenShare from "./components/ScreenShare";
import { useState } from "react";
import FloatingActions from "./components/FloatingActions";
import { AnimatePresence } from "framer-motion";
import VideoCall from "./components/VideoCall";
import CornerActionButtons from "./game/CornerActionButtons";

function App() {
    const roomJoined = useAppSelector((state) => state.room.roomJoined);
    const showOfficeChat = useAppSelector((state) => state.chat.showOfficeChat);
    const [screenDialogOpen, setScreenDialogOpen] = useState(false);
    const [showChat, setShowChat] = useState(true);

    return (
        <>
            {!roomJoined && (
                <>
                    <RoomSelection />
                </>
            )}
            {roomJoined && (
                <>
                    {showChat && <Chat setShowChat={setShowChat} />}
                    <VideoCall />
                    <AnimatePresence mode="wait">
                        <FloatingActions
                            key="floating-buttons"
                            isInsideOffice={showOfficeChat}
                            showChat={showChat}
                            setScreenDialogOpen={setScreenDialogOpen}
                            setShowChat={setShowChat}
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
            <CornerActionButtons isInGame={roomJoined} />
        </>
    );
}

export default App;
