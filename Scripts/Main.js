// 主类（放全局变量啥的）
cc.Class({
    extends: cc.Component,

    properties: {
        cellLine: 12,                       // 单元格行数
        cellColumn: 12,                     // 单元格列数
        cellWidth: 80,                      // 单元格宽度
        cellHeight: 80,                     // 单元格高度
        anim_selected: [cc.AnimationClip],  // 选中动画的动画片段数组
        anim_column: [cc.AnimationClip],    // 列动画的动画片段数组
        anim_line: [cc.AnimationClip],      // 行动画的动画片段数组
        anim_wrap: [cc.AnimationClip],      // 包装动画的动画片段数组
    },

    /**
     * 设置棋盘和图格尺寸
     * @param {number} cellLine     图格行数
     * @param {number} cellColumn   图格列数
     * @param {number} cellWidth    单图格宽度
     * @param {number} cellHeight   单图格高度
     */
    setSize(cellLine, cellColumn, cellWidth, cellHeight) {
        window.HE_cellLine = cellLine;
        window.HE_cellColumn = cellColumn;
        window.HE_cellWidth = cellWidth;
        window.HE_cellHeight = cellHeight;
        window.HE_cellManager.setSize(cellLine, cellColumn, cellWidth, cellHeight);
    },

    /**
     * 设置游戏速度
     * @param {cc.Node} evt  负责触发的组件（这里用不上）
     * @param {number} speed 游戏倍速
     */
    setSpeed(evt, speed) {
        window.HE_animDuration = .8 / speed;
    },

    /**
     * 切换到游戏界面
     */
    startGame() {
        cc.director.loadScene("Game");
    },

    /**
     * 切换到开始界面
     */
    exitGame() {
        cc.director.loadScene("Login");
    },

    onLoad() {
        // 初始化全局变量
        window.HE_cellWidth = 80;                   // 单元格宽度默认为64
        window.HE_cellHeight = 80;                  // 单元格高度默认为64
        window.HE_cellLine = 12;                    // 单元格行数默认为15
        window.HE_cellColumn = 12;                  // 单元格列数默认为15
        window.HE_touchX = null;                    // 触摸起始点X坐标初始化为null
        window.HE_touchY = null;                    // 触摸起始点Y坐标初始化为null
        window.HE_animDuration = .8;                // 动画播放时长默认为0.8秒
        window.HE_timer = 0;                        // 计时器初始化为0（这个计时器是用来阻止动画期间用户操作的）
        window.HE_refreshed = true;                 // 棋盘刷新标志初始化为true
        window.HE_animSelected = this.anim_selected;// 选中动画切片
        window.HE_animColumn = this.anim_column;    // “竖直特效”图格的动画切片数组
        window.HE_animLine = this.anim_line;        // “垂直特效”图格的动画切片数组
        window.HE_animWrap = this.anim_wrap;        // “爆炸特效”图格的动画切片数组
        window.HE_pause = false;                    // 暂停状态初始化为false（实际上并没实现暂停，只是用来当设置面板的标记）
    },

    start() {
        if (cc.director.getScene().name == "Game")
            this.setSize(this.cellLine, this.cellColumn, this.cellWidth, this.cellHeight);
    },

    update(dt) {
        window.HE_timer -= dt;
        if (window.HE_timer < .35 && !window.HE_refreshed) { // 如果计时器小于0.35且未刷新过
            window.HE_refreshed = true; // 标记已刷新
            window.HE_cellManager.refreshCells(); // 刷新棋盘
        }
    },
});
