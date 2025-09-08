import { _decorator, Component, Node, Prefab, instantiate, view, v3 } from 'cc';
import { eventManager } from './EventManager';
const { ccclass, property } = _decorator;

export enum GameState {
    MainMenu,
    Playing,
    Paused,
    GameOver
}

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager;

    @property(Prefab)
    public boardPrefab: Prefab = null;

    private _state: GameState = GameState.MainMenu;

    // --- Game Values ---
    public score: number = 0;
    public chaosValue: number = 0;
    public experience: number = 0;
    // -------------------

    onLoad() {
        if (GameManager.instance) {
            this.destroy();
            return;
        }
        GameManager.instance = this;
        // Optional: Persist this node across scene changes if needed
        // director.addPersistRootNode(this.node);

        eventManager.on('ITEM_CAUGHT', this.onItemCaught);
    }

    onDestroy() {
        eventManager.off('ITEM_CAUGHT', this.onItemCaught);
    }

    start() {
        this.setState(GameState.Playing);

        if (this.boardPrefab) {
            const boardNode = instantiate(this.boardPrefab);
            
            // Set position to the bottom of the screen
            const viewSize = view.getVisibleSize();
            const yPos = -viewSize.height / 2 + 100; // Place it 100px from the bottom
            boardNode.setPosition(v3(0, yPos, 0));

            // Assuming the scene graph is Canvas -> GameManager, we add it to the parent (Canvas)
            if (this.node.parent) {
                this.node.parent.addChild(boardNode);
            }
        } else {
            console.error("Board Prefab is not assigned in the GameManager inspector!");
        }
    }

    public setState(newState: GameState) {
        if (this._state === newState) {
            return;
        }

        this._state = newState;
        console.log(`Game state changed to: ${GameState[newState]}`);

        // We can emit an event here to let other systems know about the state change
        // eventManager.emit('GAME_STATE_CHANGED', newState);
    }

    public getState(): GameState {
        return this._state;
    }

    private onItemCaught = (data: { score: number }) => {
        if (this._state !== GameState.Playing) return;

        this.score += data.score;
        console.log(`Score: ${this.score}`);
        // We will update the UI with this new score later
    }
}
