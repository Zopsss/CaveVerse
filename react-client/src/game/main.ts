import { GameScene as MainGame } from "./scenes/GameScene";
import { AUTO } from "phaser";
import { Bootstrap } from "./scenes/Bootstrap";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "game-container",
    physics: {
        default: "arcade",
        arcade: {
            // debug: true,
            gravity: { y: 0, x: 0 },
        },
    },
    pixelArt: true,
    scene: [Bootstrap, MainGame],
};

const phaserGame = new Phaser.Game(config);

(window as any).game = phaserGame;

export default phaserGame;
