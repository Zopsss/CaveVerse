import {
    Schema,
    type,
    MapSchema,
    ArraySchema,
    SetSchema,
} from "@colyseus/schema";

type MessageType = "PLAYER_JOINED" | "PLAYER_LEFT" | "REGULAR_MESSAGE";

export class Player extends Schema {
    @type("number") x: number;
    @type("number") y: number;
    @type("string") anim: "queen_idle" | "queen_walk";
}

export class OfficeChat extends Schema {
    @type("string") username: string;
    @type("string") message: string;
    @type("string") type: MessageType;
}

export class MyRoomState extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();

    @type({ set: "string" }) mainOfficeMembers = new SetSchema<string>(); // storing sessionId's of user present in main office
    @type([OfficeChat]) mainOfficeChat = new ArraySchema<OfficeChat>(); // storing main office's chat messages

    @type({ set: "string" }) eastOfficeMembers = new SetSchema<string>();
    @type([OfficeChat]) eastOfficeChat = new ArraySchema<OfficeChat>();

    @type({ set: "string" }) northOffice1Members = new SetSchema<string>();
    @type([OfficeChat]) northOffice1Chat = new ArraySchema<OfficeChat>();

    @type({ set: "string" }) northOffice2Members = new SetSchema<string>();
    @type([OfficeChat]) northOffice2Chat = new ArraySchema<OfficeChat>();

    @type({ set: "string" }) westOfficeMembers = new SetSchema<string>();
    @type([OfficeChat]) westOfficeChat = new ArraySchema<OfficeChat>();
}
