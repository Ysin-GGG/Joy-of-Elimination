// 特效类
cc.Class({
    extends: cc.Component,

    properties: {
        anim: cc.Animation,     // 动画组件
        timeLeft: 0,            // 动画剩余时长
        timeLeftMax: 0,         // 动画持续时长
        animBegin: cc.Vec4,     // 动画起始数据 (scaleX, scaleY, rotation, opacity)
        animEnd: cc.Vec4,       // 动画结束数据 (scaleX, scaleY, rotation, opacity)
        velX: 0,                // 水平速度
        velY: 0,                // 垂直速度
    },

    /**
     * 设置节点的移动速度
     * @param {number} velX 水平速度
     * @param {number} velY 垂直速度
     * @returns
     */
    setVelocity(velX, velY) {
        this.velX = velX;
        this.velY = velY;
        return this;
    },

    /**
     * 设置节点的缩放动画起始和结束状态
     * @param {cc.Vec2} begin 起始时缩放数据
     * @param {cc.Vec2} end   结束时缩放数据
     * @returns {cc.Component} 返回当前组件
     */
    setScaling(begin, end) {
        this.animBegin.x = begin.x;
        this.animBegin.y = begin.y;
        this.animEnd.x = end.x;
        this.animEnd.y = end.y;
        return this;
    },

    /**
     * 设置节点的旋转动画起始和结束状态（角度制）
     * @param {number} begin 起始时角度数据
     * @param {number} end   结束时角度数据
     * @returns {cc.Component} 返回当前组件
     */
    setRotating(begin, end) {
        this.animBegin.z = begin;
        this.animEnd.z = end;
        return this;
    },

    /**
     * 设置节点的闪烁动画起始和结束状态
     * @param {number} begin 起始时角度数据
     * @param {number} end   结束时角度数据
     * @returns {cc.Component} 返回当前组件
     */
    setFlashing(begin, end) {
        this.animBegin.w = begin;
        this.animEnd.w = end;
        return this;
    },

    /**
     * 初始化节点的动画切片和生命周期
     * @param {cc.AnimationClip} anim 动画切片
     * @param {number} timeLeft 生命周期
     * @returns {cc.Component} 返回当前组件
     */
    init(anim, timeLeft) {
        if (timeLeft == null || timeLeft < 0) timeLeft = anim.duration;
        this.anim.addClip(anim, "default");
        this.anim.play("default");
        this.timeLeft = timeLeft;
        this.timeLeftMax = timeLeft;
        return this;
    },

    /**
     * 线性插值函数，用于计算属性的过渡值
     * @param {number} v1 值1
     * @param {number} v2 值2
     * @param {number} w  权重
     * @returns {number}  返回过渡值
     */
    lerp(v1, v2, w) {
        if (w < 0) w = 0;
        if (w > 1) w = 1;
        return v1 * w + v2 * (1 - w);
    },

    update(dt) {
        if (this.timeLeft > 0) {
            let w = this.timeLeft / this.timeLeftMax; // 计算当前时间比例
            this.node.x += this.velX * dt;   // 根据速度更新节点位置
            this.node.y += this.velY * dt;
            // 根据时间比例应用线性插值得到动画效果
            this.node.scaleX = this.lerp(this.animBegin.x, this.animEnd.x, w);
            this.node.scaleY = this.lerp(this.animBegin.y, this.animEnd.y, w);
            this.node.angle = -this.lerp(this.animBegin.z, this.animEnd.z, w); // 注意角度取反
            this.node.opacity = this.lerp(this.animBegin.w, this.animEnd.w, w);
            this.timeLeft -= dt;    // 减少剩余时间
        } else {
            this.node.destroy();    // 如果时间耗尽，销毁节点
        }
    },
});
