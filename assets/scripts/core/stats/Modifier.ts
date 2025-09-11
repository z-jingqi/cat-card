export enum ModifierType {
    Flat,
    PercentAdd,
    PercentMult,
}

let nextModifierId = 0;

export class Modifier {
    public id: number;
    public value: number;
    public type: ModifierType;
    public source: any;
    public duration: number; // Duration in seconds. 0 or less means permanent.
    public endTime: number;   // Timestamp for when the modifier expires.

    constructor(value: number, type: ModifierType, source: any = null, duration: number = 0) {
        this.id = nextModifierId++;
        this.value = value;
        this.type = type;
        this.source = source;
        this.duration = duration;
        this.endTime = 0; // Will be set by the manager when applied
    }
}
