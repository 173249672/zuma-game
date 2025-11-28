/**
 * 球链管理类 (BallChain Class)
 * 管理游戏中所有沿着路径滚动的彩球。
 * 处理球的生成、移动、物理碰撞（球与球之间的推挤）、以及消除逻辑。
 */
export class BallChain {
    /**
     * 初始化球链
     * @param {Path} path - 游戏路径对象
     * @param {number} level - 当前关卡（影响速度和球的数量）
     */
    constructor(path, level = 1) {
        this.path = path;
        this.balls = []; // 存储所有球的数组，按在路径上的 distance 排序
        this.ballRadius = 18; // 球的半径
        // 基础速度 + 关卡增量
        this.speed = 50 + (level * 5); 
        // 可用的颜色集合
        this.colors = ['#ff0055', '#00f2ff', '#00ff00', '#ffff00']; // 红, 青, 绿, 黄
        this.spawnTimer = 0; // 生成计时器
        // 连续生成的间隔时间：直径 / 速度，确保首尾相连
        this.spawnInterval = (this.ballRadius * 2) / this.speed;
        // 最大生成球数：基础20 + 关卡增量
        this.maxBalls = 20 + (level * 10);
        this.spawnedCount = 0; // 已生成的球数
        this.nextId = 0; // 球的唯一 ID 计数器

        // 预生成初始球 - 只生成第一个球在起点
        this.preSpawnBalls(1);
    }

