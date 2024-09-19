import { _decorator, Component, Node, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MachinWorkingTween')
export class MachinWorkingTween extends Component {
    @property
    period:number = 0.2;
    @property
    animationScale:number = 0.9;

    protected _orgScale:Vec3 = null;
    protected _animScale:Vec3 = null;

    start() {
        this._orgScale = this.node.getScale();
        this._animScale = this._orgScale.clone();
        this._animScale.multiplyScalar(this.animationScale)

        tween(this.node)
        .to(this.period, {scale:this._animScale})
        .to(this.period, {scale:this._orgScale})
        .union()
        .repeatForever()
        .start();
    }
}


