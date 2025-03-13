import { Schema, ArraySchema } from "@colyseus/schema";

export class MainOfficeRoomState extends Schema {
    messages = new ArraySchema<string>();
}