    /**
     * 预先生成一定数量的球（通常在游戏开始时）
     * @param {number} count - 生成数量
     */
    preSpawnBalls(count) {
        // 目前逻辑只生成在 distance 0，所以实际上 count 通常为 1
        for (let i = 0; i < count; i++) {
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];

            this.balls.push({
                id: this.nextId++,
                color: color,
                distance: 0, // 从路径起点开始
                radius: this.ballRadius
            });
            this.spawnedCount++;
        }
    }

    /**
     * 更新球链状态
     * @param {number} dt - 时间增量
     * @param {Function} onMatch - 消除回调函数 (count) => void
     */
    update(dt, onMatch) {
        // 1. 生成新球
        if (this.spawnedCount < this.maxBalls) {
            this.spawnTimer += dt;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnBall();
                this.spawnTimer = 0;
            }
        }

        if (this.balls.length === 0) return;

        const diameter = this.ballRadius * 2;
        const epsilon = 2; // 允许的微小误差，用于判定是否"连接"
        const attractionSpeed = this.speed * 4; // 球之间的磁力吸引速度

        // 确保球按距离排序（虽然通常是有序的，但为了保险）
        this.balls.sort((a, b) => a.distance - b.distance);

        // 2. 识别球段 (Segments)
        // 将连续接触的球划分为一个段，移动时以段为单位
        let segments = [];
        let currentSegment = [this.balls[0]];

        for (let i = 1; i < this.balls.length; i++) {
            const ball = this.balls[i];
            const prevBall = this.balls[i - 1];
            // 如果两球距离接近直径，视为同一段
            if (ball.distance - prevBall.distance <= diameter + epsilon) {
                currentSegment.push(ball);
            } else {
                // 否则，结束当前段，开始新段
                segments.push(currentSegment);
                currentSegment = [ball];
            }
        }
        segments.push(currentSegment);

        // 3. 移动球段
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            let moveSpeed = 0;

            if (i === 0) {
                // 第一段（最前面的段）以正常速度前进
                moveSpeed = this.speed;
            } else {
                // 后面的段受前面的段吸引
                const prevSegment = segments[i - 1];
                const prevTail = prevSegment[prevSegment.length - 1]; // 前一段的尾球
                const head = segment[0]; // 当前段的头球
                
                // 计算间隙
                const gap = head.distance - prevTail.distance - diameter;
                
                // 计算吸引力：间隙越大，拉力越小；这里似乎是反向吸引？
                // 逻辑：如果 i=0 是最前面的段（distance 最小？不对，distance 是从 0 开始增加的）
                // 让我们确认 distance 方向：Path 的 distance 随生成顺序增加？
                // 通常 Zuma 中，前面的球（先生成的）distance 更大。
                // 这里的 sort 是按 distance 升序。
                // 所以 balls[0] 是 distance 最小的（最后生成的，靠近起点）。
                // balls[length-1] 是 distance 最大的（最先生成的，靠近终点）。
                
                // 所以 segments[0] 是最后生成的段（靠近起点）。
                // segments[last] 是最先生成的段（靠近终点）。
                
                // 这里的逻辑：
                // i=0 是靠近起点的段。它应该被推着走？
                // 代码中：i=0 moveSpeed = this.speed。这表示新出来的球在推着走。
                
                // 对于 i > 0 的段（前面的段，靠近终点）：
                // prevSegment 是它后面的段（靠近起点）。
                // prevTail 是后一段距离最大的球。
                // head 是当前段距离最小的球。
                // gap = head.distance - prevTail.distance - diameter.
                // 如果 gap > 0，说明有空隙。
                
                // moveSpeed = -attractionSpeed * (0.5 + pullStrength);
                // 速度为负？这意味着球会倒退（向起点移动）以闭合间隙！这是磁力效果。
                const pullStrength = Math.min(gap / 50, 1.5);
                moveSpeed = -attractionSpeed * (0.5 + pullStrength);
            }

            // 应用速度
            for (const ball of segment) {
                ball.distance += moveSpeed * dt;
            }
        }

        // 4. 碰撞解决 (防止重叠)
        // 简单的约束求解：确保后球（大distance）不穿过前球（小distance）
        // 注意：这里遍历顺序是 1..length，即从小 distance 到大 distance
        for (let i = 1; i < this.balls.length; i++) {
            const ball = this.balls[i];       // distance 较大
            const prevBall = this.balls[i - 1]; // distance 较小
            
            // 如果距离小于直径（重叠）
            if (ball.distance < prevBall.distance + diameter) {
                // 强制推开 ball
                ball.distance = prevBall.distance + diameter;
            }
        }

        // 5. 消除检测 (Match Detection)
        // 优化：只在球静止或合并时检测？这里每帧检测所有可能的匹配
        let i = 0;
        while (i < this.balls.length) {
            let color = this.balls[i].color;
            let count = 1;
            let j = i + 1;

            // 向后查找相同颜色的连续球
            while (j < this.balls.length &&
                this.balls[j].color === color &&
                (this.balls[j].distance - this.balls[j - 1].distance <= diameter + epsilon)) {
                count++;
                j++;
            }

            if (count >= 3) {
                // 发现 3 个或更多同色球，移除它们
                this.balls.splice(i, count);
                if (onMatch) onMatch(count);
                // 移除后，i 保持不变（因为后面的元素移过来了），继续检查当前位置
            } else {
                // 否则跳过这组球
                i = j;
            }
        }
    }

    /**
     * 生成一个新球
     */
    spawnBall() {
        // 选择颜色，尝试避免直接生成3个同色导致在起点消除（虽然不太可能）
        let color;
        let attempts = 0;

        // 寻找最靠近起点的两个球
        let closest = null;
        let secondClosest = null;

        // 简单遍历找到 distance 绝对值最小的球
        for (const ball of this.balls) {
            if (!closest || Math.abs(ball.distance) < Math.abs(closest.distance)) {
                secondClosest = closest;
                closest = ball;
            } else if (!secondClosest || Math.abs(ball.distance) < Math.abs(secondClosest.distance)) {
                secondClosest = ball;
            }
        }

        // 如果最近的两个球颜色相同，尝试换个颜色
        if (closest && secondClosest && closest.color === secondClosest.color) {
            do {
                color = this.colors[Math.floor(Math.random() * this.colors.length)];
                attempts++;
            } while (attempts < 10 && color === closest.color);
        } else {
            // 随机选择颜色
            color = this.colors[Math.floor(Math.random() * this.colors.length)];
        }

        // 确定生成位置：紧贴着最后一个球（distance最小的球）
        // 如果没有球，从 0 开始
        let spawnDistance = 0;
        if (closest) {
            spawnDistance = closest.distance - (this.ballRadius * 2);
        }

        this.balls.push({
            id: this.nextId++,
            color: color,
            distance: spawnDistance,
            radius: this.ballRadius
        });
        this.spawnedCount++;
    }

    /**
     * 检查球链是否到达终点
     */
    hasReachedEnd() {
        if (this.balls.length === 0) return false;
        // 检查最前面的球（distance 最大，即数组末尾）
        const head = this.balls[this.balls.length - 1]; // 数组已按 distance 升序排序
        return head.distance >= this.path.totalLength;
    }

    /**
     * 检查球链是否为空
     */
    isEmpty() {
        return this.balls.length === 0;
    }

    /**
     * 检查是否已完成所有球的生成
     */
    hasFinishedSpawning() {
        return this.spawnedCount >= this.maxBalls;
    }

    /**
     * 检测弹射物是否击中球链
     * @param {Object} projectile - 弹射物对象 {x, y, radius}
     * @returns {Object|null} - 碰撞信息 {index, ball, x, y} 或 null
     */
    checkCollision(projectile) {
        // 遍历所有球进行圆形碰撞检测
        for (let i = 0; i < this.balls.length; i++) {
            const ball = this.balls[i];
            // 获取球当前的 2D 坐标
            const pos = this.path.getPointAt(ball.distance);
            const dx = pos.x - projectile.x;
            const dy = pos.y - projectile.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 如果距离小于两者半径之和
            if (dist < (ball.radius + projectile.radius)) {
                return { index: i, ball: ball, x: pos.x, y: pos.y };
            }
        }
        return null;
    }

    /**
     * 将弹射物插入到球链中
     * @param {Object} projectile - 弹射物
     * @param {number} hitIndex - 被击中的球的索引
     * @returns {number} - 插入位置的索引
     */
    insertBall(projectile, hitIndex) {
        // 简化的插入逻辑：总是插入到被击中球的"位置"
        // 实际上应该根据击打角度决定是插入在前面还是后面
        // 这里简化处理：直接在 hitIndex 处插入，原来的球后移

        const hitBall = this.balls[hitIndex];
        // const hitPos = this.path.getPointAt(hitBall.distance); // 未使用

        const newBall = {
            id: this.nextId++,
            color: projectile.color,
            distance: hitBall.distance, // 暂时重叠，稍后推开
            radius: this.ballRadius
        };

        // 插入数组
        this.balls.splice(hitIndex, 0, newBall);

        // 解决重叠：将插入点之后的球向前推
        // 从 hitIndex 开始向后遍历（distance 增加的方向）
        let currentIdx = hitIndex;
        while (currentIdx < this.balls.length - 1) {
            const b1 = this.balls[currentIdx];
            const b2 = this.balls[currentIdx + 1];
            // 确保 b2 比 b1 至少远一个直径
            if (b2.distance - b1.distance < this.ballRadius * 2) {
                b2.distance = b1.distance + this.ballRadius * 2;
            }
            currentIdx++;
        }

        return hitIndex;
    }

    /**
     * 检查指定位置是否形成消除
     * @param {number} startIndex - 检查的起始索引
     * @returns {number} - 消除的球数量
     */
    checkMatches(startIndex) {
        if (startIndex < 0 || startIndex >= this.balls.length) return 0;

        const color = this.balls[startIndex].color;
        let matchCount = 1;
        let start = startIndex;
        let end = startIndex;

        // 向前搜索 (index 减小)
        for (let i = startIndex - 1; i >= 0; i--) {
            if (this.balls[i].color === color) {
                matchCount++;
                start = i;
            } else {
                break;
            }
        }

        // 向后搜索 (index 增加)
        for (let i = startIndex + 1; i < this.balls.length; i++) {
            if (this.balls[i].color === color) {
                matchCount++;
                end = i; // 未使用，但逻辑上是这里的
            } else {
                break;
            }
        }

        // 如果匹配数 >= 3，执行消除
        if (matchCount >= 3) {
            this.balls.splice(start, matchCount);
            return matchCount;
        }

        return 0;
    }
}
