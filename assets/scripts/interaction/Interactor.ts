import { _decorator, Component, Enum } from 'cc';
const { ccclass, property } = _decorator;

export enum InteractorType {
    UNKNOWN = 0,
    BOARD = 1,
    BULLET = 2,
}
// Register the enum with the Cocos Creator type system
Enum(InteractorType);

@ccclass('Interactor')
export class Interactor extends Component {
    @property({ type: InteractorType })
    public type: InteractorType = InteractorType.UNKNOWN;
}
