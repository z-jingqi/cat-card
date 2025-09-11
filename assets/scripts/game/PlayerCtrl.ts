import { _decorator, Component, EventKeyboard, input, Input, KeyCode, Node, Vec3, view, UITransform, EventTouch, v3 } from 'cc';
import { Board } from '../entities/Board';
import { GameManager, GameState } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('PlayerCtrl')
export class PlayerCtrl extends Component {
    
    private _board: Board = null;
    private _uiTransform: UITransform = null;
    private _screenHalfWidth: number = 0;

    // --- New Input State Management ---
    private _inputStack: number[] = []; // Stack for keyboard input
    private _touchMoveDir: number = 0;  // Direction for touch input
    // ------------------------------------

    onLoad() {
        this._board = this.getComponent(Board);
        if (!this._board) {
            console.error("PlayerCtrl requires a Board component on the same node.");
            return;
        }

        this._uiTransform = this.getComponent(UITransform);
        this._screenHalfWidth = view.getVisibleSize().width / 2;
        
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        
        // Touch/Mouse controls
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onKeyDown(event: EventKeyboard) {
        let dir = 0;
        switch (event.keyCode) {
            case KeyCode.ARROW_LEFT:
            case KeyCode.KEY_A:
                dir = -1;
                break;
            case KeyCode.ARROW_RIGHT:
            case KeyCode.KEY_D:
                dir = 1;
                break;
        }

        if (dir !== 0) {
            // Add to stack only if it's not already there
            const index = this._inputStack.indexOf(dir);
            if (index === -1) {
                this._inputStack.push(dir);
            }
        }
    }

    private onKeyUp(event: EventKeyboard) {
        let dir = 0;
        switch (event.keyCode) {
            case KeyCode.ARROW_LEFT:
            case KeyCode.KEY_A:
                dir = -1;
                break;
            case KeyCode.ARROW_RIGHT:
            case KeyCode.KEY_D:
                dir = 1;
                break;
        }

        if (dir !== 0) {
            // Remove from stack
            const index = this._inputStack.indexOf(dir);
            if (index > -1) {
                this._inputStack.splice(index, 1);
            }
        }
    }

    private onTouchStart(event: EventTouch) {
        this.handleTouchMove(event);
    }
    
    private onTouchMove(event: EventTouch) {
        this.handleTouchMove(event);
    }

    private onTouchEnd(event: EventTouch) {
        this._touchMoveDir = 0;
    }

    private handleTouchMove(event: EventTouch) {
        const touchPos = event.getUILocation();
        const screenCenter = this._screenHalfWidth;
        if (touchPos.x < screenCenter) {
            this._touchMoveDir = -1;
        } else {
            this._touchMoveDir = 1;
        }
    }

    update(deltaTime: number) {
        let keyboardMoveDir = 0;
        if (this._inputStack.length > 0) {
            keyboardMoveDir = this._inputStack[this._inputStack.length - 1];
        }

        // Touch input takes precedence over keyboard
        const finalMoveDir = this._touchMoveDir !== 0 ? this._touchMoveDir : keyboardMoveDir;

        if (finalMoveDir === 0) {
            return;
        }

        const moveSpeed = this._board.statSheet.getStat("moveSpeed").value;
        const currentPos = this.node.position;
        const newPosX = currentPos.x + finalMoveDir * moveSpeed * deltaTime;
        
        // Boundary check
        const halfBoardWidth = this._uiTransform.contentSize.width / 2;
        const clampedPosX = Math.max(-this._screenHalfWidth + halfBoardWidth, Math.min(this._screenHalfWidth - halfBoardWidth, newPosX));

        this.node.setPosition(v3(clampedPosX, currentPos.y, currentPos.z));
    }
}
