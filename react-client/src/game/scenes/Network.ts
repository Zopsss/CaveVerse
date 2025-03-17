import { Client, Room } from "colyseus.js";
import { BACKEND_URL } from "../backend";
import store from "../../app/store";
import {
    addAvailableRooms,
    removeFromAvailableRooms,
} from "../../app/features/room/roomSlice";

export default class Network {
    client: Client;
    room!: Room;
    lobby!: Room;

    constructor() {
        this.client = new Client(BACKEND_URL);

        this.joinLobbyRoom();
    }

    async joinLobbyRoom() {
        this.lobby = await this.client.joinOrCreate("LOBBY_ROOM");

        this.lobby.onMessage("rooms", (rooms) => {
            console.log("all rooms: ", rooms);
            rooms.forEach((room) => {
                store.dispatch(
                    addAvailableRooms({
                        roomId: room.roomId,
                        roomName: room.metadata.name,
                    })
                );
            });
        });

        this.lobby.onMessage("+", ([roomId, room]) => {
            console.log("new room: ", roomId, room);
            console.log("metadata: ", room.metadata);
            // Avoid duplicate room entries
            const existingRooms = store.getState().room.availableRooms;
            if (!existingRooms.some((r) => r.roomId === roomId)) {
                store.dispatch(
                    addAvailableRooms({ roomId, roomName: room.metadata.name })
                );
            }
        });

        this.lobby.onMessage("-", (roomId) => {
            console.log("room removed: ", roomId);
            store.dispatch(removeFromAvailableRooms(roomId));
        });
    }

    async joinOrCreatePublicRoom() {
        this.room = await this.client.joinOrCreate("PUBLIC_ROOM", {});
        this.lobby.leave();
    }

    async createPrivateRoom(name: string, password: string | null) {
        this.room = await this.client.create("PRIVATE_ROOM", {
            name,
            password,
        });
        this.lobby.leave();
    }

    async joinPrivateRoom(roomId: string, password: string | null) {
        console.log("room Id: ", roomId);
        this.room = await this.client.joinById(roomId, { password });
        this.lobby.leave();
    }
}
