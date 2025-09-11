import { _decorator, Component, Node, Prefab, instantiate, view, v3, PhysicsSystem2D, EPhysics2DDrawFlags, director } from 'cc';
import { eventManager } from './EventManager';
import { BuffManager } from '../buffs/BuffManager';
import { DataManager } from './DataManager';

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

    @property
    public enablePhysicsDebug: boolean = true;

    private _state: GameState = GameState.MainMenu;
    private _buffManager: BuffManager = null;

    // --- Game Values ---
    public score: number = 0;
    public chaosValue: number = 0;
    public experience: number = 0;
    public chaosMax: number = 10; // Let's set a small max value for easy testing
    public currentLevel: number = 1;
    public expToNextLevel: number = 100;
    // -------------------

    onLoad() {
        if (GameManager.instance) {
            this.destroy();
            return;
        }
        GameManager.instance = this;
        // Optional: Persist this node across scene changes if needed
        // director.addPersistRootNode(this.node);

        this._buffManager = this.addComponent(BuffManager);

        eventManager.on('ITEM_CAUGHT', this.onItemCaught);
        eventManager.on('ITEM_MISSED', this.onItemMissed);

        this.togglePhysicsDebug(this.enablePhysicsDebug);
    }

    onDestroy() {
        eventManager.off('ITEM_CAUGHT', this.onItemCaught);
        eventManager.off('ITEM_MISSED', this.onItemMissed);
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

            this._buffManager.setBoardNode(boardNode);
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

        switch (newState) {
            case GameState.Playing:
                // Potentially unpause things here if coming from a paused state
                break;
            case GameState.Paused:
                // director.pause(); // Or handle pausing more granularly
                break;
            case GameState.GameOver:
                director.pause();
                console.log("--- GAME OVER ---");
                console.log(`Final Score: ${this.score}`);
                this.handleRunEnd();
                break;
        }

        // We can emit an event here to let other systems know about the state change
        // eventManager.emit('GAME_STATE_CHANGED', newState);
    }

    public getState(): GameState {
        return this._state;
    }

    private onItemCaught = (data: { score: number, experience: number }) => {
        if (this._state !== GameState.Playing) return;

        this.score += data.score;
        this.experience += data.experience;

        console.log(`Score: ${this.score}`);
        console.log(`EXP: ${this.experience} / ${this.expToNextLevel}`);

        this.checkForLevelUp();
        // We will update the UI with this new score later
    }

    private onItemMissed = () => {
        if (this._state !== GameState.Playing) return;

        this.chaosValue += 1;
        console.log(`Chaos: ${this.chaosValue} / ${this.chaosMax}`);

        // Check for game over
        if (this.chaosValue >= this.chaosMax) {
            this.setState(GameState.GameOver);
        }
    }

    private checkForLevelUp() {
        if (this.experience >= this.expToNextLevel) {
            this.currentLevel++;
            this.experience -= this.expToNextLevel;
            
            // Increase the EXP requirement for the next level (e.g., by 50)
            this.expToNextLevel += 50; 

            console.log(`LEVEL UP! New level: ${this.currentLevel}`);
            eventManager.emit('EXP_FULL');
        }
    }

    private handleRunEnd() {
        // Calculate gold earned from this run
        const goldEarned = Math.floor(this.score / 10);
        console.log(`Gold earned this run: ${goldEarned}`);

        // Update and save player data
        const dataManager = DataManager.instance;
        dataManager.data.totalGold += goldEarned;
        dataManager.save();

        console.log(`Total gold is now: ${dataManager.data.totalGold}`);
    }

    private togglePhysicsDebug(active: boolean) {
        if (active) {
            PhysicsSystem2D.instance.enable = true;
            PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.Aabb |
                EPhysics2DDrawFlags.Pair |
                EPhysics2DDrawFlags.CenterOfMass |
                EPhysics2DDrawFlags.Joint |
                EPhysics2DDrawFlags.Shape;
        } else {
            PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.None;
        }
    }
}
