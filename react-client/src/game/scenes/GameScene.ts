import Phaser from "phaser";
import { Room, Client } from "colyseus.js";
import { BACKEND_URL } from "../backend";
import {
    addChat,
    clearChat,
    pushNewMessage,
    setShowChat,
} from "../../app/features/chat/chatSlice";
import store from "../../app/store";
import Peer from "peerjs";
import peerService from "../../app/peerService";

type OfficeType = "MAIN" | "EAST" | "NORTH_1" | "NORTH_2" | "WEST";

export class GameScene extends Phaser.Scene {
    room: Room;
    currentPlayer: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    currentPlayerUsername: string;
    currentSessionId: string;
    playerEntities: {
        [sessionId: string]: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    } = {};
    remoteRef: Phaser.GameObjects.Rectangle;
    cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
    mapLayer: Phaser.Tilemaps.TilemapLayer;
    map!: Phaser.Tilemaps.Tilemap;
    client!: Client;
    officeRoom: Room;
    sessionID: string;
    myPeer: Peer;
    currentSpace:
        | "mainOffice"
        | "eastOffice"
        | "westOffice"
        | "northOffice1"
        | "northOffice2";
    prevSpace:
        | "mainOffice"
        | "eastOffice"
        | "westOffice"
        | "northOffice1"
        | "northOffice2";

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
        peerService.getUserMedia();

