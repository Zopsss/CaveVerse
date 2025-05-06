import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

type MessageType = "PLAYER_JOINED" | "PLAYER_LEFT" | "REGULAR_MESSAGE";

export class Player extends Schema {
    @type("number") x: number;
    @type("number") y: number;
    @type("string") username: string;
    @type("string") anim: string;
    @type("boolean") isMicOn: boolean = false;
    @type("boolean") isWebcamOn: boolean = false;
    @type("boolean") isDisconnected: boolean = false;
}

export class OfficeChat extends Schema {
    @type("string") username: string;
    @type("string") message: string;
    @type("string") type: MessageType;
}

export class MyRoomState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();

    @type([OfficeChat]) globalChat = new ArraySchema<OfficeChat>(); // storing global chat messages

    // storing members' sessionId and username as key-value pair
    // this is required to fetch member's username for screen sharing purposes.
    @type({ map: "string" }) mainOfficeMembers = new MapSchema<string>();
    @type([OfficeChat]) mainOfficeChat = new ArraySchema<OfficeChat>(); // storing main office's chat messages

    @type({ map: "string" }) eastOfficeMembers = new MapSchema<string>();
    @type([OfficeChat]) eastOfficeChat = new ArraySchema<OfficeChat>();

    @type({ map: "string" }) northOffice1Members = new MapSchema<string>();
    @type([OfficeChat]) northOffice1Chat = new ArraySchema<OfficeChat>();

    @type({ map: "string" }) northOffice2Members = new MapSchema<string>();
    @type([OfficeChat]) northOffice2Chat = new ArraySchema<OfficeChat>();

    @type({ map: "string" }) westOfficeMembers = new MapSchema<string>();
    @type([OfficeChat]) westOfficeChat = new ArraySchema<OfficeChat>();
}
