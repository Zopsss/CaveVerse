"use client";

import { AUTO, Game } from "phaser";
import { GameScene } from "./scenes/GameScene";

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
            //   debug: true,
            gravity: { y: 0, x: 0 },
        },
    },
    scale: {
        mode: Phaser.Scale.ScaleModes.RESIZE,
    },
    pixelArt: true,
    scene: [GameScene],
};

// const StartGame = (parent: string) => {
//     phaserGame = new Game({ ...config, parent });
//     return phaserGame;
// };

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

// export let phaserGame: Game;
export default StartGame;
