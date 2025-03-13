import { Client, Room } from "colyseus";
import { MainOfficeRoomState } from "./schema/MainOfficeRoomState";

export class MainOfficeRoom extends Room<MainOfficeRoomState> {
    onCreate(options: any) {
        this.setState(new MainOfficeRoomState());

        this.onMessage(0, (client, input) => {
            console.log("message received: ", input);
            // this.state.messages.push("input");
        });
    }

    onJoin(client: Client, options: any) {
        const msg = `${client.sessionId} joined main office room!`;
        console.log(msg);
        this.state.messages.push(msg);

        let allMsgs: string[] = [];
        this.state.messages.forEach((msg) => {
            allMsgs.push(msg);
        });

        console.log("all msgs: ", allMsgs);
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, " left main office room!");
        // this.state.messages.push(
        //     `${client.sessionId} left main office room :(`
        // );
    }

    onDispose() {
        console.log(this.roomId, ": disposing main office room...");
    }
}
