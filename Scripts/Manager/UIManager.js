// UI管理类
cc.Class({
    extends: cc.Component,

    properties: {
        label_score: cc.Label,
        label_combo: cc.Label,
        ui_pausePanel: cc.Node,
        ui_pauseBtn: cc.Button,
        ui_info: cc.Layout,
        ui_gray: cc.Node,
        realCombo: 1, // 实际连击数（触发下落动画才会自增1）
        currCombo: 0, // 当前连击数（每组消除都会自增1）
        maxCombo: 0,  // 最大连击数（记录的是每组消除的连击）
        score: 0,     // 计分器（加分规则直接百度x）
    },

    /**
     * 得分
     * @param {number} mul 得分倍率
     */
    addScore(mul) {
        this.score += this.realCombo * mul * 10;
    },

    /**
     * 自增消除连击
     */
    addCombo() {
        if (++this.currCombo > this.maxCombo) this.maxCombo = this.currCombo;
        window.HE_audioManager.playElimination(this.realCombo);
    },

    /**
     * 自增实际连击
     */
    addRealCombo() {
        this.realCombo++;
    },

    /**
     * 重置连击数（回调函数，但也能直接用）
     * @param {cc.Button} evt 触发按钮（用不上）
     * @param {any} regame 清空计分器和最大连击数
     */
    reset(evt, regame) {
        let combo = Math.floor(this.currCombo / 2 - 1);
        if(combo >= 0) window.HE_audioManager.playCombo(combo);
        this.currCombo = 0;
        this.realCombo = 1;
        if (regame) {
            this.score = 0;
            this.maxCombo = 0;
        }
    },

    /**
     * 唤出/关闭暂停面板
     */
    pause() {
        window.HE_pause = !window.HE_pause;
        this.ui_pausePanel.active = window.HE_pause;
        this.ui_pauseBtn.active = !window.HE_pause;
        this.ui_gray.active = window.HE_pause;
    },

    onLoad() {
        window.HE_uiManager = this;
    },

    start () {
        this.realCombo = 1;
    },

    update(dt) {
        if (window.HE_timer < -.1 && this.realCombo > 1) this.reset(null, false);
        this.label_score.string = "Score: " + this.score + " (" + this.realCombo + "x)";
        this.label_combo.string = "Combo: " + this.currCombo + "/" + this.maxCombo;
    },
});
