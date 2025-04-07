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
    username: string;
    character: string;

    constructor() {
        this.client = new Client(BACKEND_URL);

        this.joinLobbyRoom();
    }

    async joinLobbyRoom() {
        this.lobby = await this.client.joinOrCreate("LOBBY_ROOM");

        this.lobby.onMessage("rooms", (rooms) => {
            rooms.forEach((room) => {
                // public room is also included so we need to ignore it
                if (room.name === "PUBLIC_ROOM") {
                    return;
                }
                store.dispatch(
                    addAvailableRooms({
                        roomId: room.roomId,
                        roomName: room.metadata.name,
                    })
                );
            });
        });

        this.lobby.onMessage("+", ([roomId, room]) => {
            // public room is also included so we need to ignore it
            if (room.name === "PUBLIC_ROOM") {
                return;
            }
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

    async joinOrCreatePublicRoom(username: string, character: string) {
        this.username = username;
        this.character = character;
        this.room = await this.client.joinOrCreate("PUBLIC_ROOM", {
            username: this.username,
            character: this.character,
        });
        this.lobby.leave();
    }

    async createPrivateRoom(
        username: string,
        name: string,
        password: string | null,
        character: string
    ) {
        this.username = username;
        this.character = character;
        this.room = await this.client.create("PRIVATE_ROOM", {
            name,
            password,
            username: this.username,
        });
        this.lobby.leave();
    }

    async joinPrivateRoom(
        username: string,
        roomId: string,
        password: string | null,
        character: string
    ) {
        this.username = username;
        this.character = character;
        console.log("room Id: ", roomId);
        this.room = await this.client.joinById(roomId, {
            password,
            username: this.username,
        });
        this.lobby.leave();
    }
}
