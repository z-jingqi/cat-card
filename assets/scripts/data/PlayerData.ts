
export interface PermanentUpgrade {
    id: string;
    level: number;
}

export class PlayerData {
    public totalGold: number = 0;
    public permanentUpgrades: Record<string, PermanentUpgrade> = {};

    constructor() {
        // Initialize with default values if needed
    }
}
