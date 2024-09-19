import { _decorator, Collider, Component, ERigidBodyType, ICollisionEvent, instantiate, ITriggerEvent, Node, NodeSpace, ParticleSystem, Quat, randomRange, randomRangeInt, RigidBody, sys, toDegree, toRadian, tween, Tween, v3, Vec3 } from 'cc';
import { getForward, signedAngleVec3 } from '../util/Math';
import { PHY_GROUP } from '../manager/Layers';
import { SoundMgr } from '../manager/SoundMgr';
import { LineManager } from '../manager/LineManager';
import { PaletteController } from './PaletteController';
import { Item } from '../item/Item';
import { MoneyController } from '../util/MoneyController';
import { ParabolaTween } from '../util/ParabolaTween';
import { Emoji } from '../util/Emoji';
const { ccclass, property } = _decorator;

@ccclass('TruckController')
export class TruckController extends Component {
    @property(Node)
    topGroup:Node = null;

    @property
    topAnimationTime:number = 0.2;
    @property
    topAnimationY:number = 0.5;

    @property(ParticleSystem)
    vfxMoney:ParticleSystem = null;

    @property(Node)
    placePos:Node = null;

    @property(Vec3)
    placeDimention:Vec3 = v3(0, 0, 0);

    @property(Emoji)
    emoji:Emoji = null;

    @property(ParticleSystem)
    vfx:ParticleSystem = null;

    // @property
    speed:number = 30;

    // @property
    angleSpeed:number = 360;

    public static State = {
        NONE:-1,
        TO_LINE:0,
        WAITING:1,
        TO_PALETTE:2,
        ARRIVED:3,
        BUYING:4,
        PAYING:5,
        TO_BACK:6,
    };

    protected static START_X:number = -60;//40;
    protected static PALETTE_X:number = -9;
    protected static END_X:number = TruckController.PALETTE_X;//-25;

    protected _topAnimPos:Vec3 = Vec3.ZERO.clone();

    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _targetPos:Vec3 = Vec3.ZERO.clone();
    protected _velocity:Vec3 = Vec3.ZERO.clone();

    protected _state:number = TruckController.State.NONE;
    protected _startZ:number = 0;

    protected _moving:boolean = false;

    protected _buyTimer:number = 0;
    protected _buyMaxCount:number = 0;
    protected _totalPrice:number = 0;
    protected static BUY_INTERVAL:number = 0.05;

    protected _waitTime:number = 0;
    protected _maxWaitTime:number = 0;
    protected static MAX_WAIT_TIME:number = 2;

    protected static LEFT:Vec3 = v3(-1, 0, 0);

    protected _sleepMoveTimer: number = 0;
    protected _sleepMoveInterval: number = 0;

    protected _rigidBody:RigidBody = null;
    protected _collider:Collider = null;

    protected _stopWork:boolean = false;
    protected _palette:PaletteController = null;
    protected _money:MoneyController = null;

    protected _paying:boolean = false;

    protected static _viewDir:Vec3 = Vec3.ZERO.clone();

    protected onLoad(): void {
        this._topAnimPos.y = this.topAnimationY;

        if (this.placePos && this.placePos.children.length > 0) {
            const node = this.placePos.children[0];
            node.getScale(this.placeDimention);
            this.placeDimention.multiplyScalar(0.5);
            this.placeDimention.y *= 0.5;
            node.removeFromParent();
            node.destroy();
        }

        this._rigidBody = this.getComponent(RigidBody);
        this._collider = this.getComponent(Collider);
        if (this._collider) {
            this._collider.on('onCollisionEnter', this.onCollisionEnter, this);
            this._collider.on('onCollisionStay', this.onCollisionStay, this);
            this._collider.on('onCollisionExit', this.onCollisionExit, this);
            this._collider.on('onTriggerEnter', this.onTriggerEnter, this);
        }
    }

    onDestroy() {
        if (this._collider) {
            this._collider.off('onCollisionEnter', this.onCollisionEnter, this);
            this._collider.off('onCollisionStay', this.onCollisionStay, this);
            this._collider.off('onCollisionExit', this.onCollisionExit, this);
            this._collider.off('onTriggerEnter', this.onTriggerEnter, this);
        }

        if (this._palette)
            this._palette.setTruck(null);
    }

    onCollisionEnter(event: ICollisionEvent) {
        this.doCollisionEnter(event);
    }

    onCollisionStay(event: ICollisionEvent) {
        this.doCollisionStay(event);
    }

