import { _decorator, Component, Label, Node } from 'cc';
import { SoundMgr } from '../manager/SoundMgr';
const { ccclass, property } = _decorator;

@ccclass('MoneyController')
export class MoneyController extends Component {
    @property
    money:number = 0;

    @property(Label)
    label:Label = null;

    @property
    dollar:string = '$';

    public static CHANGE_UNIT:number = 10;

    protected _changeAmount:number = 0;

    protected _isAdded:boolean = false;

    protected onLoad(): void {
        if (!this.label)
            this.label = this.getComponent(Label);
        if (!this.label)
            this.label = this.getComponentInChildren(Label);
    }

    start() {
        this.setLabelString(this.money);
    }

    update(deltaTime: number) {
        if (this._changeAmount != 0) {
            const amount = Math.min(MoneyController.CHANGE_UNIT, Math.abs(this._changeAmount))
            if (this._changeAmount < 0)
                this._changeAmount += amount;
            else
                this._changeAmount -= amount;

            this.setLabelString(this.money - this._changeAmount);
        }
    }

    protected setLabelString(value:number) {
        if (this.label)
            this.label.string = this.dollar + value.toString();
    }

    public getMoney() {
        return this.money;
    }

    public isAdded() : boolean {
        const ret = this._isAdded;
        this._isAdded = false;
        return ret;
    }

    public addMoney(amount:number) {
        let money = this.money + amount;
        if (money < 0)
            money = 0;

        this._changeAmount = money - this.money;
        this.money = money;

        if (amount > 0) {
            SoundMgr.playSound('money');
            this._isAdded = true;
        }
    }
}


