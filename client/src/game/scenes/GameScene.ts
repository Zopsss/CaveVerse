import Phaser from "phaser";
import Network from "./Network";
import { MyPlayer } from "./MyPlayer";
import { Player } from "./Player";
import { Event, phaserEvents } from "../EventBus";

export class GameScene extends Phaser.Scene {
    private mapLayer: Phaser.Tilemaps.TilemapLayer;
    private map!: Phaser.Tilemaps.Tilemap;
    private network: Network;
    private cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
    private myPlayer: MyPlayer;
    private otherPlayers = new Map<string, Player>();

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
        if (this.myPlayer && collidable)
            this.physics.add.collider([this.myPlayer], group);
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

    private handleInitializingPlayer(
        character: string,
        username: string,
        sessionId: string,
        x: number,
        y: number
    ) {
        console.log("current player's sessionId: ", sessionId);

        this.myPlayer = new MyPlayer(
            this,
            x,
            y,
            character,
            username,
            sessionId,
            this.network,
            this.cursorKeys
        );

        this.physics.add.collider(this.myPlayer, this.mapLayer);
        this.cameras.main.startFollow(this.myPlayer);
        this.cameras.main.zoom = 1.7;
        this.loadObjectsFromTiled();

        this.myPlayer.initializePeers();
    }

    private handlePlayerJoined(player: any, sessionId: string) {
        console.log("player added: ", sessionId);
        const character = player.anim.split("_")[0]; // extracting character from the animation

        const entity = new Player(
            this,
            player.x,
            player.y,
            character,
            player.username
        );

        entity.setDepth(100);

        // Store the entity reference
        this.otherPlayers.set(sessionId, entity);

        player.onChange(() => {
            entity.setData("serverX", player.x);
            entity.setData("serverY", player.y);
            entity.setData("anim", player.anim);
        });
    }

    private handlePlayerLeft(sessionId: string) {
        this.otherPlayers.get(sessionId).destroy();
        this.otherPlayers.delete(sessionId);

        this.myPlayer.handlePlayerLeft(sessionId);
    }

    enableKeys() {
        this.input.keyboard.enabled = true;
    }

    disableKeys() {
        this.input.keyboard.enabled = false;
        this.input.keyboard.disableGlobalCapture();
    }

    playerStoppedWebcam() {
        this.myPlayer.playerStoppedWebcam();
    }

    playerStoppedScreenSharing() {
        this.myPlayer.playerStoppedScreenSharing();
    }

    addNewOfficeChatMessage(message: string) {
        this.myPlayer.addNewOfficeChatMessage(message);
    }

    addNewGlobalChatMessage(message: string) {
        this.network.addNewGlobalChatMessage(message);
    }

    async startWebcam(shouldConnectToOtherPlayers = false) {
        this.myPlayer.startWebcam(shouldConnectToOtherPlayers);
    }

    async startScreenSharing() {
        this.myPlayer.startScreenSharing();
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

        // handling phaser events
        phaserEvents.on(
            Event.INITIALIZE_PLAYER,
            this.handleInitializingPlayer,
            this
        );
        phaserEvents.on(Event.PLAYER_JOINED, this.handlePlayerJoined, this);
        phaserEvents.on(Event.PLAYER_LEFT, this.handlePlayerLeft, this);

        this.network.handleServerMessages();
    }

    async update(time: number) {
        if (!this.network || !this.myPlayer) {
            return;
        }

        this.myPlayer?.update();

        // interpolate other players.
        this.otherPlayers.forEach((player, sessionId) => {
            if (player.data) {
                const { serverX, serverY, anim } = player.data.values;
                player.x = Phaser.Math.Linear(player.x, serverX, 0.2);
                player.y = Phaser.Math.Linear(player.y, serverY, 0.2);
                player.anims.play(anim, true);
            }

            this.myPlayer.handleProximityChat(time, sessionId, player);
        });
    }
}