    onCollisionExit(event: ICollisionEvent) {
        this.doCollisionExit(event);
    }

    onTriggerEnter (event: ITriggerEvent) {
        this.doTriggerEnter(event);
    }

    protected doCollisionEnter(event: ICollisionEvent){
        const guest = this.getGuestFromColliderEvent(event);
        if (guest) {
            this.onCollision(guest, true);
        }
    }

    protected doCollisionStay(event: ICollisionEvent){
        const guest = this.getGuestFromColliderEvent(event);
        if (guest) {
            this.onCollision(guest, false);
        }
    }

    protected doCollisionExit(event: ICollisionEvent){

    }

    protected doTriggerEnter(event: ITriggerEvent){

    }

    protected getGuestFromColliderEvent(event: ICollisionEvent) : TruckController {
        const otherCollider = event.otherCollider;
        if (otherCollider && otherCollider.getGroup() == PHY_GROUP.PLAYER) {
            const otherNode = otherCollider.node;
            if (otherNode) {
                const guest:TruckController = otherNode.getComponent(TruckController);
                return guest;
            }
        }

        return null;
    }

    protected onCollision(other:TruckController, enter:boolean) {
        if (this._state < other._state
             || (this._state == other._state && this.getRemainDistance() > other.getRemainDistance())) {
            const baseTime = 10000 / this.speed;
            this.sleepMove(randomRangeInt(baseTime, baseTime * 1.5));

            if (enter)
                SoundMgr.playSound('horn');
        }
    }

    protected getRemainDistance() : number {
        this.node.getPosition(this._tempPos);
        this._tempPos.subtract(this._targetPos);
        return this._tempPos.length();
    }

    protected sleepMove(sleepMilliseconds:number):void {
        this._sleepMoveTimer = sys.now();
        this._sleepMoveInterval = sleepMilliseconds;
    }

    protected freeze(freeze:boolean) {
        if (this._rigidBody)
            this._rigidBody.type = freeze ? ERigidBodyType.STATIC : ERigidBodyType.DYNAMIC;
    }

    start() {
    }

    public startWork(startZ:number, toLine:boolean, money:MoneyController, vfx:boolean) {
        this._startZ = startZ;
        this._money = money;

        let state:number;
        if (toLine) {
            this._tempPos.set(TruckController.PALETTE_X, 0, startZ);
            this.node.setPosition(this._tempPos);

            state = TruckController.State.ARRIVED;

            // this.node.setRotationFromEuler(v3(0, -90, 0));
        } else {
            this._tempPos.set(TruckController.START_X, 0, startZ);
            this.node.setPosition(this._tempPos);
            this._targetPos.set(this._tempPos);
            state = TruckController.State.TO_BACK;

            // this.node.setRotationFromEuler(v3(0, 90, 0));
        }
        this.node.setRotationFromEuler(v3(0, -90, 0));

        // this.scheduleOnce(()=>{
            this._state = state;
        // }, delay);

        this.initWork();

        if (vfx && this.vfx)
            this.vfx.play();
    }

    public stopWork() {
        this._stopWork = true;

        if (this._palette) {
            this._palette.setTruck(null);
            this._palette = null;
        }
        
        if (this._state >= TruckController.State.TO_PALETTE && this._state < TruckController.State.PAYING)
            this._state = TruckController.State.PAYING;
        else {
            this._tempPos.set(TruckController.START_X, 0, this._startZ);
            this.moveTo(this._tempPos);
            this._state = TruckController.State.TO_BACK;
        }
    }

    public isBuying() : boolean {
        return this._state == TruckController.State.BUYING;
    }

    public getStartZ() : number {
        return this._startZ;
    }

    protected initWork() {
        this._buyTimer = 0;
        this._buyMaxCount = 0;
        this._totalPrice = 0;
    
        this._waitTime = 0;
        if (this.emoji)
            this.emoji.setType(Emoji.TYPE.NONE);
        this._maxWaitTime = TruckController.MAX_WAIT_TIME;//randomRange(TruckController.MAX_WAIT_TIME * 0.5, TruckController.MAX_WAIT_TIME);
    }

    protected moveTo(targetPos:Vec3) {
        this.topAnimation(true);

        this._targetPos.set(targetPos);
        this._targetPos.y = 0;

        this._moving = true;
    }

