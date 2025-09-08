import { _decorator, Component, EventKeyboard, input, Input, KeyCode, Node, Vec3, view, UITransform, EventTouch, v3 } from 'cc';
import { Board } from '../entities/Board';

const { ccclass, property } = _decorator;

@ccclass('PlayerCtrl')
export class PlayerCtrl extends Component {
    
    private _board: Board = null;
    private _moveDir: number = 0; // -1 for left, 1 for right, 0 for stop
    private _uiTransform: UITransform = null;
    private _screenHalfWidth: number = 0;

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
        switch (event.keyCode) {
            case KeyCode.ARROW_LEFT:
            case KeyCode.KEY_A:
                this._moveDir = -1;
                break;
            case KeyCode.ARROW_RIGHT:
            case KeyCode.KEY_D:
                this._moveDir = 1;
                break;
        }
    }

    private onKeyUp(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.ARROW_LEFT:
            case KeyCode.KEY_A:
            case KeyCode.ARROW_RIGHT:
            case KeyCode.KEY_D:
                this._moveDir = 0;
                break;
        }
    }

    private onTouchStart(event: EventTouch) {
        this.handleTouchMove(event);
    }
    
    private onTouchMove(event: EventTouch) {
        this.handleTouchMove(event);
    }

    private onTouchEnd(event: EventTouch) {
        this._moveDir = 0; // Stop movement when touch ends, could be changed
    }

    private handleTouchMove(event: EventTouch) {
        const touchPos = event.getUILocation();
        const screenCenter = view.getVisibleSize().width / 2;
        if (touchPos.x < screenCenter) {
            this._moveDir = -1;
        } else {
            this._moveDir = 1;
        }
    }

    update(deltaTime: number) {
        if (this._moveDir === 0) {
            return;
        }

        const currentPos = this.node.position;
        const newPosX = currentPos.x + this._moveDir * this._board.moveSpeed * deltaTime;
        
        // Boundary check
        const halfBoardWidth = this._uiTransform.contentSize.width / 2;
        const clampedPosX = Math.max(-this._screenHalfWidth + halfBoardWidth, Math.min(this._screenHalfWidth - halfBoardWidth, newPosX));

        this.node.setPosition(v3(clampedPosX, currentPos.y, currentPos.z));
    }
}
