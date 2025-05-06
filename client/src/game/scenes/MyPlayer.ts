import store from "../../app/store";
import Network from "./Network";
import { OfficeManager } from "./OfficeManager";
import { Player } from "./Player";
import {
    disconnectFromVideoCall,
    disconnectUserForVideoCalling,
    removeAllPeerConnectionsForVideoCalling,
} from "../../app/features/webRtc/webcamSlice";
import videoCalling from "../service/VideoCalling";
import screenSharing from "../service/ScreenSharing";
import {
    clearOfficeChat,
    setShowOfficeChat,
} from "../../app/features/chat/chatSlice";
import {
    clearPlayerNameMap,
    removeAllPeerConnectionsForScreenSharing,
    setPlayerNameMap,
} from "../../app/features/webRtc/screenSlice";
import { officeNames, sanitizeUserIdForScreenSharing } from "../../lib/utils";

export class MyPlayer extends Player {
    private static SPEED = 300;
    private static PROXIMITY_CONNECT_DELAY = 500;

    private lastX: number;
    private lastY: number;
    private mySessionId: string;
    private character: string;

    private currentOffice: officeNames;
    private network: Network;
    private cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;
    private officeManager: OfficeManager;
    private proximityPlayers = new Map<string, Player>();
    private proximityTimers = new Map<
        string,
        { enterTime: number; connected: boolean }
    >();

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        character: string,
        username: string,
        mySessionId: string,
        isMicOn: boolean,
        isWebcamOn: boolean,
        network: Network,
        cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys
    ) {
        super(scene, x, y, character, username, isMicOn, isWebcamOn);

        this.character = character;
        this.mySessionId = mySessionId;
        this.officeManager = new OfficeManager();
        this.network = network;
        this.cursorKeys = cursorKeys;
    }

    /** Handles current player's movements and notifies the server. */
    private handlePlayerMovements() {
        let vx = 0;
        let vy = 0;

        // set velocity x & y and player's animation
        if (this.cursorKeys.left.isDown) {
            vx -= MyPlayer.SPEED;
            this.playAnimation(`${this.character}_left_run`);
        } else if (this.cursorKeys.right.isDown) {
            vx += MyPlayer.SPEED;
            this.playAnimation(`${this.character}_right_run`);
        } else if (this.cursorKeys.up.isDown) {
            vy -= MyPlayer.SPEED;
            this.playAnimation(`${this.character}_up_run`);
        } else if (this.cursorKeys.down.isDown) {
            vy += MyPlayer.SPEED;
            this.playAnimation(`${this.character}_down_run`);
        } else {
            const currentAnimKey = this.getCurrentAnimationKey();
            const parts = currentAnimKey.split("_");
            parts[2] = "idle"; // getting the last "run" animation and changing it to idle
            const idleAnim = parts.join("_");

            // this prevents sending idle animation multiple times to the server
            if (currentAnimKey !== idleAnim) {
                this.playAnimation(idleAnim);
                this.network.updatePlayer(this.x, this.y, idleAnim);
            }
        }

        // set the velocity of the player
        (this.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);

        // if player is moving then send his live position to the server.
        if (vx !== 0 || vy !== 0) {
            const currentAnimKey = this.getCurrentAnimationKey();

            this.network.updatePlayer(this.x, this.y, currentAnimKey);
        }
    }

    /**
     * Handles office joining.
     *
     * @param officeName office's name
     */
    private joinOffice(officeName: officeNames) {
        this.currentOffice = officeName;
        this.proximityPlayers.clear();
        this.proximityTimers.clear();

        store.dispatch(setShowOfficeChat(true));

        // if player has previously given webcam access then upon joining the office,
        // call other present players of the office and share current player's webcam with them.
        if (store.getState().webcam.myWebcamStream) {
            this.startWebcam();
        }

        // notify other players & connect to the office
        this.network.joinOffice(this.currentOffice);

        // TODO: Instead of adding & removing data in playerNameMap
        // as player joins or leaves a room,
        // maintain this map from the moment player joins the game
        const { members } = this.network.getOfficeData(this.currentOffice);
        members.forEach((username, sessionId) => {
            store.dispatch(
                setPlayerNameMap({
                    peerId: sanitizeUserIdForScreenSharing(sessionId),
                    username: username,
                })
            );
        });
    }

    private leaveOffice() {
        this.network.leaveOffice(this.currentOffice);

        store.dispatch(clearOfficeChat());
        store.dispatch(setShowOfficeChat(false));
        store.dispatch(removeAllPeerConnectionsForVideoCalling());
        store.dispatch(removeAllPeerConnectionsForScreenSharing());
        store.dispatch(clearPlayerNameMap());

        this.currentOffice = null;
    }

    private handleOfficeJoiningAndLeaving() {
        const { x, y } = this;

        if (x !== this.lastX || y !== this.lastY) {
            const office = this.officeManager.update(x, y);

            if (office && this.currentOffice !== office) {
                this.joinOffice(office);
            } else if (!office && this.currentOffice) {
                this.leaveOffice();
            }

            this.lastX = x;
            this.lastY = y;
        }
    }

    private shareWebcamWithProximityPlayers(
        shouldConnectToOtherPlayers: boolean
    ) {
        for (const sessionId of this.proximityPlayers.keys()) {
            videoCalling.shareWebcam(sessionId);
        }

        // when player uses "Disconnect from video call button" and then turns on his camera again,
        // then we need to let other players know that the current player has started his webcam again.
        // TODO: Investigate this logic....
        if (shouldConnectToOtherPlayers) {
            this.network.connectToProximityVideoCall(
                Array.from(this.proximityPlayers.keys())
            );
        }
    }

    private shareWebcamWithOfficePlayers(shouldConnectToOtherPlayers: boolean) {
        const { members } = this.network.getOfficeData(this.currentOffice);

        members.forEach((username, sessionId) => {
            // preventing calling ourself
            if (sessionId === this.mySessionId) return;

            // when current player starts sharing his webcam
            // call other present players of the office and share webcam stream with them.
            videoCalling.shareWebcam(sessionId);
        });

        // when player uses "Disconnect from video call button" and then turns on his camera again,
        // then we need to let other players know that the current player has started his webcam again.
        // TODO: Investigate this logic....
        if (shouldConnectToOtherPlayers) {
            this.network.connectToOfficeVideoCall(this.currentOffice);
        }
    }

    /**
     * Starts current player's webcam.
     *
     * Gets the current player's webcam media and calls all the members of the current office.
     */
    async startWebcam(shouldConnectToOtherPlayers = false) {
        await videoCalling.getUserMedia();

        this.updateDisconnectStatus(false);
        if (this.currentOffice) {
            this.shareWebcamWithOfficePlayers(shouldConnectToOtherPlayers);
        } else {
            this.shareWebcamWithProximityPlayers(shouldConnectToOtherPlayers);
        }
    }

    /**
     * Starts streaming current player's screen.
     *
     * Gets the current player's display media and calls all the members of the current office.
     */
    async startScreenSharing() {
        await screenSharing.getUserMedia();

        const { members } = this.network.getOfficeData(this.currentOffice);
        members.forEach((username, sessionId) => {
            // preventing calling ourself
            if (sessionId === this.mySessionId) return;

            // when current player starts sharing his screen
            // call other present players of the office and share screen stream with them.
            screenSharing.shareScreen(sessionId);
        });
    }

    /**
     * Handles disconnect status of the player
     * If player clicks on "Disconnect from video calls" button,
     * it removes mic/webcam icons and shows disconenct icon
     * If player reconnects, it removes disconnect icon and shows mic/webcam icons
     * It also notifies server about these updates.
     *
     * @param disconnected if true, show disconnect button otherwise show mic/webcam button
     */
    updateDisconnectStatus(disconnected: boolean) {
        this.setDisconnectIcon(disconnected);

        const status = this.getCurrentStatus();
        this.network.updatePlayer(
            this.x,
            this.y,
            this.getCurrentAnimationKey(),
            status
        );
    }

    /**
     * Handles proximity chat between players.
     *
     * The logic prioritizes disconnection checks before attempting a connection:
     * 1. If the player moves away after the timer started, disconnect and clean up.
     * 2. If the proximity player enters an office, disconnect immediately.
     * 3. Only then, if the player is still near and both are outside any office, start or complete connection.
     *
     * This order ensures cleanup and disconnects are handled first, avoiding unnecessary
     * connection attempts and reducing redundant proximity checks.
     *
     * @param time update()'s time (from Phaser's update loop)
     * @param sessionId session ID of the proximity player
     * @param otherPlayer the proximity player's sprite
     */
    handleProximityChat(time: number, sessionId: string, otherPlayer: Player) {
        const distance = Phaser.Math.Distance.Between(
            this.x,
            this.y,
            otherPlayer.x,
            otherPlayer.y
        );

        const isProximityPlayerInOffice = OfficeManager.isInOffice(
            otherPlayer.x,
            otherPlayer.y
        );

        // disconnect if player was previously tracked but moved away
        if (this.proximityTimers.has(sessionId) && distance > 50) {
            const timer = this.proximityTimers.get(sessionId);

            // player's timer was started but before connecting
            // he moved away so no need to keep his timer anymore.
            if (!timer.connected) {
                this.proximityTimers.delete(sessionId);
                return;
            }

            // if moved away player was connected then disconnect with him
            store.dispatch(disconnectUserForVideoCalling(sessionId));

            this.proximityPlayers.delete(sessionId);
            this.proximityTimers.delete(sessionId);

            // notifying proximity player to disconnect with current player
            this.network.removeFromProximityCall(sessionId);

            return;
        }

        // disconnect if player is already connected and entered an office
        if (this.proximityPlayers.has(sessionId) && isProximityPlayerInOffice) {
            store.dispatch(disconnectUserForVideoCalling(sessionId));

            this.proximityPlayers.delete(sessionId);
            this.proximityTimers.delete(sessionId);

            // notifying proximity player to disconnect with current player
            this.network.removeFromProximityCall(sessionId);

            return;
        }

        // connect if near and both are not in office
        if (
            distance <= 50 &&
            !this.currentOffice &&
            !isProximityPlayerInOffice
        ) {
            // player just came near the current player, start his timer and return
            if (!this.proximityTimers.has(sessionId)) {
                this.proximityTimers.set(sessionId, {
                    enterTime: time,
                    connected: false,
                });
                return;
            }

            // player is near for enough time and is not already connected
            // only then connect with him
            const timer = this.proximityTimers.get(sessionId);
            if (
                !timer.connected &&
                time - timer.enterTime >= MyPlayer.PROXIMITY_CONNECT_DELAY
            ) {
                // this.proximityPlayers[sessionId] = otherPlayer;
                this.proximityPlayers.set(sessionId, otherPlayer);
                timer.connected = true;
                videoCalling.shareWebcam(sessionId);
            }
        }
    }

    handlePlayerLeft(sessionId: string) {
        store.dispatch(disconnectUserForVideoCalling(sessionId));
        this.proximityPlayers.delete(sessionId);
        this.proximityTimers.delete(sessionId);
    }

    playerStoppedScreenSharing() {
        this.network.playerStoppedScreenSharing(this.currentOffice);
    }

    /**
     * Stops webcam.
     *
     * Letting other players know that the current player
     * stopped his webcam.
     */
    playerStoppedWebcam() {
        // TODO: Add a common folder between server & client where all types can be declared.
        // because currentOffice can be set to invalid string which server cannot handle.
        store.dispatch(disconnectFromVideoCall());
        this.updateDisconnectStatus(true);
        if (this.currentOffice) {
            this.network.userStoppedOfficeWebcam(this.currentOffice);
        } else {
            this.network.userStoppedProximityWebcam(
                Array.from(this.proximityPlayers.keys())
            );
        }
    }

    addNewOfficeChatMessage = (message: string) => {
        this.network.addNewOfficeChatMessage(message, this.currentOffice);
    };

    /**
     * Initializes Video Calling & Screen Sharing peers.
     */
    initializePeers = () => {
        videoCalling
            .initializePeer(this.mySessionId)
            .then((peer) => {
                console.log("peer initialized for video calling: ", peer.id);
            })
            .catch((error) => {
                console.error("Failed to initialize peer:", error);
            });

        screenSharing.initializePeer(this.mySessionId).then((peer) => {
            console.log("peer initialized for screen sharing: ", peer.id);
        });
    };

    update() {
        this.handlePlayerMovements();
        this.handleOfficeJoiningAndLeaving();
    }
}
