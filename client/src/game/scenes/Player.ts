export class Player extends Phaser.Physics.Arcade.Sprite {
    character: string;
    username: string;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        character: string,
        username: string
    ) {
        super(scene, x, y, character);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.character = character;
        this.username = username;

        this.anims.play(`${this.character}_down_idle`, true);
    }
}
