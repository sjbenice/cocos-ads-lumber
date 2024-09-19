import { _decorator, CCInteger, Component, instantiate, Node, ParticleSystem, Prefab, Quat, tween, Vec2, Vec3 } from 'cc';
import { Item } from '../item/Item';
import { Utils } from '../util/Utils';
import { PaletteController } from './PaletteController';
const { ccclass, property } = _decorator;

@ccclass('LineController')
export class LineController extends Component {
    @property(Node)
    inputPos:Node = null;

    @property(ParticleSystem)
    showVfx:ParticleSystem = null;

    @property(Prefab)
    itemPrefabs:Prefab[] = [];

    @property(CCInteger)
    itemCounts:number[] = [];

    @property(Node)
    flowGroup:Node = null;

    @property(Node)
    machineGroup:Node = null;

    @property
    maxOutputCount:number = 60;

    @property(Node)
    outputPos:Node = null;

    inputPeriod:number = 1.5;
    lineSpeed:number = 10;


    protected _isWorking:boolean = true;
    protected _timer:number = 0;

    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _tempPos2:Vec3 = Vec3.ZERO.clone();

    protected _flowPosx:Vec3[] = [];
    // protected _flowRotx:Quat[] = [];
    protected _palette:PaletteController = null;

    protected static LINE_EFFECT_TIME:number = 0.2;

    protected onLoad(): void {
        if (this.outputPos)
            this._palette = this.outputPos.getComponent(PaletteController);
    }

    start() {
        if (this.flowGroup) {
            for (let i = 0; i < this.flowGroup.children.length; i++) {
                const group = this.flowGroup.children[i];
                for (let j = 0; j < group.children.length; j++) {
                    const element = group.children[j];
                    this._flowPosx.push(element.getWorldPosition());
                    // this._flowRotx.push(element.getWorldRotation());
                }
            }
        }
    }

    useMachine(show:boolean) {
        if (this.machineGroup)
            this.machineGroup.active = show;
    }

    isMachine() {
        return this.machineGroup && this.machineGroup.active;
    }

    showWithEffect() {
        this._isWorking = false;

        if (this.showVfx)
            this.showVfx.play();

        this.node.setScale(Vec3.ZERO);
        tween(this.node)
        .to(0.5, {scale:Vec3.ONE})
        .call(()=>{
            this._isWorking = true;
        })
        .start();
    }

    update(deltaTime: number) {
        if (this._isWorking && this.flowGroup && this.flowGroup.children.length > 0) {
            this._timer += deltaTime;
            if (this._timer >= this.inputPeriod) {
                this._timer = 0;

                if (!this._palette.checkArrange(this.maxOutputCount)) {
                    return;
                }

                let inputGroup = this.inputPos;
                let groupIndex:number = 0, posIndex:number = 0, time:number = 0;
                let loop:boolean = true;

                while (loop) {
                    const group = this.createItemGroup(groupIndex, inputGroup);
                    if (!group)
                        break;

                    inputGroup = null;

                    const tw = tween(group)
                    .hide()
                    // .call(()=>{
                    //     group.setScale(Vec3.ZERO);
                    // })
                    .delay(time)
                    .show()
                    // .to(LineController.LINE_EFFECT_TIME, {scale:Vec3.ONE});

                    while (true) {
                        const [index, node] = this.getFlowInfo(groupIndex, posIndex);
                        if (node === false) {// end of flow line
                            tw.call(()=>{
                                if (this._palette)
                                    this._palette.arrangeGroup(group);
                            });
                            loop = false;
                            break;
                        } else if (node === null) {// if end of group
                            time += LineController.LINE_EFFECT_TIME;
                            tw.to(LineController.LINE_EFFECT_TIME, {scale:Vec3.ZERO})
                            tw.call(()=>{
                                group.removeFromParent();
                                group.destroy();
                            });
                            groupIndex ++;
                            posIndex = 0;
                            break;
                        } else if (node instanceof Node) {
                            tw.call(()=>{
                                group.setParent(node);
                                group.setWorldPosition(this._flowPosx[index]);
                            });

                            const [next_index, next_node] = this.getFlowInfo(groupIndex, ++ posIndex);
                            if (next_node instanceof Node) {
                                Vec3.subtract(this._tempPos, this._flowPosx[index], this._flowPosx[next_index]);
                                const subTime = this._tempPos.length() / this.lineSpeed;
                                time += subTime;
                                tw.to(subTime, 
                                    {
                                        worldPosition:this._flowPosx[next_index], 
                                        // worldRotation:this._flowRotx[next_index],
                                    });
                            }
                        }
                    }
                    tw.start();
                }
            }
        }
    }

    protected createItemGroup(kind:number, inputGroup:Node) : Node {
        if (this.itemCounts && kind < this.itemCounts.length) {
            const itemGroup = new Node();
            let itemDimension = null;
            for (let index = 0; index < this.itemCounts[kind]; index++) {
                const element = (inputGroup && inputGroup.children.length > 0) ? inputGroup.children[0] : instantiate(this.itemPrefabs[kind]);
                const item = element.getComponent(Item);
                item.enablePhysics(false);
    
                itemGroup.addChild(element);
                element.setRotation(Quat.IDENTITY);
    
                if (!itemDimension)
                    itemDimension = item.getHalfDimension();
            }
            
            if (itemDimension) {
                this._tempPos.set(itemDimension).multiplyScalar(2);
                Utils.createPyramid(itemGroup, this._tempPos);
            }

            return itemGroup;
        }

        return null;
    }

    protected getFlowInfo(groupIndex:number, index:number) : [number, Node | null | boolean] {
        // return false if end of flow line
        // return null if end of group
        if (groupIndex < this.flowGroup.children.length) {
            let node:Node = null;

            if (this.isMachine()) {
                if (index >= this.flowGroup.children[groupIndex].children.length)
                    return [-1, groupIndex == this.flowGroup.children.length - 1 ? false : null];

                node = this.flowGroup.children[groupIndex].children[index];

                for (let i = 0; i < groupIndex; i++) {
                    index += this.flowGroup.children[i].children.length;            
                }
            } else {
                let i = index;
                for (let j = 0; j < this.flowGroup.children.length; j++) {
                    if (i < this.flowGroup.children[j].children.length) {
                        node = this.flowGroup.children[j].children[i];
                        break;
                    }
                    i -= this.flowGroup.children[j].children.length;
                }
            }

            if (index < this._flowPosx.length) {
                return [index, node];
            } else {
                return [-1, false];
            }
        }

        return [-1, null];
    }
}


