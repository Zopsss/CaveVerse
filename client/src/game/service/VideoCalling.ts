import { sanitizeUserIdForVideoCalling } from "../../lib/utils";
import {
    addWebcamStream,
    setMyWebcamStream,
} from "../../app/features/webRtc/webcamSlice";
import store from "../../app/store";
import Peer from "peerjs";

class VideoCalling {
    private static instance: VideoCalling;
    private peer: Peer | null = null;
    private initializationPromise: Promise<Peer> | null = null;

    private constructor() {}

    public static getInstance(): VideoCalling {
        if (!VideoCalling.instance) {
            VideoCalling.instance = new VideoCalling();
        }
        return VideoCalling.instance;
    }

    public getPeer(): Peer | null {
        return this.peer;
    }

    public async initializePeer(userId: string): Promise<Peer> {
        // If already initializing, return the existing promise
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        // If already initialized, return the peer
        if (this.peer) {
            return Promise.resolve(this.peer);
        }

        // Create a new initialization promise
        this.initializationPromise = new Promise((resolve, reject) => {
            const sanitizedId = sanitizeUserIdForVideoCalling(userId);
            const peer = new Peer(sanitizedId);

            peer.on("open", (id) => {
                this.peer = peer;

                resolve(peer);
            });

            peer.on("call", (call) => {
                console.log("video call received from", call.peer);
                call.answer();
                call.on("stream", (userStream) => {
                    store.dispatch(
                        addWebcamStream({ peerId: call.peer, call, userStream })
                    );
                });
            });

            peer.on("error", (error) => {
                console.error("Peer error:", error);
                reject(error);
            });
        });

        return this.initializationPromise;
    }

    public shareWebcam(sessionId: string) {
        if (!this.peer) {
            console.error("Cannot call peer - Peer not initialized");
            throw new Error("Peer not initialized");
        }

        const myWebcamStream = store.getState().webcam.myWebcamStream;
        if (!myWebcamStream) {
            console.log("player is not sharing his webcam");
            return;
        }

        try {
            const userId = sanitizeUserIdForVideoCalling(sessionId);
            console.log(
                `${"calling: " + userId + " with my id: " + this.peer.id}`
            );
            this.peer.call(userId, myWebcamStream);
        } catch (err) {
            console.error("Error while sharing screen: ", err);
            throw err;
        }
    }

    getUserMedia = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });

        store.dispatch(setMyWebcamStream(stream));
    };
}

export default VideoCalling.getInstance();
