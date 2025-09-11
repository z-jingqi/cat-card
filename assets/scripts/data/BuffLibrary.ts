import { Board } from "../entities/Board";
import { Modifier, ModifierType } from "../core/stats/Modifier";
import { GlobalStats } from "../core/GlobalStats";
import { StatManager } from "../core/StatManager";

export interface Buff {
    id: string;
    name: string;
    description: string;
    apply: (target: Board) => void;
}

export const BuffLibrary: Record<string, Buff> = {
    'BOARD_SPEED_UP_10': {
        id: 'BOARD_SPEED_UP_10',
        name: 'Swift Moves',
        description: 'Increases board movement speed by 10%.',
        apply: function(target: Board) {
            const stat = target.statSheet.getStat("moveSpeed");
            if (stat) {
                const modifier = new Modifier(0.1, ModifierType.PercentAdd, this);
                StatManager.instance.addTimedModifier(stat, modifier);
            }
        }
    },
    'BOARD_SIZE_UP_10': {
        id: 'BOARD_SIZE_UP_10',
        name: 'Wider Net',
        description: 'Increases board width by 10%.',
        apply: function(target: Board) {
            const stat = target.statSheet.getStat("width");
            if (stat) {
                const modifier = new Modifier(0.1, ModifierType.PercentAdd, this);
                StatManager.instance.addTimedModifier(stat, modifier);
            }
        }
    },
    'ITEM_FALL_SLOW_5': {
        id: 'ITEM_FALL_SLOW_5',
        name: 'Time Warp',
        description: 'Items fall 5% slower.',
        apply: function(target: Board) {
            const stat = GlobalStats.itemFallSpeed;
            const modifier = new Modifier(-0.05, ModifierType.PercentAdd, this);
            StatManager.instance.addTimedModifier(stat, modifier);
        }
    },
    'BOARD_SPEED_BOOST_30_TEMP': {
        id: 'BOARD_SPEED_BOOST_30_TEMP',
        name: 'Haste',
        description: 'Increases board movement speed by 30% for 10 seconds.',
        apply: function(target: Board) {
            const stat = target.statSheet.getStat("moveSpeed");
            if (stat) {
                const modifier = new Modifier(0.3, ModifierType.PercentAdd, this, 10);
                StatManager.instance.addTimedModifier(stat, modifier);
            }
        }
    }
};
