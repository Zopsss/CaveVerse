import { Client, Room } from "colyseus.js";
import { BACKEND_URL } from "../backend";
import { sanitizeUserId } from "../../lib/utils";
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
    disconnectUser,
    removeAllPeerConnections,
    removePlayerNameMap,
    setPlayerNameMap,
} from "../../app/features/webRtc/screenSlice";

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
    currentSpace: officeNames;
    prevSpace: officeNames;
    currentPlayer: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
    playerEntities: {
        [sessionId: string]: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    } = {};
    username: string;
    character: string;
    lastPressedKey = "down";

    constructor() {
        this.client = new Client(BACKEND_URL);

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
     * Starts streaming player's screen.
     *
     * Gets the player's display media and calls all the members of the current office.
     */
    startScreenSharing = async () => {
        await screenSharing.getUserDisplayMedia();

        const { members } = this.getOfficeData(this.currentSpace);
        members.forEach((username, sessionId) => {
            // preventing calling ourself
            if (sessionId === this.room.sessionId) return;

            screenSharing.shareScreen(sessionId);
        });
    };

    /**
     * Helper method to get the appropriate state properties for each office
     *
     * @param officeName office's name
     */
    private getOfficeData = (officeName: officeNames) => {
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
        this.currentSpace = officeName;

        let roomName: string;
        switch (officeName) {
            case "mainOffice":
                roomName = "MAIN";
                break;
            case "eastOffice":
                roomName = "EAST";
                break;
            case "westOffice":
                roomName = "WEST";
                break;
            case "northOffice1":
                roomName = "NORTH_1";
                break;
            case "northOffice2":
                roomName = "NORTH_2";
                break;
        }

        // get user media
        videoCalling.getUserMedia();

        // connect to the office
        store.dispatch(setShowOfficeChat(true));
        const peer = videoCalling.getPeer();
        this.room.send(`JOIN_${roomName}_OFFICE`, {
            peerId: peer.id,
            username: this.username,
        });

        // TODO: Instead of adding & removing data in playerNameMap
        // as player joins or leaves a room,
        // maintain this map from the moment player joins the game
        const { members } = this.getOfficeData(this.currentSpace);
        members.forEach((username, sessionId) => {
            console.log(
                "username: ",
                username,
                "sessionid: ",
                sanitizeUserId(sessionId)
            );
            store.dispatch(
                setPlayerNameMap({
                    peerId: sanitizeUserId(sessionId),
                    username: username,
                })
            );
        });
    };

    /**
     * Handles office specific chat messages.
     *
     * @param officeName newly received message's office name
     * @param serverData chat message received from server
     */
    private handleChatMessages = (officeName: officeNames, serverData) => {
        const { chat, members } = this.getOfficeData(officeName);

        const isInOffice: boolean = members.has(this.room.sessionId);

        // if current player is not in the space for which message is received then don't do anything.
        if (!isInOffice) return;

        if (this.prevSpace === officeName) {
            // this means the player is already in the office
            // so push whatever message comes from server.
            store.dispatch(
                pushNewOfficeMessage({
                    username: serverData.username,
                    message: serverData.message,
                    type: serverData.type,
                })
            );
        } else {
            // this means that the player just joined main,
            // so we will get the whole chat and push it to the redux store.
            const allMessages = chat.map((msg) => {
                return {
                    username: msg.username,
                    message: msg.message,
                    type: msg.type,
                };
            });
            store.dispatch(addOfficeChat(allMessages));
            this.prevSpace = officeName;
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
        let currentOffice: string;
        switch (this.currentSpace) {
            case "mainOffice":
                currentOffice = "MAIN";
                break;
            case "eastOffice":
                currentOffice = "EAST";
                break;
            case "westOffice":
                currentOffice = "WEST";
                break;
            case "northOffice1":
                currentOffice = "NORTH_1";
                break;
            case "northOffice2":
                currentOffice = "NORTH_2";
                break;
        }

        this.room.send("USER_STOPPED_SCREEN_SHARING", currentOffice);
    };

    /**
     * Sends new Office Chat message.
     *
     * @param content message content.
     */
    addNewOfficeMessage = (content: string) => {
        let addMessage: string;

        // setting add message according to currently joined space
        switch (this.currentSpace) {
            case "mainOffice":
                addMessage = "ADD_MAIN_OFFICE_MESSAGE";
                break;

            case "eastOffice":
                addMessage = "ADD_EAST_OFFICE_MESSAGE";
                break;

            case "westOffice":
                addMessage = "ADD_WEST_OFFICE_MESSAGE";
                break;

            case "northOffice1":
                addMessage = "ADD_NORTH_OFFICE_1_MESSAGE";
                break;

            case "northOffice2":
                addMessage = "ADD_NORTH_OFFICE_2_MESSAGE";
                break;

            default:
                console.log("invalid currentSpace: ", this.currentSpace);
                break;
        }

        this.room.send(addMessage, {
            username: this.username,
            message: content,
        });
    };

    /**
     * Sends new Global Chat message.
     *
     * @param content message content.
     */
    addNewGlobalChatMessage = (content: string) => {
        this.room.send("ADD_NEW_GLOBAL_CHAT_MESSAGE", {
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
     * Handles office specific messages.
     *
     * TODO: Currently we rely on onAdd messages from server.
     *       All offices have it's onAdd messages, they're all handles in this method.
     *       Instead of this, use onMessage to handle messages from all offices.
     */
    handleOfficeMessages = () => {
        this.room.state.mainOfficeChat.onAdd((serverData) => {
            this.handleChatMessages("mainOffice", serverData);
        });

        this.room.state.eastOfficeChat.onAdd((serverData) => {
            this.handleChatMessages("eastOffice", serverData);
        });

        this.room.state.westOfficeChat.onAdd((serverData) => {
            this.handleChatMessages("westOffice", serverData);
        });

        this.room.state.northOffice1Chat.onAdd((serverData) => {
            this.handleChatMessages("northOffice1", serverData);
        });

        this.room.state.northOffice2Chat.onAdd((serverData) => {
            this.handleChatMessages("northOffice2", serverData);
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
            "CONNECT_TO_WEBRTC",
            async ({ peerId, username }) => {
                try {
                    setTimeout(async () => {
                        // Ensure PeerJS is initialized
                        await videoCalling.initializePeer(this.room.sessionId);

                        // Call the new user
                        await videoCalling.connectToNewUser(peerId);
                    }, 3000);
                } catch (err) {
                    console.error("Failed to connect to new user:", err);
                }

                store.dispatch(
                    setPlayerNameMap({
                        peerId: sanitizeUserId(peerId),
                        username,
                    })
                );

                screenSharing.shareScreen(peerId);
            }
        );

        this.room.onMessage("DISCONNECT_FROM_WEBRTC", (userId) => {
            videoCalling.disconnectUser(userId);
            store.dispatch(disconnectUser(userId));
            store.dispatch(removePlayerNameMap(sanitizeUserId(userId)));
        });

        this.room.onMessage("NEW_GLOBAL_CHAT_MESSAGE", (serverData) => {
            store.dispatch(
                pushNewGlobalMessage({
                    username: serverData.username,
                    message: serverData.message,
                    type: serverData.type,
                })
            );
        });

        this.room.onMessage("GET_WHOLE_GLOBAL_CHAT", (globalChatMessages) => {
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
            store.dispatch(disconnectUser(userId));
        });

        this.room.state.players.onRemove((player, sessionId) => {
            const entity = this.playerEntities[sessionId];
            if (entity) {
                entity.destroy();
                delete this.playerEntities[sessionId];
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
            this.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: `${this.character}_left_run`,
            });
            this.lastPressedKey = "left";
        } else if (this.cursorKeys.right.isDown) {
            this.currentPlayer.setVelocityX(velocity);
            this.currentPlayer.anims.play(`${this.character}_right_run`, true);
            this.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: `${this.character}_right_run`,
            });
            this.lastPressedKey = "right";
        } else if (this.cursorKeys.up.isDown) {
            this.currentPlayer.setVelocityY(-velocity);
            this.currentPlayer.anims.play(`${this.character}_up_run`, true);
            this.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: `${this.character}_up_run`,
            });
            this.lastPressedKey = "up";
        } else if (this.cursorKeys.down.isDown) {
            this.currentPlayer.setVelocityY(velocity);
            this.currentPlayer.anims.play(`${this.character}_down_run`, true);
            this.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: `${this.character}_down_run`,
            });
            this.lastPressedKey = "down";
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

        // interpolate other players.
        for (let sessionId in this.playerEntities) {
            // skipping current player
            if (sessionId === this.room.sessionId) continue;

            const entity = this.playerEntities[sessionId];
            if (entity.data) {
                const { serverX, serverY, anim } = entity.data.values;
                entity.x = Phaser.Math.Linear(entity.x, serverX, 0.2);
                entity.y = Phaser.Math.Linear(entity.y, serverY, 0.2);
                entity.anims.play(anim, true);
            }
        }

        const mainOfficeX = 799.85;
        const mainOfficeY = 608.02;
        const mainOfficeWidth = 799.85;
        const mainOfficeHeight = 512.02;

        const isInsideMainOffice =
            this.currentPlayer.x >= mainOfficeX &&
            this.currentPlayer.x <= mainOfficeX + mainOfficeWidth &&
            this.currentPlayer.y >= mainOfficeY &&
            this.currentPlayer.y <= mainOfficeY + mainOfficeHeight;

        const eastOfficeX = 63.96;
        const eastOfficeY = 351.94;
        const eastOfficeWidth = 384.12;
        const eastOfficeHeight = 768.09;

        const isInsideEastOffice =
            this.currentPlayer.x >= eastOfficeX &&
            this.currentPlayer.x <= eastOfficeX + eastOfficeWidth &&
            this.currentPlayer.y >= eastOfficeY &&
            this.currentPlayer.y <= eastOfficeY + eastOfficeHeight;

        const westOfficeX = 1920.0;
        const westOfficeY = 608.25;
        const westOfficeWidth = 448.13;
        const westOfficeHeight = 544.0;

        const isInsideWestOffice =
            this.currentPlayer.x >= westOfficeX &&
            this.currentPlayer.x <= westOfficeX + westOfficeWidth &&
            this.currentPlayer.y >= westOfficeY &&
            this.currentPlayer.y <= westOfficeY + westOfficeHeight;

        const northOffice1X = 927.85;
        const northOffice1Y = 156.61;
        const northOffice1Width = 512.09;
        const northOffice1Height = 259.42;

        const isInsideNorthOffice1 =
            this.currentPlayer.x >= northOffice1X &&
            this.currentPlayer.x <= northOffice1X + northOffice1Width &&
            this.currentPlayer.y >= northOffice1Y &&
            this.currentPlayer.y <= northOffice1Y + northOffice1Height;

        const northOffice2X = 1471.97;
        const northOffice2Y = 156.61;
        const northOffice2Width = 512.09;
        const northOffice2Height = 259.42;

        const isInsideNorthOffice2 =
            this.currentPlayer.x >= northOffice2X &&
            this.currentPlayer.x <= northOffice2X + northOffice2Width &&
            this.currentPlayer.y >= northOffice2Y &&
            this.currentPlayer.y <= northOffice2Y + northOffice2Height;

        if (isInsideMainOffice && this.currentSpace !== "mainOffice") {
            console.log("in main office");
            this.joinOffice("mainOffice");
        } else if (isInsideEastOffice && this.currentSpace !== "eastOffice") {
            console.log("in east office");
            this.joinOffice("eastOffice");
        } else if (isInsideWestOffice && this.currentSpace !== "westOffice") {
            console.log("in west office");
            this.joinOffice("westOffice");
        } else if (
            isInsideNorthOffice1 &&
            this.currentSpace !== "northOffice1"
        ) {
            console.log("in north office 1");
            this.joinOffice("northOffice1");
        } else if (
            isInsideNorthOffice2 &&
            this.currentSpace !== "northOffice2"
        ) {
            console.log("in north office 2");
            this.joinOffice("northOffice2");
        }

        if (
            !isInsideMainOffice &&
            !isInsideEastOffice &&
            !isInsideWestOffice &&
            !isInsideNorthOffice1 &&
            !isInsideNorthOffice2 &&
            this.prevSpace
        ) {
            store.dispatch(setShowOfficeChat(false));
            let room: string;
            switch (this.currentSpace) {
                case "mainOffice":
                    room = "LEFT_MAIN_OFFICE";
                    break;
                case "eastOffice":
                    room = "LEFT_EAST_OFFICE";
                    break;
                case "westOffice":
                    room = "LEFT_WEST_OFFICE";
                    break;
                case "northOffice1":
                    room = "LEFT_NORTH_1_OFFICE";
                    break;
                case "northOffice2":
                    room = "LEFT_NORTH_2_OFFICE";
                    break;
            }

            this.room.send(room, this.username);
            store.dispatch(clearOfficeChat()); // player left the office so clear the redux state as well
            store.dispatch(setShowOfficeChat(false));
            videoCalling.removeAllPeerConnections();
            store.dispatch(removeAllPeerConnections());
            store.dispatch(clearPlayerNameMap());
            this.currentSpace = null;
            this.prevSpace = null;
        }
    };
}
