import Chat from "./components/Chat";
import { useAppSelector } from "./app/hooks";
import RoomSelection from "./components/RoomSelection";
import ScreenShare from "./components/ScreenShare";

function App() {
    const roomJoined = useAppSelector((state) => state.room.roomJoined);
    const showOfficeChat = useAppSelector((state) => state.chat.showOfficeChat);

    return (
        <>
            {!roomJoined && <RoomSelection />}
            {roomJoined && <Chat />}
            {showOfficeChat && <ScreenShare />}
        </>
    );
}

export default App;
