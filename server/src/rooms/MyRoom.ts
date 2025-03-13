import { Room, Client } from "colyseus";
import { MyRoomState, Player, OfficeChat } from "../rooms/schema/MyRoomState";

type OfficeType = "MAIN" | "EAST" | "NORTH_1" | "NORTH_2" | "WEST";
interface InputMessageType {
    username: string;
    message: string;
}
export class MyRoom extends Room<MyRoomState> {
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
        officeType: OfficeType
    ) {
        const sessionId = client.sessionId;
        const { chat, members, name } = this.getOfficeData(officeType);

        const newMessage = new OfficeChat();
        newMessage.username = "Nennuuuu";
        newMessage.message = `Just joined ${name} lobby`;
        newMessage.type = "PLAYER_JOINED";

        // Add user to the appropriate office members collection
        members.add(sessionId);

        // Add message to the appropriate chat collection
        chat.push(newMessage);

        // Notify other users in the same office
        this.clients.forEach((member) => {
            if (
                members.has(member.sessionId) &&
                member.sessionId !== client.sessionId
            ) {
                member.send("USER_CONNECTED", peerId);
            }
        });
    }

    private handleLeftOffice(client: Client, officeType: OfficeType) {
        const sessionId = client.sessionId;
        const { name, chat, members } = this.getOfficeData(officeType);

        const newMessage = new OfficeChat();
        newMessage.username = "Nennuuuu";
        newMessage.message = `Left ${name} lobby`;
        newMessage.type = "PLAYER_LEFT";

        chat.push(newMessage);
        members.delete(sessionId);

        this.clients.forEach((member) => {
            if (members.has(member.sessionId)) {
                member.send("USER_DISCONNECTED", client.sessionId);
            }
        });
    }

    private handleAddMessage(officeType: OfficeType, input: InputMessageType) {
        const { chat } = this.getOfficeData(officeType);
        const newMessage = new OfficeChat();
        newMessage.username = input.username;
        newMessage.message = input.message;
        newMessage.type = "REGULAR_MESSAGE";

        chat.push(newMessage);
    }

    onCreate(options: any) {
        this.setState(new MyRoomState());

        this.onMessage(0, (client, input) => {
            const player = this.state.players.get(client.sessionId);
            player.x = input.playerX;
            player.y = input.playerY;
            player.anim = input.anim;
        });

        this.onMessage("JOIN_MAIN_OFFICE", (client, peerId) => {
            this.handleOfficeJoin(client, peerId, "MAIN");
        });

        this.onMessage("LEFT_MAIN_OFFICE", (client) => {
            this.handleLeftOffice(client, "MAIN");
        });

        this.onMessage(
            "ADD_MAIN_OFFICE_MESSAGE",
            (client, input: InputMessageType) => {
                this.handleAddMessage("MAIN", input);
            }
        );

        this.onMessage("JOIN_EAST_OFFICE", (client, peerId) => {
            this.handleOfficeJoin(client, peerId, "EAST");
        });

        this.onMessage("LEFT_EAST_OFFICE", (client) => {
            this.handleLeftOffice(client, "EAST");
        });

        this.onMessage(
            "ADD_EAST_OFFICE_MESSAGE",
            (client, input: InputMessageType) => {
                this.handleAddMessage("EAST", input);
            }
        );

        this.onMessage("JOIN_NORTH_1_OFFICE", (client, peerId) => {
            this.handleOfficeJoin(client, peerId, "NORTH_1");
        });

        this.onMessage("LEFT_NORTH_1_OFFICE", (client) => {
            this.handleLeftOffice(client, "NORTH_1");
        });

        this.onMessage(
            "ADD_NORTH_OFFICE_1_MESSAGE",
            (client, input: InputMessageType) => {
                this.handleAddMessage("NORTH_1", input);
            }
        );

        this.onMessage("JOIN_NORTH_2_OFFICE", (client, peerId) => {
            this.handleOfficeJoin(client, peerId, "NORTH_2");
        });

        this.onMessage("LEFT_NORTH_2_OFFICE", (client) => {
            this.handleLeftOffice(client, "NORTH_2");
        });

        this.onMessage(
            "ADD_NORTH_OFFICE_2_MESSAGE",
            (client, input: InputMessageType) => {
                this.handleAddMessage("NORTH_2", input);
            }
        );

        this.onMessage("JOIN_WEST_OFFICE", (client, peerId) => {
            this.handleOfficeJoin(client, peerId, "WEST");
        });

        this.onMessage("LEFT_WEST_OFFICE", (client) => {
            this.handleLeftOffice(client, "WEST");
        });

        this.onMessage(
            "ADD_WEST_OFFICE_MESSAGE",
            (client, input: InputMessageType) => {
                this.handleAddMessage("WEST", input);
            }
        );
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined!");

        const player = new Player();

        player.x = 550;
        player.y = 820;
        player.anim = "queen_idle";

        this.state.players.set(client.sessionId, player);
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
        this.state.players.delete(client.sessionId);
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
}
