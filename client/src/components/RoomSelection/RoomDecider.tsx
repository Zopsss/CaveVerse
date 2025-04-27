import { useAppSelector } from "../../app/hooks";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const RoomDecider = ({
    setShowPublicRoom,
    setShowCreateOrJoinCustomRoom,
}: {
    setShowPublicRoom: React.Dispatch<React.SetStateAction<boolean>>;
    setShowCreateOrJoinCustomRoom: React.Dispatch<
        React.SetStateAction<boolean>
    >;
}) => {
    const isLoading = useAppSelector((state) => state.room.isLoading);

    if (isLoading) {
        return (
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">
                        Connecting to the server
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Skeleton className="h-10 rounded-lg animate-pulse" />
                    <Skeleton className="h-10 rounded-lg animate-pulse" />
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">
                        Welcome to CaveVerse
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <Button
                        className="w-full cursor-pointer"
                        onClick={() => {
                            setShowPublicRoom(true);
                            setShowCreateOrJoinCustomRoom(false);
                        }}
                    >
                        Join Public Room
                    </Button>
                    <Button
                        className="w-full cursor-pointer"
                        onClick={() => {
                            setShowCreateOrJoinCustomRoom(true);
                            setShowPublicRoom(false);
                        }}
                    >
                        Join/Create Custom Room
                    </Button>
                </CardContent>
            </Card>
        </>
    );
};

export default RoomDecider;
