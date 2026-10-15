// 图格元素类（棋盘上的动物）
cc.Class({
    extends: cc.Component,

    properties: {
        sprite: cc.Sprite,
        anim: cc.Animation,
        styleSwap: -1, // 这个属性是用来给同色特效处理用的（有时候是被其他特效导致的消除，这种情况只能随机选一个色来消除了）
        style: 0, // 0-bear, 1-cat, 2-chicken, 3-fox, 4-frog, 5-horse, 6-bird
        effect: 0, // 0-none, 1-line, 2-column, 3-wrap, 4-color, 5-warp+wrap, 6-wrap+line, 7-wrap+column
        fadeIn: false,
        isSelected: false,
        hasEliminated: false,
    },

    /**
     * 直接消除自身
     * @returns {boolean} 若消除成功返回true，否则返回false
     */
    destroySelf() {
        if (this.hasEliminated) return false;  // 如果已经被消除，则不执行销毁操作，返回false
        window.HE_timer = window.HE_animDuration; // 执行期间禁止操作
        window.HE_refreshed = false; // 标记为未刷新状态
        this.hasEliminated = true;   // 标记为已消除状态
        this.fadeIn = false;         // 停止渐显效果
        this.node.opacity = 0;       // 设置节点透明度为0，即完全不可见
        this.style = -1;             // 重置样式为“无”
        this.styleSwap = -1;         // 重置同色消除目标样式为“随机”
        this.effect = 0;             // 重置特效类型为“无”
        return true;                 // 返回销毁成功
    },

    /**
     * 正常消除自身
     * @param {number} cellX 图格横坐标
     * @param {number} cellY 图格纵坐标
     * @param {number} scoreMul 得分加成（乘算）
     * @returns {boolean} 若消除成功返回true，否则返回false
     */
    eliminateSelf(cellX, cellY, scoreMul) {
        if (this.hasEliminated) return false;
        window.HE_uiManager.addScore(scoreMul); // 得分
        window.HE_timer = window.HE_animDuration + .15; // 执行期间禁止操作
        window.HE_refreshed = false;
        let cell = window.HE_cellManager;       // 获取图格管理器
        let effect = window.HE_effectManager;   // 获取特效管理器
        let animTime = window.HE_animDuration;  // 获取动画持续时间
        let dx = Math.max(cellX, window.HE_cellColumn - cellX) / animTime;  // 该图格到板边的最大水平距离
        let dy = Math.max(cellY, window.HE_cellLine - cellY) / animTime;    // 该图格到板边的最大垂直距离
        effect.newEffect(this.node.getPosition(), 0, 0); // 消除特效
        switch (this.effect) {
            case 1: // 横线特效
            case 6: // 三重横线特效
                // 生成特效和播放音效
                if (this.effect == 6) {
                    effect.newEffect(this.node.getPosition(), 90, 3);
                    effect.newEffect(this.node.getPosition(), 90, 4);
                }
                else {
                    window.HE_audioManager.playEffect(0);
                    effect.newEffect(this.node.getPosition(), 0, 1);
                    effect.newEffect(this.node.getPosition(), 0, 2);
                }
                // 这里用延迟执行做了个简单的消除动画，去掉延迟执行就是瞬间消除整行/列
                for (let x = cellX - 1; x >= 0; x--) // 向左消除
                    this.scheduleOnce(() => cell.eliminateCell(x, cellY, 1.5), (cellX - x) / dx); // 消除动画（由近到远逐渐消除）
                for (let x = cellX + 1; x < window.HE_cellColumn; x++)  // 向右消除
                    this.scheduleOnce(() => cell.eliminateCell(x, cellY, 1.5), (x - cellX) / dx); // 消除动画（由近到远逐渐消除）
                break;
            case 2: // 竖线特效
            case 7: // 三重竖线特效
                // 生成特效和播放音效
                if (this.effect == 7) {
                    effect.newEffect(this.node.getPosition(), 0, 3);
                    effect.newEffect(this.node.getPosition(), 0, 4);
                }
                else {
                    window.HE_audioManager.playEffect(0);
                    effect.newEffect(this.node.getPosition(), 90, 1);
                    effect.newEffect(this.node.getPosition(), 90, 2);
                }
                // 这里用延迟执行做了个简单的消除动画，去掉延迟执行就是瞬间消除整行/列
                for (let y = cellY - 1; y >= 0; y--) // 向下消除
                    this.scheduleOnce(() => cell.eliminateCell(cellX, y, 1.5), (cellY - y) / dy); // 消除动画（由近到远逐渐消除）
                for (let y = cellY + 1; y < window.HE_cellLine; y++) // 向上消除
                    this.scheduleOnce(() => cell.eliminateCell(cellX, y, 1.5), (y - cellY) / dy); // 消除动画（由近到远逐渐消除）
                break;
            case 3: // 爆炸特效
            case 5: // 大爆炸特效
                window.HE_audioManager.playEffect(2); // 播放音效
                let range = this.effect - 1;
                for (let x = cellX - range; x <= cellX + range; x++)
                    for (let y = cellY - range; y <= cellY + range; y++) {
                        let dist = Math.abs(cellX - x) + Math.abs(cellY - y);
                        if (dist > 0 && dist <= range)
                            this.scheduleOnce(() => cell.eliminateCell(x, y, range - 1), dist / range * animTime / this.effect); // 消除动画（由近到远逐渐消除）
                    }
                break;
            case 4: // 同色特效
                // 生成特效和播放音效
                window.HE_audioManager.playEffect(3);
                effect.newEffect(this.node.getPosition(), 0, 0); 
                // 若图格为“魔术鸟”
                if (this.style == 6) {
                    if (this.styleSwap >= 0) this.setStyle(this.styleSwap); // 人为设置了要变化的类型（交换操作时导致）
                    else if (this.styleSwap == -1) this.setStyle(Math.floor(Math.random() * 5)); // 否则随机变化（被其他特效消除导致）
                    else { // 如果为其他的负值，则表示该特效与其他特效进行了组合，自身不用做原本的同色消除特效处理，所以直接break
                        this.setEffect(0); 
                        break;
                    }
                    this.setEffect(0);
                }
                // 以下为同色特效消除处理
                if (this.styleSwap < 0) this.styleSwap = this.style;
                let list = []; 
                let z = 0; // 曼哈顿距离
                // 开始遍历
                for (let y = 0; y < window.HE_cellLine; y++)
                    for (let x = 0; x < window.HE_cellColumn; x++)
                        if (cell.getAnimal(x, y).style == this.styleSwap) 
                            list.push(cc.v3(x, y, Math.abs(cellX - x) + Math.abs(cellY - y))); // z为该图格到当前图格的曼哈顿距离
                list = list.sort((a, b) => b.z - a.z);
                z = list[0].z; // 获取最大的曼哈顿距离
                for (let i = 0; i < list.length; i++)
                    this.scheduleOnce(() => cell.eliminateCell(list[i].x, list[i].y, 2.5), animTime * (2 - list[i].z / z)); // 消除动画（由远到近逐渐消除）
                return false;
        }
        // 消除后的信息处理
        this.hasEliminated = true;   // 标记为已消除状态
        this.fadeIn = false;         // 关闭渐显动画
        this.node.opacity = 0;       // 设置节点透明度为0，即完全不可见
        this.style = -1;             // 重置样式为“无”
        this.styleSwap = -1;         // 重置同色消除目标样式为“随机”
        this.effect = 0;             // 重置特效类型为“无”
        return true;                 // 返回销毁成功
    },

    /**
     * 重新生成
     * @param {number} style    图格类型
     * @param {number} height   图格高度差
     * @param {number} opacity  初始不透明度
     */
    respawn(style, effect, height, opacity) {
        this.node.opacity = opacity; // 设置节点初始透明度
        this.fadeIn = true;          // 启用渐显动画
        this.hasEliminated = false;  // 标记为未消除状态
        this.setStyle(style);        // 设置图格类型
        this.setEffect(effect);      // 设置特效类型
        this.fall(null, height);     // 执行下落动画
    },

    /**
     * 下落
     * @param {number} duration 动画时长（单位：秒），为null或负数时使用默认时长
     * @param {number} height   图格高度差
     */
    fall(duration, height) {
        if (duration == null || duration < 0) duration = window.HE_animDuration;
        window.HE_timer = duration;  // 阻止用户在期间进行操作
        duration = duration * 2 / 3; // 将实际动作时长设置为总时长的2/3，以留有一部分时间用于其他动作

        height *= window.HE_cellHeight; // 计算实际下落的像素高度
        this.node.y += height; // 将节点向上移动指定高度

        // 创建并执行下落动作，使用BackOut缓动效果
        let fall = cc.repeat(cc.moveBy(duration, cc.v2(0, -height)).easing(cc.easeBackOut()), 1);
        this.node.runAction(fall);
    },

    /**
     * 移动
     * @param {number} dir 移动方向：0-下 1-左 2-上 3-右
     * @param {number} style 0-板边回弹 1-无效交换 2-有效交换
     */
    move(dir, style) {
        dir = Math.floor(dir % 4 + 4) % 4; // 确保dir在0到3之间的整数
        let move = this.moveAnim(dir, style, null);
        this.node.runAction(move);
    },

    /**
     * 移动动画
     * @param {number} dir 移动方向：0-下 1-左 2-上 3-右
     * @param {number} style 0-板边回弹 1-无效交换 2-有效交换
     * @param {number} duration 动画时长（单位：秒），为null或负数时使用默认时长
     * @returns {cc.ActionInterval} 封装的动作
     */
    moveAnim(dir, style, duration) {
        dir = Math.floor(dir % 4 + 4) % 4; // 确保dir在0到3之间的整数
        let act1, act2;
        let offsetX = (dir % 2) * (dir - 2) * this.node.width; // 要移动的横向距离
        let offsetY = ((dir + 1) % 2) * (dir - 1) * this.node.height; // 要移动的纵向距离
        if (duration == null || duration < 0) duration = window.HE_animDuration;
        window.HE_timer = duration;
        switch (style) {
            case 0: // 板边回弹动画
                duration /= 4;
                offsetX /= 4;
                offsetY /= 4;
                act1 = cc.moveBy(duration, cc.v2(offsetX, offsetY)).easing(cc.easeSineOut());
                act2 = cc.moveBy(duration, cc.v2(-offsetX, -offsetY)).easing(cc.easeSineIn());
                return cc.repeat(cc.sequence(act1, act2), 1);
            case 1: // 无效交换动画
                duration /= 2;
                act1 = cc.moveBy(duration, cc.v2(-offsetX, -offsetY)).easing(cc.easeSineOut());
                act2 = cc.moveBy(duration, cc.v2(offsetX, offsetY)).easing(cc.easeBackOut());
                return cc.repeat(cc.sequence(act1, act2), 1);
            case 2: // 有效交换动画
                return cc.repeat(cc.moveBy(duration, cc.v2(offsetX, offsetY)).easing(cc.easeBackOut()), 1);
        }
        return null;
    },

    /**
     * 设置图格元素种类
     * @param {number} style
     */
    setStyle(style) {
        // 设置当前的样式
        this.style = style;
        // 设置精灵的显示帧为指定样式的动物
        this.sprite.spriteFrame = window.HE_animals[this.style];

        // 获取当前样式对应的动画
        let selected = window.HE_animSelected[this.style]; // 选中时的动画
        let column = window.HE_animColumn[this.style];     // 持有“竖线特效”的动画
        let line = window.HE_animLine[this.style];         // 持有“横线特效”的动画
        let wrap = window.HE_animWrap[this.style];         // 持有“爆炸特效”的动画
        this.setAnims(selected, column, line, wrap);
        // 如果节点的透明度小于255，则自动启用渐显动画
        if (this.node.opacity < 255) this.fadeIn = true;
    },

    /**
     * 设置图格元素特效并播放对应动画
     * @param {number} type
     */
    setEffect(type) {
        this.effect = type;
        switch (type) {
            case 1:
                this.anim.play("line");
                break;
            case 2:
                this.anim.play("column");
                break;
            case 3:
                this.anim.play("wrap");
                break;
            case 4:
                this.setStyle(6); // “魔术鸟”要直接将其种类修改
                break;
        }
    },

    /**
     * 设置图格元素动画切片
     * @param {cc.AnimationClip} selected
     * @param {cc.AnimationClip} column
     * @param {cc.AnimationClip} line
     * @param {cc.AnimationClip} wrap
     */
    setAnims(selected, column, line, wrap) {
        // 移除原有动画
        let clips = this.anim.getClips();
        for (let i = 0; i < clips.length; i++)
            this.anim.removeClip(clips[i], true);

        // 新增动画
        this.anim.addClip(selected, "selected"); // 选中时的动画
        this.anim.addClip(column, "column");     // 持有“竖线特效”的动画
        this.anim.addClip(line, "line");         // 持有“横线特效”的动画
        this.anim.addClip(wrap, "wrap");         // 持有“爆炸特效”的动画
        this.anim.stop(); // 终止当前动画
    },

    /**
     * 图格被选中
     * @param {boolean} value 是否被选中
     */
    select(value) {
        // 如果传入的值与当前的选择状态不同，并且当前样式为6或特效为0
        if (value != this.isSelected && (this.style == 6 || this.effect == 0)) // 只有“魔术鸟”和无特效的普通图格才执行选中动画
            if (this.isSelected = value) this.anim.play("selected");
            else {
                // 停止“选中”动画，恢复静态
                this.anim.stop("selected");
                this.sprite.spriteFrame = window.HE_animals[this.style];
            }
    },

    update(dt) {
        // 若启用了渐显动画
        if (this.fadeIn) {
            // 根据时间间隔更新节点透明度
            this.node.opacity += dt * 255 * window.HE_animDuration * 4;
            // 如果透明度达到255
            if (this.node.opacity >= 255) {
                this.node.opacity = 255; // 设置透明度为255避免溢出
                this.fadeIn = false; // 禁用渐显动画
            }
        }
    },
});
