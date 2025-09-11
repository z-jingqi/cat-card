import { Stat } from "./stats/Stat";

class GlobalStatsManager {
    private static _instance: GlobalStatsManager;

    public itemFallSpeed: Stat;

    private constructor() {
        // Default fall speed is 1. We can modify this with buffs.
        this.itemFallSpeed = new Stat(1); 
    }

    public static get instance(): GlobalStatsManager {
        if (!GlobalStatsManager._instance) {
            GlobalStatsManager._instance = new GlobalStatsManager();
        }
        return GlobalStatsManager._instance;
    }
}

export const GlobalStats = GlobalStatsManager.instance;
