import { _decorator, Collider, Component, EPSILON, instantiate, Node, Prefab, random, randomRange, v3, Vec3 } from 'cc';
import { Item } from '../item/Item';
import { CautionMark } from './CautionMark';
import { GameState } from '../manager/GameState';
import { TruckController } from './TruckController';
const { ccclass, property } = _decorator;

@ccclass('PaletteController')
export class PaletteController extends Component {
    @property(CautionMark)
    caution:CautionMark = null;

    @property
    epsilon:number = EPSILON;

    @property
    loadMultiply:number = 1;

    @property(Prefab)
    loadPrefab:Prefab = null;

    protected _collider:Collider = null;

    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _tempPos2:Vec3 = Vec3.ZERO.clone();
    protected _isRuining:boolean = false;

    protected _truck:TruckController = null;
    protected _hadTruck:boolean = false;

    protected onLoad(): void {
        this._collider = this.getComponent(Collider);
    }

    start() {

    }

    public createInitGoods(count:number) {
        if (this.loadPrefab) {
            for (let index = 0; index < count; index++) {
                const element = instantiate(this.loadPrefab);
                const item = element.getComponent(Item);
                this.arrange(item, true, false);
            }
        }
    }

    public onDestroyAll() {
        if (this._truck) {
            this._truck.onDestroyPalette();
            this._truck = null;
        }
    }

    public setTruck(truck:TruckController) {
        this._truck = truck;
        if (truck)
            this._hadTruck = true;
    }

    public hasTruck() {
        return this._truck != null;
    }

    public canAcceptTruck(posZ:number) {
        this.node.getWorldPosition(this._tempPos);
        return (Math.abs(this._tempPos.z - posZ) < this.epsilon);
    }

    protected isTruckBuying() {
        return this._truck && this._truck.isBuying();
    }

    public checkArrange(maxCount:number) : boolean {
        if (this._isRuining) {
            if (this.node.children.length == 0) {
                this._isRuining = false;
                if (this.caution)
                    this.caution.showCaution(false);
            } else {
                this.ruin(Math.floor(maxCount / randomRange(5, 10)));
            }
        } else if (this.node.children.length >= maxCount) {
            this._isRuining = true;

            if (this.caution) {
                this.caution.showCaution(true);
                GameState.setState(GameState.State.NEED_CLIENTS);
            }
        }

        return !this._isRuining;
    }

    protected ruin(count:number) {
        if (this._isRuining) {
            let j = this.node.children.length - 1;
            for (let i = 0; i < count; i++) {
                while (j >= 0) {
                    const element = this.node.children[j--];
                    const item = element.getComponent(Item);
                    if (!item.isPhysicsEnabled()) {
                        item.enablePhysics(true);
    
                        item.node.getPosition(this._tempPos);
                        this._tempPos.x -= randomRange(-1, 1) * this._tempPos.y / 2;
                        this._tempPos.z += randomRange(-1, 1) * this._tempPos.y / 2;
                        item.node.setPosition(this._tempPos);
                        this._tempPos.z = random() * 180;
                        this._tempPos.y = random() * 180;
                        item.node.setRotationFromEuler(this._tempPos);

                        break;
                    }
                }
            }
        }
    }

    public arrangeGroup(group:Node) {
        if (group) {
            const count = group.children.length;
            for (let index = 0; index < count; index++) {
                const element = group.children[0];
                const item = element.getComponent(Item);
                this.arrange(item, this._hadTruck/*this.isTruckBuying()*/);                
            }

            group.removeFromParent();
            group.destroy();
        }
    }

    protected arrange(item:Item, arrange:boolean, effect:boolean = true) {
        if (this._collider && item) {
            this.node.addChild(item.node);

            if (arrange) {
                item.enablePhysics(false);

                PaletteController.calcArrangePos(this._collider.worldBounds.halfExtents, item.getHalfDimension(), 
                    this.node.children.length - 1, this._tempPos);

                item.node.setPosition(this._tempPos);
    
                if (effect && this.node.active)
                    item.scaleEffect(randomRange(0.2, 0.4));
            } else {
                // if (this._isRuining)
                    item.enablePhysics(true);
                GameState.setState(GameState.State.NEED_CLIENTS);
            }
        }
    }

    public static calcArrangePos(placeHalfDimention:Vec3, itemHalfDimention:Vec3, index:number, outPos:Vec3) {
        const dimen: Vec3 = placeHalfDimention;
        const itemDimen: Vec3 = itemHalfDimention;
        const rows : number = Math.floor(dimen.z / itemDimen.z);
        const cols : number = Math.floor(dimen.x / itemDimen.x);

        const y:number = Math.floor(index / (rows * cols)) * itemDimen.y * 2 + itemDimen.y;
        index = index % (rows * cols);
        const z:number = Math.floor(index / cols) * itemDimen.z * 2 + itemDimen.z - rows * itemDimen.z;
        const x:number = Math.floor(index % cols) * itemDimen.x * 2 + itemDimen.x - cols * itemDimen.x;

        outPos.set(x, y, z);
    }

}


