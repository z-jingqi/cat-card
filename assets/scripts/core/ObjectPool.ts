import { _decorator, Component, instantiate, Node, NodePool, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ObjectPoolManager')
export class ObjectPoolManager extends Component {
    public static instance: ObjectPoolManager;

    private _pools: Map<string, NodePool> = new Map();

    onLoad() {
        if (ObjectPoolManager.instance) {
            this.destroy();
            return;
        }
        ObjectPoolManager.instance = this;
    }

    /**
     * Retrieves a node from the specified pool. Creates the pool if it doesn't exist.
     * @param prefab The prefab to instantiate for the pool.
     * @returns A node from the pool.
     */
    public get(prefab: Prefab): Node {
        const poolName = prefab.name;
        if (!poolName) {
            console.error("Prefab name is missing!");
            return null;
        }

        if (!this._pools.has(poolName)) {
            this._pools.set(poolName, new NodePool());
        }

        const pool = this._pools.get(poolName);
        let node = pool.get();

        if (!node) {
            node = instantiate(prefab);
            // Add a component or property to the node to identify its pool
            node['_poolName'] = poolName; 
        }

        return node;
    }

    /**
     * Puts a node back into its corresponding pool.
     * @param node The node to put back.
     */
    public put(node: Node) {
        if (!node) {
            return;
        }
        
        const poolName = node['_poolName'];
        if (!poolName) {
            console.error("Node does not have a pool name!", node.name);
            node.destroy(); // Destroy it if we can't pool it
            return;
        }

        const pool = this._pools.get(poolName);
        if (!pool) {
            console.error(`No pool found for name: ${poolName}`);
            node.destroy();
            return;
        }

        pool.put(node);
    }

    /**
     * Clears a specific pool.
     * @param poolName The name of the pool to clear.
     */
    public clearPool(poolName: string) {
        const pool = this._pools.get(poolName);
        if (pool) {
            pool.clear();
        }
    }
}
