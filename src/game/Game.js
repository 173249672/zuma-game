import { Path } from './Path.js';
import { BallChain } from './BallChain.js';
import { Shooter } from './Shooter.js';
import { Renderer } from './Renderer.js';

/**
 * 游戏主类 (Game Class)
 * 负责协调游戏的所有核心组件：路径、球链、发射器和渲染器。
 * 处理游戏循环、状态管理、输入事件和核心逻辑。
 */
export class Game {
    /**
     * 初始化游戏实例
     * @param {HTMLCanvasElement} canvas - 游戏画布元素
     * @param {Object} callbacks - UI 回调函数集合 (onGameOver, onVictory, etc.)
     */
    constructor(canvas, callbacks) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d'); // 获取 2D 渲染上下文
        this.callbacks = callbacks;
        this.width = canvas.width;
        this.height = canvas.height;

        // 游戏状态变量
        this.score = 0;      // 当前得分
        this.level = 1;      // 当前关卡
        this.isRunning = false; // 游戏是否正在进行中
        this.isPaused = false;  // 游戏是否暂停
        this.lastTime = 0;   // 上一帧的时间戳，用于计算 dt

        // 初始化核心组件
        // 1. Path: 定义球滚动的轨道
        this.path = new Path(this.width, this.height);
        // 2. BallChain: 管理轨道上的球链逻辑
        this.chain = new BallChain(this.path);
        // 3. Shooter: 玩家控制的发射器（青蛙）
        this.shooter = new Shooter(this.width / 2, this.height / 2);
        // 4. Renderer: 负责将所有内容绘制到 Canvas 上
        this.renderer = new Renderer(this.ctx, this.width, this.height);

        // 绑定事件监听器
        // 监听鼠标移动：更新发射器的瞄准角度
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isRunning || this.isPaused) return;
            // 获取 Canvas 在视口中的位置，用于修正鼠标坐标
            const rect = this.canvas.getBoundingClientRect();
            this.shooter.updateAngle(e.clientX - rect.left, e.clientY - rect.top);
        });

        // 监听鼠标点击：发射球
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.isRunning || this.isPaused) return;
            const proj = this.shooter.shoot(); // 尝试发射
            if (proj) {
                this.projectiles.push(proj); // 如果发射成功，添加到弹射物列表
            }
        });
    }

    /**
     * 切换暂停状态
     */
    togglePause() {
        if (!this.isRunning) return;
        this.isPaused = !this.isPaused;

        if (!this.isPaused) {
            // 恢复游戏时，重置 lastTime，防止 dt 过大导致逻辑跳跃
            this.lastTime = performance.now();
        }

        // 通知 UI 层暂停状态已改变
        if (this.callbacks.onPauseToggle) {
            this.callbacks.onPauseToggle(this.isPaused);
        }
    }

    /**
     * 开始新游戏
     */
    start() {
        this.score = 0;
        this.level = 1;
        this.resetLevel(); // 重置关卡状态
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        // 初始化 UI 显示
        this.callbacks.onScoreUpdate(this.score);
        this.callbacks.onLevelUpdate(this.level);
        
        // 启动游戏循环
        requestAnimationFrame((t) => this.loop(t));
    }

    /**
     * 重新开始当前游戏（通常在失败后调用）
     */
    restart() {
        this.start();
    }

    /**
     * 进入下一关
     */
    nextLevel() {
        this.level++;
        this.callbacks.onLevelUpdate(this.level);
        this.resetLevel(); // 根据新关卡重置状态
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        // 启动游戏循环
        requestAnimationFrame((t) => this.loop(t));
    }

    /**
     * 重置关卡相关的所有对象
     */
    resetLevel() {
        // 重新生成路径（可能会随关卡变化，这里虽然 Path 构造函数支持 level，但目前 Path 逻辑可能未完全利用）
        this.path = new Path(this.canvas.width, this.canvas.height, this.level);
        // 重新生成球链，传入 level 可能会影响球的速度或数量
        this.chain = new BallChain(this.path, this.level);
        // 重置发射器
        this.shooter = new Shooter(this.canvas.width / 2, this.canvas.height / 2);
        // 清空所有活动的弹射物和粒子效果
        this.projectiles = [];
        this.particles = [];
    }

    /**
     * 游戏主循环
     * @param {number} timestamp - 当前时间戳
     */
    loop(timestamp) {
        if (!this.isRunning) return;
        // 计算两帧之间的时间差 (delta time)，单位秒
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // 更新逻辑
        this.update(dt);
        // 渲染画面
        this.draw();

        // 请求下一帧
        requestAnimationFrame((t) => this.loop(t));
    }

    /**
     * 更新游戏逻辑
     * @param {number} dt - 时间增量 (秒)
     */
    update(dt) {
        // 如果暂停，跳过更新
        if (this.isPaused) return;

        // 更新发射器（主要处理冷却时间）
        this.shooter.update(dt);

        // 更新球链（移动、生成新球、消除检测）
        this.chain.update(dt, (matchCount) => {
            // 如果发生消除，增加分数
            this.score += matchCount * 100;
            this.callbacks.onScoreUpdate(this.score);
        });

        // 检测游戏失败：球链到达终点
        if (this.chain.hasReachedEnd()) {
            this.isRunning = false;
            this.callbacks.onGameOver(this.score);
            return;
        }

        // 检测游戏胜利：球链为空且已生成完所有球
        if (this.chain.isEmpty() && this.chain.hasFinishedSpawning()) {
            this.isRunning = false;
            this.callbacks.onVictory();
            return;
        }

        // 更新所有弹射物
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            // 根据速度更新位置
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;

            // 边界检查：如果超出屏幕范围，移除弹射物
            if (proj.x < -50 || proj.x > this.width + 50 || proj.y < -50 || proj.y > this.height + 50) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // 碰撞检测：检查弹射物是否击中球链中的球
            const collision = this.chain.checkCollision(proj);

            if (collision) {
                // 处理碰撞：将弹射物插入到球链中
                const points = this.chain.insertBall(proj, collision.index);
                this.projectiles.splice(i, 1); // 移除弹射物

                // 插入后立即检查是否形成消除
                const matches = this.chain.checkMatches(collision.index);
                if (matches > 0) {
                    // 如果有消除，给予额外分数奖励
                    this.score += matches * 100; 
                    this.callbacks.onScoreUpdate(this.score);
                }
            }
        }
    }

    /**
     * 绘制游戏画面
     */
    draw() {
        this.renderer.clear(); // 清除上一帧
        this.renderer.drawPath(this.path); // 绘制轨道
        this.renderer.drawChain(this.chain); // 绘制球链
        this.renderer.drawShooter(this.shooter); // 绘制发射器
        this.renderer.drawProjectiles(this.projectiles); // 绘制弹射物
    }
}
