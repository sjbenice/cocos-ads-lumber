import { _decorator, Component, easing, Node, Sprite, SpriteRenderer, Tween, tween, v3, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TutorHand')
export class TutorHand extends Component {
    protected static TIME = 1;
    protected static DISTANCE = 60;
    protected static MOVE_DOWN = v3(TutorHand.DISTANCE, -TutorHand.DISTANCE);
    protected static MOVE_UP = v3(-TutorHand.DISTANCE, TutorHand.DISTANCE);

    protected _sprite:Sprite = null;
    protected _orgPos:Vec3 = null;
    protected _downPos:Vec3 = null;

    protected onLoad(): void {
        this._sprite = this.getComponent(Sprite);
        this._sprite.enabled = false;

        this._orgPos = this.node.getPosition();
        this._downPos = this._orgPos.clone();
        this._downPos.add(TutorHand.MOVE_DOWN);
    }

    showTutor(show:boolean) {
        if (this._sprite) {
            if (show) {
                if (!this._sprite.enabled) {
                    // this.scheduleOnce(() => {
                        this._sprite.enabled = true;
        
                        tween(this.node)
                        .call(()=>{
                            this.node.setPosition(this._downPos);
                        })
                        .to(TutorHand.TIME, {position:this._orgPos}, {easing:'backOut'})
                        .union()
                        .repeatForever()
                        .start();
                    // }, 2);
                }
            } else {
                Tween.stopAllByTarget(this.node);

                this.unscheduleAllCallbacks();

                this.node.setPosition(Vec3.ZERO)
                this._sprite.enabled = false;
            }
        }
    }
}


