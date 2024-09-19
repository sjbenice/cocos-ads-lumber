import { _decorator, Component, EventMouse, EventTouch, Input, input, Node } from 'cc';
import { Utils } from './Utils';
import { SoundMgr } from '../manager/SoundMgr';
const { ccclass, property } = _decorator;

@ccclass('MouseController')
export class MouseController extends Component {
    private _pressing:boolean = false;

    protected onLoad(): void {
        
    }
    
    protected onDestroy(): void {
        if (!Utils.isTouchDevice()) {
            input.off(Input.EventType.MOUSE_DOWN, this._onInputMouseDown, this);
            input.off(Input.EventType.MOUSE_MOVE, this._onInputMouseMove, this);
            input.off(Input.EventType.MOUSE_UP, this._onInputMouseUp, this);
            // if (HTML5) {
            //     document.removeEventListener('pointerlockchange', this._onPointerlockchange);
            // }
        } else {
            // this.node.off(Node.EventType.TOUCH_START, this._onThisNodeTouchStart, this);
            // this.node.off(Node.EventType.TOUCH_END, this._onThisNodeTouchEnd, this);
            // this.node.off(Node.EventType.TOUCH_CANCEL, this._onThisNodeTouchCancelled, this);
            // this.node.off(Node.EventType.TOUCH_MOVE, this._onThisNodeTouchMove, this);
            input.off(Input.EventType.TOUCH_START, this._onThisNodeTouchStart, this);
            input.off(Input.EventType.TOUCH_MOVE, this._onThisNodeTouchMove, this);
            input.off(Input.EventType.TOUCH_END, this._onThisNodeTouchEnd, this);
            input.off(Input.EventType.TOUCH_CANCEL, this._onThisNodeTouchCancelled, this);
        }
    }

    start() {
        if (!Utils.isTouchDevice()) {
            input.on(Input.EventType.MOUSE_DOWN, this._onInputMouseDown, this);
            input.on(Input.EventType.MOUSE_MOVE, this._onInputMouseMove, this);
            input.on(Input.EventType.MOUSE_UP, this._onInputMouseUp, this);
            // if (HTML5) {
            //     document.addEventListener('pointerlockchange', this._onPointerlockchange);
            // }
        } else {
            // this.node.on(Node.EventType.TOUCH_START, this._onThisNodeTouchStart, this);
            // this.node.on(Node.EventType.TOUCH_END, this._onThisNodeTouchEnd, this);
            // this.node.on(Node.EventType.TOUCH_CANCEL, this._onThisNodeTouchCancelled, this);
            // this.node.on(Node.EventType.TOUCH_MOVE, this._onThisNodeTouchMove, this);
            input.on(Input.EventType.TOUCH_START, this._onThisNodeTouchStart, this);
            input.on(Input.EventType.TOUCH_MOVE, this._onThisNodeTouchMove, this);
            input.on(Input.EventType.TOUCH_END, this._onThisNodeTouchEnd, this);
            input.on(Input.EventType.TOUCH_CANCEL, this._onThisNodeTouchCancelled, this);
        }
    }
    
    private _onInputMouseDown(event: EventMouse) {
        switch (event.getButton()) {
            default:
                break;
            case EventMouse.BUTTON_LEFT:
                this._onClickOrTouch(event.getUILocationX(), event.getUILocationY(), event.getLocationX(), event.getLocationY());
                break;
        }
    }

    private _onInputMouseMove(event: EventMouse) {
        this._onClickOrTouchMove(event.getUILocationX(), event.getUILocationY(), event.getLocationX(), event.getLocationY());
    }

    private _onInputMouseUp (event: EventMouse) {
        switch (event.getButton()) {
            default:
                break;
            case EventMouse.BUTTON_LEFT:
                this.doClickOrTouchEnd(this._pressing);
                break;
        }
    }

    private _onThisNodeTouchStart (touchEvent: EventTouch) {
        const touch = touchEvent.touch;
        if (!touch) {
            return;
        }

        this._onClickOrTouch(touch.getUILocationX(), touch.getUILocationY(), touch.getLocationX(), touch.getLocationY());
    }

    private _onThisNodeTouchEnd () {
        this.doClickOrTouchEnd(this._pressing);
    }
    
    private _onThisNodeTouchCancelled () {
        this._onThisNodeTouchEnd();
    }

    private _onThisNodeTouchMove (touchEvent: EventTouch) {
        const touch = touchEvent.touch;
        if (!touch) {
            return;
        }
        this._onClickOrTouchMove(touch.getUILocationX(), touch.getUILocationY(), touch.getLocationX(), touch.getLocationY());
    }

    private _onClickOrTouch(x: number, y: number, screenX:number, screenY:number) {
        SoundMgr.onFirstClick();

        this._pressing = this.doClickOrTouch(x, y, screenX, screenY, false);
    }

    private _onClickOrTouchMove(x: number, y: number, screenX:number, screenY:number) {
        if (this._pressing) {
            this._pressing = this.doClickOrTouch(x, y, screenX, screenY, true);
        }
    }

    protected doClickOrTouchEnd(pressing:boolean) {
    }

    protected doClickOrTouch(x: number, y: number, screenX:number, screenY:number, moving:boolean) : boolean {
        // console.log(x, y);
        return false;
    }
}


