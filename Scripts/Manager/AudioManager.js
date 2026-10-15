
cc.Class({
    extends: cc.Component,

    properties: {
        // 音频资源
        swap: cc.AudioClip,         // 换位音效
        click: cc.AudioClip,        // 点击音效
        music: cc.AudioClip,        // 背景音乐
        combos: [cc.AudioClip],     // 连击音效数组（就停止连击消除后播放的喜感“Unbelievable”之类的XD）
        effects: [cc.AudioClip],    // 特效音效数组
        eliminations: [cc.AudioClip], // 消除音效数组

        // 音量控制参数
        masterVolume: 0.5,          // 主音量
        musicVolume: 0.5,           // 背景音乐音量
        soundVolume: 0.5,           // 音效音量

        // 私有变量
        _musicId: -1,               // 背景音乐的播放实例ID
    },

    /**
     * 设置主音量（给滑动条用的回调函数）
     * @param {cc.Slider} evt 滑动条组件
     */
    setMasterVolume(evt) {
        this.masterVolume = evt.progress;
        cc.audioEngine.setMusicVolume(this.masterVolume * this.musicVolume);
        cc.audioEngine.setEffectsVolume(this.masterVolume * this.soundVolume);
    },

    /**
     * 设置背景音量（给滑动条用的回调函数）
     * @param {cc.Slider} evt 滑动条组件
     */
    setMusicVolume(evt) {
        this.musicVolume = evt.progress;
        cc.audioEngine.setMusicVolume(this.masterVolume * this.musicVolume);
    },

    /**
     * 设置音效音量（给滑动条用的回调函数）
     * @param {cc.Slider} evt 滑动条组件
     */
    setSoundVolume(evt) {
        this.soundVolume = evt.progress;
        cc.audioEngine.setEffectsVolume(this.masterVolume * this.soundVolume);
    },

    /**
     * 播放交换音效
     */
    playSwap() {
        cc.audioEngine.playEffect(this.swap, false);
    },

    /**
     * 播放点击音效
     */
    playClick() {
        cc.audioEngine.playEffect(this.click, false);
    },

    /**
     * 播放或暂停背景音乐
     */
    playMusic() {
        if (cc.audioEngine.isMusicPlaying()) cc.audioEngine.pauseMusic(this._musicId);
        else cc.audioEngine.resumeMusic(this._musicId);
    },
    /**
     * 播放连击语音
     * @param {number} combo 索引
     */
    playCombo(combo) {
        if (combo < 0) combo = 0;
        if (combo >= this.combos.length) combo = this.combos.length - 1;
        cc.audioEngine.playEffect(this.combos[combo], false);
    },

    /**
     * 播放特效音效
     * @param {number} type 索引
     */
    playEffect(type) {
        if (type < 0) type = 0;
        if (type >= this.effects.length) type = this.effects.length - 1;
        cc.audioEngine.playEffect(this.effects[type], false);
    },

    /**
     * 播放消除音效
     * @param {number} combo 索引
     */
    playElimination(combo) {
        if (combo < 0) combo = 0;
        if (combo >= this.eliminations.length) combo = this.eliminations.length - 1;
        cc.audioEngine.playEffect(this.eliminations[combo], false);
    },

    onLoad() {
        window.HE_audioManager = this;
    },
    
    start() {
        this._musicId = cc.audioEngine.playMusic(this.music, true);
    }
});
