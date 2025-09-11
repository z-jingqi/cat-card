import { Modifier, ModifierType } from "./Modifier";

export class Stat {
    public baseValue: number;
    private _modifiers: Modifier[] = [];
    private _isDirty: boolean = true;
    private _cachedValue: number;

    public get value(): number {
        if (this._isDirty) {
            this._cachedValue = this.calculateValue();
            this._isDirty = false;
        }
        return this._cachedValue;
    }

    constructor(baseValue: number) {
        this.baseValue = baseValue;
    }

    public addModifier(modifier: Modifier) {
        this._modifiers.push(modifier);
        this._isDirty = true;
    }

    public removeModifier(modifier: Modifier): boolean {
        const initialCount = this._modifiers.length;
        this._modifiers = this._modifiers.filter(m => m.id !== modifier.id);
        
        if (this._modifiers.length < initialCount) {
            this._isDirty = true;
            return true;
        }
        return false;
    }

    public removeModifiersFromSource(source: any): boolean {
        const initialCount = this._modifiers.length;
        this._modifiers = this._modifiers.filter(m => m.source !== source);
        
        if (this._modifiers.length < initialCount) {
            this._isDirty = true;
            return true;
        }
        return false;
    }

    private calculateValue(): number {
        let finalValue = this.baseValue;
        
        // Apply flat modifiers first
        for (const modifier of this._modifiers) {
            if (modifier.type === ModifierType.Flat) {
                finalValue += modifier.value;
            }
        }

        // Then, sum additive percentages and apply them
        let percentAddSum = 0;
        for (const modifier of this._modifiers) {
            if (modifier.type === ModifierType.PercentAdd) {
                percentAddSum += modifier.value;
            }
        }
        finalValue *= (1 + percentAddSum);

        // Finally, apply multiplicative percentages
        for (const modifier of this._modifiers) {
            if (modifier.type === ModifierType.PercentMult) {
                finalValue *= (1 + modifier.value);
            }
        }

        return finalValue;
    }
}
