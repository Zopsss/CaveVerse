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
    private proximityTimers: {
        [sessionId: string]: {
            enterTime: number;
            connected: boolean;
        };
    } = {};
    username: string;
    character: string;
    lastX: number;
    lastY: number;
    static PROXIMITY_CONNECT_DELAY = 500;

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

        // for debugging purpose only, please remove it before merging the PR.
        console.log("backend url: ", BACKEND_URL);
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
        this.proximityPlayers = {};
        this.proximityTimers = {};

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

    /** Handles current player's movements and notifies the server. */
    private handlePlayerMovements = () => {
        const speed = 300;
        let vx = 0;
        let vy = 0;

        // set velocity x & y and player's animation
        if (this.cursorKeys.left.isDown) {
            vx -= speed;
            this.currentPlayer.anims.play(`${this.character}_left_run`, true);
        } else if (this.cursorKeys.right.isDown) {
            vx += speed;
            this.currentPlayer.anims.play(`${this.character}_right_run`, true);
        } else if (this.cursorKeys.up.isDown) {
            vy -= speed;
            this.currentPlayer.anims.play(`${this.character}_up_run`, true);
        } else if (this.cursorKeys.down.isDown) {
            vy += speed;
            this.currentPlayer.anims.play(`${this.character}_down_run`, true);
        } else {
            const parts = this.currentPlayer.anims.currentAnim.key.split("_");
            parts[2] = "idle"; // getting the last "run" animation and changing it to idle
            const idleAnim = parts.join("_");

            // this prevents sending idle animation multiple times to the server
            if (this.currentPlayer.anims.currentAnim.key !== idleAnim) {
                this.currentPlayer.anims.play(idleAnim, true);
                this.room.send("PLAYER_MOVED", {
                    playerX: this.currentPlayer.x,
                    playerY: this.currentPlayer.y,
                    anim: idleAnim,
                });
            }
        }

        // set the velocity of the player
        this.currentPlayer.setVelocity(vx, vy);

        // if player is moving then send his live position to the server.
        if (vx !== 0 || vy !== 0) {
            this.room.send("PLAYER_MOVED", {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: this.currentPlayer.anims.currentAnim.key,
            });
        }
    };

    /**
     * Handles proximity chat between players.
     *
     * The logic prioritizes disconnection checks before attempting a connection:
     * 1. If the player moves away after the timer started, disconnect and clean up.
     * 2. If the proximity player enters an office, disconnect immediately.
     * 3. Only then, if the player is still near and both are outside any office, start or complete connection.
     *
     * This order ensures cleanup and disconnects are handled first, avoiding unnecessary
     * connection attempts and reducing redundant proximity checks.
     *
     * @param time update()'s time (from Phaser's update loop)
     * @param sessionId session ID of the proximity player
     * @param otherPlayer the proximity player's sprite
     */

    private handleProximityChat = (
        time: number,
        sessionId: string,
        otherPlayer: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    ) => {
        const distance = Phaser.Math.Distance.Between(
            this.currentPlayer.x,
            this.currentPlayer.y,
            otherPlayer.x,
            otherPlayer.y
        );

        const proximityPlayer = this.otherPlayers[sessionId];
        const isProximityPlayerInOffice = OfficeManager.isInOffice(
            proximityPlayer.x,
            proximityPlayer.y
        );

        // disconnect if player was previously tracked but moved away
        if (this.proximityTimers[sessionId] && distance > 50) {
            const timer = this.proximityTimers[sessionId];

            // player's timer was started but before connecting
            // he moved away so no need to keep his timer anymore.
            if (!timer.connected) {
                delete this.proximityTimers[sessionId];
                return;
            }

            // if moved away player was connected then disconnect with him
            console.log("player", sessionId, "removed from proximityPlayers");
            store.dispatch(disconnectUserForVideoCalling(sessionId));

            delete this.proximityPlayers[sessionId];
            delete this.proximityTimers[sessionId];

            // notifying proximity player to disconnect with current player
            this.room.send("REMOVE_FROM_PROXIMITY_CALL", sessionId);

            return;
        }

        // disconnect if player is already connected and entered an office
        if (this.proximityPlayers[sessionId] && isProximityPlayerInOffice) {
            console.log("player", sessionId, "removed from proximityPlayers");
            store.dispatch(disconnectUserForVideoCalling(sessionId));

            delete this.proximityPlayers[sessionId];
            delete this.proximityTimers[sessionId];

            // notifying proximity player to disconnect with current player
            this.room.send("REMOVE_FROM_PROXIMITY_CALL", sessionId);

            return;
        }

        // connect if near and both are not in office
        if (
            distance <= 50 &&
            !this.currentOffice &&
            !isProximityPlayerInOffice
        ) {
            // player just came near the current player, start his timer and return
            if (!this.proximityTimers[sessionId]) {
                this.proximityTimers[sessionId] = {
                    enterTime: time,
                    connected: false,
                };
                return;
            }

            // player is near for enough time and is not already connected
            // only then connect with him
            const timer = this.proximityTimers[sessionId];
            if (
                !timer.connected &&
                time - timer.enterTime >= Network.PROXIMITY_CONNECT_DELAY
            ) {
                this.proximityPlayers[sessionId] = otherPlayer;
                timer.connected = true;
                console.log("player", sessionId, "added to proximityPlayers");
                videoCalling.shareWebcam(sessionId);
            }
        }
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
            ({ sessionId, username, message, type }) => {
                // sessionId is sent only with player left game message
                // otherwise it is not required.

                store.dispatch(
                    pushNewGlobalMessage({
                        username,
                        message,
                        type,
                    })
                );

                // if a player left then check if he was a proximity chat player
                // if he was then disconnect with him from Video Call
                if (
                    type === "PLAYER_LEFT" &&
                    this.proximityPlayers[sessionId]
                ) {
                    store.dispatch(disconnectUserForVideoCalling(sessionId));
                    delete this.proximityPlayers[sessionId];
                    delete this.proximityTimers[sessionId];
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

        this.room.onMessage("END_VIDEO_CALL_WITH_USER", (userId) => {
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
    update = (time: number, delta: number) => {
        if (!this.currentPlayer) {
            return;
        }

        this.handlePlayerMovements();

        const { x, y } = this.currentPlayer;

        if (x !== this.lastX || y !== this.lastY) {
            const office = this.officeManager.update(x, y);

            if (office && this.currentOffice !== office) {
                this.joinOffice(office);
            } else if (!office && this.currentOffice) {
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

            this.handleProximityChat(time, sessionId, entity);
        }
    };
}
