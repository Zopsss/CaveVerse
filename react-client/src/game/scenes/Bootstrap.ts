import { setRoomJoined } from "../../app/features/room/roomSlice";
import store from "../../app/store";
import Network from "./Network";

export class Bootstrap extends Phaser.Scene {
    network: Network;

    constructor() {
        super("bootstrap");
    }

    preload() {
        this.load.atlas(
            "nancy",
            "assets/characters/nancy/nancy.png",
            "assets/characters/nancy/nancy_atlas.json"
        );
        this.load.animation(
            "nancy_anim",
            "assets/characters/nancy/nancy_anim.json"
        );
        this.load.atlas(
            "ash",
            "assets/characters/ash/ash.png",
            "assets/characters/ash/ash_atlas.json"
        );
        this.load.animation("ash_anim", "assets/characters/ash/ash_anim.json");
        this.load.atlas(
            "lucy",
            "assets/characters/lucy/lucy.png",
            "assets/characters/lucy/lucy_atlas.json"
        );
        this.load.animation(
            "lucy_anim",
            "assets/characters/lucy/lucy_anim.json"
        );
        this.load.atlas(
            "adam",
            "assets/characters/adam/adam.png",
            "assets/characters/adam/adam_atlas.json"
        );
        this.load.animation(
            "adam_anim",
            "assets/characters/adam/adam_anim.json"
        );
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

    init() {
        this.network = new Network();
    }

    launchGame() {
        this.scene.launch("GameScene", { network: this.network });
        store.dispatch(setRoomJoined(true));
    }
}
