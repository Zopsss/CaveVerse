import Phaser from "phaser";
import Network from "./Network";

export class GameScene extends Phaser.Scene {
    mapLayer: Phaser.Tilemaps.TilemapLayer;
    map!: Phaser.Tilemaps.Tilemap;
    network: Network;

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
        if (this.network.currentPlayer && collidable)
            this.physics.add.collider([this.network.currentPlayer], group);
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

        this.network.cursorKeys = this.input.keyboard.createCursorKeys();

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
            this.network.otherPlayers[sessionId] = entity;

            // Is current player
            if (sessionId === this.network.room.sessionId) {
                console.log(
                    "current player's sessionId: ",
                    this.network.room.sessionId
                );
                this.network.currentPlayer = entity;
                this.physics.add.collider(
                    this.network.currentPlayer,
                    this.mapLayer
                );
                this.cameras.main.startFollow(this.network.currentPlayer);
                this.cameras.main.zoom = 1.7;
                this.loadObjectsFromTiled();

                this.network.initializePeers();
            } else {
                // Other players
                player.onChange(() => {
                    entity.setData("serverX", player.x);
                    entity.setData("serverY", player.y);
                    entity.setData("anim", player.anim);
                });
            }
        });

        this.network.handleServerMessages();
    }

    async update(time: number, delta: number) {
        this.network.update();
    }
}
