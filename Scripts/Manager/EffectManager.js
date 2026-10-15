// 特效管理类
cc.Class({
    extends: cc.Component,

    properties: {
        prefab_anims: [cc.AnimationClip],
        prefab_effect: cc.Prefab,
    },

    /**
     * 生成特效对象
     * @param {cc.Vec2} pos 生成坐标
     * @param {number} rot  初始角度
     * @param {number} type 特效类型
     * @returns {cc.Component} 返回所生成特效的组件
     */
    newEffect(pos, rot, type) {
        let eff = cc.instantiate(this.prefab_effect);
        let comp = eff.getComponent("Effect").init(this.prefab_anims[type], null);
        let arc = rot * Math.PI / 180; // 角度转弧度
        let vel = 8;
        eff.setPosition(pos);
        // 这里都是对应特效的基本属性设置，没啥好讲的（doge
        switch (type) {
            case 0: // Elimination
                comp.setScaling(cc.v2(1, 1), cc.v2(1.5, 1.5));
                comp.setRotating(rot, rot + 90);
                comp.setFlashing(255, 0);
                break;
            case 1: // Line Elimination (Right)
                eff.anchorX = 0;
                comp.setScaling(cc.v2(0, 1.1), cc.v2(2, .1));
                comp.setRotating(-rot, -rot);
                comp.setFlashing(255, 0);
                break;
            case 2: // Line Elimination (Left)
                eff.anchorX = 0;
                eff.x += Math.cos(arc) * window.HE_cellWidth / 2;
                eff.y += -Math.sin(arc) * window.HE_cellHeight / 2;
                comp.setVelocity(Math.cos(arc) * -vel, -Math.sin(arc) * -vel);
                comp.setScaling(cc.v2(0, 1.1), cc.v2(-2, .1));
                comp.setRotating(-rot, -rot);
                comp.setFlashing(255, 0);
                break;
            case 3: // Column Elimination (Up)
                eff.anchorY = 0;
                eff.x -= -Math.sin(arc) * window.HE_cellWidth / 2;
                eff.y -= Math.cos(arc) * window.HE_cellHeight / 2;
                comp.setVelocity(Math.sin(arc) * vel, Math.cos(arc) * vel);
                comp.setScaling(cc.v2(1.1, 0), cc.v2(.1, 1.5));
                comp.setRotating(rot, rot);
                comp.setFlashing(255, 0);
                break;
            case 4: // Column Elimination (Down)
                eff.anchorY = 0;
                eff.x += -Math.sin(arc) * window.HE_cellWidth / 2;
                eff.y += Math.cos(arc) * window.HE_cellHeight / 2;
                comp.setVelocity(Math.sin(arc) * -vel, Math.cos(arc) * -vel);
                comp.setScaling(cc.v2(1.1, 0), cc.v2(.1, -1.5));
                comp.setRotating(rot, rot);
                comp.setFlashing(255, 0);
                break;
        }
        this.node.addChild(eff);
        return comp;
    },

    onLoad() {
        window.HE_effectManager = this;
        window.HE_anims = this.prefab_anims;
    },
});
