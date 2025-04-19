import { Room, Client } from "colyseus";
import { MyRoomState, Player, OfficeChat } from "../rooms/schema/MyRoomState";

type officeNames =
    | "mainOffice"
    | "eastOffice"
    | "westOffice"
    | "northOffice1"
    | "northOffice2";
interface InputMessageType {
    username: string;
    message: string;
}
export class MyRoom extends Room<MyRoomState> {
    room: string;
    roomPassword: string;
    hasPassword = false;

    // for debugging purpose only
    getAllMessages() {
        const allMessages: {
            username: string;
            message: string;
        }[] = [];
        this.state.mainOfficeChat.forEach((msg) => {
            allMessages.push({
                username: msg.username,
                message: msg.message,
            });
        });
        console.log("All Messages: ", allMessages);
        console.log("----------------------------");
    }

    /** Helper method to get the appropriate state properties for each office */
    private getOfficeData(officeName: officeNames) {
        const officeMap = {
            mainOffice: {
                members: this.state.mainOfficeMembers,
                chat: this.state.mainOfficeChat,
                name: "main office",
            },
            eastOffice: {
                members: this.state.eastOfficeMembers,
                chat: this.state.eastOfficeChat,
                name: "east office",
            },
            westOffice: {
                members: this.state.westOfficeMembers,
                chat: this.state.westOfficeChat,
                name: "west office",
            },
            northOffice1: {
                members: this.state.northOffice1Members,
                chat: this.state.northOffice1Chat,
                name: "north 1 office",
            },
            northOffice2: {
                members: this.state.northOffice2Members,
                chat: this.state.northOffice2Chat,
                name: "north 2 office",
            },
        };

        return officeMap[officeName];
    }

    /** Helper method to get user's office type, used when user leaves the game */
    private getUserOfficeName(sessionId: string): officeNames {
        if (this.state.mainOfficeMembers.has(sessionId)) {
            return "mainOffice";
        } else if (this.state.eastOfficeMembers.has(sessionId)) {
            return "eastOffice";
        } else if (this.state.westOfficeMembers.has(sessionId)) {
            return "westOffice";
        } else if (this.state.northOffice1Members.has(sessionId)) {
            return "northOffice1";
        } else if (this.state.northOffice2Members.has(sessionId)) {
            return "northOffice2";
        }

        return null;
    }

    private handleOfficeJoin(
        client: Client,
        username: string,
        officeName: officeNames
    ) {
        const sessionId = client.sessionId;
        const { chat, members, name } = this.getOfficeData(officeName);

        const message = `Just joined ${name} lobby`;
        const messageType = "PLAYER_JOINED";
        const newMessage = new OfficeChat();
        newMessage.username = username;
        newMessage.message = message;
        newMessage.type = messageType;

        // Add user to the appropriate office members collection
        members.set(sessionId, username);

        // Add message to the appropriate chat collection
        chat.push(newMessage);

        client.send("GET_OFFICE_CHAT", chat);

        // Notify other players when current player enters office.
        members.forEach((username, userId) => {
            if (userId === client.sessionId) return;

            this.clients.getById(userId).send("USER_JOINED_OFFICE", {
                playerSessionId: client.sessionId,
                username,
                message,
                type: messageType,
            });
        });

        const allMembers: any = [];
        members.forEach((value, key) => {
            allMembers.push({ key, value });
        });
        console.log("chat members: ", allMembers);
    }

    private handleOfficeLeave(
        client: Client,
        username: string,
        officeName: officeNames
    ) {
        const sessionId = client.sessionId;
        const { name, chat, members } = this.getOfficeData(officeName);
        // if condition is required when user haven't given his webcam permission yet, otherwise servers gives this error:
        // @colyseus/schema MapSchema: trying to delete non-existing index: vd04glYYb (undefined)
        // TODO: don't know why this is happening, need to investigate it!!!!
        if (members.has(sessionId)) {
            const message = `Left ${name} lobby`;
            const messageType = "PLAYER_LEFT";
            const newMessage = new OfficeChat();
            newMessage.username = username;
            newMessage.message = message;
            newMessage.type = messageType;

            chat.push(newMessage);

            members.delete(sessionId);

            // Notify other players when current player leaves office.
            members.forEach((username, userId) => {
                this.clients.getById(userId).send("PLAYER_LEFT_OFFICE", {
                    playerSessionId: client.sessionId,
                    username,
                    message,
                    type: messageType,
                });
            });
        }
    }

