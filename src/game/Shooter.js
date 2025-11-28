/**
 * 发射器类 (Shooter Class)
 * 玩家控制的青蛙/发射台。
 * 负责管理当前球、下一个球的颜色，以及瞄准和射击逻辑。
 */
export class Shooter {
    /**
     * 初始化发射器
     * @param {number} x - 发射器中心 X 坐标
     * @param {number} y - 发射器中心 Y 坐标
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 0; // 瞄准角度 (弧度)
        this.colors = ['#ff0055', '#00f2ff', '#00ff00', '#ffff00']; // 可用的球颜色
        this.radius = 25; // 发射器本体半径

        // 初始化当前球和下一个球的颜色
        this.currentBall = this.getRandomColor();
        this.nextBall = this.getRandomColor();

        this.cooldown = 0; // 当前冷却时间
        this.cooldownTime = 0.3; // 射击冷却间隔 (秒)
    }

    /**
     * 随机获取一种颜色
     * @returns {string} 颜色代码
     */
    getRandomColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    /**
     * 更新瞄准角度
     * 使发射器朝向目标点 (通常是鼠标位置)
     * @param {number} targetX - 目标点 X 坐标
     * @param {number} targetY - 目标点 Y 坐标
     */
    updateAngle(targetX, targetY) {
        this.angle = Math.atan2(targetY - this.y, targetX - this.x);
    }

    /**
     * 发射当前球
     * @returns {Object|null} - 如果成功发射，返回弹射物对象；如果在冷却中，返回 null
     */
    shoot() {
        if (this.cooldown > 0) return null;

        // 创建弹射物对象
        const projectile = {
            // 起始位置：发射器边缘
            x: this.x + Math.cos(this.angle) * this.radius,
            y: this.y + Math.sin(this.angle) * this.radius,
            // 速度向量：沿角度方向
            vx: Math.cos(this.angle) * 800, // 速度 800 像素/秒
            vy: Math.sin(this.angle) * 800,
            color: this.currentBall,
            radius: 18 // 弹射物半径 (应与 BallChain 中的球一致)
        };

        // 更新球的颜色队列
        this.currentBall = this.nextBall;
        this.nextBall = this.getRandomColor();
        
        // 重置冷却时间
        this.cooldown = this.cooldownTime;

        return projectile;
    }

    /**
     * 更新发射器状态 (主要是冷却时间)
     * @param {number} dt - 时间增量
     */
    update(dt) {
        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }
    }
}
