import { _decorator, Component, view, UITransform, BoxCollider2D } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('StretchToScreen')
export class StretchToScreen extends Component {

    onLoad() {
        this.stretchWidth();
    }

    stretchWidth() {
        const uiTransform = this.getComponent(UITransform);
        if (!uiTransform) {
            console.error("StretchToScreen component requires a UITransform component on the same node.");
            return;
        }

        const viewSize = view.getVisibleSize();
        const newWidth = viewSize.width;
        
        // Update the visual width
        uiTransform.width = newWidth;

        // Also update the physics collider width
        const boxCollider = this.getComponent(BoxCollider2D);
        if (boxCollider) {
            boxCollider.size.width = newWidth;
            boxCollider.apply(); // Apply the changes to the physics world
        }
    }
}
