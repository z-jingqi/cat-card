import { _decorator, Component, Node, Label } from 'cc';
import { eventManager } from '../core/EventManager';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    @property(Label)
    public scoreLabel: Label = null;

    @property(Label)
    public chaosLabel: Label = null;

    onLoad() {
        eventManager.on('ITEM_CAUGHT', this.updateScore, this);
        eventManager.on('ITEM_MISSED', this.updateChaos, this);
    }

    onDestroy() {
        eventManager.off('ITEM_CAUGHT', this.updateScore, this);
        eventManager.off('ITEM_MISSED', this.updateChaos, this);
    }

    start() {
        // Initialize the UI with starting values
        this.updateScore();
        this.updateChaos();
    }

    private updateScore = () => {
        if (this.scoreLabel) {
            this.scoreLabel.string = `Score: ${GameManager.instance.score}`;
        }
    }

    private updateChaos = () => {
        if (this.chaosLabel) {
            this.chaosLabel.string = `Chaos: ${GameManager.instance.chaosValue}`;
        }
    }
}
