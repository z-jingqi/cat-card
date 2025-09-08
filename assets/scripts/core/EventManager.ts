import { _decorator } from 'cc';

type EventCallback = (...args: any[]) => void;

class EventManager {
    private static instance: EventManager;

    private eventMap: Map<string, EventCallback[]> = new Map();

    public static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    public on(eventName: string, callback: EventCallback): void {
        if (!this.eventMap.has(eventName)) {
            this.eventMap.set(eventName, []);
        }
        this.eventMap.get(eventName)!.push(callback);
    }

    public off(eventName: string, callback: EventCallback): void {
        if (this.eventMap.has(eventName)) {
            const callbacks = this.eventMap.get(eventName)!;
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    public emit(eventName: string, ...args: any[]): void {
        if (this.eventMap.has(eventName)) {
            const callbacks = this.eventMap.get(eventName)!.slice(); // Create a copy to avoid issues with modification during iteration
            for (const callback of callbacks) {
                callback(...args);
            }
        }
    }
}

// Export a singleton instance
export const eventManager = EventManager.getInstance();
