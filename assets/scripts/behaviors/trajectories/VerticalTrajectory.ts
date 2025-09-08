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
        const speed = this._stats.verticalSpeed || 100;
        const pos = this.node.position;
        this.node.setPosition(v3(pos.x, pos.y - speed * dt, pos.z));
    }
}
