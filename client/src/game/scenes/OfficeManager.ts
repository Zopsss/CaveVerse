import Phaser from "phaser";

type OfficeName =
    | "mainOffice"
    | "eastOffice"
    | "westOffice"
    | "northOffice1"
    | "northOffice2";

type OfficeZone = {
    name: OfficeName;
    rect: Phaser.Geom.Rectangle;
};

export class OfficeManager {
    private currentOffice: OfficeName | null = null;
    private lastRect: Phaser.Geom.Rectangle | null = null;
    static OFFICES: ReadonlyArray<OfficeZone> = [
        {
            name: "mainOffice",
            rect: new Phaser.Geom.Rectangle(799.85, 608.02, 799.85, 512.02),
        },
        {
            name: "eastOffice",
            rect: new Phaser.Geom.Rectangle(63.96, 351.94, 384.12, 768.09),
        },
        {
            name: "westOffice",
            rect: new Phaser.Geom.Rectangle(1920.0, 608.25, 448.13, 544.0),
        },
        {
            name: "northOffice1",
            rect: new Phaser.Geom.Rectangle(927.85, 156.61, 512.09, 259.42),
        },
        {
            name: "northOffice2",
            rect: new Phaser.Geom.Rectangle(1471.97, 156.61, 512.09, 259.42),
        },
    ];

    constructor() {}

    /**
     * Check & Update player's current office.
     *
     * @param x player's x position
     * @param y player's y position
     * @returns name of the current office or null if player is not in any office
     */
    public update(x: number, y: number): OfficeName | null {
        // Check last office first
        if (
            this.lastRect &&
            Phaser.Geom.Rectangle.Contains(this.lastRect, x, y)
        ) {
            return this.currentOffice;
        }

        for (const office of OfficeManager.OFFICES) {
            if (Phaser.Geom.Rectangle.Contains(office.rect, x, y)) {
                if (office.name !== this.currentOffice) {
                    // user joined new office
                    this.currentOffice = office.name;
                    this.lastRect = office.rect;
                    return this.currentOffice;
                }
                return this.currentOffice; // Already in office
            }
        }

        // If not in any office
        if (this.currentOffice !== null) {
            this.currentOffice = null;
            this.lastRect = null;
        }

        return null;
    }

    /**
     * Checks if a player is inside an office or not.
     *
     * @param x player's x position
     * @param y player's y position
     * @returns true if player is inside an office otherwise false
     */
    public static isInOffice(x: number, y: number): boolean {
        for (const office of OfficeManager.OFFICES) {
            if (Phaser.Geom.Rectangle.Contains(office.rect, x, y)) {
                return true;
            }
        }

        return false;
    }
}
