import { useState } from "react";
import RoomDecider from "./RoomDecider";
import PublicRoom from "./PublicRoom";
import JoinOrCreateCustomRoom from "./JoinOrCreateCustomRoom";
import { CarouselApi } from "../ui/carousel";

const RoomSelection = () => {
    const [showPublicRoom, setShowPublicRoom] = useState(false);
    const [showCreateOrJoinCustomRoom, setShowCreateOrJoinCustomRoom] =
        useState(false);
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();

    const getSelectedCharacter = () => {
        switch (carouselApi.selectedScrollSnap()) {
            case 0:
                return "nancy";
            case 1:
                return "ash";
            case 2:
                return "lucy";
            case 3:
                return "adam";
        }
    };

    return (
        <div className="w-screen h-screen bg-zinc-50 absolute left-0 top-0 flex flex-col gap-2 items-center justify-center">
            {showPublicRoom ? (
                <PublicRoom
                    setCarouselApi={setCarouselApi as () => void}
                    getSelectedCharacter={getSelectedCharacter}
                    setShowCreateOrJoinCustomRoom={
                        setShowCreateOrJoinCustomRoom
                    }
                    setShowPublicRoom={setShowPublicRoom}
                />
            ) : showCreateOrJoinCustomRoom ? (
                <JoinOrCreateCustomRoom
                    setCarouselApi={setCarouselApi as () => void}
                    getSelectedCharacter={getSelectedCharacter}
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