    protected topAnimation(start:boolean) {
        if (this.topGroup) {
            Tween.stopAllByTarget(this.topGroup);
            this.topGroup.setPosition(Vec3.ZERO);
    
            if (start)
                tween(this.topGroup)
                .to(this.topAnimationTime, {position:this._topAnimPos})
                .to(this.topAnimationTime, {position:Vec3.ZERO})
                .union()
                .repeatForever()
                .start();
        }
    }

    public onDestroyPalette() {
        this._palette = null;
        this._state = TruckController.State.PAYING;
    }

    public hasPalette() : boolean {
        return this._palette != null;
    }

    public isWaiting() :boolean {
        return !this._palette && 
            (this._state >= TruckController.State.WAITING && this._state <= TruckController.State.BUYING);
    }

    public setPalette(palette:PaletteController) {
        this._palette = palette;
    }

    update(deltaTime: number) {
        if (this._sleepMoveTimer > 0){
            if (sys.now() < this._sleepMoveTimer + this._sleepMoveInterval) {
                this.updateEmojiTime(deltaTime);
                return;
            }

            this._sleepMoveTimer = 0;
            this._sleepMoveInterval = 0;
        }
        
        if (this._moving) {
            this.node.getWorldPosition(this._tempPos);

            Vec3.subtract(this._velocity, this._targetPos, this._tempPos);
            const distance = this._velocity.lengthSqr();

            this._velocity.normalize();
            this._velocity.multiplyScalar(deltaTime * this.speed);
            if (this._velocity.length() > distance) {
                this._tempPos.set(this._targetPos);
            } else {
                this._tempPos.add(this._velocity);
            }

            if (distance < 0.1) {
                this.node.setWorldPosition(this._targetPos);
                this._moving = false;
            } else {
                // if (this._state != TruckController.State.ARRIVED)
                //     TruckController.faceViewCommon(this._velocity, deltaTime, this.node, this.angleSpeed);
                
                this.node.setWorldPosition(this._tempPos);
            }
        }

        switch (this._state) {
            case TruckController.State.TO_LINE:
                if (!this._moving) {
                    this._state = TruckController.State.WAITING;
                }
                break;
            case TruckController.State.WAITING:
                this.updateEmojiTime(deltaTime);

                if (this._palette) {
                    this._palette.setTruck(this);
                    // this._palette.node.getWorldPosition(this._tempPos);
                    this._tempPos.x = TruckController.END_X;
                    this._tempPos.z = this._startZ;
                    this.moveTo(this._tempPos);
                    this._state = TruckController.State.TO_PALETTE;
                }
                break;
            case TruckController.State.TO_PALETTE:
                if (!this._moving) {
                    // if (TruckController.faceViewCommon(TruckController.LEFT, deltaTime, this.node, this.angleSpeed) < 0.01)
                    {
                        // this._tempPos.set(this._targetPos);
                        // this._tempPos.x = TruckController.PALETTE_X;
                        // this.moveTo(this._tempPos);
                        this._state = TruckController.State.ARRIVED;
                    }
                }
                break;
            case TruckController.State.ARRIVED:
                if (!this._moving) {
                    this.topAnimation(false);
                    this.freeze(true);
                    this._state = TruckController.State.BUYING;
                }
                break;
            case TruckController.State.BUYING:
                this._buyTimer += deltaTime;
                if (this._buyTimer >= TruckController.BUY_INTERVAL) {
                    this._buyTimer = 0;
                    if (this._palette && this._palette.node.children.length > 0) {
                        for (let index = this._palette.node.children.length - 1; index >= 0; index--) {
                            const good = this._palette.node.children[index];
                            const item = good.getComponent(Item);
                            if (item && !item.isPhysicsEnabled()) {
                                item.stopScaleEffect();

                                good.getWorldPosition(this._tempPos);
                                good.setParent(this.placePos);
                                good.setRotation(Quat.IDENTITY);
                                good.setWorldPosition(this._tempPos);
    
                                // item.enablePhysics(false);
    
                                this._totalPrice += item.price;
    
                                SoundMgr.playSound('peeling');
            
                                const dimen = item.getHalfDimension();
    
                                if (this._buyMaxCount <= 0) {
                                    this._buyMaxCount = Math.floor(this.placeDimention.x / (dimen.x));
                                    this._buyMaxCount *= Math.floor(this.placeDimention.y / (dimen.y));
                                    this._buyMaxCount *= Math.floor(this.placeDimention.z / (dimen.z));
                                }
    
                                PaletteController.calcArrangePos(this.placeDimention, dimen, 
                                    this.placePos.children.length - 1, this._tempPos);
    
                                ParabolaTween.moveNodeParabola(good, this._tempPos, 10, 0.5, -1, 0, false);

                                if (this._palette.loadMultiply > 1 && this._palette.loadPrefab) {
                                    for (let index = 1; index < this._palette.loadMultiply; index++) {
                                        if (this.placePos.children.length >= this._buyMaxCount)
                                            break;
                                        const element = instantiate(this._palette.loadPrefab);
                                        const itemElement = element.getComponent(Item);
                                        itemElement.enablePhysics(false);
                                        element.setParent(good.parent);
                                        this._totalPrice += item.price;

                                        PaletteController.calcArrangePos(this.placeDimention, dimen, 
                                            this.placePos.children.length - 1, this._tempPos);

                                        element.setPosition(this._tempPos);
                                        tween(element)
                                        .hide()
                                        .delay(0.5)
                                        .show()
                                        .start();
                                    }
                                }
            
                                if (this.placePos.children.length >= this._buyMaxCount)
                                    this._state = TruckController.State.PAYING;
    
                                break;
                            }    
                        }
                    }
                }
                break;
            case TruckController.State.PAYING:
                if (!this._paying) {
                    this._paying = true;
                    
                    this.topAnimation(true);
                    this.freeze(false);

                    if (this._totalPrice > 0) {
                        if (this.emoji && this.emoji.getType() <= Emoji.TYPE.TIRED)
                            this.emoji.setType(Emoji.TYPE.SMILE);
        
                        if (this.vfxMoney && !this.vfxMoney.isPlaying)
                            this.vfxMoney.play();

                        if (this._money)
                            this._money.addMoney(this._totalPrice);
                    }

                    this.scheduleOnce(() => {
                        // if (this.vfxMoney)
                        //     this.vfxMoney.stop();

                        // SoundMgr.playSound('woohoo');

                        this._paying = false;

                        this._tempPos.set(TruckController.START_X, 0, this._startZ);
                        this.moveTo(this._tempPos);
                        this._state = TruckController.State.TO_BACK;

                        // this.scheduleOnce(() => {
                            if (this._palette)
                                this._palette.setTruck(null);

                            this._palette = null;
                        // }, 1);
                    }, 1);
                }
                break;
            case TruckController.State.TO_BACK:
                if (!this._moving) {
                    if (this._stopWork) {
                        this.node.removeFromParent();
                        this.node.destroy();
                    } else {
                        // if (TruckController.faceViewCommon(Vec3.RIGHT, deltaTime, this.node, this.angleSpeed) < 0.01)
                        {
                            if (this.placePos)
                                this.placePos.removeAllChildren();

                            this.initWork();
    
                            if (this._palette) {
                                this._state = TruckController.State.WAITING;
                            } else {
                                this._tempPos.set(TruckController.END_X, 0, this._startZ);
                                this.moveTo(this._tempPos);
                                this._state = TruckController.State.TO_LINE;
                            }
                        }
                    }
                }
                break;
        }
    }

