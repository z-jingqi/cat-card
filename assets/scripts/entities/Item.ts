import { _decorator, Component, Collider2D, IPhysics2DContact, Contact2DType, RigidBody2D, v2 } from 'cc';
import { ItemBlueprint } from '../data/ItemBlueprints';
import { BaseMotion } from '../behaviors/trajectories/VerticalTrajectory';
import { IInteractable } from '../interaction/IInteractable';
import { Interactor, InteractorType } from '../interaction/Interactor';
import { eventManager } from '../core/EventManager';
import { ObjectPoolManager } from '../core/ObjectPool';
import { GameManager, GameState } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('Item')
export class Item extends Component implements IInteractable {
    
    private _blueprint: ItemBlueprint = null;
    private _stats: any = {};
    private _motionComponents: BaseMotion[] = [];

    public setup(blueprint: ItemBlueprint) {
        this._blueprint = blueprint;
        // For now, we'll just copy base stats. Later this will use the modifier system.
        this._stats = { ...blueprint.baseStats };

        // This is a simplified version. The final spawner will add components dynamically.
        const motion = this.getComponent(BaseMotion);
        if (motion) {
            motion.setup(this._stats);
            this._motionComponents.push(motion);
        }
    }

    onLoad() {
        // Registering for collision events
        const collider = this.getComponent(Collider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }

    onDestroy() {
        const collider = this.getComponent(Collider2D);
        if (collider) {
            collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }

    update(deltaTime: number) {
        for (const motion of this._motionComponents) {
            motion.move(deltaTime);
        }
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // Check for interaction with the Board
        const interactor = otherCollider.getComponent(Interactor);
        if (interactor) {
            this.onInteract(interactor);
            return; // Interaction handled, no need to check for floor
        }

        // Check for collision with the Floor (by group)
        if (otherCollider.group === selfCollider.group) {
            // This is a collision with another item, ignore it
            return;
        }

        // If it's not an interactor and not another item, we assume it's the floor
        eventManager.emit('ITEM_MISSED');
        this.scheduleOnce(() => {
            ObjectPoolManager.instance.put(this.node);
        });
    }

    onInteract(interactor: Interactor) {
        if (this._blueprint.interaction.type !== 'CATCH') {
            return;
        }

        if (interactor.type === InteractorType.BOARD) {
            // Announce that this item was caught, sending its stats
            eventManager.emit('ITEM_CAUGHT', {
                score: this._stats.score || 0,
                // We can add more data like exp later
            });

            // Return this node to the object pool to be reused, but do it in the next frame
            this.scheduleOnce(() => {
                ObjectPoolManager.instance.put(this.node);
            });
        }
    }
}
