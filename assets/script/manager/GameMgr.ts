import { _decorator, Button, Component, director, Node, Sprite, Toggle, Tween, tween } from 'cc';
import event_html_playable from '../event_html_playable';
import { Utils } from '../util/Utils';
import { TutorHand } from '../controller/TutorHand';
import { GameState } from './GameState';
import { SoundMgr } from './SoundMgr';
import { MoneyController } from '../util/MoneyController';
import { MouseController } from '../util/MouseController';
import { LineManager } from './LineManager';
import { TruckManager } from './TruckManager';
import { PlateController } from '../controller/PlateController';
const { ccclass, property } = _decorator;

@ccclass('GameMgr')
export class GameMgr extends MouseController {
    static VERSION = {
        FULL: 1,
        ACTION_1_1: 2,// press upgrade button line and truck
    };

    @property(Node)
    btnPlay:Node = null;
    @property(Node)
    btnSound:Node = null;

    @property(TutorHand)
    tutorHands:TutorHand[] = [];

    @property(Node)
    btnUpgradeSlides:Node = null;

    @property(Node)
    btnUpgradeClients:Node = null;

    @property(MoneyController)
    money:MoneyController = null;

    @property(LineManager)
    lineManager:LineManager = null;
    
    @property(TruckManager)
    truckManager:TruckManager = null;

    @property(PlateController)
    plate:PlateController = null;

    private static _instance: GameMgr = null;
    private _version:number = 0;
    private _isGameEnd:boolean = false;

    private _endUpgradeCount:number = 0;

    private _isTutorSlides:boolean = true;

    onLoad() {
        super.onLoad();

        if (GameMgr._instance) {
            this.node.destroy();
            return;
        }
        GameMgr._instance = this;
        // director.addPersistRootNode(this.node);

        this._version = event_html_playable.version();
        if (this._version <= 0) {
            this._version = parseInt(Utils.getUrlParameter('version'), 10);
            if (!this._version)
                this._version = GameMgr.VERSION.FULL;
        }
        console.log(this._version);
    }

    protected onDestroy(): void {
        super.onDestroy();

        this.unscheduleAllCallbacks();

        if (GameMgr._instance == this)
            GameMgr._instance = null;

        if (!this._isGameEnd)
            event_html_playable.trackExit();
    }

    start() {
        super.start();
        
        event_html_playable.game_start();

        if (this.btnSound && (event_html_playable.hideSoundButton() || event_html_playable.hideAllButton()))
            this.btnSound.active = false;
        if (this.btnPlay) {
            // tween(this.btnPlay.getComponent(Button).node)
            // .by(0.5, {angle:5}, {easing:'bounceIn'})
            // .by(0.5, {angle:-10}, {easing:'bounceIn'})
            // .by(0.5, {angle:5}, {easing:'bounceIn'})
            // .union()
            // .repeatForever()
            // .start();

            if (event_html_playable.hideAllButton())
                this.btnPlay.active = false;
        }

        this.showTutor(true);
    }

    protected lateUpdate(dt: number): void {
        if (this.money && this.money.isAdded())
            this.updateAllUpgradeButtonStatus();

    //     if (GameState.isChanged()) {
    //         switch (GameState.getState()) {
    //             case GameState.State.NEED_SLIDES:
    //                 this.showTutorHand(this.btnUpgradeSlides, true);
    //                 this.showTutorHand(this.btnUpgradeClients, false);
    //                 break;
    //             case GameState.State.NEED_CLIENTS:
    //                 this.showTutorHand(this.btnUpgradeSlides, false);
    //                 this.showTutorHand(this.btnUpgradeClients, true);
    //                 break;
    //         }

    //         GameState.setState(GameState.State.SPLASH);
    //         GameState.isChanged();
    //     }
    }

    protected showTutor(show:boolean) {
        this.showTutorHand(this._isTutorSlides ? this.btnUpgradeSlides : this.btnUpgradeClients, show);
        this.showTutorHand(this._isTutorSlides ? this.btnUpgradeClients : this.btnUpgradeSlides, !show);
    }
    // showTutor(show:boolean) {
    //     if (this.tutorHands.length) {
    //         this.tutorHands.forEach(element => {
    //             element.showTutor(show);
    //         });
    //     }

    //     if (!show) {
    //         this.showTutorHand(this.btnUpgradeSlides, show);
    //         this.showTutorHand(this.btnUpgradeClients, show);
    //     }
    // }
    