        // initialize the peer
        peerService
            .initializePeer(this.room.sessionId)
            .then((peer) => {
                store.dispatch(setShowChat(true));
                // connect to the office
                this.room.send(`JOIN_${roomName}_OFFICE`, {
                    peerId: peer.id,
                    username: this.currentPlayerUsername,
                });
            })
            .catch((error) => {
                console.error("Failed to initialize peer:", error);
                store.dispatch(setShowChat(true));
            });
    }

    async connect() {
        this.client = new Client(BACKEND_URL);

        try {
            this.room = await this.client.joinOrCreate("my_room", {});
        } catch (e) {
            console.error(e);
        }
    }

    addNewMessage(content: string) {
        let addMessage: string;
        console.log(this.currentSpace);

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
            username: this.currentPlayerUsername,
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
        this.currentPlayerUsername = username;
    }

    async create() {
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

        // Connect with the room
        await this.connect();

        this.room.state.players.onAdd((player, sessionId) => {
            console.log("player added: ", sessionId);
            const entity = this.physics.add.sprite(
                player.x,
                player.y,
                "queen",
                "queen_idle"
            );

            entity.setDepth(100);

            // Store the entity reference
            this.playerEntities[sessionId] = entity;

            // Is current player
            if (sessionId === this.room.sessionId) {
                this.currentPlayer = entity;
                this.currentSessionId = sessionId;
                this.physics.add.collider(this.currentPlayer, this.mapLayer);
                this.cameras.main.startFollow(this.currentPlayer);
                this.cameras.main.zoom = 1.7;
                this.loadObjectsFromTiled();
            } else {
                // Other players
                player.onChange(() => {
                    entity.setData("serverX", player.x);
                    entity.setData("serverY", player.y);
                    entity.setData("anim", player.anim);
                });
            }
        });

        this.room.state.players.onRemove((player, sessionId) => {
            const entity = this.playerEntities[sessionId];
            if (entity) {
                entity.destroy();
                delete this.playerEntities[sessionId];
            }
        });

        // TODO: Fix "Cannot call peer - No local stream available"
        this.room.onMessage("USER_CONNECTED", async (userId) => {
            try {
                setTimeout(async () => {
                    // Ensure PeerJS is initialized
                    await peerService.initializePeer(this.room.sessionId);

                    // Call the new user
                    await peerService.connectToNewUser(userId);
                }, 3000);
            } catch (err) {
                console.error("Failed to connect to new user:", err);
            }
        });

        this.room.onMessage("USER_DISCONNECTED", (userId) => {
            peerService.disconnectUser(userId);
        });

        this.room.state.mainOfficeChat.onAdd((item) => {
            const isInMainOfficeChat: boolean =
                this.room.state.mainOfficeMembers.has(this.room.sessionId);

            if (!isInMainOfficeChat) return; // if current player is not in this space then don't do anything.

            if (this.prevSpace === "mainOffice") {
                // this means the player is already in main office chat
                // so push whatever message comes to redux store.
                store.dispatch(
                    pushNewMessage({
                        username: item.username,
                        message: item.message,
                        type: item.type,
                    })
                );
            } else {
                // this means that the player just joined main office chat,
                // so we will get the whole chat and push it to the redux store.
                const allMessages = this.room.state.mainOfficeChat.map(
                    (msg) => {
                        return {
                            username: msg.username,
                            message: msg.message,
                            type: msg.type,
                        };
                    }
                );
                store.dispatch(addChat(allMessages));
                this.prevSpace = "mainOffice";
            }
        });

        this.room.state.eastOfficeChat.onAdd((item) => {
            const isInEastOfficeChat: boolean =
                this.room.state.eastOfficeMembers.has(this.room.sessionId);

            if (!isInEastOfficeChat) return; // if current player is not in this space then don't do anything.

            if (this.prevSpace === "eastOffice") {
                // this means the player is already in main office chat
                // so push whatever message comes to redux store.
                store.dispatch(
                    pushNewMessage({
                        username: item.username,
                        message: item.message,
                        type: item.type,
                    })
                );
            } else {
                // this means that the player just joined main office chat,
                // so we will get the whole chat and push it to the redux store.
                console.log("player just joined the chat");
                const allMessages = this.room.state.eastOfficeChat.map(
                    (msg) => {
                        return {
                            username: msg.username,
                            message: msg.message,
                            type: msg.type,
                        };
                    }
                );
                store.dispatch(addChat(allMessages));
                this.prevSpace = "eastOffice";
            }
        });

        this.room.state.westOfficeChat.onAdd((item) => {
            const isInWestOfficeChat: boolean =
                this.room.state.westOfficeMembers.has(this.room.sessionId);

            if (!isInWestOfficeChat) return; // if current player is not in this space then don't do anything.

            if (this.prevSpace === "westOffice") {
                // this means the player is already in main office chat
                // so push whatever message comes to redux store.
                store.dispatch(
                    pushNewMessage({
                        username: item.username,
                        message: item.message,
                        type: item.type,
                    })
                );
            } else {
                // this means that the player just joined main office chat,
                // so we will get the whole chat and push it to the redux store.
                console.log("player just joined the chat");
                const allMessages = this.room.state.westOfficeChat.map(
                    (msg) => {
                        return {
                            username: msg.username,
                            message: msg.message,
                            type: msg.type,
                        };
                    }
                );
                store.dispatch(addChat(allMessages));
                this.prevSpace = "westOffice";
            }
        });

        this.room.state.northOffice1Chat.onAdd((item) => {
            const isInNorthOffice1Chat: boolean =
                this.room.state.northOffice1Members.has(this.room.sessionId);

            if (!isInNorthOffice1Chat) return; // if current player is not in this space then don't do anything.

            if (this.prevSpace === "northOffice1") {
                // this means the player is already in main office chat
                // so push whatever message comes to redux store.
                store.dispatch(
                    pushNewMessage({
                        username: item.username,
                        message: item.message,
                        type: item.type,
                    })
                );
            } else {
                // this means that the player just joined main office chat,
                // so we will get the whole chat and push it to the redux store.
                console.log("player just joined the chat");
                const allMessages = this.room.state.northOffice1Chat.map(
                    (msg) => {
                        return {
                            username: msg.username,
                            message: msg.message,
                            type: msg.type,
                        };
                    }
                );
                store.dispatch(addChat(allMessages));
                this.prevSpace = "northOffice1";
            }
        });

        this.room.state.northOffice2Chat.onAdd((item) => {
            const isInNorthOffice2Chat: boolean =
                this.room.state.northOffice2Members.has(this.room.sessionId);

            if (!isInNorthOffice2Chat) return; // if current player is not in this space then don't do anything.

            if (this.prevSpace === "northOffice2") {
                // this means the player is already in main office chat
                // so push whatever message comes to redux store.
                store.dispatch(
                    pushNewMessage({
                        username: item.username,
                        message: item.message,
                        type: item.type,
                    })
                );
            } else {
                // this means that the player just joined main office chat,
                // so we will get the whole chat and push it to the redux store.
                console.log("player just joined the chat");
                const allMessages = this.room.state.northOffice2Chat.map(
                    (msg) => {
                        return {
                            username: msg.username,
                            message: msg.message,
                            type: msg.type,
                        };
                    }
                );
                store.dispatch(addChat(allMessages));
                this.prevSpace = "northOffice2";
            }
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
        } else if (this.cursorKeys.right.isDown) {
            this.currentPlayer.setVelocityX(velocity);
        } else if (this.cursorKeys.up.isDown) {
            this.currentPlayer.setVelocityY(-velocity);
        } else if (this.cursorKeys.down.isDown) {
            this.currentPlayer.setVelocityY(velocity);
        }

        const currVelocity = this.currentPlayer.body.velocity;
        if (Math.abs(currVelocity.x) > 0.1 || Math.abs(currVelocity.y) > 0.1) {
            this.currentPlayer.anims.play("queen_walk", true);
            this.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: "queen_walk",
            });
        } else {
            this.currentPlayer.anims.play("queen_idle", true);
            this.room.send(0, {
                playerX: this.currentPlayer.x,
                playerY: this.currentPlayer.y,
                anim: "queen_idle",
            });
        }

        // interpolate other players.
        for (let sessionId in this.playerEntities) {
            if (sessionId === this.room.sessionId) continue;

            const entity = this.playerEntities[sessionId];
            const { serverX, serverY, anim } = entity.data.values;

            entity.x = Phaser.Math.Linear(entity.x, serverX, 0.2);
            entity.y = Phaser.Math.Linear(entity.y, serverY, 0.2);
            entity.anims.play(anim, true);
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
            store.dispatch(setShowChat(false));
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

            this.room.send(room, this.currentPlayerUsername);
            store.dispatch(clearChat()); // player left the office so clear the redux state as well
            store.dispatch(setShowChat(false));
            peerService.removeAllPeerConnections();
            this.currentSpace = null;
            this.prevSpace = null;
        }
    }
}
