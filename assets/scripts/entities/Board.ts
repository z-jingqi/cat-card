import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Board')
export class Board extends Component {
    @property
    public moveSpeed: number = 300;

    // We will add more properties here later, like width, special abilities, etc.
}
