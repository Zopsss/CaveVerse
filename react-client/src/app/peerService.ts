import Peer, { MediaConnection } from "peerjs";

class PeerService {
    private static instance: PeerService;
    private connectedPeers = new Map<
        string,
        { call: MediaConnection; video: HTMLVideoElement }
    >();
    private calledPeers = new Map<
        string,
        { call: MediaConnection; video: HTMLVideoElement }
    >();
    private peer: Peer | null = null;
    private initializationPromise: Promise<Peer> | null = null;
    private activeCallIds: Set<string> = new Set(); // Track active call IDs to prevent duplicates
    private videoContainer = document.querySelector("#video-container");
    private myVideo = document.createElement("video");
    myStream: MediaStream;

    private constructor() {}

    public static getInstance(): PeerService {
        if (!PeerService.instance) {
            PeerService.instance = new PeerService();
        }
        return PeerService.instance;
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
            const sanitizedId = this.sanitizeUserId(userId);
            const peer = new Peer(sanitizedId);
            this.myVideo.muted = true; // muting own video

            peer.on("open", (id) => {
                this.peer = peer;

                resolve(peer);
            });

            peer.on("call", (call) => {
                if (!this.connectedPeers.has(call.peer)) {
                    call.answer(this.myStream);
                    const video = document.createElement("video");
                    this.connectedPeers.set(call.peer, { call, video });
                    call.on("stream", (userStream) => {
                        this.addVideoStream(video, userStream);
                    });
                }
            });

            peer.on("error", (error) => {
                console.error("Peer error:", error);
                reject(error);
            });
        });

        return this.initializationPromise;
    }

    // PeerJS throws invalid_id error if it contains some characters such as that colyseus generates.
    // https://peerjs.com/docs.html#peer-id
    private sanitizeUserId(userId: string) {
        return userId.replace(/[^0-9a-z]/gi, "X");
    }

    public async connectToNewUser(userId: string): Promise<void> {
        if (!this.peer) {
            console.error("Cannot call peer - Peer not initialized");
            throw new Error("Peer not initialized");
        }

        console.log("Calling peer:", userId, "with my ID:", this.peer.id);

        try {
            // Make the call
            const call = this.peer.call(userId, this.myStream);
            const video = document.createElement("video");

            this.connectedPeers.set(userId, { call, video });

            // Track that we're calling this peer
            this.activeCallIds.add(userId);

            // Handle the stream when we get it
            call.on("stream", (remoteStream) => {
                console.log("Received stream from called peer:", userId);
                this.addVideoStream(video, remoteStream);
            });

            // Handle call closure
            call.on("close", () => {
                console.log("Call to", userId, "closed");
                this.activeCallIds.delete(userId);
            });
        } catch (err) {
            console.error("Error calling peer", userId, ":", err);
            this.activeCallIds.delete(userId);
            throw err;
        }
    }

    // TODO: Remove video when user closes the site when he's inside of office.
    // disconnect remote player when he leaves the office.
    public disconnectUser(userId: string) {
        const sanitizedId = this.sanitizeUserId(userId);

        if (this.connectedPeers.has(sanitizedId)) {
            const peer = this.connectedPeers.get(sanitizedId);
            peer.call.close();
            peer.video.remove();
            this.connectedPeers.delete(sanitizedId);
        }
    }

    // disconnect all the connected peers with current player when he leaves the office.
    public removeAllPeerConnections() {
        // if condition is required otherwise an infinite loops starts
        // if user leaves the office without giving access to his webcam.
        if (this.myStream) {
            this.myStream.getTracks()[0].enabled = false;
            this.myStream.getTracks()[1].enabled = false;
            this.myVideo.remove();
        }

        this.connectedPeers.forEach((peer) => {
            peer.call.close();
            peer.video.remove();
        });

        this.connectedPeers.clear();
    }

    private addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
        video.srcObject = stream;
        video.playsInline = true;
        video.addEventListener("loadeddata", () => video.play());

        if (this.videoContainer) {
            this.videoContainer.appendChild(video);
        }
    }

    getUserMedia() {
        navigator.mediaDevices
            .getUserMedia({
                audio: true,
                video: true,
            })
            .then((stream) => {
                this.myStream = stream;
                this.addVideoStream(this.myVideo, stream);
            });
    }

    public destroyPeer(): void {
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
            this.initializationPromise = null;
        }
    }
}

export default PeerService.getInstance();
