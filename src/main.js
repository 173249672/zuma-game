import './style.css'
import { Game } from './game/Game.js'

// ==========================================
// 1. 获取 DOM 元素 (Get DOM Elements)
// ==========================================
// 获取游戏画布元素，这是游戏渲染的主要区域
const canvas = document.getElementById('gameCanvas');

// 获取各个 UI 按钮元素
const startBtn = document.getElementById('start-btn');         // 开始游戏按钮
const restartBtn = document.getElementById('restart-btn');     // 重新开始按钮
const nextLevelBtn = document.getElementById('next-level-btn');// 下一关按钮

// 获取各个 UI 屏幕/层元素，用于控制游戏的显示状态
const startScreen = document.getElementById('start-screen');       // 开始界面
const gameOverScreen = document.getElementById('game-over-screen');// 游戏结束界面
const victoryScreen = document.getElementById('victory-screen');   // 胜利界面
const countdownScreen = document.getElementById('countdown-screen');// 倒计时界面
const countdownNumber = document.getElementById('countdown-number');// 倒计时数字显示
const pauseScreen = document.getElementById('pause-screen');       // 暂停界面

// ==========================================
// 2. 画布尺寸管理 (Canvas Resizing)
// ==========================================
/**
 * 调整画布大小以适应全屏
 * 每次窗口大小改变时都会调用此函数，确保游戏画面充满整个屏幕
 */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// 监听窗口大小改变事件，自动调整画布
window.addEventListener('resize', resizeCanvas);
// 初始化时先调用一次，设置初始大小
resizeCanvas();

// ==========================================
// 3. 游戏实例初始化 (Game Initialization)
// ==========================================
// 创建游戏实例，传入画布和一系列回调函数
// 这些回调函数允许 Game 类在特定事件发生时通知 UI 层进行更新
const game = new Game(canvas, {
  // 当游戏结束时触发（失败）
  onGameOver: (score) => {
    // 更新最终得分显示
    document.getElementById('final-score-display').textContent = `Score: ${score}`;
    // 显示游戏结束界面
    gameOverScreen.classList.remove('hidden');
  },
  // 当游戏胜利时触发（通关）
  onVictory: () => {
    // 显示胜利界面
    victoryScreen.classList.remove('hidden');
  },
  // 当得分更新时触发
  onScoreUpdate: (score) => {
    // 更新 HUD 上的分数显示
    document.getElementById('score').textContent = score;
  },
  // 当关卡更新时触发
  onLevelUpdate: (level) => {
    // 更新 HUD 上的关卡显示
    document.getElementById('level').textContent = level;
  },
  // 当暂停状态切换时触发
  onPauseToggle: (isPaused) => {
    if (isPaused) {
      // 如果暂停，显示暂停界面
      pauseScreen.classList.remove('hidden');
    } else {
      // 如果恢复，隐藏暂停界面
      pauseScreen.classList.add('hidden');
    }
  }
});

// ==========================================
// 4. 全局输入控制 (Input Handling)
// ==========================================
// 监听键盘按键事件，用于处理暂停功能
window.addEventListener('keydown', (e) => {
  // 如果按下空格键
  if (e.code === 'Space') {
    e.preventDefault(); // 防止空格键导致页面滚动
    game.togglePause(); // 切换游戏的暂停/继续状态
  }
});

// ==========================================
// 5. 倒计时逻辑 (Countdown Logic)
// ==========================================
/**
 * 开始倒计时，倒计时结束后执行回调函数
 * @param {Function} callback - 倒计时结束后要执行的函数（通常是开始游戏）
 */
function startCountdown(callback) {
  // 显示倒计时界面
  countdownScreen.classList.remove('hidden');
  let count = 3; // 倒计时起始数字

  // 定义更新倒计时的内部函数
  const updateCountdown = () => {
    if (count > 0) {
      // 更新显示的数字
      countdownNumber.textContent = count;
      
      // 通过移除并重新添加动画属性来重置动画，确保每次数字变化都有动画效果
      countdownNumber.style.animation = 'none';
      setTimeout(() => {
        countdownNumber.style.animation = 'countdownPulse 1s ease-in-out';
      }, 10); // 微小的延迟确保浏览器识别样式变化
      
      count--;
      // 1秒后再次调用自身
      setTimeout(updateCountdown, 1000);
    } else {
      // 倒计时结束
      countdownScreen.classList.add('hidden'); // 隐藏倒计时界面
      callback(); // 执行开始游戏的回调
    }
  };

  // 启动倒计时
  updateCountdown();
}

// ==========================================
// 6. 按钮事件绑定 (Button Event Listeners)
// ==========================================
// 开始按钮点击事件
startBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden'); // 隐藏开始界面
  startCountdown(() => game.start());  // 开始倒计时，结束后启动游戏
});

// 重新开始按钮点击事件
restartBtn.addEventListener('click', () => {
  gameOverScreen.classList.add('hidden'); // 隐藏游戏结束界面
  startCountdown(() => game.restart());   // 开始倒计时，结束后重启游戏
});

// 下一关按钮点击事件
nextLevelBtn.addEventListener('click', () => {
  victoryScreen.classList.add('hidden');  // 隐藏胜利界面
  startCountdown(() => game.nextLevel()); // 开始倒计时，结束后进入下一关
});

