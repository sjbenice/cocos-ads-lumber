import { _decorator, Component, randomRange, Node } from 'cc';
import { SoundMgr } from '../manager/SoundMgr';
const { ccclass, property } = _decorator;

@ccclass('Emoji')
export class Emoji extends Component {
    public static TYPE = {
        NONE:-1,
        SMILE:0,
        TIRED:1,
        CRY:2,
        ANGRY:3,
    }

    @property(Node)
    icons:Node[] = [];

    private _type:number = Emoji.TYPE.NONE;
    private static SHOW_TIME:number = 2;

    protected onLoad(): void {
        this.node.active = false;
    }

    protected onDestroy(): void {
        this.unscheduleAllCallbacks();
    }

    public setType(type:number){
        if (this._type != type) {
            this.unscheduleAllCallbacks();

            this._type = type;
    
            if (this.icons){
                if (Emoji.TYPE.NONE < type){
                    if (type == this.icons.length - 1)
                        SoundMgr.playSound('angry');
                    
                    if (type >= this.icons.length)
                        type = this.icons.length - 1;

                    this.node.active = true;

                    this.icons.forEach(icon => {
                        icon.active = false;
                    });
                    this.icons[type].active = true;;
                    this.scheduleHide();
                } else {
                    this.node.active = false;
                }
            }
        }
    }

    public getType() : number {
        return this._type;
    }

    protected scheduleShow() {
        this.scheduleOnce(() => {
            this.node.active = true;
            this.scheduleHide();
        }, randomRange(Emoji.SHOW_TIME, Emoji.SHOW_TIME * 1.5));
    }

    protected scheduleHide() {
        this.scheduleOnce(() => {
            this.node.active = false;
        }, Emoji.SHOW_TIME);
    }
}
