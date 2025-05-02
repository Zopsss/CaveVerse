import { Events } from "phaser";

// Used to emit events between React components and Phaser scenes
// https://newdocs.phaser.io/docs/3.70.0/Phaser.Events.EventEmitter
export const phaserEvents = new Events.EventEmitter();

export enum Event {
    INITIALIZE_PLAYER = "initialize-player",
    PLAYER_JOINED = "player-joined",
    PLAYER_LEFT = "player-left",
}
