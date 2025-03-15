import { setRoomJoined } from "../../app/features/room/roomSlice";
import store from "../../app/store";

export class Bootstrap extends Phaser.Scene {
    constructor() {
        super("bootstrap");
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

    launchGame() {
        this.scene.launch("GameScene");
        store.dispatch(setRoomJoined(true));
    }
}
