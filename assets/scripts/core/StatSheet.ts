import { _decorator, Component } from 'cc';
import { Stat } from './stats/Stat';

const { ccclass, property } = _decorator;

@ccclass('StatSheet')
export class StatSheet extends Component {
    
    private _stats: Map<string, Stat> = new Map();

    public defineStat(name: string, baseValue: number) {
        if (this._stats.has(name)) {
            console.warn(`Stat "${name}" is already defined.`);
            return;
        }
        this._stats.set(name, new Stat(baseValue));
    }

    public getStat(name: string): Stat | null {
        if (!this._stats.has(name)) {
            console.error(`Stat "${name}" not found.`);
            return null;
        }
        return this._stats.get(name);
    }

    public removeModifiersFromSource(source: any) {
        for (const stat of this._stats.values()) {
            stat.removeModifiersFromSource(source);
        }
    }
}
