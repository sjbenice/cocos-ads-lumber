import { _decorator, Component, EPSILON, instantiate, Node, Prefab, random, v3, Vec3 } from 'cc';
import { LineManager } from './LineManager';
import { TruckController } from '../controller/TruckController';
import { MoneyController } from '../util/MoneyController';
import { PaletteController } from '../controller/PaletteController';
const { ccclass, property } = _decorator;

class Order {
    truck:TruckController;
    palette:PaletteController;
    distance:number;
}

@ccclass('TruckManager')
export class TruckManager extends Component {
    @property(LineManager)
    lineManager:LineManager = null;

    @property(MoneyController)
    money:MoneyController = null;

    @property(Prefab)
    itemPrefab:Prefab[] = [];

    protected arrangePeriod:number = 0.5;
    
    protected _version:number = TruckManager.Version.NONE;

    protected _arrangeTimer:number = 0;
    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _tempPos2:Vec3 = Vec3.ZERO.clone();

    protected _firstTime:boolean = true;

    public static Version = {
        NONE:-1,
        SIMPLE_2:0,
        SIMPLE_4:1,
        SIMPLE_6:2,
        SIMPLE_8:3,
        BELAZ_3:4,
        END:5,
    };

    public upgrade() : boolean {
        if (this._version < TruckManager.Version.END) {
            this._version ++;

            switch(this._version) {
                case TruckManager.Version.SIMPLE_2:
                    this.createItem(0);
                    this.createItem(1);
                    break;
                case TruckManager.Version.SIMPLE_4:
                    this.createItem(2);
                    this.createItem(3);
                    break;
                case TruckManager.Version.SIMPLE_6:
                    this.createItem(4);
                    this.createItem(5);
                    break;
                case TruckManager.Version.SIMPLE_8:
                    this.createItem(6);
                    this.createItem(7);
                    break;
                case TruckManager.Version.BELAZ_3:
                    const pos2 = this.node.children[2].getPosition();
                    const pos4 = this.node.children[4].getPosition();
                    const pos6 = this.node.children[6].getPosition();
                    while (this.node.children.length > 0) {
                        const element = this.node.children[0];
                        element.removeFromParent();
                        element.destroy();
                    }
                    // this.getComponentsInChildren(TruckController).forEach(truck => {
                    //     truck.stopWork();
                    // });
                    this.createItem(2, pos2);
                    this.createItem(4, pos4);
                    this.createItem(6, pos6);
                    break;
            }
        }

        return this._version < TruckManager.Version.END;
    }

    protected createItem(index:number, pos:Vec3 = null) : Node {
        const z = ((this.lineManager.count - 1) / 2 - index) * this.lineManager.zPeriod;
        const node = instantiate(this.itemPrefab[this._version < TruckManager.Version.BELAZ_3 ? 0 : 1]);
        this.node.addChild(node);

        const truck = node.getComponent(TruckController);
        if (truck) {
            truck.startWork(z, this._version == TruckManager.Version.SIMPLE_2, this.money, pos != null);
        }

        if (pos)
            node.setPosition(pos);

        return node;
    }

    start() {
        this.upgrade();
    }

    protected lateUpdate(dt: number): void {
        this._arrangeTimer += dt;
        if (this._arrangeTimer >= this.arrangePeriod) {
            this._arrangeTimer = 0;

            // ^-^
            if (this._version == TruckManager.Version.BELAZ_3 && this.lineManager.isFirstVersion()) {
                const truck = this.node.children[0].getComponent(TruckController);
                if (truck.isWaiting()) {
                    const palette = this.lineManager.node.children[1].getComponentInChildren(PaletteController);
                    palette.setTruck(truck);
                    truck.setPalette(palette);
                }
                return;
            }

            const palettes = [];
            this.lineManager.getComponentsInChildren(PaletteController).forEach(palette => {
                if (palette && !palette.hasTruck())
                    palettes.push(palette);
            });

            if (palettes.length > 0) {
                const orders:Order[] = [];

                const trucks = [];
                this.getComponentsInChildren(TruckController).forEach(truck => {
                    if (truck && truck.isWaiting())
                        trucks.push(truck);
                });

                if (trucks.length > 0) {
                    trucks.forEach(truck => {
                        let nearst:PaletteController = null;
                        let minDistance:number = Infinity;
                        truck.node.getWorldPosition(this._tempPos2);
                        for (let index = 0; index < palettes.length; index++) {
                            const palette = palettes[index];
                            palette.node.getWorldPosition(this._tempPos);
                            const distance = Vec3.squaredDistance(this._tempPos, this._tempPos2);// Math.abs(this._tempPos.z - truck.getStartZ())
                            if (palette.canAcceptTruck(truck.getStartZ()) && distance < minDistance)
                            {
                                minDistance = distance;
                                nearst = palette;
                                // break;
                            }
                        }

                        let add:boolean = true;

                        for (let index = 0; index < orders.length; index++) {
                            const order:Order = orders[index];
                            if (order.palette == nearst) {
                                if (order.distance > minDistance) {
                                    order.truck = truck;
                                    order.distance = minDistance;
                                }
                                add = false;
                                break;
                            }
                        }

                        if (add && nearst) {
                            const order = new Order();
                            order.truck = truck;
                            order.palette = nearst;
                            order.distance = minDistance;
                            orders.push(order);
                        }    
                    });
                }

                if (orders.length > 0) {
                    // orders.sort((a, b) => a.distance - b.distance);
                    // const order = orders[0];
                    // order.truck.setPalette(order.palette);
                    // order.palette.setTruck(order.truck);

                    orders.forEach(order => {
                        order.truck.setPalette(order.palette);
                        order.palette.setTruck(order.truck);
                    });
                }
            }
        }
    }
}