    public gotoFirstScene(delay:number) {
        if (this._isGameEnd) return;

        this._isGameEnd = true;

        event_html_playable.game_end();
        this.scheduleOnce(()=>{
            // const scheduler = director.getScheduler();
            // scheduler.unscheduleAll();
            // Tween.stopAll();

            GameState.setState(GameState.State.SPLASH);

            // this.node.destroy();
            // SoundMgr.destroyMgr();

            // director.loadScene("first");
            event_html_playable.download();//.redirect();
        }, delay);
    }

    onToggleSound(target: Toggle) {
        // this.showTutor(false);

        SoundMgr.onSound(target.isChecked);

        event_html_playable.trackSound(target.isChecked);

        // this.showTutor(true);
    }

    onBtnPlay() {
        SoundMgr.playSound('button');

        // this.showTutor(false);
        event_html_playable.track_gtag('winInstall');
        event_html_playable.download();
        // this.showTutor(true);
    }

    protected onClickUpgrade(btnNode:Node, callback:any, param:any) {
        if (btnNode && callback && this.money) {
            SoundMgr.onFirstClick();

            SoundMgr.playSound('button');
        
            const money = btnNode.getComponentInChildren(MoneyController);
            const price = money.getMoney();
            if (price <= this.money.getMoney()) {
                SoundMgr.playSound('evolve');

                this.showTutorHand(btnNode, false);
                // this.showTutor(false);
    
                money.addMoney(Math.floor(price / 2));

                this.addMoney(-price);

                // this.showTutor(true);

                const btn = btnNode.getComponentInChildren(Button);
                if (callback(param)) {
                    btn.enabled = false;

                    const bgNode = btn.node.getChildByName('bg');
                    if (bgNode) {
                        const sprite = bgNode.getComponent(Sprite);
                        sprite.fillRange = 0;
                        tween(sprite)
                        .to(1, {fillRange:1})
                        .call(()=>{
                            this.updateBtnStatus(btnNode);
                        })
                        .start();
                    }

                    if (this._version == GameMgr.VERSION.ACTION_1_1) {
                        this.gotoFirstScene(0);
                        this._isGameEnd = false;
                    }                        
                } else {
                    btn.destroy();
                    this._endUpgradeCount ++;
                    this.gotoFirstScene(0);
                }
            }
        }
    }

    protected addMoney(amount:number) {
        if (this.money)
            this.money.addMoney(amount);

        this.updateAllUpgradeButtonStatus();
    }

    protected updateAllUpgradeButtonStatus() {
        this.updateBtnStatus(this.btnUpgradeSlides);
        this.updateBtnStatus(this.btnUpgradeClients);

        this.showTutor(true);
    }

    protected updateBtnStatus(btnNode:Node) {
        if (this.money && btnNode) {
            const btnMoney = btnNode.getComponentInChildren(MoneyController);
            const enable = btnMoney && btnMoney.getMoney() <= this.money.getMoney();
            if (this.enableUpgradeBtn(btnNode, enable) && enable) {
                // this.showTutorHand(btnNode, true);
            }
        }
    }

    protected showTutorHand(btnNode:Node, show:boolean) {
        if (btnNode) {
            const tutor = btnNode.getComponentInChildren(TutorHand);
            if (tutor) {
                const btn = btnNode.getComponentInChildren(Button);
                tutor.showTutor(show && btn && btn.enabled);
            }
        }
    }

    protected enableUpgradeBtn(btnNode:Node, enable:boolean) : boolean {
        let ret:boolean = false;
        if (btnNode) {
            const btn = btnNode.getComponentInChildren(Button);
            if (btn) {
                ret = btn.enabled != enable;
                btn.enabled = enable;
            }
            this.disableSprite4Node(btnNode.children[0].getChildByName('upgrade'), !enable);
            this.disableSprite4Node(btnNode.children[0].getChildByName('bucks'), !enable);
        }

        return ret;
    }

    protected disableSprite4Node(node:Node, disable:boolean) {
        const sprite = node.getComponent(Sprite);
        if (sprite) {
            sprite.grayscale = disable;
        }
    }

    protected doUpgradeSlides(lineManager:any) : boolean {
        if (lineManager)
            return lineManager.upgrade();

        return false;
    }

    protected doUpgradeClients(truckManager:any) : boolean {
        if (truckManager)
            return truckManager.upgrade();

        return false;
    }

    onBtnUpgradeSlides() {
        this.onClickUpgrade(this.btnUpgradeSlides, this.doUpgradeSlides, this.lineManager);

        this._isTutorSlides = false;
        this.showTutor(true);

        if (this.plate)
            this.plate.showCaution(false);
    }

    onBtnUpgradeCustomers() {
        this.onClickUpgrade(this.btnUpgradeClients, this.doUpgradeClients, this.truckManager);

        this._isTutorSlides = true;
        this.showTutor(true);
    }
}