    onAuth(
        client: Client,
        options: { roomName: string; password: string | null }
    ) {
        if (!this.roomPassword) return true;

        if (this.roomPassword === options.password) {
            return true;
        }
        return false;
    }

    onCreate(options: { name: string; password: string | null }) {
        this.room = options.name;
        this.roomPassword = options.password;
        if (options.password) this.hasPassword = true;
        this.setMetadata({ name: options.name, hasPassword: this.hasPassword });

        this.setState(new MyRoomState());

        this.onMessage(0, (client, input) => {
            const player = this.state.players.get(client.sessionId);
            player.x = input.playerX;
            player.y = input.playerY;
            player.anim = input.anim;
        });

        this.onMessage("JOIN_OFFICE", (client, { username, office }) => {
            this.handleOfficeJoin(client, username, office);
        });

        this.onMessage("LEAVE_OFFICE", (client, { username, office }) => {
            this.handleOfficeLeave(client, username, office);
        });

        this.onMessage(
            "PUSH_OFFICE_MESSAGE",
            (client, { username, message, officeName }) => {
                const { members, chat } = this.getOfficeData(officeName);
                const newMessage = new OfficeChat();
                newMessage.username = username;
                newMessage.message = message;
                newMessage.type = "REGULAR_MESSAGE";

                chat.push(newMessage);

                members.forEach((username, userId) => {
                    this.clients
                        .getById(userId)
                        .send("NEW_OFFICE_MESSAGE", newMessage);
                });
            }
        );

        this.onMessage(
            "PUSH_GLOBAL_CHAT_MESSAGE",
            (client, { username, message }) => {
                const newMessage = new OfficeChat();
                newMessage.username = username;
                newMessage.message = message;
                newMessage.type = "REGULAR_MESSAGE";

                this.state.globalChat.push(newMessage);
                this.broadcast("NEW_GLOBAL_CHAT_MESSAGE", newMessage);
            }
        );

        this.onMessage(
            "USER_STOPPED_SCREEN_SHARING",
            (client, officeName: officeNames) => {
                const { members } = this.getOfficeData(officeName);
                members.forEach((username, userId) => {
                    // preventing sending message to ourself
                    if (userId === client.sessionId) return;

                    this.clients
                        .getById(userId)
                        .send("USER_STOPPED_SCREEN_SHARING", client.sessionId);
                });
            }
        );

        this.onMessage(
            "USER_STOPPED_WEBCAM",
            (client, officeName: officeNames) => {
                const { members } = this.getOfficeData(officeName);
                members.forEach((username, userId) => {
                    // preventing sending message to ourself
                    if (userId === client.sessionId) return;

                    this.clients
                        .getById(userId)
                        .send("USER_STOPPED_WEBCAM", client.sessionId);
                });
            }
        );

        this.onMessage(
            "CONNECT_TO_VIDEO_CALL",
            (client, officeName: officeNames) => {
                const { members } = this.getOfficeData(officeName);
                members.forEach((username, userId) => {
                    if (userId === client.sessionId) return;

                    this.clients
                        .getById(userId)
                        .send("CONNECT_TO_VIDEO_CALL", client.sessionId);
                });
            }
        );
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined!");
        console.log("options: ", options);

        const player = new Player();

        player.x = 550;
        player.y = 820;
        player.username = options.username;
        player.anim = `${options.character}_down_idle`;

        this.state.players.set(client.sessionId, player);

        const newMessage = new OfficeChat();
        newMessage.type = "PLAYER_JOINED";
        newMessage.message = `Just joined the lobby!`;
        newMessage.username = options.username;
        this.state.globalChat.push(newMessage);

        // notifying all users expect the newly joined user that a new user has joined
        this.broadcast("NEW_GLOBAL_CHAT_MESSAGE", newMessage, {
            except: [client],
        });

        // sending whole chat to the newly joined user
        client.send("GET_GLOBAL_CHAT", this.state.globalChat);
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");

        const newMessage = new OfficeChat();
        const username = this.state.players.get(client.sessionId).username;
        newMessage.type = "PLAYER_LEFT";
        newMessage.username = username;
        newMessage.message = `Left the lobby!`;

        this.state.players.delete(client.sessionId);
        this.state.globalChat.push(newMessage);
        this.broadcast("NEW_GLOBAL_CHAT_MESSAGE", newMessage);

        const officeName = this.getUserOfficeName(client.sessionId);

        if (officeName) {
            this.handleOfficeLeave(client, username, officeName);
        }
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
}
