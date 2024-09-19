import { _decorator, Component, instantiate, Node, Prefab, random, randomRange, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TreeHeightController')
export class TreeHeightController extends Component {
    @property(Prefab)
    treePrefab:Prefab = null;

    @property
    xRange:number = 10;

    @property
    zRange:number = 10;

    @property
    cellSize:number = 0.5;

    @property
    variant:number = 0.2;

    start() {
        this.node.children[0].active = false;
        if (this.treePrefab) {
            const pos = Vec3.ZERO.clone();
            const scale = Vec3.ONE.clone();
            for (let x = -this.xRange / 2; x < this.xRange / 2; x += this.cellSize) {
                for (let z = -this.zRange / 2; z < this.zRange / 2; z += this.cellSize) {
                    const tree = instantiate(this.treePrefab);
                    this.node.addChild(tree);
                    tree.getScale(scale);
                    scale.multiplyScalar(randomRange(1-this.variant, 1+this.variant));
                    tree.setScale(scale);

                    pos.x = x + (0.5 - random()) * this.cellSize;
                    pos.z = z + (0.5 - random()) * this.cellSize;

                    tree.setPosition(pos);
                }
            }
        }
    }
}


