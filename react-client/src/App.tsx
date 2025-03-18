import Chat from "./components/Chat";
import { useAppSelector } from "./app/hooks";
import RoomSelection from "./components/RoomSelection";

function App() {
    const roomJoined = useAppSelector((state) => state.room.roomJoined);

    return (
        <>
            {!roomJoined && <RoomSelection />}
            {roomJoined && <Chat />}
        </>
    );
}

export default App;
