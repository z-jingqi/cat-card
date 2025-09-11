import { _decorator, Component, Collider2D, IPhysics2DContact, Contact2DType, RigidBody2D, v2, Vec2 } from 'cc';
import { ItemBlueprint } from '../data/ItemBlueprints';
import { BaseMotion } from '../behaviors/trajectories/VerticalTrajectory';
import { IInteractable } from '../interaction/IInteractable';
import { Interactor, InteractorType } from '../interaction/Interactor';
import { eventManager } from '../core/EventManager';
import { ObjectPoolManager } from '../core/ObjectPool';
import { GlobalStats } from '../core/GlobalStats';

const { ccclass, property } = _decorator;

@ccclass('Item')
export class Item extends Component implements IInteractable {
    
    private _blueprint: ItemBlueprint = null;
    private _stats: any = {};
    private _motionComponents: BaseMotion[] = [];
    private _rigidBody: RigidBody2D = null;

    onLoad() {
        this._rigidBody = this.getComponent(RigidBody2D);
        if (!this._rigidBody) {
            console.error("Item component requires a RigidBody2D component.");
        }

        const collider = this.getComponent(Collider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }
    
    public setup(blueprint: ItemBlueprint) {
        this._blueprint = blueprint;
        this._stats = { ...blueprint.baseStats };

        // Apply global speed modifiers to the item's base speed
        const fallSpeed = (this._stats.fallSpeed || 100) * GlobalStats.itemFallSpeed.value;
        if (this._rigidBody) {
            this._rigidBody.linearVelocity = v2(0, -fallSpeed);
        }

        const motion = this.getComponent(BaseMotion);
        if (motion) {
            motion.setup(this._stats);
            if (!this._motionComponents.includes(motion)) {
                this._motionComponents.push(motion);
            }
        }
    }

    onDestroy() {
        const collider = this.getComponent(Collider2D);
        if (collider) {
            collider.off(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        }
    }

    update(deltaTime: number) {
        // Recalculate fall speed every frame to react to changes in global stats
        const fallSpeed = (this._stats.fallSpeed || 100) * GlobalStats.itemFallSpeed.value;
        if (this._rigidBody && Math.abs(this._rigidBody.linearVelocity.y - (-fallSpeed)) > 0.1) {
            this._rigidBody.linearVelocity = v2(this._rigidBody.linearVelocity.x, -fallSpeed);
        }

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
                experience: this._stats.experience || 0,
            });

            // Return this node to the object pool to be reused, but do it in the next frame
            this.scheduleOnce(() => {
                ObjectPoolManager.instance.put(this.node);
            });
        }
    }
}
