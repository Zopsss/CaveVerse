import { useState } from "react";
import RoomDecider from "./RoomDecider";
import PublicRoom from "./PublicRoom";
import JoinOrCreateCustomRoom from "./JoinOrCreateCustomRoom";

const RoomSelection = () => {
    const [showPublicRoom, setShowPublicRoom] = useState(false);
    const [showCreateOrJoinCustomRoom, setShowCreateOrJoinCustomRoom] =
        useState(false);

    return (
        <div className="w-screen h-screen bg-zinc-50 absolute left-0 top-0 flex flex-col gap-2 items-center justify-center">
            {showPublicRoom ? (
                <PublicRoom
                    setShowCreateOrJoinCustomRoom={
                        setShowCreateOrJoinCustomRoom
                    }
                    setShowPublicRoom={setShowPublicRoom}
                />
            ) : showCreateOrJoinCustomRoom ? (
                <JoinOrCreateCustomRoom
                    setShowCreateOrJoinCustomRoom={
                        setShowCreateOrJoinCustomRoom
                    }
                    setShowPublicRoom={setShowPublicRoom}
                />
            ) : (
                <RoomDecider
                    setShowCreateOrJoinCustomRoom={
                        setShowCreateOrJoinCustomRoom
                    }
                    setShowPublicRoom={setShowPublicRoom}
                />
            )}
        </div>
    );
};

export default RoomSelection;
