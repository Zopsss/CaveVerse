import { Client, Room } from "colyseus.js";
import { BACKEND_URL } from "../backend";
import { officeNames, sanitizeUserIdForScreenSharing } from "../../lib/utils";
import store from "../../app/store";
import videoCalling from "../service/VideoCalling";
import screenSharing from "../service/ScreenSharing";
import {
    addAvailableRooms,
    removeFromAvailableRooms,
    setIsLoading,
} from "../../app/features/room/roomSlice";
import {
    addGlobalChat,
    addOfficeChat,
    pushNewGlobalMessage,
    pushNewOfficeMessage,
} from "../../app/features/chat/chatSlice";
import {
    disconnectUserForScreenSharing,
    removePlayerNameMap,
    setPlayerNameMap,
} from "../../app/features/webRtc/screenSlice";
import { disconnectUserForVideoCalling } from "../../app/features/webRtc/webcamSlice";
import { Event, phaserEvents } from "../EventBus";

export default class Network {
    private client: Client;
    private room!: Room;
    private lobby!: Room;
    private username: string;
    private character: string;

    constructor() {
        this.client = new Client(BACKEND_URL);
        this.joinLobbyRoom();
    }

    /**
     * Joins default lobby room and gets & handles custom room's data.
     */
    joinLobbyRoom = async () => {
        this.lobby = await this.client.joinOrCreate("LOBBY_ROOM");
        store.dispatch(setIsLoading(false));

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
                        hasPassword: room.metadata.hasPassword,
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
                    addAvailableRooms({
                        roomId,
                        roomName: room.metadata.name,
                        hasPassword: room.metadata.hasPassword,
                    })
                );
            }
        });

        this.lobby.onMessage("-", (roomId) => {
            store.dispatch(removeFromAvailableRooms(roomId));
        });
    };

    /**
     * Handles joining or creating public room.
     *
     * @param username player's username
     * @param character selected avatar
     */
    joinOrCreatePublicRoom = async (username: string, character: string) => {
        store.dispatch(setIsLoading(true));
        const isMicOn = store.getState().webcam.isMicOn;
        const isWebcamOn = store.getState().webcam.isWebcamOn;

        this.username = username;
        this.character = character;
        this.room = await this.client.joinOrCreate("PUBLIC_ROOM", {
            username: this.username,
            character: this.character,
            isMicOn,
            isWebcamOn,
        });
        this.lobby.leave();
        store.dispatch(setIsLoading(false));
    };

    /**
     * Creates custom room.
     *
     * @param username player's username
     * @param roomName room name
     * @param password room password
     * @param character selected avatar
     */
    createCustomRoom = async (
        username: string,
        roomName: string,
        password: string | null,
        character: string
    ) => {
        store.dispatch(setIsLoading(true));

        const isMicOn = store.getState().webcam.isMicOn;
        const isWebcamOn = store.getState().webcam.isWebcamOn;

        this.username = username;
        this.character = character;
        this.room = await this.client.create("PRIVATE_ROOM", {
            name: roomName,
            password,
            username: this.username,
            character,
            isMicOn,
            isWebcamOn,
        });
        this.lobby.leave();
        store.dispatch(setIsLoading(false));
    };

    /**
     * Joins custom room.
     *
     * @param username player's username
     * @param roomId room id
     * @param password room password
     * @param character selected avatar
     */
    joinCustomRoom = async (
        username: string,
        roomId: string,
        password: string | null,
        character: string
    ) => {
        store.dispatch(setIsLoading(true));

        const isMicOn = store.getState().webcam.isMicOn;
        const isWebcamOn = store.getState().webcam.isWebcamOn;

        this.username = username;
        this.character = character;
        this.room = await this.client.joinById(roomId, {
            password,
            username: this.username,
            character,
            isMicOn,
            isWebcamOn,
        });
        this.lobby.leave();
        store.dispatch(setIsLoading(false));
    };

    /**
     * Helper method to get the appropriate state properties for each office
     *
     * @param officeName office's name
     */
    getOfficeData = (officeName: officeNames) => {
        const officeMap = {
            mainOffice: {
                members: this.room.state.mainOfficeMembers,
                chat: this.room.state.mainOfficeChat,
            },
            eastOffice: {
                members: this.room.state.eastOfficeMembers,
                chat: this.room.state.eastOfficeChat,
            },
            westOffice: {
                members: this.room.state.westOfficeMembers,
                chat: this.room.state.westOfficeChat,
            },
            northOffice1: {
                members: this.room.state.northOffice1Members,
                chat: this.room.state.northOffice1Chat,
            },
            northOffice2: {
                members: this.room.state.northOffice2Members,
                chat: this.room.state.northOffice2Chat,
            },
        };

        return officeMap[officeName];
    };

    updatePlayer(
        x: number,
        y: number,
        anim: string,
        status?: {
            isMicOn?: boolean;
            isWebcamOn?: boolean;
            isDisconnected?: boolean;
        }
    ) {
        this.room.send("UPDATE_PLAYER", {
            playerX: x,
            playerY: y,
            anim,
            status,
        });
    }

    joinOffice(officeName: officeNames) {
        this.room.send("JOIN_OFFICE", {
            username: this.username,
            office: officeName,
        });
    }

    leaveOffice(officeName: officeNames) {
        this.room.send("LEAVE_OFFICE", {
            username: this.username,
            office: officeName,
        });
    }

    connectToOfficeVideoCall(currentOffice: string) {
        this.room.send("CONNECT_TO_OFFICE_VIDEO_CALL", currentOffice);
    }

    connectToProximityVideoCall(proximityPlayerSessionId: string[]) {
        this.room.send(
            "CONNECT_TO_PROXIMITY_VIDEO_CALL",
            proximityPlayerSessionId
        );
    }

    removeFromProximityCall(sessionId: string) {
        this.room.send("REMOVE_FROM_PROXIMITY_CALL", sessionId);
    }

    userStoppedOfficeWebcam(office: officeNames) {
        this.room.send("USER_STOPPED_OFFICE_WEBCAM", office);
    }

    userStoppedProximityWebcam(proximityPlayers: string[]) {
        this.room.send("USER_STOPPED_PROXIMITY_WEBCAM", proximityPlayers);
    }

    /**
     * Stops screen sharing.
     *
     * Letting other players know that the current player
     * stopped his screen sharing.
     */
    playerStoppedScreenSharing = (office: officeNames) => {
        // TODO: Add a common folder between server & client where all types can be declared.
        // because currentOffice can be set to invalid string which server cannot handle.
        this.room.send("USER_STOPPED_SCREEN_SHARING", office);
    };

    /**
     * Sends new Office Chat message.
     *
     * @param message chat message
     * @param officeName player's office
     */
    addNewOfficeChatMessage = (message: string, officeName: officeNames) => {
        this.room.send("PUSH_OFFICE_MESSAGE", {
            username: this.username,
            message,
            officeName,
        });
    };

    /**
     * Sends new Global Chat message.
     *
     * @param message chat message
     */
    addNewGlobalChatMessage = (message: string) => {
        this.room.send("PUSH_GLOBAL_CHAT_MESSAGE", {
            username: this.username,
            message,
        });
    };

    /**
     * Handles all types of server messages.
     *
     * This method currently handles all types of messages from server,
     * which are this.room.onMessage, this.room.xxxx.onAdd & this.room.xxxx.onRemove
     * if onAdd & onRemove types of messages increases in future, then split this method into 3:
     * first to handle onMessage, second to handle onAdd, third to handle onRemove
     */
    handleServerMessages = () => {
        // TODO: Fix "Cannot call peer - No local stream available"
        this.room.onMessage(
            "USER_JOINED_OFFICE",
            async ({ playerSessionId, username, message, type }) => {
                store.dispatch(
                    setPlayerNameMap({
                        peerId: sanitizeUserIdForScreenSharing(playerSessionId),
                        username,
                    })
                );

                store.dispatch(
                    pushNewOfficeMessage({
                        username,
                        message,
                        type,
                    })
                );

                // when new player joins office,
                // then call that new player and share current player's screen & webcam with him
                screenSharing.shareScreen(playerSessionId);
                videoCalling.shareWebcam(playerSessionId);
            }
        );

        this.room.onMessage(
            "NEW_OFFICE_MESSAGE",
            ({ username, message, type }) => {
                store.dispatch(
                    pushNewOfficeMessage({
                        username,
                        message,
                        type,
                    })
                );
            }
        );

        this.room.onMessage(
            "PLAYER_LEFT_OFFICE",
            ({ playerSessionId, username, message, type }) => {
                store.dispatch(
                    pushNewOfficeMessage({
                        username: username,
                        message: message,
                        type: type,
                    })
                );
                store.dispatch(disconnectUserForVideoCalling(playerSessionId));
                store.dispatch(disconnectUserForScreenSharing(playerSessionId));
                store.dispatch(
                    removePlayerNameMap(
                        sanitizeUserIdForScreenSharing(playerSessionId)
                    )
                );
            }
        );

        this.room.onMessage("GET_OFFICE_CHAT", (officeChat) => {
            const allMessages = officeChat.map((msg) => {
                return {
                    username: msg.username,
                    message: msg.message,
                    type: msg.type,
                };
            });
            store.dispatch(addOfficeChat(allMessages));
        });

        this.room.onMessage("CONNECT_TO_VIDEO_CALL", (playerSessionId) => {
            videoCalling.shareWebcam(playerSessionId);
        });

        this.room.onMessage(
            "NEW_GLOBAL_CHAT_MESSAGE",
            ({ username, message, type }) => {
                store.dispatch(
                    pushNewGlobalMessage({
                        username,
                        message,
                        type,
                    })
                );
            }
        );

        this.room.onMessage("GET_GLOBAL_CHAT", (globalChatMessages) => {
            const allMessages = globalChatMessages.map((msg) => {
                return {
                    username: msg.username,
                    message: msg.message,
                    type: msg.type,
                };
            });

            store.dispatch(addGlobalChat(allMessages));
        });

        this.room.onMessage("USER_STOPPED_SCREEN_SHARING", (userId) => {
            store.dispatch(disconnectUserForScreenSharing(userId));
        });

        this.room.onMessage("END_VIDEO_CALL_WITH_USER", (userId) => {
            store.dispatch(disconnectUserForVideoCalling(userId));
        });

        this.room.state.players.onRemove((player, sessionId) => {
            phaserEvents.emit(Event.PLAYER_LEFT, sessionId);
        });

        this.room.state.players.onAdd((player, sessionId) => {
            // handling current player
            if (sessionId === this.room.sessionId) {
                phaserEvents.emit(
                    Event.INITIALIZE_PLAYER,
                    this.character,
                    this.username,
                    this.room.sessionId,
                    player.x,
                    player.y
                );
                return;
            }

            // handling other players
            phaserEvents.emit(Event.PLAYER_JOINED, player, sessionId);
        });
    };
}
