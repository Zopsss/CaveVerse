import { Room, Client } from "colyseus";
import { MyRoomState, Player, OfficeChat } from "../rooms/schema/MyRoomState";

type OfficeType = "MAIN" | "EAST" | "NORTH_1" | "NORTH_2" | "WEST";
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

    // Helper method to get the appropriate state properties for each office
    private getOfficeData(officeType: OfficeType) {
        const officeMap = {
            MAIN: {
                members: this.state.mainOfficeMembers,
                chat: this.state.mainOfficeChat,
                name: "main office",
            },
            EAST: {
                members: this.state.eastOfficeMembers,
                chat: this.state.eastOfficeChat,
                name: "east office",
            },
            NORTH_1: {
                members: this.state.northOffice1Members,
                chat: this.state.northOffice1Chat,
                name: "north 1 office",
            },
            NORTH_2: {
                members: this.state.northOffice2Members,
                chat: this.state.northOffice2Chat,
                name: "north 2 office",
            },
            WEST: {
                members: this.state.westOfficeMembers,
                chat: this.state.westOfficeChat,
                name: "west office",
            },
        };

        return officeMap[officeType];
    }

    private handleOfficeJoin(
        client: Client,
        peerId: string,
        username: string,
        officeType: OfficeType
    ) {
        const sessionId = client.sessionId;
        const { chat, members, name } = this.getOfficeData(officeType);

        const newMessage = new OfficeChat();
        newMessage.username = username;
        newMessage.message = `Just joined ${name} lobby`;
        newMessage.type = "PLAYER_JOINED";

        // Add user to the appropriate office members collection
        members.set(sessionId, username);

        // Add message to the appropriate chat collection
        chat.push(newMessage);

        // Notify other users in the same office
        this.clients.forEach((member) => {
            if (
                members.has(member.sessionId) &&
                member.sessionId !== client.sessionId
            ) {
                member.send("CONNECT_TO_WEBRTC", {
                    peerId: client.sessionId,
                    username,
                });
            }
        });

        console.log("peerId: ", peerId);

        const allMembers: any = [];
        members.forEach((value, key) => {
            allMembers.push({ key, value });
        });
        console.log("chat members: ", allMembers);
    }

    private handleLeftOffice(
        client: Client,
        username: string,
        officeType: OfficeType
    ) {
        const sessionId = client.sessionId;
        const { name, chat, members } = this.getOfficeData(officeType);
        // if condition is required when user haven't given his webcam permission yet, otherwise servers gives this error:
        // @colyseus/schema MapSchema: trying to delete non-existing index: vd04glYYb (undefined)
        // TODO: don't know why this is happening, need to investigate it!!!!
        if (members.has(sessionId)) {
            const newMessage = new OfficeChat();
            newMessage.username = username;
            newMessage.message = `Left ${name} lobby`;
            newMessage.type = "PLAYER_LEFT";

            chat.push(newMessage);

            members.delete(sessionId);

            this.clients.forEach((member) => {
                if (members.has(member.sessionId)) {
                    member.send("DISCONNECT_FROM_WEBRTC", client.sessionId);
                }
            });
        }
    }

    private handleAddMessage(officeType: OfficeType, input: InputMessageType) {
        const { chat } = this.getOfficeData(officeType);
        const newMessage = new OfficeChat();
        newMessage.username = input.username;
        newMessage.message = input.message;
        newMessage.type = "REGULAR_MESSAGE";

        chat.push(newMessage);
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

        this.onMessage("JOIN_MAIN_OFFICE", (client, { peerId, username }) => {
            this.handleOfficeJoin(client, peerId, username, "MAIN");
        });

        this.onMessage("LEFT_MAIN_OFFICE", (client, username) => {
            this.handleLeftOffice(client, username, "MAIN");
        });

        this.onMessage(
            "ADD_MAIN_OFFICE_MESSAGE",
            (client, input: InputMessageType) => {
                this.handleAddMessage("MAIN", input);
            }
        );

        this.onMessage("JOIN_EAST_OFFICE", (client, { peerId, username }) => {
            this.handleOfficeJoin(client, peerId, username, "EAST");
        });

        this.onMessage("LEFT_EAST_OFFICE", (client, username) => {
            this.handleLeftOffice(client, username, "EAST");
        });

        this.onMessage(
            "ADD_EAST_OFFICE_MESSAGE",
            (client, input: InputMessageType) => {
                this.handleAddMessage("EAST", input);
            }
        );

        this.onMessage(
            "JOIN_NORTH_1_OFFICE",
            (client, { peerId, username }) => {
                this.handleOfficeJoin(client, peerId, username, "NORTH_1");
            }
        );

        this.onMessage("LEFT_NORTH_1_OFFICE", (client, username) => {
            this.handleLeftOffice(client, username, "NORTH_1");
        });

        this.onMessage(
            "ADD_NORTH_OFFICE_1_MESSAGE",
            (client, input: InputMessageType) => {
                this.handleAddMessage("NORTH_1", input);
            }
        );

        this.onMessage(
            "JOIN_NORTH_2_OFFICE",
            (client, { peerId, username }) => {
                this.handleOfficeJoin(client, peerId, username, "NORTH_2");
            }
        );

        this.onMessage("LEFT_NORTH_2_OFFICE", (client, username) => {
            this.handleLeftOffice(client, username, "NORTH_2");
        });

        this.onMessage(
            "ADD_NORTH_OFFICE_2_MESSAGE",
            (client, input: InputMessageType) => {
                this.handleAddMessage("NORTH_2", input);
            }
        );

        this.onMessage("JOIN_WEST_OFFICE", (client, { peerId, username }) => {
            this.handleOfficeJoin(client, peerId, username, "WEST");
        });

        this.onMessage("LEFT_WEST_OFFICE", (client, username) => {
            this.handleLeftOffice(client, username, "WEST");
        });

        this.onMessage(
            "ADD_WEST_OFFICE_MESSAGE",
            (client, input: InputMessageType) => {
                this.handleAddMessage("WEST", input);
            }
        );

        this.onMessage(
            "ADD_NEW_GLOBAL_CHAT_MESSAGE",
            (client, input: InputMessageType) => {
                const newMessage = new OfficeChat();
                newMessage.username = input.username;
                newMessage.message = input.message;
                newMessage.type = "REGULAR_MESSAGE";

                this.state.globalChat.push(newMessage);
                this.broadcast("NEW_GLOBAL_CHAT_MESSAGE", newMessage);
            }
        );

        this.onMessage(
            "USER_STOPPED_SCREEN_SHARING",
            (client, office: OfficeType) => {
                const { members } = this.getOfficeData(office);
                members.forEach((username, userId) => {
                    if (userId === client.sessionId) return;
                    this.clients
                        .getById(userId)
                        .send("USER_STOPPED_SCREEN_SHARING", client.sessionId);
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
        newMessage.message = `Just joined!`;
        newMessage.username = options.username;
        this.state.globalChat.push(newMessage);

        // notifying all users expect the newly joined user that a new user has joined
        this.broadcast("NEW_GLOBAL_CHAT_MESSAGE", newMessage, {
            except: [client],
        });

        // sending whole chat to the newly joined user
        client.send("GET_WHOLE_GLOBAL_CHAT", this.state.globalChat);
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");

        const newMessage = new OfficeChat();
        const username = this.state.players.get(client.sessionId).username;
        newMessage.type = "PLAYER_LEFT";
        newMessage.username = username;
        newMessage.message = `Left!`;

        this.state.players.delete(client.sessionId);
        this.state.globalChat.push(newMessage);
        this.broadcast("NEW_GLOBAL_CHAT_MESSAGE", newMessage);
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
}
