import { _decorator, Component, UITransform } from 'cc';
import { StatSheet } from '../core/StatSheet';

const { ccclass, property } = _decorator;

@ccclass('Board')
export class Board extends Component {
    
    public statSheet: StatSheet;
    private _uiTransform: UITransform;

    @property
    public baseMoveSpeed: number = 300;

    onLoad() {
        this.statSheet = this.getComponent(StatSheet);
        if (!this.statSheet) {
            console.error("Board component requires a StatSheet component.");
            return;
        }

        this._uiTransform = this.getComponent(UITransform);
        if (!this._uiTransform) {
            console.error("Board component requires a UITransform component.");
            return;
        }

        this.statSheet.defineStat("moveSpeed", this.baseMoveSpeed);
        this.statSheet.defineStat("width", this._uiTransform.contentSize.width);
    }

    update(dt: number) {
        const widthStat = this.statSheet.getStat("width");
        if (widthStat && widthStat.value !== this._uiTransform.contentSize.width) {
            this._uiTransform.setContentSize(widthStat.value, this._uiTransform.contentSize.height);
        }
    }
}
