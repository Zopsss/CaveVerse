import Chat from "./components/Chat";
import { useAppSelector } from "./app/hooks";

function App() {
    const showChat = useAppSelector((state) => state.chat.showChat);

    return <>{showChat && <Chat />}</>;
}

export default App;
