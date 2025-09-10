import { Board } from "../entities/Board";

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
        apply: (target: Board) => {
            // Note: This is a temporary implementation.
            // It will be replaced by the Stat & Modifier system later.
            target.moveSpeed *= 1.1;
        }
    },
    'BOARD_SIZE_UP_10': {
        id: 'BOARD_SIZE_UP_10',
        name: 'Wider Net',
        description: 'Increases board width by 10%.',
        apply: (target: Board) => {
            const currentScale = target.node.getScale();
            target.node.setScale(currentScale.x * 1.1, currentScale.y, currentScale.z);
        }
    },
    'ITEM_FALL_SLOW_5': {
        id: 'ITEM_FALL_SLOW_5',
        name: 'Time Warp',
        description: 'Items fall 5% slower.',
        apply: (target: Board) => {
            // This will be implemented later with the GlobalModifierManager
            console.log("Applying slow fall effect (placeholder).");
        }
    }
};
