import { _decorator, Component, Node, Prefab, view, Vec3, v3 } from 'cc';
import { ItemBlueprints } from '../data/ItemBlueprints';
import { ObjectPoolManager } from '../core/ObjectPool';
import { Item } from '../entities/Item';
import { VerticalTrajectory } from '../behaviors/trajectories/VerticalTrajectory';

const { ccclass, property } = _decorator;

@ccclass('ItemSpawner')
export class ItemSpawner extends Component {
    @property([Prefab])
    public itemPrefabs: Prefab[] = [];

    @property
    public spawnInterval: number = 2.0;

    private _spawnTimer: number = 0;
    private _screenHalfWidth: number = 0;

    onLoad() {
        this._screenHalfWidth = view.getVisibleSize().width / 2;
    }

    start() {
        this._spawnTimer = this.spawnInterval;
    }

    update(deltaTime: number) {
        this._spawnTimer -= deltaTime;
        if (this._spawnTimer <= 0) {
            this.spawnItem();
            this._spawnTimer = this.spawnInterval;
        }
    }

    spawnItem() {
        // For now, we only have one item type
        const blueprint = ItemBlueprints["APPLE_NORMAL"];
        if (!blueprint) return;

        // Find the correct prefab. For now, we assume the first one is the generic item.
        // A better system would map blueprint IDs to prefabs.
        const itemPrefab = this.itemPrefabs[0];
        if (!itemPrefab) {
            console.error("Item prefab is not assigned in ItemSpawner.");
            return;
        }

        const itemNode = ObjectPoolManager.instance.get(itemPrefab);

        // Position it at a random x coordinate at the top of the screen
        const spawnX = Math.random() * (this._screenHalfWidth * 2) - this._screenHalfWidth;
        const spawnY = view.getVisibleSize().height / 2 + 50; // Start slightly above the screen
        itemNode.setPosition(v3(spawnX, spawnY, 0));

        // Get the Item component and set it up
        const itemComp = itemNode.getComponent(Item);
        if (itemComp) {
            itemComp.setup(blueprint);
        }
        
        // Add the node to the scene (assuming the spawner is a child of the Canvas)
        this.node.parent.addChild(itemNode);
    }
}
