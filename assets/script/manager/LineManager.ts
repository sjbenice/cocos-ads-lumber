import { _decorator, AudioSource, Component, instantiate, Node, Prefab, v3, Vec3 } from 'cc';
import { LineController } from '../controller/LineController';
import { PlateController } from '../controller/PlateController';
import { PaletteController } from '../controller/PaletteController';
const { ccclass, property } = _decorator;

@ccclass('LineManager')
export class LineManager extends Component {
    @property
    count:number = 9;
    @property
    zPeriod:number = 5;

    @property
    initCount:number = 2;

    @property(Node)
    inputPos:Node = null;

    @property(Prefab)
    itemPrefab:Prefab[] = [];

    @property(Node)
    truckGroup:Node = null;

    @property(AudioSource)
    machineAudio:AudioSource = null;

    protected _version:number = LineManager.Version.NONE;

    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _tempPos2:Vec3 = Vec3.ZERO.clone();

    public static Version = {
        NONE:-1,
        SIMPLE_2:0,
        SIMPLE_4:1,
        MACHINE_6:2,
        SPRING_2:3,
        END:4,
    };

    public isFirstVersion() : boolean {
        return this._version == LineManager.Version.SIMPLE_2;
    }
    
    public upgrade() : boolean {
        if (this._version < LineManager.Version.END) {
            this._version ++;

            switch(this._version) {
                case LineManager.Version.SIMPLE_2:
                    this.createItem(0);
                    this.createItem(1);
                    break;
                case LineManager.Version.SIMPLE_4:
                    this.createItem(2);
                    this.createItem(3);
                    break;
                case LineManager.Version.MACHINE_6:
                    this.getComponentsInChildren(LineController).forEach(line=>{
                        line.useMachine(true);
                    });
                    this.createItem(4);
                    this.createItem(5);

                    if (this.machineAudio)
                        this.machineAudio.play();
                    break;
                case LineManager.Version.SPRING_2:
                    this.getComponentsInChildren(PaletteController).forEach(palette=>{
                        palette.onDestroyAll();
                    });
                    this.node.removeAllChildren();
                    this.createItem(2);
                    this.createItem(6);
                    break;
            }
        }

        return this._version < LineManager.Version.END;
    }

    protected createItem(index:number) : Node {
        const z = ((this.count - 1) / 2 - index) * this.zPeriod;
        const node = instantiate(this.itemPrefab[this._version < LineManager.Version.SPRING_2 ? 0 : 1]);
        this.node.addChild(node);
        node.setPosition(v3(0, 0, z));

        const line = node.getComponent(LineController);
        line.inputPos = this.inputPos;

        if (this._version > LineManager.Version.SIMPLE_2 && line.showVfx)
            line.showVfx.play();

        if (this._version >= LineManager.Version.MACHINE_6) {
            line.useMachine(true);
        }

        const palette = node.getComponentInChildren(PaletteController);
        if (palette && this._version == LineManager.Version.SIMPLE_2) {
            palette.createInitGoods(30);
        }

        return node;
    }

    // public findNearstEmptyPalette(node:Node, outWorldPos:Vec3) : PaletteController {
    //     let ret:PaletteController = null;
    //     let minDistance:number = Infinity;
    //     node.getWorldPosition(this._tempPos2);
    //     this.getComponentsInChildren(PaletteController).forEach(palette=>{
    //         if (!palette.hasTruck()) {
    //             palette.node.getWorldPosition(this._tempPos);
    //             const distance = Vec3.squaredDistance(this._tempPos, this._tempPos2);
    //             if (distance < minDistance) {
    //                 outWorldPos.set(this._tempPos);
    //                 minDistance = distance;
    //                 ret = palette;
    //             }
    //         }
    //     });
    //     return ret;
    // }

    start() {
        this.upgrade();
    }
}


