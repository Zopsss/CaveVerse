import Chat from "./components/Chat";
import { useAppSelector } from "./app/hooks";
import RoomSelection from "./components/RoomSelection";

function App() {
    const showChat = useAppSelector((state) => state.chat.showChat);
    const roomJoined = useAppSelector((state) => state.room.roomJoined);

    return (
        <>
            {!roomJoined && <RoomSelection />}
            {showChat && <Chat />}
        </>
    );
}

export default App;
