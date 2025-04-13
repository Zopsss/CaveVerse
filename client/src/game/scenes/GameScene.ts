import Phaser from "phaser";
import { Room, Client } from "colyseus.js";
import { BACKEND_URL } from "../backend";
import {
    addOfficeChat,
    addGlobalChat,
    clearOfficeChat,
    pushNewGlobalMessage,
    pushNewOfficeMessage,
    setShowOfficeChat,
} from "../../app/features/chat/chatSlice";
import store from "../../app/store";
import Peer from "peerjs";
import videoCalling from "../service/VideoCalling";
import Network from "./Network";
import screenSharing from "../service/ScreenSharing";
import { sanitizeUserId } from "../../lib/utils";
import {
    clearPlayerNameMap,
    disconnectUser,
    removeAllPeerConnections,
    removePlayerNameMap,
    setPlayerNameMap,
} from "../../app/features/webRtc/screenSlice";

type OfficeType = "MAIN" | "EAST" | "NORTH_1" | "NORTH_2" | "WEST";
type officeNames =
    | "mainOffice"
    | "eastOffice"
    | "westOffice"
    | "northOffice1"
    | "northOffice2";

export class GameScene extends Phaser.Scene {
    room: Room;
    currentPlayer: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    currentPlayerUsername: string;
    playerEntities: {
        [sessionId: string]: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    } = {};
    remoteRef: Phaser.GameObjects.Rectangle;
    cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
    mapLayer: Phaser.Tilemaps.TilemapLayer;
    map!: Phaser.Tilemaps.Tilemap;
    client!: Client;
    sessionID: string;
    myPeer: Peer;
    network: Network;
    currentSpace: officeNames;
    prevSpace: officeNames;
    lastPressedKey = "down";

    constructor() {
        super({ key: "GameScene" });
    }

    private addGroupFromTiled(
        objectLayerName: string,
        key: string,
        tilesetName: string,
        collidable: boolean
    ) {
        const group = this.physics.add.staticGroup();
        const objectLayer = this.map.getObjectLayer(objectLayerName);
        objectLayer.objects.forEach((object) => {
            const actualX = object.x! + object.width! * 0.5;
            const actualY = object.y! - object.height! * 0.5;
            const item = group.get(
                actualX,
                actualY,
                key,
                object.gid! - this.map.getTileset(tilesetName).firstgid
            );
            // .setDepth(actualY);

            if (objectLayerName === "FlippedTrees") {
                item.setFlipY(true);
            }
        });
        if (this.currentPlayer && collidable)
            this.physics.add.collider([this.currentPlayer], group);
    }

    private loadObjectsFromTiled() {
        this.addGroupFromTiled(
            "Modern_Office_Collide",
            "modern_office",
            "Modern_Office_Black_Shadow",
            true
        );
        this.addGroupFromTiled(
            "Modern_Office_Objects",
            "modern_office",
            "Modern_Office_Black_Shadow",
            false
        );

        this.addGroupFromTiled("Carpets", "generic", "Generic", false);

        this.addGroupFromTiled("Generic_Collide", "generic", "Generic", true);
        this.addGroupFromTiled("Generic_Objects", "generic", "Generic", false);
        this.addGroupFromTiled("FlippedTrees", "generic", "Generic", false);

        this.addGroupFromTiled(
            "Basement_Collide",
            "basement",
            "Basement",
            true
        );

        this.addGroupFromTiled(
            "Basement_Objects",
            "basement",
            "Basement",
            false
        );

        this.addGroupFromTiled(
            "Computers",
            "modern_office",
            "Modern_Office_Black_Shadow",
            false
        );
        this.addGroupFromTiled("Chairs", "chair", "chair", false);
        this.addGroupFromTiled("Whiteboard", "whiteboard", "whiteboard", true);
    }

