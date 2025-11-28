/**
 * 路径类 (Path Class)
 * 定义游戏中球滚动的轨道。
 * 负责生成螺旋形状的路径，并提供根据距离获取路径上坐标的功能。
 */
export class Path {
    /**
     * 初始化路径
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {number} level - 当前关卡（可用于改变路径形状，目前暂未使用）
     */
    constructor(width, height, level = 1) {
        this.width = width;
        this.height = height;
        this.points = []; // 存储路径上的一系列点 {x, y}
        this.totalLength = 0; // 路径的总长度（像素）
        this.generateSpiral(); // 生成螺旋路径
    }

    /**
     * 生成螺旋形路径
     * 从外部向中心螺旋
     */
    generateSpiral() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        // 最大半径为画布宽高中较小值的 45%
        const maxRadius = Math.min(this.width, this.height) * 0.45;
        const coils = 3; // 螺旋的圈数
        const steps = 500; // 生成路径点的细分数量（越多越平滑）

        // 遍历生成点
        // 从外圈 (t=0) 到内圈 (t=1)
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const angle = t * Math.PI * 2 * coils; // 角度随 t 增加
            // 半径随 t 减小 (1 -> 0.2)
            const radius = maxRadius * (1 - t * 0.8);

            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            this.points.push({ x, y });
        }

        // 计算总长度并缓存每段的长度，用于后续插值计算
        this.segmentLengths = [];
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i + 1];
            // 计算两点间距离
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            this.segmentLengths.push(dist);
            this.totalLength += dist;
        }
    }

    /**
     * 根据距离获取路径上的坐标和角度
     * @param {number} distance - 沿着路径的距离
     * @returns {Object} {x, y, angle} - 坐标和切线角度
     */
    getPointAt(distance) {
        // 情况 1: 距离小于 0（球还在起点之前，用于处理刚生成的球）
        // 向后外推路径
        if (distance < 0) {
            const p1 = this.points[0];
            const p2 = this.points[1];
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            // 沿着切线方向反向延伸
            const x = p1.x + Math.cos(angle) * distance;
            const y = p1.y + Math.sin(angle) * distance;
            return { x, y, angle };
        }

        // 情况 2: 距离超出总长度（球到达终点）
        // 返回终点坐标
        if (distance >= this.totalLength) {
            const last = this.points[this.points.length - 1];
            const prev = this.points[this.points.length - 2];
            const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
            return { ...last, angle };
        }

        // 情况 3: 正常在路径上
        // 遍历线段寻找 distance 所在的线段
        let currentDist = 0;
        for (let i = 0; i < this.segmentLengths.length; i++) {
            const segLen = this.segmentLengths[i];
            if (currentDist + segLen >= distance) {
                // 找到所在线段，进行线性插值
                const remaining = distance - currentDist;
                const t = remaining / segLen; // 在该线段上的比例 (0-1)
                const p1 = this.points[i];
                const p2 = this.points[i + 1];

                const x = p1.x + (p2.x - p1.x) * t;
                const y = p1.y + (p2.y - p1.y) * t;
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

                return { x, y, angle };
            }
            currentDist += segLen;
        }
        
        // 理论上不应到达这里，除非浮点数误差
        return this.points[this.points.length - 1];
    }
}
