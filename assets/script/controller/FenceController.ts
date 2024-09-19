import { _decorator, Component, instantiate, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FenceController')
export class FenceController extends Component {
    @property(Node)
    vert:Node = null;

    @property
    length:number = 1.6;

    protected _stepX:number = 0;
    protected _pos:Vec3 = Vec3.ZERO.clone();

    start() {
        if (!this.vert)
            this.vert = this.node.children[0];

        if (this.vert) {
            this.vert.getPosition(this._pos);
            this._stepX = this._pos.x * 2;

            const count:number = Math.floor(this.length / this._stepX) + 1;
            for (let index = 0; index < count; index++) {
                const element = instantiate(this.vert);
                this._pos.x = -this.length / 2 + this._stepX * index;
                this.node.addChild(element);
                element.setPosition(this._pos);
            }

            this.vert.active = false;
        }
    }
}