    private joinRoom(roomName: OfficeType) {
        switch (roomName) {
            case "MAIN":
                this.currentSpace = "mainOffice";
                break;
            case "EAST":
                this.currentSpace = "eastOffice";
                break;
            case "WEST":
                this.currentSpace = "westOffice";
                break;
            case "NORTH_1":
                this.currentSpace = "northOffice1";
                break;
            case "NORTH_2":
                this.currentSpace = "northOffice2";
                break;
        }

        // get user media
        videoCalling.getUserMedia();

        // initialize the peer
        videoCalling
            .initializePeer(this.network.room.sessionId)
            .then((peer) => {
                store.dispatch(setShowOfficeChat(true));
                // connect to the office
                this.network.room.send(`JOIN_${roomName}_OFFICE`, {
                    peerId: peer.id,
                    username: this.network.username,
                });
            })
            .catch((error) => {
                console.error("Failed to initialize peer:", error);
                store.dispatch(setShowOfficeChat(true));
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
    }

    // Helper method to get the appropriate state properties for each office
    private getOfficeData(officeNames: officeNames) {
        const officeMap = {
            mainOffice: {
                members: this.network.room.state.mainOfficeMembers,
                chat: this.network.room.state.mainOfficeChat,
            },
            eastOffice: {
                members: this.network.room.state.eastOfficeMembers,
                chat: this.network.room.state.eastOfficeChat,
            },
            westOffice: {
                members: this.network.room.state.westOfficeMembers,
                chat: this.network.room.state.westOfficeChat,
            },
            northOffice1: {
                members: this.network.room.state.northOffice1Members,
                chat: this.network.room.state.northOffice1Chat,
            },
            northOffice2: {
                members: this.network.room.state.northOffice2Members,
                chat: this.network.room.state.northOffice2Chat,
            },
        };

        return officeMap[officeNames];
    }

    // handling office specific chat messages
    private handleChatMessages(prevSpace: officeNames, serverData) {
        const { chat, members } = this.getOfficeData(prevSpace);

        const isInOffice: boolean = members.has(this.network.room.sessionId);

        // if current player is not in the space then don't do anything.
        if (!isInOffice) return;

        if (this.prevSpace === prevSpace) {
            // this means the player is already in lobby
            // so push whatever message comes from server.
            store.dispatch(
                pushNewOfficeMessage({
                    username: serverData.username,
                    message: serverData.message,
                    type: serverData.type,
                })
            );
        } else {
            // this means that the player just joined main office chat,
            // so we will get the whole chat and push it to the redux store.
            const allMessages = chat.map((msg) => {
                return {
                    username: msg.username,
                    message: msg.message,
                    type: msg.type,
                };
            });
            store.dispatch(addOfficeChat(allMessages));
            this.prevSpace = prevSpace;
        }
    }

    async connect() {
        this.client = new Client(BACKEND_URL);

        try {
            this.room = await this.client.joinOrCreate("PUBLIC_ROOM", {});
        } catch (e) {
            console.error(e);
        }
    }

    async handleScreenSharing() {
        await screenSharing.getUserDisplayMedia();

        const { members } = this.getOfficeData(this.currentSpace);
        members.forEach((username, sessionId) => {
            // preventing calling ourself
            if (sessionId === this.network.room.sessionId) return;

            screenSharing.shareScreen(sessionId);
        });
    }

    /**
     * letting other players know that the current player
     * stopped his screen sharing.
     */
    playerStoppedScreenSharing() {
        let currentOffice: OfficeType;
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

        this.network.room.send("USER_STOPPED_SCREEN_SHARING", currentOffice);
    }

    addNewMessage(content: string) {
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

        this.network.room.send(addMessage, {
            username: this.network.username,
            message: content,
        });
    }

    addNewGlobalChatMessage(content: string) {
        this.network.room.send("ADD_NEW_GLOBAL_CHAT_MESSAGE", {
            username: this.network.username,
            message: content,
        });
    }

    enableKeys() {
        this.input.keyboard.enabled = true;
    }

    disableKeys() {
        this.input.keyboard.enabled = false;
        this.input.keyboard.disableGlobalCapture();
    }

    setUsername(username: string) {
        this.network.username = username;
    }

    async create(data: { network: Network }) {
        if (data.network) {
            this.network = data.network;
        } else {
            console.log("network instance missing");
            throw new Error("server instance missing");
        }
        // Create tilemap
        this.input.keyboard.disableGlobalCapture();
        this.map = this.make.tilemap({ key: "map" });
        const tileset = this.map.addTilesetImage(
            "FloorAndGround",
            "ground_tiles"
        );

        // Create layer and scale it
        this.mapLayer = this.map.createLayer("Ground", tileset);

        // Set collisions for tiles with the collides property
        this.mapLayer.setCollisionByProperty({ collides: true });
        this.mapLayer.setPosition(0, 0);

        this.cursorKeys = this.input.keyboard.createCursorKeys();

        this.network.room.state.players.onAdd((player, sessionId) => {
            console.log("player added: ", sessionId);
            // hardcoding player's character here
            // it doesn't affect as update method is called in loop
            // so it'll add the real character even before game loads.
            const entity = this.physics.add.sprite(
                player.x,
                player.y,
                "nancy",
                "nancy_down_idle"
            );

            entity.setDepth(100);

            // Store the entity reference
            this.playerEntities[sessionId] = entity;

            // Is current player
            if (sessionId === this.network.room.sessionId) {
                console.log(
                    "current player's sessionId: ",
                    this.network.room.sessionId
                );
                this.currentPlayer = entity;
                this.physics.add.collider(this.currentPlayer, this.mapLayer);
                this.cameras.main.startFollow(this.currentPlayer);
                this.cameras.main.zoom = 1.7;
                this.loadObjectsFromTiled();

                screenSharing
                    .initializePeer(this.network.room.sessionId)
                    .then((peer) => {
                        console.log(
                            "peer initialized for screen sharing: ",
                            peer.id
                        );
                    });
            } else {
                // Other players
                player.onChange(() => {
                    entity.setData("serverX", player.x);
                    entity.setData("serverY", player.y);
                    entity.setData("anim", player.anim);
                });
            }
        });

        this.network.room.state.players.onRemove((player, sessionId) => {
            const entity = this.playerEntities[sessionId];
            if (entity) {
                entity.destroy();
                delete this.playerEntities[sessionId];
            }
        });

        this.network.room.state.mainOfficeChat.onAdd((serverData) => {
            this.handleChatMessages("mainOffice", serverData);
        });

        this.network.room.state.eastOfficeChat.onAdd((serverData) => {
            this.handleChatMessages("eastOffice", serverData);
        });

        this.network.room.state.westOfficeChat.onAdd((serverData) => {
            this.handleChatMessages("westOffice", serverData);
        });

        this.network.room.state.northOffice1Chat.onAdd((serverData) => {
            this.handleChatMessages("northOffice1", serverData);
        });

        this.network.room.state.northOffice2Chat.onAdd((serverData) => {
            this.handleChatMessages("northOffice2", serverData);
        });

        // TODO: Fix "Cannot call peer - No local stream available"
        this.network.room.onMessage(
            "CONNECT_TO_WEBRTC",
            async ({ peerId, username }) => {
                try {
                    setTimeout(async () => {
                        // Ensure PeerJS is initialized
                        await videoCalling.initializePeer(
                            this.network.room.sessionId
                        );

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

        this.network.room.onMessage("DISCONNECT_FROM_WEBRTC", (userId) => {
            videoCalling.disconnectUser(userId);
            store.dispatch(disconnectUser(userId));
            store.dispatch(removePlayerNameMap(sanitizeUserId(userId)));
        });

        this.network.room.onMessage("NEW_GLOBAL_CHAT_MESSAGE", (serverData) => {
            store.dispatch(
                pushNewGlobalMessage({
                    username: serverData.username,
                    message: serverData.message,
                    type: serverData.type,
                })
            );
        });

        this.network.room.onMessage(
            "GET_WHOLE_GLOBAL_CHAT",
            (globalChatMessages) => {
                const allMessages = globalChatMessages.map((msg) => {
                    return {
                        username: msg.username,
                        message: msg.message,
                        type: msg.type,
                    };
                });

                store.dispatch(addGlobalChat(allMessages));
            }
        );

        this.network.room.onMessage("USER_STOPPED_SCREEN_SHARING", (userId) => {
            store.dispatch(disconnectUser(userId));
        });
    }

    async update(time: number, delta: number) {
        if (!this.currentPlayer) {
            return;
        }

        const velocity = 300;

        // Reset velocity
        this.currentPlayer.setVelocity(0);

        // Apply movement using velocity instead of position
        if (this.cursorKeys.left.isDown) {
            this.currentPlayer.setVelocityX(-velocity);
            this.currentPlayer.anims.play(
                `${this.network.character}_left_run`,
                true
            );
            this.network.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: `${this.network.character}_left_run`,
            });
            this.lastPressedKey = "left";
        } else if (this.cursorKeys.right.isDown) {
            this.currentPlayer.setVelocityX(velocity);
            this.currentPlayer.anims.play(
                `${this.network.character}_right_run`,
                true
            );
            this.network.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: `${this.network.character}_right_run`,
            });
            this.lastPressedKey = "right";
        } else if (this.cursorKeys.up.isDown) {
            this.currentPlayer.setVelocityY(-velocity);
            this.currentPlayer.anims.play(
                `${this.network.character}_up_run`,
                true
            );
            this.network.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: `${this.network.character}_up_run`,
            });
            this.lastPressedKey = "up";
        } else if (this.cursorKeys.down.isDown) {
            this.currentPlayer.setVelocityY(velocity);
            this.currentPlayer.anims.play(
                `${this.network.character}_down_run`,
                true
            );
            this.network.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: `${this.network.character}_down_run`,
            });
            this.lastPressedKey = "down";
        } else {
            this.currentPlayer.anims.play(
                `${this.network.character}_${this.lastPressedKey}_idle`,
                true
            );
            this.network.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: `${this.network.character}_${this.lastPressedKey}_idle`,
            });
        }

        // interpolate other players.
        for (let sessionId in this.playerEntities) {
            // skipping current player
            if (sessionId === this.network.room.sessionId) continue;

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
            this.joinRoom("MAIN");
        } else if (isInsideEastOffice && this.currentSpace !== "eastOffice") {
            console.log("in east office");
            this.joinRoom("EAST");
        } else if (isInsideWestOffice && this.currentSpace !== "westOffice") {
            console.log("in west office");
            this.joinRoom("WEST");
        } else if (
            isInsideNorthOffice1 &&
            this.currentSpace !== "northOffice1"
        ) {
            console.log("in north office 1");
            this.joinRoom("NORTH_1");
        } else if (
            isInsideNorthOffice2 &&
            this.currentSpace !== "northOffice2"
        ) {
            console.log("in north office 2");
            this.joinRoom("NORTH_2");
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

            this.network.room.send(room, this.network.username);
            store.dispatch(clearOfficeChat()); // player left the office so clear the redux state as well
            store.dispatch(setShowOfficeChat(false));
            videoCalling.removeAllPeerConnections();
            store.dispatch(removeAllPeerConnections());
            store.dispatch(clearPlayerNameMap());
            this.currentSpace = null;
            this.prevSpace = null;
        }
    }
}
