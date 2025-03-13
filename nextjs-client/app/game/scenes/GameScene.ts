import { Room, Client } from "colyseus.js";
import { BACKEND_URL } from "../backend";
import {
    playerJoinedMessage,
    playerLeftMessage,
    pushNewMessage,
    setFocused,
    setShowChat,
} from "@/lib/store/features/chatSlice";
import { storeRef } from "@/app/StoreProvider";

export class GameScene extends Phaser.Scene {
    room: Room;
    currentPlayer: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    playerEntities: {
        [sessionId: string]: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    } = {};
    remoteRef: Phaser.GameObjects.Rectangle;
    cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
    mapLayer: Phaser.Tilemaps.TilemapLayer;
    map!: Phaser.Tilemaps.Tilemap;
    isInSpace = false;
    client!: Client;
    officeRoom: Room;

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

    enableKeys() {
        this.input.keyboard.enabled = true;
    }

    disableKeys() {
        this.input.keyboard.enabled = false;
        this.input.keyboard.disableGlobalCapture();
    }

    preload() {
        this.load.atlas("queen", "assets/queen.png", "assets/queen_atlas.json");
        this.load.animation("queen_anim", "assets/queen_anim.json");
        this.load.tilemapTiledJSON("map", "/assets/map/map.json");
        this.load.spritesheet("chair", "assets/items/chair.png", {
            frameWidth: 32,
            frameHeight: 32,
        });
        this.load.spritesheet("generic", "assets/tileset/Generic.png", {
            frameWidth: 32,
            frameHeight: 32,
        });
        this.load.spritesheet("basement", "assets/tileset/Basement.png", {
            frameWidth: 32,
            frameHeight: 32,
        });
        this.load.spritesheet(
            "modern_office",
            "assets/tileset/Modern_Office_Black_Shadow.png",
            {
                frameWidth: 32,
                frameHeight: 32,
            }
        );
        this.load.spritesheet("whiteboard", "assets/items/whiteboard.png", {
            frameWidth: 32,
            frameHeight: 32,
        });
        this.load.spritesheet("chair", "assets/items/chair.png", {
            frameWidth: 32,
            frameHeight: 32,
        });
        this.load.image("ground_tiles", "assets/map/FloorAndGround.png");
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

        this.room.state.mainOfficeChat.onAdd((item, sessionId) => {
            console.log("item: ", item.username, item.message);
            storeRef.current.dispatch(
                pushNewMessage({
                    username: item.username,
                    message: item.message,
                })
            );
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

    connectMainOfficeRoom() {
        try {
            this.room.send("JOIN_MAIN_OFFICE");
            storeRef.current.dispatch(setShowChat(true));
            console.log("room joined");
        } catch (error) {
            console.error(error);
        }
    }

    disconnectMainOfficeRoom() {
        try {
            this.room.send("LEFT_MAIN_OFFICE");
            storeRef.current.dispatch(setShowChat(false));
            storeRef.current.dispatch(setFocused(false));
            console.log("room left");
        } catch (error) {
            console.error(error);
        }
    }

    addNewMessage(content: string) {
        this.room.send("addMainOfficeChatMessage", {
            username: "Nennuuuu",
            message: content,
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

        const layerX = 799.85;
        const layerY = 608.02;
        const layerWidth = 799.85;
        const layerHeight = 512.02;
        if (
            this.currentPlayer.x >= layerX &&
            this.currentPlayer.x <= layerX + layerWidth &&
            this.currentPlayer.y >= layerY &&
            this.currentPlayer.y <= layerY + layerHeight &&
            !this.isInSpace
        ) {
            this.isInSpace = true;
            await this.connectMainOfficeRoom();
        } else if (
            (this.currentPlayer.x <= layerX ||
                this.currentPlayer.x >= layerX + layerWidth ||
                this.currentPlayer.y <= layerY ||
                this.currentPlayer.y >= layerY + layerHeight) &&
            this.isInSpace
        ) {
            this.isInSpace = false;
            this.disconnectMainOfficeRoom();
        }
    }
}
