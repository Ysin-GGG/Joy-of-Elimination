// 图格类（就棋盘上的那个背景图格）
cc.Class({
    extends: cc.Component,

    properties: {
        cellX: 0,
        cellY: 0,
        isAir: false, // 当前图格是否为空气墙（车了个轮子）
    },

    /**
     * 移动动画（触屏滑动）
     * @param {number} dir 移动方向：0-下 1-左 2-上 3-右
     * @param {number} style 0-板边回弹 1-无效交换 2-有效交换
     */
    moveAnimalByTouch(x, y) {
        // 计算滑动差值
        let diffX = x - window.HE_touchX;
        let diffY = y - window.HE_touchY;

        // 达到滑动阈值执行
        if (Math.abs(diffX) > window.HE_cellWidth / 4 || Math.abs(diffY) > window.HE_cellHeight / 4) {
            // 计算移动方向：0-下 1-左 2-上 3-右
            let dir = Math.abs(diffX) > Math.abs(diffY) ? (Math.sign(diffX) + 2) : (Math.sign(diffY) + 1);
            let x = this.cellX + (dir % 2) * (dir - 2)
            let y = this.cellY + ((dir + 1) % 2) * (dir - 1);

            // 如果移动到了超出边界，则对所选的两个图格进行交换，否则选择新的网格位置
            if (window.HE_cellManager.outside(x, y)) window.HE_cellManager.getAnimal(this.cellX, this.cellY).move(dir, 0);
            else window.HE_cellManager.selectCell(x, y);
            window.HE_touchX = x;
            window.HE_touchY = y;
            return true;
        }
        return false;
    },

    // 触摸开始事件处理
    onPress(evt) {
        // 如果游戏暂停或者当前动物处于空中状态，则不处理触摸事件
        if (window.HE_pause || this.isAir) return;

        // 选择当前网格位置
        window.HE_cellManager.selectCell(this.cellX, this.cellY);

        // 记录触摸开始位置
        window.HE_touchX = evt.getLocationX();
        window.HE_touchY = evt.getLocationY();
    },

    // 触摸移动事件处理
    onMove(evt) {
        // 如果游戏暂停、该图格为空气墙、或者计时器大于-0.1、或者没有选中原始网格，则不处理移动事件
        if (window.HE_pause || this.isAir || window.HE_timer > -0.1 || window.HE_cellManager._orig == null) return;

        // 根据触摸位置移动动物
        this.moveAnimalByTouch(evt.getLocationX(), evt.getLocationY());
    },

    // 触摸释放事件处理
    onRelease(evt) {
        // 如果动物处于空中状态，则不处理释放事件
        if (this.isAir) return;

        // 清空触摸点坐标
        window.HE_touchX = null;
        window.HE_touchY = null;
    },

    // 组件加载时注册触摸事件监听
    onLoad() {
        this.node.on("touchstart", this.onPress, this);
        this.node.on("touchmove", this.onMove, this);
        this.node.on("touchend", this.onRelease, this);
        this.node.on("touchcancel", this.onRelease, this);
    },

    // 组件销毁时移除触摸事件监听
    onDestroy() {
        this.node.off("touchstart", this.onPress, this);
        this.node.off("touchmove", this.onMove, this);
        this.node.off("touchend", this.onRelease, this);
        this.node.off("touchcancel", this.onRelease, this);
    },
});
