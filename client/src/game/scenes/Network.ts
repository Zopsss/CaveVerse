import { Client, Room } from "colyseus.js";
import { BACKEND_URL } from "../backend";
import { sanitizeUserIdForScreenSharing } from "../../lib/utils";
import store from "../../app/store";
import videoCalling from "../service/VideoCalling";
import screenSharing from "../service/ScreenSharing";
import {
    addAvailableRooms,
    removeFromAvailableRooms,
} from "../../app/features/room/roomSlice";
import {
    addGlobalChat,
    addOfficeChat,
    clearOfficeChat,
    pushNewGlobalMessage,
    pushNewOfficeMessage,
    setShowOfficeChat,
} from "../../app/features/chat/chatSlice";
import {
    clearPlayerNameMap,
    disconnectUserForScreenSharing,
    removeAllPeerConnectionsForScreenSharing,
    removePlayerNameMap,
    setPlayerNameMap,
} from "../../app/features/webRtc/screenSlice";
import {
    disconnectFromVideoCall,
    disconnectUserForVideoCalling,
    removeAllPeerConnectionsForVideoCalling,
} from "../../app/features/webRtc/webcamSlice";
import { OfficeManager } from "./OfficeManager";

type officeNames =
    | "mainOffice"
    | "eastOffice"
    | "westOffice"
    | "northOffice1"
    | "northOffice2";

export default class Network {
    client: Client;
    room!: Room;
    lobby!: Room;
    currentOffice: officeNames;
    officeManager: OfficeManager;
    currentPlayer: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
    otherPlayers: {
        [sessionId: string]: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    } = {};
    proximityPlayers: {
        [sessionId: string]: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    } = {};
    username: string;
    character: string;
    lastX: number;
    lastY: number;
    lastPressedKey = "down";

    constructor() {
        this.client = new Client(BACKEND_URL);
        this.officeManager = new OfficeManager();
        this.joinLobbyRoom();
    }

    /* ATTENTION: Please follow following order for creating new methods:
     * first async methods should come
     * then private methods should come
     * then public methods should come
     */

    /**
     * Joins default lobby room and gets & handles custom room's data.
     */
    joinLobbyRoom = async () => {
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
            console.log("room removed: ", roomId);
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
        this.username = username;
        this.character = character;
        this.room = await this.client.joinOrCreate("PUBLIC_ROOM", {
            username: this.username,
            character: this.character,
        });
        this.lobby.leave();
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
        this.username = username;
        this.character = character;
        this.room = await this.client.create("PRIVATE_ROOM", {
            name: roomName,
            password,
            username: this.username,
        });
        this.lobby.leave();
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
        this.username = username;
        this.character = character;
        console.log("room Id: ", roomId);
        this.room = await this.client.joinById(roomId, {
            password,
            username: this.username,
        });
        this.lobby.leave();
    };

    /**
     * Starts current player's webcam.
     *
     * Gets the current player's webcam media and calls all the members of the current office.
     */
    startWebcam = async (shouldConnectToOtherPlayers = false) => {
        await videoCalling.getUserMedia();

        if (this.currentOffice) {
            this.shareWebcamWithOfficePlayers(shouldConnectToOtherPlayers);
        } else {
            this.shareWebcamWithProximityPlayer(shouldConnectToOtherPlayers);
        }
    };

    shareWebcamWithOfficePlayers = async (
        shouldConnectToOtherPlayers: boolean
    ) => {
        const { members } = this.getOfficeData();
        members.forEach((username, sessionId) => {
            // preventing calling ourself
            if (sessionId === this.room.sessionId) return;

            // when current player starts sharing his webcam
            // call other present players of the office and share webcam stream with them.
            videoCalling.shareWebcam(sessionId);
        });

        // when player uses "Disconnect from video call button" and then turns on his camera again,
        // then we need to let other players know that the current player has started his webcam again.
        // TODO: Investigate this logic....
        if (shouldConnectToOtherPlayers) {
            this.room.send("CONNECT_TO_OFFICE_VIDEO_CALL", this.currentOffice);
        }
    };

    shareWebcamWithProximityPlayer = async (
        shouldConnectToOtherPlayers: boolean
    ) => {
        for (const sessionId in this.proximityPlayers) {
            videoCalling.shareWebcam(sessionId);
        }

        // when player uses "Disconnect from video call button" and then turns on his camera again,
        // then we need to let other players know that the current player has started his webcam again.
        // TODO: Investigate this logic....
        if (shouldConnectToOtherPlayers) {
            this.room.send(
                "CONNECT_TO_PROXIMITY_VIDEO_CALL",
                Object.keys(this.proximityPlayers)
            );
        }
    };

