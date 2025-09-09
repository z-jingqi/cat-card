import { _decorator, Component, Node, Vec3, v3 } from 'cc';
const { ccclass, property } = _decorator;

// This will be a base class or interface for all motion components
export abstract class BaseMotion extends Component {
    protected _stats: any = {};

    public setup(stats: any) {
        this._stats = stats;
    }

    public abstract move(dt: number): void;
}


@ccclass('VerticalTrajectory')
export class VerticalTrajectory extends BaseMotion {
    
    public move(dt: number): void {
        // The movement is now handled by the RigidBody2D's Linear Velocity.
        // This component is now just a "tag" to identify the movement type.
        // We could add logic here for non-physics-based movements in the future.
    }
}
