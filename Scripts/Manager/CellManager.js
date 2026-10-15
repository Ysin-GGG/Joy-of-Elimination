// 图格管理类
cc.Class({
    extends: cc.Component,

    properties: {
        imgs_cell: [cc.SpriteFrame],
        prefab_animal: cc.Prefab,
        prefab_cell: cc.Prefab,
        node_animals: cc.Node,
        node_select: cc.Node,
        node_cells: cc.Node,
        _animals: Array,
        _cells: Array,
        _orig: null, // cc.Vec2,
        _dest: null, // cc.Vec2,
    },

    /**
     * 检索图格是否越界
     * @param {number} cellX    图格横坐标
     * @param {number} cellY    图格纵坐标
     * @returns {boolean}       坐标是否超出地图
     */
    outside(cellX, cellY) {
        return cellX < 0 || cellX >= window.HE_cellColumn || cellY < 0 || cellY >= window.HE_cellLine;
    },

    /**
     * 点选图格
     * @param {object} cell 所选图格
     * @returns {number}    0-同一图格 1-相邻图格 -1-无关图格
     */
    selectCell(cellX, cellY) {
        if (this.outside(cellX, cellY) || window.HE_pause) return;
        if (this._orig == null) { // 若未选中任何图格
            this._orig = cc.v2(cellX, cellY); // 则令所点击的图格被选中
            this.getAnimal(cellX, cellY).select(true);
            // 重新定位选择框
            this.node_select.opacity = 255;
            this.node_select.x = this._cells[cellY][cellX].x;
            this.node_select.y = this._cells[cellY][cellX].y;
            window.HE_audioManager.playClick();
        }
        else { // 否则根据第二个点击的图格进行下列判断
            this._dest = cc.v2(cellX, cellY);
            switch (this.checkCell()) {
                case 0: // 取消当前选择的图格
                    this.getAnimal(cellX, cellY).select(false);
                    this._orig = null;
                    this._dest = null;
                    this.node_select.opacity = 0;
                    window.HE_audioManager.playClick();
                    break;
                case 1: // 交换当前选择的图格
                    this.trySwap();
                    this.getAnimal(this._orig.x, this._orig.y).select(false);
                    this.getAnimal(this._dest.x, this._dest.y).select(false);
                    this._orig = null;
                    this._dest = null;
                    this.node_select.opacity = 0;
                    break;
                case -1: // 更改当前选择的图格
                    this.getAnimal(this._orig.x, this._orig.y).select(false);
                    this.getAnimal(this._dest.x, this._dest.y).select(true);
                    this._orig = this._dest;
                    this._dest = null;
                    this.node_select.x = this._cells[this._orig.y][this._orig.x].x;
                    this.node_select.y = this._cells[this._orig.y][this._orig.x].y;
                    window.HE_audioManager.playClick();
                    break;
            }
        }
    },

    /**
     * 设置棋盘尺寸并初始化
     * @param {number} cellLine     图格行数
     * @param {number} cellColumn   图格列数
     * @param {number} cellWidth    单图格宽度
     * @param {number} cellHeight   单图格高度
     */
    setSize(cellLine, cellColumn, cellWidth, cellHeight) {
        cellLine = Math.floor(cellLine);
        cellColumn = Math.floor(cellColumn);
        // 地图节点尺寸初始化
        this.node.width = cellColumn * cellWidth;
        this.node.height = cellLine * cellHeight;
        // 选择框尺寸初始化
        this.node_select.width = cellWidth;
        this.node_select.height = cellHeight;
        // 图格和图格元素二维数组初始化
        this._animals = new Array(cellLine);
        this._cells = new Array(cellLine);
        for (let i = 0; i < cellLine; i++) {
            this._animals[i] = new Array(cellColumn);
            this._cells[i] = new Array(cellColumn);
            for (let j = 0; j < cellColumn; j++) {
                let style = Math.floor(Math.random() * (this.imgs_cell.length - 1));
                let x = ((j - cellColumn / 2 + .5) * cellWidth);
                let y = ((i - cellLine / 2 + .5) * cellHeight);

                // 初始化图格元素
                this._animals[i][j] = cc.instantiate(this.prefab_animal);
                this._animals[i][j].x = x;
                this._animals[i][j].y = y;
                this._animals[i][j].width = cellWidth;
                this._animals[i][j].height = cellHeight;
                this._animals[i][j].getComponent("Animal").setStyle(style);
                this.node_animals.addChild(this._animals[i][j]);

                // 初始化棋盘图格
                this._cells[i][j] = cc.instantiate(this.prefab_cell);
                this._cells[i][j].x = x;
                this._cells[i][j].y = y;
                this._cells[i][j].width = cellWidth;
                this._cells[i][j].height = cellHeight;
                this.node_cells.addChild(this._cells[i][j]);

                // 图格记录自身所在位置
                let cell = this._cells[i][j].getComponent("Cell");
                cell.cellX = j;
                cell.cellY = i;
            }
        }
        // 初始化消除组合
        this.initEliminations();
        // 直接生成两个特效块，以测试组合特效 （实际运行时可以删去）
        this.getAnimal(6, 6).setEffect(2);
        this.getAnimal(6, 7).setEffect(4);
    },

    /**
     * 获取棋盘上的图格
     * @param {number} cellX    图格横坐标
     * @param {number} cellY    图格纵坐标
     * @returns {object}        返回Cell组件，否则为null
     */
    getCell(cellX, cellY) {
        if (this.outside(cellX, cellY)) return null;
        return this._cells[cellY][cellX].getComponent("Cell");
    },

    /**
     * 获取棋盘上的图格元素
     * @param {number} cellX    图格横坐标
     * @param {number} cellY    图格纵坐标
     * @returns {object}        返回Animal组件，否则为null
     */
    getAnimal(cellX, cellY) {
        if (this.outside(cellX, cellY)) return null;
        return this._animals[cellY][cellX].getComponent("Animal");
    },

    /**
     * 检测所选的两个图格关系
     * @returns {number} 0-同一图格 1-相邻图格 -1-无关图格
     */
    checkCell() {
        if (window.HE_timer < -.1 && this._orig != null && this._dest != null) {
            let diffX = this._orig.x - this._dest.x; // 两图格之间的水平曼哈顿距离
            let diffY = this._orig.y - this._dest.y; // 两图格之间的垂直曼哈顿距离
            if (diffX == 0 && diffY == 0) return 0; // 距离为0，则表示为同一图格
            if (Math.abs(diffX) + Math.abs(diffY) == 1) return 1; // 合计距离为1，则表示为相邻图格
        }
        return -1; // 否则为不相邻图格
    },

    /**
     * 刷新棋盘状态（包含下落动画处理）
     */
    refreshCells() {
        // 遍历棋盘
        for (let x = 0; x < window.HE_cellColumn; x++) {
            for (let y = 0, z = 0; y < window.HE_cellLine; y++) {
                let caze = 0;
                let orig = this.getAnimal(x, y);
                let dest = this.getAnimal(x, y + z);
                if (orig.hasEliminated || z > 0) // 若该图格已被消除或其下方有空间时
                    while (!caze) // 向上方循环遍历，直至到达板边或检索到非空图格
                        if (dest == null) caze = 1; // 检索到板边
                        else if (!dest.hasEliminated) caze = 2; // 检索到为非空图格
                        else dest = this.getAnimal(x, y + ++z);
                if (caze == 1) orig.respawn(Math.floor(Math.random() * (this.imgs_cell.length - 1)), 0, z, 0); // 生成图格重新填充
                if (caze == 2) orig.respawn(dest.style, dest.effect, z, 255); // 克隆上方图格（因为下落动画不会改变位置，单纯是动画）
            }
        }
        // 延迟执行（等待下落动画结束）
        this.scheduleOnce(
            function () { 
                /*
                该部分比较离谱，细讲一下
                1、因为自然消除产生的下落可能会产生“连击消除”，所以每次消除的下落动画后都要进行全盘检测
                2、这种随机因素可能会导致一次消除能产生多种“特效”，应该取其中优先级更高的“特效”
                3、以下为个人的暴力对策：
                4、-先遍历检索一次，查看并记录每个图格的消除后会产生什么“特效”，以及其牵连消除的其他图格
                5、-随后用二维数组记录其对应的“特效”优先级，并将其推入一个顺序表里等待执行
                6、-对顺序表进行排序，高优先级“特效”的图格会排在前面
                7、-对顺序表进行遍历，对排序好的图格逐个进行消除操作
                8、如此反复上述步骤，直至棋盘趋于稳定（连击消除结束）
                */
                if (this.existElimination()) { // 检测棋盘是否仍存在0步消除
                    let map = this.checkEliminations(); // 获取对应图格可能产生的“特效”
                    let list = []; // 顺序表
                    // 第一次遍历
                    for (let i = 0; i < window.HE_cellLine; i++)
                        for (let j = 0; j < window.HE_cellColumn; j++)
                            if (map[i][j] < 0) list.push(cc.v3(j, i, map[j][i])); // 此处只推入优先级为负数的图格（表示这个图格执行消除后会产生“特效”）
                    list = list.sort((a, b) => map[a.y][a.x] - map[b.y][b.x]); // 按“特效”的优先级排序图格坐标
                    for (let i = 0; i < list.length; i++) {
                        let x = list[i].x;
                        let y = list[i].y;
                        let count = this.dfs(x, y, null); // 获取该图格的消除信息
                        if (this.checkElimination(count) == -map[y][x]) this.eliminate(x, y, count); // 若优先级与表中数据一致，则表示该图格未受其他“特效”影响，直接消除
                    }
                    window.HE_uiManager.addRealCombo(); // 完成一次刷新，实际连击数+1
                }
                else if (this.isImpasse()) this.generate(); // 死局检测，若为死局则重新生成整个棋盘
                else window.HE_uiManager.reset(false); // 若非死局，则重置消除连击数
            }, window.HE_animDuration
        );
    },

    /**
     * 单图格消除处理
     * @param {number} cellX 图格横坐标
     * @param {number} cellY 图格纵坐标
     * @param {number} score 得分倍数加成
     */
    eliminateCell(cellX, cellY, scoreMul) {
        if (this.outside(cellX, cellY)) return false;
        else return this.getAnimal(cellX, cellY).eliminateSelf(cellX, cellY, scoreMul);
    },

    /**
     * 执行消除并填充棋盘
     * 常配合该类下的dfs函数使用
     * @param {number} cellX    图格横坐标
     * @param {number} cellY    图格纵坐标
     * @param {number[]} count  四个方向（依次为：左，下，右，上）的连续同种图格数
     */
    eliminate(cellX, cellY, count) {
        let priority = this.checkElimination(count);
        if (priority > 0) window.HE_uiManager.addCombo();
        if (priority > 2) window.HE_uiManager.addScore(1.0);
        switch (priority) {
            case 1:  // 单行3个
            case 2:  // 单列3个
                this.eliminateCell(cellX, cellY, 1.0);
                break;
            case 4:  // 单行4个 (单列消除特效)
            case 8:  // 单列4个 (单行消除特效)
                this.getAnimal(cellX, cellY).setEffect(8 / priority);
                break;
            case 16:
                this.getAnimal(cellX, cellY).setEffect(3);
                break;
            case 32: // 单行5个及以上 (同色消除特效)
            case 64: // 单列5个及以上 (同色消除特效)
                this.getAnimal(cellX, cellY).setEffect(4);
                break;
        }
        switch (priority) {
            case 1:  // 单行3个
            case 4:  // 单行4个 (单列消除特效)
            case 32: // 单行5个及以上 (同色消除特效)
            case 16: // 单行和单列均3-4个 (爆炸特效)
                for (let x = 1; x <= count[0]; x++) this.eliminateCell(cellX - x, cellY, 1.0);
                for (let x = 1; x <= count[2]; x++) this.eliminateCell(cellX + x, cellY, 1.0);
                if(priority != 16) break;
            case 2:  // 单列3个
            case 8:  // 单列4个 (单行消除特效)
            case 64: // 单列5个及以上 (同色消除特效)
                for (let y = 1; y <= count[1]; y++) this.eliminateCell(cellX, cellY - y, 1.0);
                for (let y = 1; y <= count[3]; y++) this.eliminateCell(cellX, cellY + y, 1.0);
                break;
        }
    },

    /**
     * 执行消除并填充棋盘
     * @param {number} cellX1 图格1横坐标
     * @param {number} cellY1 图格1纵坐标
     * @param {number} cellX2 图格2横坐标
     * @param {number} cellY2 图格2纵坐标
     */
    eliminateEffect(cellX1, cellY1, cellX2, cellY2) {
        let animTime = window.HE_animDuration;
        let cell1 = this.getAnimal(cellX1, cellY1);
        let cell2 = this.getAnimal(cellX2, cellY2);
        let count = new Array(6).fill(0);
        count[cell1.effect]++;
        count[cell2.effect]++;
        // 下面这部分...基本就是在写怎么获取要消除的图格罢了，又长又臭就不解释了
        if (count[4] > 1) { // 清屏特效：由远到近将图格全部消除
            let arr = [];
            let z = 0;
            this.scheduleOnce(() => this.eliminateCell(cellX1, cellY1, 5.0), animTime);
            this.scheduleOnce(() => this.eliminateCell(cellX2, cellY2, 5.0), animTime);
            window.HE_audioManager.playEffect(5);
            for (let y = 0; y < window.HE_cellLine; y++)
                for (let x = 0; x < window.HE_cellColumn; x++)
                    arr.push(cc.v3(x, y, Math.abs(cellX2 - x) + Math.abs(cellY2 - y)));
            arr = arr.sort((a, b) => b.z - a.z);
            z = arr[0].z;
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].z > 0)
                    this.scheduleOnce(() => this.eliminateCell(arr[i].x, arr[i].y, 5.0), animTime * (1 - arr[i].z / z));
            }
        }
        else if (count[4] > 0) { // 同色特效（结合“魔术鸟”的组合特效）
            let arr = [];
            let cellX = cell1.effect == 4 ? cellX1 : cellX2;
            let cellY = cell1.effect == 4 ? cellY1 : cellY2;
            let other = cell1.effect == 4 ? this.getAnimal(cellX2, cellY2) : this.getAnimal(cellX1, cellY1);
            let z = other.style;
            for (let y = 0; y < window.HE_cellLine; y++)
                for (let x = 0; x < window.HE_cellColumn; x++)
                    if (this.getAnimal(x, y).style == z)
                        arr.push(cc.v3(x, y, Math.abs(cellX - x) + Math.abs(cellY - y)));
            arr = arr.sort((a, b) => b.z - a.z);
            z = arr[0].z;
            if (count[1] + count[2] > 0) { // 直线特效化（横竖方向随机）：获取同色的全部图格，随机赋予并直接触发直线特效
                for (let i = 0; i < arr.length; i++)
                    if (arr[i].z > 0) {
                        this.scheduleOnce(() => this.getAnimal(arr[i].x, arr[i].y).setEffect(Math.random() < .5 ? 1 : 2), animTime * (1 - arr[i].z / z));
                        this.scheduleOnce(() => this.eliminateCell(arr[i].x, arr[i].y, 4.5), animTime * (arr[i].z / z + 1));
                    }
                this.scheduleOnce(() => this.eliminateCell(cellX, cellY, 4.5), animTime);
                this.getAnimal(cellX, cellY).styleSwap = -2;
                window.HE_audioManager.playEffect(3);
            }
            else if (count[3] > 0) { // 爆炸特效化：获取同色的全部图格，随机转化直线特效并直接触发
                for (let i = 0; i < arr.length; i++)
                    if (arr[i].z > 0) {
                        this.scheduleOnce(() => this.getAnimal(arr[i].x, arr[i].y).setEffect(3), animTime * (1 - arr[i].z / z));
                        this.scheduleOnce(() => this.eliminateCell(arr[i].x, arr[i].y, 4.5), animTime * (arr[i].z / z + 1));
                    }
                this.scheduleOnce(() => this.eliminateCell(cellX, cellY, 4.5), animTime);
                this.getAnimal(cellX, cellY).styleSwap = -2;
                window.HE_audioManager.playEffect(4);
            }
            else { // 无额外特效：获取同色的全部图格，由远到近将其全部逐个消除
                this.scheduleOnce(() => this.eliminateCell(cellX, cellY, 2.5), animTime);
                this.getAnimal(cellX, cellY).styleSwap = other.style;
                this.getAnimal(cellX, cellY).eliminateSelf(cellX, cellY, 2.5);
            }
        }
        else if (count[3] > 0) {
            if (count[1] > 0) { // 三重横线特效：在同一列上，将连续三个图格转换为横线特效并直接触发
                cell1.setEffect(0);
                cell2.setEffect(0);
                window.HE_audioManager.playEffect(1);
                for (let y = -1; y <= 1; y++) {
                    let animal = this.getAnimal(cellX1, cellY1 + y);
                    if (animal != null) {
                        animal.setEffect(6);
                        this.eliminateCell(cellX1, cellY1 + y, 3.5);
                    }
                }
            }
            else if (count[2] > 0) { // 三重竖线特效：在同一行上，将连续三个图格转换为竖线特效并直接触发
                cell1.setEffect(0);
                cell2.setEffect(0);
                window.HE_audioManager.playEffect(1);
                for (let x = -1; x <= 1; x++) {
                    let animal = this.getAnimal(cellX1 + x, cellY1);
                    if (animal != null) {
                        animal.setEffect(7);
                        this.eliminateCell(cellX1 + x, cellY1, 3.5);
                    }
                }
            }
            else if (count[3] > 1) { // 大爆炸特效：将所选的两个图格转换为大爆炸特效并直接触发
                cell1.setEffect(5);
                cell2.setEffect(5);
                window.HE_audioManager.playEffect(2);
                this.eliminateCell(cellX1, cellY1, 4.0);
                this.eliminateCell(cellX2, cellY2, 4.0);
            }
        }
        else if (count[1] + count[2] > 1) { // 十字特效：将所选的两个图格各转换成横线和竖线特效并直接触发
            cell1.setEffect(6);
            cell2.setEffect(7);
            window.HE_audioManager.playEffect(0);
            this.eliminateCell(cellX1, cellY1, 3.0);
            this.eliminateCell(cellX2, cellY2, 3.0);
        }
    },

    /**
     * 查看棋盘当前是否存在0步消除
     * @returns {boolean} 若存在，则返回true，否则返回false
     */
    existElimination() {
        for (let i = 0; i < window.HE_cellLine; i++)
            for (let j = 0; j < window.HE_cellColumn; j++)
                if (this.checkElimination(this.dfs(j, i, null))) return true;
        return false;
    },

    /**
     * 转换当前图格的消除类型（值越大优先级越高，其中单行或单列同数）
       消除存在优先级，若一次消除内可触发两种类型，则优先执行高优先级的消除
       自然下落时形成十字消除，此时可触发的消除类型有：单行3个、单列3个、单行和单列均3个，则应该执行"单行和单列均3个的消除"
     * @param {number[]} count 四个方向上的连续同种图格数
     * @returns {number} 消除类型：0-不可消除，1-单行3个，2-单列3个，4-单行4个，8-单列4个，16-单行和单列均3-4个，32-单行5个及以上，64-单列5个及以上
     */
    checkElimination(count) {
        let l = count[0] + count[2];
        let c = count[1] + count[3];
        if (c > 3) return 64; // 单列5个及以上 (同色消除特效)
        if (l > 3) return 32; // 单行5个及以上 (同色消除特效)
        if (l > 1 &&
            c > 1) return 16; // 单行和单列均3-4个 (爆炸特效)
        if (c > 2) return 8;  // 单列4个 (单行消除特效)
        if (l > 2) return 4;  // 单行4个 (单列消除特效)
        if (c > 1) return 2;  // 单列3个
        if (l > 1) return 1;  // 单行3个
        return 0;             // 不可消除
    },

    /**
     * 统计棋盘当前存在的消除组合
     * @returns {number[][]} 返回消除优先级矩阵
     */
    checkEliminations() {
        // 初始化矩阵
        let map = new Array(window.HE_cellLine);
        for (let i = 0; i < window.HE_cellLine; i++)
            map[i] = new Array(window.HE_cellColumn).fill(0);

        // 遍历矩阵
        for (let i = 0; i < window.HE_cellLine; i++)
            for (let j = 0; j < window.HE_cellColumn; j++) {
                let count = this.dfs(j, i, null); // 搜索处理
                let priority = this.checkElimination(count); // 消除优先级
                /*
                这里注意一下，负责执行消除的图格会被标记为优先级的负数，而其消除相关的图格会被标记为同优先级的正数
                例如下图（左上角为0,0）
                -16 16 16
                16 0 0
                16 0 0
                则表示由(0,0)负责消除，同时消除与其相连的同优先级图格(0,1)、(0,2)、(1,0)、(2,0)
                */
                if (Math.abs(map[i][j]) < priority) map[i][j] = -priority; // 设为负数，作为消除标记
                switch (priority) {
                    case 1:  // 单行3个
                    case 4:  // 单行4个 (单列消除特效)
                    case 32: // 单行5个及以上 (同色消除特效)
                    case 16: // 单行和单列均3-4个 (爆炸特效)
                        for (let x = 1; x <= count[0]; x++) if (Math.abs(map[i][j - x]) < priority) map[i][j - x] = priority; // 标记为消除优先级的正数
                        for (let x = 1; x <= count[2]; x++) if (Math.abs(map[i][j + x]) < priority) map[i][j + x] = priority; // 标记为消除优先级的正数
                        if (priority != 16) break; // 爆炸特效需要同时执行水平和垂直方向的处理，故此处不break，利用特性顺带执行下面的代码
                    case 2:  // 单列3个
                    case 8:  // 单列4个 (单行消除特效)
                    case 64: // 单列5个及以上 (同色消除特效)
                        for (let y = 1; y <= count[1]; y++) if (Math.abs(map[i - y][j]) < priority) map[i - y][j] = priority; // 标记为消除优先级的正数
                        for (let y = 1; y <= count[3]; y++) if (Math.abs(map[i + y][j]) < priority) map[i + y][j] = priority; // 标记为消除优先级的正数
                        break;
                }
            }
        return map;
    },

    /**
     * 清除生成棋盘时存在的0步消除（即保证生成棋盘时，不会出现任何三消及以上的消除组合）
     * 原理：一个图格有6种类型（不包括“魔术鸟”），但方向只有4个，因此必存在合适的解
     *      采用洗牌算法，对6个类型的顺序进行洗牌打乱，以保证每个类型出现的概率均匀
     *      随后以此按乱序的类型遍历，直至该图格的0步消除被清除
     */
    initEliminations() {
        for (let i = 0; i < window.HE_cellLine; i++) {
            for (let j = 0; j < window.HE_cellColumn; j++) {
                if (this.checkElimination(this.dfs(j, i, null)) > 0) {
                    let animal = this.getAnimal(j, i);
                    let length = this.imgs_cell.length - 1;
                    let order = [];
                    for (let k = 0; k < length; k++) order.push(k);
                    for (let k = length - 1; k > 0; k--) { // Kruth洗牌，概率均匀
                        let l = Math.floor(Math.random() * k);
                        let temp = order[k];
                        order[k] = order[l];
                        order[l] = temp;
                    }
                    for (let k = 0; k < order.length; k++) // 枚举每个类型
                        if (this.checkElimination(this.dfs(j, i, order[k])) == 0) { // 若该类型的图格不会被0步消除
                            animal.setStyle(order[k]); // 则保留该类型
                            break; // 并跳出循环避免被覆盖
                        }
                }
            }
        }
        if (this.isImpasse()) this.generate();
    },

    /**
     * 重新生成棋盘（带下落动画）
     */
    generate() {
        for (let i = 0; i < window.HE_cellLine; i++)
            for (let j = 0; j < window.HE_cellColumn; j++) {
                let animal = this.getAnimal(j, i);
                animal.destroySelf();
                animal.respawn(Math.floor(Math.random() * (this.imgs_cell.length - 1)), 0, 2, 0);
            }
        this.initEliminations();
    },

    /**
     * 检测当前棋盘是否进入死局
     * 不可在棋盘没填充完毕时执行
     * 情况1（异行/列消除）的简单原理：以3x2的矩阵为例，若矩阵中每列至少存在1个同种图格，则存在消除，即不为死局
     * 统计有4种情况，如：
     * 001 101 110 010
     * 110 010 001 101
     * 情况2（同行/列消除）的简单原理：以4x1的矩阵为例，若矩阵中至少存在3个同种图格，则存在消除，即不为死局
     * 统计有2种情况，如：1101 1011
     * 若采用滑动窗口思想/状态转移方程，可优化时间复杂度（懒得写，够用就行x）
     * @returns {boolean} 若为死局，则返回true，否则返回false
     */
    isImpasse() {
        //3x2矩阵，检测每列至少存在1个同种图格（未完成）
        if (window.HE_cellColumn > 2 && window.HE_cellLine > 1)
            for (let y = 1; y < window.HE_cellLine; y++) {
                for (let x = 2; x < window.HE_cellColumn; x++) {
                    let style = this.getAnimal(x, y).style;
                    if (style == this.getAnimal(x - 1, y).style)
                        if (style == this.getAnimal(x - 2, y - 1).style)
                            return false;
                    if (style == this.getAnimal(x - 1, y - 1))
                        if (style == this.getAnimal(x - 2, y - 1) || style == this.getAnimal(x - 2, y - 2))
                            return false;
                }
            }
        //2x3矩阵，检测每行至少存在1个同种图格（未完成）
        if (window.HE_cellColumn > 1 && window.HE_cellLine > 2)
            for (let y = 2; y < window.HE_cellLine; y++) {
                for (let x = 1; x < window.HE_cellColumn; x++) {
                    let style = this.getAnimal(x, y).style;
                    if (style == this.getAnimal(x, y - 1).style)
                        if (style == this.getAnimal(x - 1, y - 2).style)
                            return false;
                    if (style == this.getAnimal(x - 1, y - 1))
                        if (style == this.getAnimal(x - 1, y - 2) || style == this.getAnimal(x - 2, y - 2))
                            return false;
                }
            }
        //4x1矩阵，检测至少存在3个同种图格
        if (window.HE_cellColumn > 3)
            for (let y = 0; y < window.HE_cellLine; y++) {
                let count = new Array(this.imgs_cell.length).fill(0);
                for (let x = 0; x < 4; x++)
                    if (++count[this.getAnimal(x, y).style] > 2)
                        return false;
                for (let j = 4; j < window.HE_cellColumn; j++) {
                    --count[this.getAnimal(j - 4, y).style];
                    if (++count[this.getAnimal(j, y).style] > 2)
                        return false;
                }
            }
        //1x4矩阵，检测至少存在3个同种图格
        if (window.HE_cellLine > 3)
            for (let x = 0; x < window.HE_cellColumn; x++) {
                let count = new Array(this.imgs_cell.length).fill(0);
                for (let y = 0; y < 4; y++)
                    if (++count[this.getAnimal(x, y).style] > 2)
                        return false;
                for (let y = 4; y < window.HE_cellLine; y++) {
                    --count[this.getAnimal(x, y - 4).style];
                    if (++count[this.getAnimal(x, y).style] > 2)
                        return false;
                }
            }
        return true;
    },

    /**
     * 尝试交换图格
     * 注意需要_orig和_dest同时不为空
     * @returns {boolean} 若交换后触发消除，则返回true，否则返回false
     */
    trySwap() {
        let orig = cc.v3(this._orig.x, this._orig.y, this.getAnimal(this._orig.x, this._orig.y).effect);
        let dest = cc.v3(this._dest.x, this._dest.y, this.getAnimal(this._dest.x, this._dest.y).effect);
        this.swap(orig.x, orig.y, dest.x, dest.y); // 先交换测试是否存在消除组合
        let origCnt = this.dfs(orig.x, orig.y, null);
        let destCnt = this.dfs(dest.x, dest.y, null);
        let effect = orig.z == 4 || dest.z == 4 || orig.z > 0 && dest.z > 0; // 判断交换时是否触发组合特效或同色消除特效
        let style = effect || this.checkElimination(origCnt) || this.checkElimination(destCnt) ? 2 : 1;
        if (style == 1) this.swap(orig.x, orig.y, dest.x, dest.y); // 交换后检测到不存在消除组合，则再交换回来
        else this.scheduleOnce( // 否则待交换动画结束后
            function () {
                if (effect) this.eliminateEffect(orig.x, orig.y, dest.x, dest.y); // 若可触发组合特效，则直接调用组合特效消除
                else { // 尝试对两个交换的图格进行消除
                    this.eliminate(orig.x, orig.y, origCnt);
                    this.eliminate(dest.x, dest.y, destCnt);
                }
            }, window.HE_animDuration
        );
        // 下面为交换的移动动画部分
        if (orig.x < dest.x) {
            this.getAnimal(orig.x, orig.y).move(1, style, null);
            this.getAnimal(dest.x, dest.y).move(3, style, null);
        }
        else if (dest.x < orig.x) {
            this.getAnimal(orig.x, orig.y).move(3, style, null);
            this.getAnimal(dest.x, dest.y).move(1, style, null);
        }
        else if (orig.y < dest.y) {
            this.getAnimal(orig.x, orig.y).move(0, style, null);
            this.getAnimal(dest.x, dest.y).move(2, style, null);
        }
        else if (dest.y < orig.y) {
            this.getAnimal(orig.x, orig.y).move(2, style, null);
            this.getAnimal(dest.x, dest.y).move(0, style, null);
        }
        return style == 2;
    },

    /**
     * 交换图格信息
     * @param {number} x1 图格1的横坐标
     * @param {number} y1 图格1的纵坐标
     * @param {number} x2 图格2的横坐标
     * @param {number} y2 图格2的纵坐标
     */
    swap(x1, y1, x2, y2) {
        let temp = this._animals[y1][x1];
        this._animals[y1][x1] = this._animals[y2][x2];
        this._animals[y2][x2] = temp;
    },

    /**
     * 获取图格及其四个方向上连续的同种图格
     * @param {number} cellX 图格横坐标
     * @param {number} cellY 图格纵坐标
     * @param {number} style 图格类型，取null则自动获取对应图格的类型
     * @returns {number[]} 四个方向（依次为：左，下，右，上）的连续同种图格数
     * 
     */
    dfs(cellX, cellY, style) { // 你以为真的要用DFS？其实连递归都不用的超低配版DFS就满足需求辣！
        if (this.outside(cellX, cellY)) return null;
        if (style == null) style = this.getAnimal(cellX, cellY).style;
        let count = [0, 0, 0, 0];
        for (let x = cellX - 1; x >= 0; x--) // 向左扫描
            if (this.getAnimal(x, cellY).style == style) count[0]++;
            else break;
        for (let y = cellY - 1; y >= 0; y--) // 向下扫描
            if (this.getAnimal(cellX, y).style == style) count[1]++;
            else break;
        for (let x = cellX + 1; x < window.HE_cellColumn; x++) // 向右扫描
            if (this.getAnimal(x, cellY).style == style) count[2]++;
            else break;
        for (let y = cellY + 1; y < window.HE_cellLine; y++)   // 向上扫描
            if (this.getAnimal(cellX, y).style == style) count[3]++;
            else break;
        return count;
        /*
        返回结果举例，设如图所示：
        0010
        0100
        1110
        0010
        设左上角为(0,0)，右下角为(3,3)
        若对(2,2)执行该函数，需要以该点为起点，向四个方向连续延伸检测（关键在于连续）
        左方向检测到2个同种图格，下方向均检测到1个同种图格，右和上方向未检测同种图格
        根据上述的顺序，最终返回一个长度为4的数组：[2,1,0,0]（左，下，右，上）
        */
    },

    onLoad() {
        window.HE_cellManager = this;
        window.HE_animals = this.imgs_cell;
    },
});
