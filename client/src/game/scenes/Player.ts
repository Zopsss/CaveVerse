export class Player extends Phaser.GameObjects.Container {
    private sprite: Phaser.GameObjects.Sprite;
    private usernameText: Phaser.GameObjects.Text;
    private micIcon: Phaser.GameObjects.Image;
    private webcamIcon: Phaser.GameObjects.Image;
    private disconnectIcon: Phaser.GameObjects.Image;
    private statusBubble: Phaser.GameObjects.Graphics;
    private isMicOn: boolean;
    private isWebcamOn: boolean;
    private isDisconnected: boolean;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        character: string,
        username: string,
        isMicOn: boolean,
        isWebcamOn: boolean
    ) {
        super(scene, x, y);

        this.sprite = scene.add.sprite(
            0,
            0,
            character,
            `${character}_down_idle`
        );
        this.add(this.sprite);
        this.sprite.anims.play(`${character}_down_idle`);

        this.usernameText = scene.add
            .text(0, -35, username, {
                fontSize: "13px",
                fontFamily: "Arial",
                color: "#000000",
                padding: { left: 4, right: 4, top: 0 },
                resolution: 10,
            })
            .setOrigin(0.5);
        this.add(this.usernameText);

        // Create status bubble (background)
        this.statusBubble = scene.add.graphics();
        this.add(this.statusBubble);

        this.initializeStatus(isMicOn, isWebcamOn);

        // Draw the bubble after icons are added
        this.redrawStatusBubble();

        scene.add.existing(this);
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(32, 32);
        // body.setOffset(-8, -8);

        this.setSize(32, 32);

        scene.physics.world.enable(this);
        scene.physics.world.enableBody(
            this,
            Phaser.Physics.Arcade.DYNAMIC_BODY
        );

        this.setDepth(5000);
    }

    // Draw a rounded rectangle behind mic/video icons
    private redrawStatusBubble() {
        this.statusBubble.clear();
        const width = 40;
        const height = 20;
        const radius = 10;

        this.statusBubble.fillStyle(0x000000, 0.6);
        this.statusBubble.fillRoundedRect(
            -width / 2,
            30,
            width,
            height,
            radius
        );
    }

    private initializeStatus(isMicOn: boolean, isWebcamOn: boolean) {
        this.isMicOn = isMicOn;
        this.isWebcamOn = isWebcamOn;
        this.isDisconnected = false;

        if (isMicOn) {
            this.micIcon = this.scene.add.image(10, 40, "mic-on");
        } else {
            this.micIcon = this.scene.add.image(10, 40, "mic-off");
        }
        this.micIcon.setScale(0.5);
        this.add(this.micIcon);

        if (isWebcamOn) {
            this.webcamIcon = this.scene.add.image(-10, 40, "camera-on");
        } else {
            this.webcamIcon = this.scene.add.image(-10, 40, "camera-off");
        }
        this.webcamIcon.setScale(0.5);
        this.add(this.webcamIcon);
    }

    playAnimation(animationKey: string) {
        this.sprite.play(animationKey, true);
    }

    getCurrentAnimationKey() {
        return this.sprite.anims.currentAnim.key;
    }

    setMicIcon(on: boolean) {
        this.micIcon.setTexture(on ? "mic-on" : "mic-off");
        this.isMicOn = on;
    }

    setWebcamIcon(on: boolean) {
        this.webcamIcon.setTexture(on ? "camera-on" : "camera-off");
        this.isWebcamOn = on;
    }

    setDisconnectIcon(disconnected: boolean) {
        this.webcamIcon?.destroy();
        this.micIcon?.destroy();
        this.disconnectIcon?.destroy();

        if (disconnected) {
            this.disconnectIcon = this.scene.add.image(0, 40, "phone-off");
            this.disconnectIcon.setScale(0.5);
            this.add(this.disconnectIcon);

            this.isDisconnected = true;
            this.isMicOn = false;
            this.isWebcamOn = false;
        } else {
            this.webcamIcon = this.scene.add.image(-10, 40, "camera-on");
            this.webcamIcon.setScale(0.5);
            this.add(this.webcamIcon);

            this.micIcon = this.scene.add.image(10, 40, "mic-on");
            this.micIcon.setScale(0.5);
            this.add(this.micIcon);

            this.isDisconnected = false;
            this.isMicOn = true;
            this.isWebcamOn = true;
        }
    }

    getCurrentStatus() {
        return {
            isMicOn: this.isMicOn,
            isWebcamOn: this.isWebcamOn,
            isDisconnected: this.isDisconnected,
        };
    }
}
