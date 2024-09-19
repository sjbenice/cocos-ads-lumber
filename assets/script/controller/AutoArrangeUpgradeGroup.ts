import { _decorator, Component, Node, NodeEventType, Size, UITransform, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AutoArrangeUpgradeGroup')
export class AutoArrangeUpgradeGroup extends Component {
    @property(UITransform)
    renderUI:UITransform = null;

    gap:number = 0;

    private initialSize: Size = Size.ZERO.clone();
    private _itemSize:Size = null;
    
    onLoad() {
        if (this.renderUI == null)
            this.renderUI = this.getComponent(UITransform);

        if (this.node.children.length > 0)
            this._itemSize = this.node.children[0].children[0].getComponent(UITransform).contentSize.clone();

        this.node.on(NodeEventType.TRANSFORM_CHANGED, this.arrangeChildren, this);

        this.arrangeChildren();
    }

    protected onDestroy(): void {
        if (this.node)
            this.node.off(NodeEventType.TRANSFORM_CHANGED, this.arrangeChildren, this);
    }

    arrangeChildren() {
        if (this.renderUI && this._itemSize && !this.initialSize.equals(this.renderUI.contentSize)) {
            // console.log(`Canvas resized: width = ${this.renderUI.width}, height = ${this.renderUI.height}`);

            const renderDimen = this.renderUI.contentSize;
            this.initialSize.set(renderDimen);
            
            let rows, cols;
            let itemHeight, itemWidth;
            let scale;
            let left, top;
            if (renderDimen.width > renderDimen.height) {
                rows = 2;
                cols = 1;
                itemHeight = renderDimen.height / (rows + 2.5);
                this.gap = itemHeight / 2;
                scale = itemHeight / this._itemSize.height;
                itemWidth = this._itemSize.width * scale;

                left = renderDimen.width / 2 - itemWidth;
                top = (itemHeight * rows + this.gap * (rows - 1)) / 2 - itemHeight / 2;
            } else {
                rows = 1;
                cols = 2;
                itemWidth = renderDimen.width / (cols + 0.8);
                this.gap = itemWidth * 0.3;
                scale = itemWidth / (this._itemSize.width * 1.5);
                itemHeight = this._itemSize.height * scale;

                left = - (itemWidth * cols + this.gap * (cols - 1)) / 2 + itemWidth / 2;
                top = -renderDimen.height / 2 + itemHeight * 0.8;
            }

            const vec3scale = Vec3.ONE.clone();
            vec3scale.multiplyScalar(scale);

            const pos = Vec3.ZERO.clone();

            for (let index = 0; index < this.node.children.length; index++) {
                const element = this.node.children[index];
                element.setScale(vec3scale);
                pos.x = left + (index % cols) * (itemWidth + this.gap);
                pos.y = top - Math.floor(index / cols) * (itemHeight + this.gap);
                element.setPosition(pos);
            }
        }
    }
}


