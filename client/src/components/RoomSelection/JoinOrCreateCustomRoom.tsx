import { useState } from "react";
import { Button } from "../ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { useAppSelector } from "../../app/hooks";
import CreateCustomRoom from "./CreateCustomRoom";
import { ArrowLeft, LockIcon } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import JoinCustomRoom from "./JoinCustomRoom";

const JoinOrCreateCustomRoom = ({
    setCarouselApi,
    getSelectedCharacter,
    setShowPublicRoom,
    setShowCreateOrJoinCustomRoom,
}: {
    setCarouselApi: () => void;
    getSelectedCharacter: () => "nancy" | "ash" | "lucy" | "adam";
    setShowPublicRoom: React.Dispatch<React.SetStateAction<boolean>>;
    setShowCreateOrJoinCustomRoom: React.Dispatch<
        React.SetStateAction<boolean>
    >;
}) => {
    const availableRooms = useAppSelector((state) => state.room.availableRooms);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [showJoinRoom, setShowJoinRoom] = useState(false);
    const [roomId, setRoomId] = useState<string>();
    const [roomName, setRoomName] = useState<string>();
    const [roomHasPassword, setRoomHasPassword] = useState<boolean>();

    if (showJoinRoom) {
        return (
            <JoinCustomRoom
                roomName={roomName}
                roomId={roomId}
                roomHasPassword={roomHasPassword}
                getSelectedCharacter={getSelectedCharacter}
                setCarouselApi={setCarouselApi}
                setShowCreateOrJoinCustomRoom={setShowCreateOrJoinCustomRoom}
                setShowJoinRoom={setShowJoinRoom}
            />
        );
    }

    if (showCreateRoom) {
        return (
            <CreateCustomRoom
                getSelectedCharacter={getSelectedCharacter}
                setCarouselApi={setCarouselApi}
                setShowCreateOrJoinCustomRoom={setShowCreateOrJoinCustomRoom}
                setShowCreateRoom={setShowCreateRoom}
            />
        );
    }

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="text-2xl relative text-center">
                    <ArrowLeft
                        className="cursor-pointer text-zinc-500 absolute left-0"
                        onClick={() => {
                            setShowCreateOrJoinCustomRoom(false);
                            setShowPublicRoom(false);
                        }}
                    />
                    All the available custom rooms
                </CardTitle>
                <CardDescription className="text-center">
                    Custom rooms can be passwordless too!
                    <br />
                    Rooms with password will have a lock icon next to it.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 w-full">
                {availableRooms.length > 0 ? (
                    <div className="w-full">
                        {/* TODO: Find a way to make table body scrollable */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="font-semibold">
                                            Room Name
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                            Room Id
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {availableRooms.map((room, index) => (
                                        <TableRow
                                            key={room.roomId}
                                            className={`w-full h-fit ${
                                                index % 2
                                                    ? "bg-zinc-100"
                                                    : "bg-white"
                                            }`}
                                        >
                                            <TableCell>
                                                {room.roomName}
                                            </TableCell>
                                            <TableCell>{room.roomId}</TableCell>
                                            <TableCell className="flex items-center justify-end">
                                                <Button
                                                    className="cursor-pointer"
                                                    onClick={() => {
                                                        setRoomId(room.roomId);
                                                        setRoomName(
                                                            room.roomName
                                                        );
                                                        setRoomHasPassword(
                                                            room.hasPassword
                                                        );
                                                        setShowJoinRoom(true);
                                                    }}
                                                >
                                                    {room.hasPassword && (
                                                        <LockIcon />
                                                    )}
                                                    Join
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <Button
                            variant="secondary"
                            className="cursor-pointer mt-5 w-full"
                            onClick={() => setShowCreateRoom(true)}
                        >
                            Create Custom Room
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center flex-col gap-3">
                        <h1 className="text-center font-semibold">
                            Oops! No custom rooms are available,
                            <br /> click below button to create your own custom
                            room 👇🏻
                        </h1>
                        <Button
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => setShowCreateRoom(true)}
                        >
                            Create Custom Room
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default JoinOrCreateCustomRoom;
