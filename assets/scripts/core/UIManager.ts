import { _decorator, Component, Node, Label, Prefab, instantiate, Button, director, Layout } from 'cc';
import { eventManager } from '../core/EventManager';
import { GameManager } from '../core/GameManager';
import { Buff } from '../data/BuffLibrary';

const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    @property(Label)
    public scoreLabel: Label = null;

    @property(Label)
    public chaosLabel: Label = null;

    @property(Node)
    public buffSelectionPanel: Node = null;
    
    @property(Prefab)
    public buffChoicePrefab: Prefab = null;

    @property(Node)
    public buffChoiceLayout: Node = null;


    onLoad() {
        // Make this node persist across scene changes and immune to director.pause()
        director.addPersistRootNode(this.node);

        eventManager.on('ITEM_CAUGHT', this.updateScore);
        eventManager.on('ITEM_MISSED', this.updateChaos);
        eventManager.on('SHOW_BUFF_SELECTION', this.showBuffSelection);
    }

    onDestroy() {
        eventManager.off('ITEM_CAUGHT', this.updateScore);
        eventManager.off('ITEM_MISSED', this.updateChaos);
        eventManager.off('SHOW_BUFF_SELECTION', this.showBuffSelection);
    }

    start() {
        // Initialize the UI with starting values
        this.updateScore();
        this.updateChaos();
        this.buffSelectionPanel.active = false; // Ensure it's hidden at start
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

    private showBuffSelection = (buffs: Buff[]) => {
        // Activate first so layout can compute sizes while paused
        this.buffSelectionPanel.active = true;

        // Prepare layout and clear previous
        const layout = this.buffChoiceLayout.getComponent(Layout);
        this.buffChoiceLayout.removeAllChildren();

        for (const buff of buffs) {
            const choiceNode = instantiate(this.buffChoicePrefab);
            
            // Find labels by name
            const nameLabel = choiceNode.getChildByName('Label')?.getComponent(Label);
            const descLabel = choiceNode.getChildByName('DescriptionLabel')?.getComponent(Label);

            if (nameLabel) {
                nameLabel.string = buff.name;
            }
            if (descLabel) {
                descLabel.string = buff.description;
            }

            // Add click event
            const button = choiceNode.getComponent(Button);
            if (button) {
                button.node.on('click', () => {
                    this.onBuffChoiceClicked(buff.id);
                }, this);
            }

            this.buffChoiceLayout.addChild(choiceNode);
        }

        // Force layout update immediately (no frame tick while paused)
        if (layout) {
            layout.updateLayout();
        }
    }

    private onBuffChoiceClicked(buffId: string) {
        eventManager.emit('BUFF_SELECTED', buffId);
        this.hideBuffSelection();
    }

    private hideBuffSelection() {
        this.buffSelectionPanel.active = false;
        this.buffChoiceLayout.removeAllChildren();
    }
}
