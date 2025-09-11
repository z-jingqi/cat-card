import { sys } from 'cc';
import { PlayerData } from '../data/PlayerData';

const SAVE_KEY = 'cat-puzzle-save-data';

export class DataManager {
    private static _instance: DataManager;
    public data: PlayerData;

    private constructor() {
        this.load();
    }

    public static get instance(): DataManager {
        if (!DataManager._instance) {
            DataManager._instance = new DataManager();
        }
        return DataManager._instance;
    }

    public load() {
        const savedData = sys.localStorage.getItem(SAVE_KEY);
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                this.data = Object.assign(new PlayerData(), parsedData);
            } catch (e) {
                console.error("Failed to parse save data. Initializing new data.", e);
                this.data = new PlayerData();
            }
        } else {
            this.data = new PlayerData();
        }
    }

    public save() {
        try {
            const dataToSave = JSON.stringify(this.data);
            sys.localStorage.setItem(SAVE_KEY, dataToSave);
            console.log("Game data saved.");
        } catch (e) {
            console.error("Failed to save game data.", e);
        }
    }

    public reset() {
        this.data = new PlayerData();
        this.save();
        console.log("Game data has been reset.");
    }
}
