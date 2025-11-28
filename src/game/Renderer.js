/**
 * 渲染器类 (Renderer Class)
 * 负责将游戏的所有视觉元素绘制到 Canvas 上。
 * 包含绘制路径、球、发射器、弹射物和特效的方法。
 */
export class Renderer {
    /**
     * 初始化渲染器
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     */
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
    }

    /**
     * 清除画布
     * 每一帧开始时调用
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * 绘制游戏路径 (轨道)
     * @param {Path} path - 路径对象
     */
    drawPath(path) {
        if (path.points.length < 2) return;

        this.ctx.beginPath();
        this.ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
            this.ctx.lineTo(path.points[i].x, path.points[i].y);
        }

        // 1. 绘制发光效果 (Glow effect)
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = 'rgba(0, 242, 255, 0.5)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 45; // 轨道宽度
        this.ctx.stroke();

        // 2. 绘制中心线 (Inner line)
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = 'rgba(0, 242, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 3. 绘制终点骷髅头标志
        const end = path.points[path.points.length - 1];
        this.drawSkull(end.x, end.y);
    }

    /**
     * 绘制骷髅头 (游戏失败的终点标志)
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     */
    drawSkull(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // 绘制红色背景圆
        this.ctx.fillStyle = '#ff0055';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#ff0055';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
        this.ctx.fill();

        // 绘制骷髅头符号
        this.ctx.fillStyle = '#000';
        this.ctx.shadowBlur = 0;
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('☠', 0, 2);
        this.ctx.restore();
    }

    /**
     * 绘制单个球体
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} radius - 半径
     * @param {string} color - 颜色代码
     */
    drawBall(x, y, radius, color) {
        // 创建径向渐变以模拟球体立体感
        // 光源位置在左上角 (x - radius/3, y - radius/3)
        const gradient = this.ctx.createRadialGradient(x - radius / 3, y - radius / 3, radius / 10, x, y, radius);
        gradient.addColorStop(0, '#fff');      // 高光
        gradient.addColorStop(0.3, color);     // 本体色
        gradient.addColorStop(1, '#000');      // 阴影

        this.ctx.fillStyle = gradient;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = color; // 彩色辉光

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // 绘制额外的高光点 (Shine)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 0;
        this.ctx.beginPath();
        this.ctx.arc(x - radius / 3, y - radius / 3, radius / 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * 绘制整个球链
     * @param {BallChain} chain - 球链对象
     */
    drawChain(chain) {
        for (const ball of chain.balls) {
            // 获取球在路径上的实际 2D 坐标
            const pos = chain.path.getPointAt(ball.distance);
            this.drawBall(pos.x, pos.y, ball.radius, ball.color);
        }
    }

    /**
     * 绘制发射器 (包括炮塔、瞄准线、当前球和下一球)
     * @param {Shooter} shooter - 发射器对象
     */
    drawShooter(shooter) {
        // 1. 绘制瞄准线 (位于发射器下方)
        this.ctx.save();
        this.ctx.translate(shooter.x, shooter.y);
        this.ctx.rotate(shooter.angle); // 旋转画布以匹配瞄准角度

        // 创建渐变瞄准线
        const gradient = this.ctx.createLinearGradient(0, 0, 400, 0);
        gradient.addColorStop(0, 'rgba(0, 242, 255, 0.6)');
        gradient.addColorStop(0.5, 'rgba(0, 242, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 242, 255, 0)');

        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]); // 虚线效果
        this.ctx.beginPath();
        this.ctx.moveTo(shooter.radius, 0); // 从炮口开始
        this.ctx.lineTo(400, 0); // 延伸出去
        this.ctx.stroke();
        this.ctx.setLineDash([]); // 重置虚线

        this.ctx.restore();

        // 2. 绘制炮塔本体
        this.ctx.save();
        this.ctx.translate(shooter.x, shooter.y);
        this.ctx.rotate(shooter.angle);

        this.ctx.fillStyle = '#222';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#00f2ff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, shooter.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // 绘制炮管
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, -10, 40, 20); // 简单的矩形炮管

        this.ctx.restore(); // 恢复状态，以便绘制球体时不受旋转影响

        // 3. 绘制当前待发射的球 (位于发射器中心)
        // 注意：我们不旋转这个球，让光照方向保持一致
        this.drawBall(shooter.x, shooter.y, 18, shooter.currentBall);

        // 4. 绘制下一个球的指示器 (在发射器旁边的小球)
        this.drawBall(shooter.x - 35, shooter.y + 35, 12, shooter.nextBall);
    }

    /**
     * 绘制所有飞行中的弹射物
     * @param {Array} projectiles - 弹射物数组
     */
    drawProjectiles(projectiles) {
        for (const p of projectiles) {
            this.drawBall(p.x, p.y, p.radius, p.color);
        }
    }
}