    protected updateEmojiTime(deltaTime:number) {
        this._waitTime += deltaTime;

        const emojiType = Math.floor(this._waitTime * (Emoji.TYPE.ANGRY - Emoji.TYPE.TIRED + 1) / this._maxWaitTime);
        if (emojiType >= Emoji.TYPE.TIRED && this.emoji)
            this.emoji.setType(emojiType);
    }

    public static faceViewCommon(movementInput: Vec3, deltaTime: number, moveNode:Node, turnAngleSpeed) {
        TruckController._viewDir.set(movementInput);
        TruckController._viewDir.y = 0.0;
        TruckController._viewDir.normalize();

        const characterDir = getForward(moveNode);
        characterDir.y = 0.0;
        characterDir.normalize();

        const currentAimAngle = signedAngleVec3(characterDir, TruckController._viewDir, Vec3.UNIT_Y);
        const currentAimAngleDegMag = toDegree(Math.abs(currentAimAngle));

        const maxRotDegMag = turnAngleSpeed > 0 ? turnAngleSpeed * deltaTime : currentAimAngleDegMag;
        const rotDegMag = Math.min(maxRotDegMag, currentAimAngleDegMag);
        const q = Quat.fromAxisAngle(new Quat(), Vec3.UNIT_Y, Math.sign(currentAimAngle) * toRadian(rotDegMag));
        moveNode.rotate(q, NodeSpace.WORLD);

        return currentAimAngleDegMag;
    }
}


