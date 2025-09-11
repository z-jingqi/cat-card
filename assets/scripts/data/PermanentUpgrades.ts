import { Modifier, ModifierType } from "../core/stats/Modifier";
import { StatSheet } from "../core/StatSheet";

export interface UpgradeEffect {
    (statSheet: StatSheet, level: number): void;
}

export interface PermanentUpgradeBlueprint {
    id: string;
    name: string;
    description: string;
    maxLevel: number;
    getCost: (level: number) => number;
    applyEffect: UpgradeEffect;
}

export const PermanentUpgrades: Record<string, PermanentUpgradeBlueprint> = {
    'BASE_MOVE_SPEED': {
        id: 'BASE_MOVE_SPEED',
        name: 'Base Speed',
        description: 'Permanently increases the board\'s base movement speed by 5% per level.',
        maxLevel: 10,
        getCost: (level: number) => {
            return 100 + Math.floor(Math.pow(level, 2) * 50); // Example cost formula
        },
        applyEffect: (statSheet: StatSheet, level: number) => {
            const moveSpeedStat = statSheet.getStat('moveSpeed');
            if (moveSpeedStat) {
                // The source is this blueprint, allowing for easy removal/recalculation if needed
                const modifier = new Modifier(level * 0.05, ModifierType.PercentAdd, 'BASE_MOVE_SPEED');
                moveSpeedStat.addModifier(modifier);
            }
        }
    },
    // Future upgrades can be added here
};
