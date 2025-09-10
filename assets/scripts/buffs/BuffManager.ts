import { _decorator, Component, Node, director } from 'cc';
import { eventManager } from '../core/EventManager';
import { GameManager, GameState } from '../core/GameManager';
import { Buff, BuffLibrary } from '../data/BuffLibrary';
import { Board } from '../entities/Board';

const { ccclass, property } = _decorator;

@ccclass('BuffManager')
export class BuffManager extends Component {

    private _boardNode: Node = null;

    onLoad() {
        eventManager.on('EXP_FULL', this.onLevelUp);
        eventManager.on('BUFF_SELECTED', this.onBuffSelected);
    }

    onDestroy() {
        eventManager.off('EXP_FULL', this.onLevelUp);
        eventManager.off('BUFF_SELECTED', this.onBuffSelected);
    }

    public setBoardNode(board: Node) {
        this._boardNode = board;
    }

    private onLevelUp = () => {
        // GameManager.instance.setState(GameState.Paused);
        director.pause();

        const availableBuffs = Object.keys(BuffLibrary).map(key => BuffLibrary[key]);
        const selectedBuffs: Buff[] = [];

        // Simple random selection of 3 unique buffs
        while (selectedBuffs.length < 3 && availableBuffs.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableBuffs.length);
            const buff = availableBuffs.splice(randomIndex, 1)[0];
            selectedBuffs.push(buff);
        }

        console.log("Player can choose from these buffs:", selectedBuffs.map(b => b.name));
        
        // Announce the buffs that are available for the UI to show
        eventManager.emit('SHOW_BUFF_SELECTION', selectedBuffs);
    }

    private onBuffSelected = (buffId: string) => {
        if (!this._boardNode) {
            console.error("Board node not set in BuffManager!");
            return;
        }

        const buff = BuffLibrary[buffId];
        if (buff) {
            const boardComponent = this._boardNode.getComponent(Board);
            if (boardComponent) {
                buff.apply(boardComponent);
                console.log(`Applied buff: ${buff.name}`);
            }
        }

        // GameManager.instance.setState(GameState.Playing);
        director.resume();
    }
}
