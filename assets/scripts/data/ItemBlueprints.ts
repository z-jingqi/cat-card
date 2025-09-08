
export interface ItemBlueprint {
    id: string;
    description: string;
    sprite: string; // This will be used later when we have actual art
    baseStats: {
        score: number;
        [key: string]: any; // Allows for other stats later
    };
    motionComponents: string[];
    interaction: {
        type: "CATCH" | "SHOOT" | "HYBRID";
    };
}

export const ItemBlueprints: Record<string, ItemBlueprint> = {
    "APPLE_NORMAL": {
        id: "APPLE_NORMAL",
        description: "A simple, delicious apple.",
        sprite: "apple.png",
        baseStats: {
            score: 100,
            verticalSpeed: 200, // pixels per second
        },
        motionComponents: [ "VerticalTrajectory" ],
        interaction: {
            type: "CATCH",
        }
    }
    // We will add more blueprints here later!
};