    /**
     * Starts streaming current player's screen.
     *
     * Gets the current player's display media and calls all the members of the current office.
     */
    startScreenSharing = async () => {
        await screenSharing.getUserMedia();

        const { members } = this.getOfficeData();
        members.forEach((username, sessionId) => {
            // preventing calling ourself
            if (sessionId === this.room.sessionId) return;

            // when current player starts sharing his screen
            // call other present players of the office and share screen stream with them.
            screenSharing.shareScreen(sessionId);
        });
    };

    /**
     * Helper method to get the appropriate state properties for each office
     *
     * @param officeName office's name
     */
    private getOfficeData = (officeName: officeNames = this.currentOffice) => {
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

    /**
     * Handles office joining.
     *
     * @param officeName office's name
     */
    private joinOffice = (officeName: officeNames) => {
        this.currentOffice = officeName;

        store.dispatch(setShowOfficeChat(true));

        // if player has previously given webcam access then upon joining the office,
        // call other present players of the office and share current player's webcam with them.
        if (store.getState().webcam.myWebcamStream) {
            this.startWebcam();
        }

        // notify other players & connect to the office
        this.room.send(`JOIN_OFFICE`, {
            username: this.username,
            office: officeName,
        });

        // TODO: Instead of adding & removing data in playerNameMap
        // as player joins or leaves a room,
        // maintain this map from the moment player joins the game
        const { members } = this.getOfficeData();
        members.forEach((username, sessionId) => {
            store.dispatch(
                setPlayerNameMap({
                    peerId: sanitizeUserIdForScreenSharing(sessionId),
                    username: username,
                })
            );
        });
    };

    private leaveOffice = () => {
        this.room.send("LEAVE_OFFICE", {
            username: this.username,
            office: this.currentOffice,
        });

        store.dispatch(clearOfficeChat()); // player left the office so clear the redux state as well
        store.dispatch(setShowOfficeChat(false));
        store.dispatch(removeAllPeerConnectionsForVideoCalling());
        store.dispatch(removeAllPeerConnectionsForScreenSharing());
        store.dispatch(clearPlayerNameMap());

        this.currentOffice = null;
    };

    /**
     * Stops screen sharing.
     *
     * Letting other players know that the current player
     * stopped his screen sharing.
     */
    playerStoppedScreenSharing = () => {
        // TODO: Add a common folder between server & client where all types can be declared.
        // because currentOffice can be set to invalid string which server cannot handle.
        this.room.send("USER_STOPPED_SCREEN_SHARING", this.currentOffice);
    };

    /**
     * Stops webcam.
     *
     * Letting other players know that the current player
     * stopped his webcam.
     */
    playerStoppedWebcam = () => {
        // TODO: Add a common folder between server & client where all types can be declared.
        // because currentOffice can be set to invalid string which server cannot handle.
        store.dispatch(disconnectFromVideoCall());
        if (this.currentOffice) {
            this.room.send("USER_STOPPED_OFFICE_WEBCAM", this.currentOffice);
        } else {
            this.room.send(
                "USER_STOPPED_PROXIMITY_WEBCAM",
                Object.keys(this.proximityPlayers)
            );
        }
    };

    /**
     * Sends new Office Chat message.
     *
     * @param content message content.
     */
    addNewOfficeMessage = (content: string) => {
        this.room.send("PUSH_OFFICE_MESSAGE", {
            username: this.username,
            message: content,
            officeName: this.currentOffice,
        });
    };

    /**
     * Sends new Global Chat message.
     *
     * @param content message content.
     */
    addNewGlobalChatMessage = (content: string) => {
        this.room.send("PUSH_GLOBAL_CHAT_MESSAGE", {
            username: this.username,
            message: content,
        });
    };

    /**
     * Initializes Video Calling & Screen Sharing peers.
     */
    initializePeers = () => {
        videoCalling
            .initializePeer(this.room.sessionId)
            .then((peer) => {
                console.log("peer initialized for video calling: ", peer.id);
            })
            .catch((error) => {
                console.error("Failed to initialize peer:", error);
            });

        screenSharing.initializePeer(this.room.sessionId).then((peer) => {
            console.log("peer initialized for screen sharing: ", peer.id);
        });
    };

    /**
     * Handles all types of server messages.
     *
     * This method currently handles all types of messages from server,
     * which are this.room.onMessage, this.room.xxxx.onAdd & this.room.xxxx.onRemove
     * if onAdd & onRemove types of messages increases in future, then split this method into 3:
     * first to handle onMessage, second to handle onAdd, third to handle onRemove
     *
     * Currently there's no onAdd message in this method, there's only one onAdd method in GameScene.ts
     * but it cannot be added here because it depends on GameScene.ts' internal methods.
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
            ({ sessionId, username, message, messageType }) => {
                store.dispatch(
                    pushNewGlobalMessage({
                        username,
                        message,
                        type: messageType,
                    })
                );

                // if a player left then check if he was a proximity chat player
                // if he was then disconnect with him from Video Call
                if (
                    messageType === "PLAYER_LEFT" &&
                    this.proximityPlayers[sessionId]
                ) {
                    store.dispatch(disconnectUserForVideoCalling(sessionId));
                }
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

        this.room.onMessage("USER_STOPPED_WEBCAM", (userId) => {
            store.dispatch(disconnectUserForVideoCalling(userId));
        });

        this.room.state.players.onRemove((player, sessionId) => {
            const entity = this.otherPlayers[sessionId];
            if (entity) {
                entity.destroy();
                delete this.otherPlayers[sessionId];
            }
        });
    };

    /**
     * Handles real-time movements of player.
     */
    update = () => {
        if (!this.currentPlayer) {
            return;
        }

        const velocity = 300;

        // Reset velocity
        this.currentPlayer.setVelocity(0);

        // Apply movement using velocity instead of position
        if (this.cursorKeys.left.isDown) {
            this.currentPlayer.setVelocityX(-velocity);
            this.currentPlayer.anims.play(`${this.character}_left_run`, true);
            this.lastPressedKey = "left";
            this.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: `${this.character}_left_run`,
            });
        } else if (this.cursorKeys.right.isDown) {
            this.currentPlayer.setVelocityX(velocity);
            this.currentPlayer.anims.play(`${this.character}_right_run`, true);
            this.lastPressedKey = "right";
            this.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: `${this.character}_right_run`,
            });
        } else if (this.cursorKeys.up.isDown) {
            this.currentPlayer.setVelocityY(-velocity);
            this.currentPlayer.anims.play(`${this.character}_up_run`, true);
            this.lastPressedKey = "up";
            this.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: `${this.character}_up_run`,
            });
        } else if (this.cursorKeys.down.isDown) {
            this.currentPlayer.setVelocityY(velocity);
            this.currentPlayer.anims.play(`${this.character}_down_run`, true);
            this.lastPressedKey = "down";
            this.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: `${this.character}_down_run`,
            });
        } else {
            this.currentPlayer.anims.play(
                `${this.character}_${this.lastPressedKey}_idle`,
                true
            );
            this.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: `${this.character}_${this.lastPressedKey}_idle`,
            });
        }

        const { x, y } = this.currentPlayer;

        if (x !== this.lastX || y !== this.lastY) {
            const zone = this.officeManager.update(x, y);

            if (zone && this.currentOffice !== zone) {
                this.currentOffice = zone;
                this.joinOffice(zone);
            } else if (!zone && this.currentOffice) {
                this.leaveOffice();
            }

            this.lastX = x;
            this.lastY = y;
        }

        // interpolate other players.
        for (const sessionId in this.otherPlayers) {
            // skipping current player
            if (sessionId === this.room.sessionId) continue;

            const entity = this.otherPlayers[sessionId];
            if (entity.data) {
                const { serverX, serverY, anim } = entity.data.values;
                entity.x = Phaser.Math.Linear(entity.x, serverX, 0.2);
                entity.y = Phaser.Math.Linear(entity.y, serverY, 0.2);
                entity.anims.play(anim, true);
            }

            const distance = Phaser.Math.Distance.Between(
                entity.x,
                entity.y,
                this.currentPlayer.x,
                this.currentPlayer.y
            );

            if (distance <= 50 && !this.currentOffice) {
                if (!this.proximityPlayers[sessionId]) {
                    this.proximityPlayers[sessionId] = entity;
                    console.log(
                        "player",
                        sessionId,
                        "added to proximityPlayers"
                    );

                    videoCalling.shareWebcam(sessionId);
                }
            } else if (this.proximityPlayers[sessionId]) {
                delete this.proximityPlayers[sessionId];
                console.log(
                    "player",
                    sessionId,
                    "removed from proximityPlayers"
                );

                store.dispatch(disconnectUserForVideoCalling(sessionId));
            }
        }
    };
}
