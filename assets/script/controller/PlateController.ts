import { _decorator, Collider, Component, instantiate, Node, Prefab, Quat, random, randomRange, RigidBody, Vec3 } from 'cc';
import { Item } from '../item/Item';
import { CautionMark } from './CautionMark';
import { GameState } from '../manager/GameState';
const { ccclass, property } = _decorator;

@ccclass('PlateController')
export class PlateController extends Component {
    @property(Prefab)
    itemPrefab:Prefab = null;

    @property
    xRadius:number = 0;

    @property
    zRadius:number = 0;

    @property
    isPhysics:boolean = true;

    @property
    period:number = 0.1;

    variant:number = 0.5;

    @property
    maxCount:number = 300;

    @property(CautionMark)
    cautionMark:CautionMark = null;

    protected _pos:Vec3 = Vec3.ZERO.clone();
    protected _quat:Quat = Quat.IDENTITY.clone();

    protected _timer:number = 0;
    protected _initialCount:number = 0;

    private _isCaution:boolean = false;

    start() {
        if (this.itemPrefab) {
            let brevno = instantiate(this.itemPrefab);
            const item = brevno.getComponent(Item);
            const dimen = item.getHalfDimension();

            for (let x = -this.xRadius; x < this.xRadius; x+= dimen.x * 2) {
                for (let z = -this.zRadius; z < this.zRadius; z+= dimen.z * 2.5) {
                    if (!brevno)
                        brevno = instantiate(this.itemPrefab);
                    this._pos.x = x + randomRange(-this.variant, this.variant) * dimen.x;
                    this._pos.z = z + randomRange(-this.variant, this.variant) * dimen.z;
                    this.node.addChild(brevno);
                    brevno.setPosition(this._pos);
                    Quat.fromEuler(this._quat, 0, random() * 360, random() * 20);
                    brevno.setRotation(this._quat);

                    if (!this.isPhysics) {
                        const collider = brevno.getComponent(Collider);
                        if (collider)
                            collider.destroy();
                        const rigid = brevno.getComponent(RigidBody);
                        if (rigid)
                            rigid.destroy();
                    }
                    brevno = null;
                }
            }
        }

        this._initialCount = this.node.children.length;

        this.showCaution(true);
    }

    public showCaution(show:boolean) {
        this._isCaution = show;

        if (this.cautionMark)
            this.cautionMark.showCaution(show);

        if (!show)
            this.enabled = false;
    }

    protected update(dt: number): void {
        if (!this.isPhysics) return;

        this._timer += dt;
        if (this._timer >= this.period) {
            this._timer = 0;
            
            const brevno = instantiate(this.itemPrefab);
            this._pos.x = randomRange(-this.variant, this.variant) * this.xRadius;
            this._pos.z = randomRange(-this.variant, this.variant) * this.zRadius;
            this.node.addChild(brevno);
            brevno.setPosition(this._pos);
            Quat.fromEuler(this._quat, 0, random() * 360, random() * 20);
            brevno.setRotation(this._quat);

            if (this.node.children.length > this.maxCount) {
                const node = this.node.children[0];
                node.removeFromParent();
                node.destroy();
            }
            
            // if (this.cautionMark) {
            //     const bCaution = this.node.children.length > this._initialCount;
            //     this.cautionMark.showCaution(bCaution);
            //     if (bCaution)
            //         GameState.setState(GameState.State.NEED_SLIDES);
            // }

            if (this._isCaution)
                this.showCaution(true);
        }
    }
}


