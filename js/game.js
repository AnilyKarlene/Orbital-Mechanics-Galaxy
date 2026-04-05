import { CONFIG, THEME_NAME } from './config.js';
import { Paddle } from './paddle.js';
import { Ball } from './ball.js';
import { Brick } from './brick.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';
import { Items } from './items.js';
import { EffectManager } from './effectManager.js';
import { LevelManager } from './levelManager.js';
import { Collision } from './collision.js';

export class Game {
    constructor() {
        this.initializeCanvas();
        this.initializeState();
        this.initializeGameObjects();
        this.setupEventListeners();
        this.startGameLoop();
    }

    /**
     * Инициализация холста и DOM-элементов
     */
    initializeCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.globalScoreEl = document.getElementById('globalScoreDisplay');
        this.localScoreEl = document.getElementById('localScoreDisplay');
        this.levelEl = document.getElementById('levelDisplay');
        this.livesEl = document.getElementById('livesDisplay');
        this.timeEl = document.getElementById('timeDisplay');
        this.moneyEl = document.getElementById('moneyDisplay');
    }

    /**
     * Инициализация состояния игры
     */
    initializeState() {
        this.globalScore = 0;
        this.localScore = 0;
        this.level = 1;
        this.lives = 3;
        this.gameOver = false;
        this.paused = true;
        this.gameStarted = false;
        this.levelComplete = false;

        this.money = 0;
        this.levelTimeSeconds = 0;
        this.levelTimerInterval = null;

        this.silenceMode = false;
        this.silenceCounter = 0;
        this.giantBallTimer = 0;
        this.piercingBallTimer = 0;
        this.paddleEffect = null;
        this.paddleEffectTimer = 0;
        this.shieldCount = 0;

        this.lowBlockTimer = 0;
        this.lowBlockActive = false;
        this.lowBlockTriggered = false;

        // Статистика для бонусов
        this.yellowBlocksDestroyed = 0;
        this.livesLostThisLevel = false;
        this.ballsLostThisLevel = false;
        this.extraBallCount = 0;
        this.goldenBallPresent = false;
        this.blackBallPresent = false;
        this.highSpeedBalls = false;
        this.sourHomingActivated = false;
    }

    /**
     * Инициализация игровых объектов
     */
    initializeGameObjects() {
        this.balls = [];
        this.bricks = [];
        this.hearts = [];
        this.penalties = [];
        this.shields = [];
        this.particles = [];
        this.scorePopups = [];

        this.paddle = new Paddle(this);
        this.levelManager = new LevelManager(this);
        this.input = new Input(this);
        this.renderer = new Renderer(this);
        this.collision = new Collision(this);
        this.effectManager = new EffectManager(this);
        this.items = new Items(this);

        this.levelTimerValue = 5;
        this.levelTimerRequest = null;

        this.loadLevel(this.level);
        this.initBall();
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        this.input.setup();
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
        this.setupImport();
    }

    /**
     * Запуск игрового цикла
     */
    startGameLoop() {
        this.updateScore();
        this.updateDecoPositions();
        this.showLevelStartAnimation();
        this.gameLoop();
    }

    setupImport() {
        const showBtn = document.getElementById('showImportBtn');
        const importArea = document.getElementById('importArea');
        const importBtn = document.getElementById('importLevelBtn');
        const codeInput = document.getElementById('levelCodeInput');
        const pasteBtn = document.getElementById('pasteFromClipboardBtn');

        showBtn.addEventListener('click', () => {
            importArea.style.display = importArea.style.display === 'flex' ? 'none' : 'flex';
        });

        importBtn.addEventListener('click', () => {
            try {
                const json = codeInput.value.trim();
                if (!json) return;
                const blocks = JSON.parse(json);
                this.importLevel(blocks);
                importArea.style.display = 'none';
                codeInput.value = '';
            } catch (e) {
                alert('Ошибка парсинга JSON: ' + e.message);
            }
        });

        pasteBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (!text) {
                    alert('Буфер обмена пуст');
                    return;
                }
                const blocks = JSON.parse(text);
                this.importLevel(blocks);
                importArea.style.display = 'none';
            } catch (e) {
                if (e.name === 'NotAllowedError') {
                    alert('Нет разрешения на чтение буфера обмена. Вставьте вручную через кнопку "Ручной ввод".');
                } else if (e instanceof SyntaxError) {
                    alert('Содержимое буфера не является валидным JSON.');
                } else {
                    alert('Ошибка: ' + e.message);
                }
            }
        });
    }

    importLevel(blocksArray) {
        if (!Array.isArray(blocksArray)) {
            alert('Данные должны быть массивом');
            return;
        }
        const newBricks = [];
        for (let b of blocksArray) {
            if (!b.x || !b.y || !b.width || !b.height || !b.type) {
                alert('Каждый блок должен содержать x, y, width, height, type');
                return;
            }
            const shape = b.shape || 'rect';
            const brick = new Brick(b.x, b.y, b.width, b.height, b.type, b.hits || 1, b.color, shape);
            newBricks.push(brick);
        }
        this.bricks = newBricks;
        this.levelComplete = false;
        this.createScorePopup(this.canvas.width/2, 100, 'УРОВЕНЬ ЗАГРУЖЕН');
    }

    initBall() {
        const ball = new Ball(
            this.canvas.width / 2,
            this.canvas.height - 50,
            CONFIG.ball.speed * (Math.random() > 0.5 ? 1 : -1),
            -CONFIG.ball.speed,
            this
        );
        ball.active = true;
        if (this.giantBallTimer > 0) {
            ball.radius = 40;
        }
        this.balls = [ball];
    }

    resetBall() {
        this.initBall();
        this.paddle.resetPosition();
    }

    /**
     * Обновление UI счета
     */
    updateScore() {
        this.globalScoreEl.textContent = this.globalScore;
        this.localScoreEl.textContent = this.localScore;
        this.levelEl.textContent = this.level;
        this.livesEl.textContent = this.lives;
        this.moneyEl.textContent = this.money;
    }

    startLevelTimer() {
        if (this.levelTimerInterval) clearInterval(this.levelTimerInterval);
        this.levelTimeSeconds = 0;
        this.updateTimeDisplay();
        this.levelTimerInterval = setInterval(() => {
            if (!this.paused && !this.gameOver && !this.levelComplete) {
                this.levelTimeSeconds++;
                this.updateTimeDisplay();
            }
        }, 1000);
    }

    stopLevelTimer() {
        if (this.levelTimerInterval) {
            clearInterval(this.levelTimerInterval);
            this.levelTimerInterval = null;
        }
    }

    updateTimeDisplay() {
        const mins = Math.floor(this.levelTimeSeconds / 60);
        const secs = this.levelTimeSeconds % 60;
        this.timeEl.textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
    }

    handleResize() {
        this.updateDecoPositions();
        this.updateOverlayPositions();
    }

    updateOverlayPositions() {
        const rect = this.canvas.getBoundingClientRect();
        const canvasAspect = this.canvas.width / this.canvas.height;
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        let displayedWidth, displayedHeight, offsetX, offsetY;

        if (containerWidth / containerHeight > canvasAspect) {
            displayedHeight = containerHeight;
            displayedWidth = containerHeight * canvasAspect;
            offsetX = (containerWidth - displayedWidth) / 2;
            offsetY = 0;
        } else {
            displayedWidth = containerWidth;
            displayedHeight = containerWidth / canvasAspect;
            offsetX = 0;
            offsetY = (containerHeight - displayedHeight) / 2;
        }

        const overlays = document.querySelectorAll('.overlay');
        overlays.forEach(overlay => {
            overlay.style.left = offsetX + 'px';
            overlay.style.top = offsetY + 'px';
            overlay.style.width = displayedWidth + 'px';
            overlay.style.height = displayedHeight + 'px';
        });
    }

    updateDecoPositions() {
        const rect = this.canvas.getBoundingClientRect();
        const canvasAspect = this.canvas.width / this.canvas.height;
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        let displayedWidth, displayedHeight, offsetX, offsetY;

        if (containerWidth / containerHeight > canvasAspect) {
            displayedHeight = containerHeight;
            displayedWidth = containerHeight * canvasAspect;
            offsetX = (containerWidth - displayedWidth) / 2;
            offsetY = 0;
        } else {
            displayedWidth = containerWidth;
            displayedHeight = containerWidth / canvasAspect;
            offsetX = 0;
            offsetY = (containerHeight - displayedHeight) / 2;
        }

        const leftDeco = document.querySelector('.deco-left');
        const rightDeco = document.querySelector('.deco-right');
        if (leftDeco && rightDeco) {
            leftDeco.style.width = Math.max(0, offsetX) + 'px';
            leftDeco.style.left = '0';
            rightDeco.style.width = Math.max(0, offsetX) + 'px';
            rightDeco.style.right = '0';
        }
        this.updateOverlayPositions();
    }

    loadLevel(levelNum) {
        this.bricks = this.levelManager.loadLevel(levelNum);
    }

    showLevelStartAnimation() {
        const overlay = document.getElementById('levelStartOverlay');
        const themeSpan = document.getElementById('levelStartTheme');
        const levelSpan = document.getElementById('levelStartNumber');
        themeSpan.textContent = THEME_NAME;
        levelSpan.textContent = `Ур. ${this.level}`;
        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 2800);
    }

    nextLevel() {
        this.level++;
        this.resetLevelState();
        this.loadLevel(this.level);
        this.initBall();
        this.startLevelTimer();
        document.getElementById('levelCompleteOverlay').classList.add('hidden');
        this.showLevelStartAnimation();
    }

    /**
     * Сброс состояния уровня
     */
    resetLevelState() {
        this.levelComplete = false;
        this.paused = false;
        this.resetEffects();
        this.clearItems();
        this.particles = [];
        this.scorePopups = [];
        
        // Сброс статистики уровня
        this.yellowBlocksDestroyed = 0;
        this.livesLostThisLevel = false;
        this.ballsLostThisLevel = false;
        this.extraBallCount = 0;
        this.goldenBallPresent = false;
        this.blackBallPresent = false;
        this.highSpeedBalls = false;
        this.sourHomingActivated = false;
        this.localScore = 0;
        this.updateScore();
    }

    resetEffects() {
        this.silenceMode = false;
        this.silenceCounter = 0;
        this.giantBallTimer = 0;
        this.piercingBallTimer = 0;
        this.paddleEffect = null;
        this.paddleEffectTimer = 0;
        this.shieldCount = 0;
        this.lowBlockTimer = 0;
        this.lowBlockActive = false;
        this.lowBlockTriggered = false;
        this.paddle.resetSpeed();
        this.balls.forEach(b => b.clearEffects());
    }

    clearItems() {
        this.hearts = [];
        this.penalties = [];
        this.shields = [];
    }

    gameOverHandler() {
        this.gameOver = true;
        this.paused = true;
        this.stopLevelTimer();
    }

    restart() {
        this.globalScore = 0;
        this.localScore = 0;
        this.level = 1;
        this.lives = 3;
        this.money = 0;
        this.levelTimeSeconds = 0;
        this.updateTimeDisplay();
        this.gameOver = false;
        this.paused = true;
        this.gameStarted = false;
        this.levelComplete = false;
        
        this.resetEffects();
        this.clearItems();
        this.particles = [];
        this.scorePopups = [];
        
        this.loadLevel(this.level);
        this.initBall();
        this.updateScore();
        document.getElementById('levelCompleteOverlay').classList.add('hidden');
        document.getElementById('pauseOverlay').classList.remove('hidden');
        this.showLevelStartAnimation();
        this.stopLevelTimer();
        
        // Сброс статистики уровня
        this.yellowBlocksDestroyed = 0;
        this.livesLostThisLevel = false;
        this.ballsLostThisLevel = false;
        this.extraBallCount = 0;
        this.goldenBallPresent = false;
        this.blackBallPresent = false;
        this.highSpeedBalls = false;
        this.sourHomingActivated = false;
    }

    startGame() {
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.paused = false;
            document.getElementById('pauseOverlay').classList.add('hidden');
            this.startLevelTimer();
        } else if (this.paused && !this.gameOver) {
            this.paused = false;
            document.getElementById('pauseOverlay').classList.add('hidden');
        }
    }

    togglePause() {
        if (this.gameOver || !this.gameStarted) return;
        this.paused = !this.paused;
        if (this.paused) {
            document.getElementById('pauseOverlay').classList.remove('hidden');
        } else {
            document.getElementById('pauseOverlay').classList.add('hidden');
        }
    }

    addScore(points, isYellow = false) {
        const target = this.localScore + points;
        this.animateNumber(this.localScore, target, (val) => {
            this.localScore = val;
            this.localScoreEl.textContent = val;
        }, 200);
        this.localScore += points;
        if (isYellow) {
            this.yellowBlocksDestroyed++;
        }
    }

    /**
     * Уменьшает количество жизней и устанавливает флаг потери жизни
     */
    loseLife() {
        this.lives--;
        this.livesLostThisLevel = true; // Устанавливаем флаг потери жизни
        this.updateScore();
    }

    animateNumber(start, end, callback, duration = 200) {
        const startTime = performance.now();
        const change = end - start;
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + change * progress);
            callback(current);
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                callback(end);
            }
        };
        requestAnimationFrame(animate);
    }

    animateMoney(target) {
        this.animateNumber(this.money, target, (val) => {
            this.money = val;
            this.moneyEl.textContent = val;
        }, 500);
    }

    animateGlobalScore(target) {
        this.animateNumber(this.globalScore, target, (val) => {
            this.globalScore = val;
            this.globalScoreEl.textContent = val;
        }, 500);
    }

    /**
     * Проверка завершения уровня и отображение бонусов
     */
    checkLevelComplete() {
        if (this.bricks.every(b => !b.active) && !this.levelComplete && !this.gameOver) {
            this.levelComplete = true;
            this.paused = true;
            this.stopLevelTimer();
            
            this.collectLevelStatistics();
            this.showLevelCompleteOverlay();
        }
    }

    /**
     * Сбор статистики уровня для расчета бонусов
     */
    collectLevelStatistics() {
        this.extraBallCount = Math.max(0, this.balls.length - 1);
        this.goldenBallPresent = this.balls.some(b => b.goldMode);
        this.blackBallPresent = this.balls.some(b => b.blackMode);
        this.highSpeedBalls = this.balls.some(b => Math.hypot(b.speedX, b.speedY) > 8);
    }

    /**
     * Отображение экрана завершения уровня
     */
    showLevelCompleteOverlay() {
        const bonuses = this.calculateBonuses();
        const totalBonusMoney = this.calculateTotalBonus(bonuses);
        
        this.setupLevelCompleteOverlay(bonuses, totalBonusMoney);
        this.startLevelCompleteTimer();
    }

    /**
     * Расчет бонусов за уровень
     * @returns {Array} Массив бонусов
     */
    calculateBonuses() {
        const bonuses = [];
        
        bonuses.push({ name: 'Прохождение уровня', value: CONFIG.bonuses.levelComplete });
        
        if (this.levelTimeSeconds < 30) {
            bonuses.push({ name: 'Меньше 30 секунд', value: CONFIG.bonuses.under30sec });
        } else if (this.levelTimeSeconds < 60) {
            bonuses.push({ name: 'Меньше минуты', value: CONFIG.bonuses.under60sec });
        }

        if (!this.sourHomingActivated) {
            bonuses.push({ name: 'Без кислого гоминга', value: CONFIG.bonuses.noSourHoming });
        }

        if (this.yellowBlocksDestroyed > 0) {
            const yellowBonus = this.yellowBlocksDestroyed * CONFIG.bonuses.perYellowBlock;
            bonuses.push({ name: `Жёлтые блоки (${this.yellowBlocksDestroyed})`, value: yellowBonus });
        }

        if (this.extraBallCount > 0) {
            const extraBonus = this.extraBallCount * CONFIG.bonuses.extraBall;
            bonuses.push({ name: `Лишние шары (${this.extraBallCount})`, value: extraBonus });
        }

        if (this.goldenBallPresent) {
            bonuses.push({ name: 'Золотой шар', value: CONFIG.bonuses.goldenBall });
        }

        if (!this.livesLostThisLevel) {
            bonuses.push({ name: 'Без потери жизни', value: CONFIG.bonuses.noLifeLost });
        }

        if (!this.ballsLostThisLevel) {
            bonuses.push({ name: 'Без потери шаров', value: CONFIG.bonuses.noBallLost });
        }

        if (this.blackBallPresent) {
            bonuses.push({ name: 'Чёрный шар', value: CONFIG.bonuses.blackBallPresent });
        }

        if (this.highSpeedBalls) {
            bonuses.push({ name: 'Высокая скорость шаров', value: CONFIG.bonuses.highSpeed });
        }

        const localScoreContribution = Math.floor(this.localScore * 0.1);
        if (localScoreContribution > 0) {
            bonuses.push({ name: '10% от очков уровня', value: localScoreContribution });
        }

        return bonuses;
    }

    /**
     * Расчет общей суммы бонусов
     * @param {Array} bonuses - Массив бонусов
     * @returns {number} Общая сумма бонусов
     */
    calculateTotalBonus(bonuses) {
        return bonuses.reduce((sum, bonus) => sum + bonus.value, 0);
    }

    /**
     * Настройка экрана завершения уровня
     * @param {Array} bonuses - Массив бонусов
     * @param {number} totalBonusMoney - Общая сумма бонусов
     */
    setupLevelCompleteOverlay(bonuses, totalBonusMoney) {
        const overlay = document.getElementById('levelCompleteOverlay');
        const textEl = document.getElementById('levelCompleteText');
        const bonusContainer = document.getElementById('bonusContainer');
        
        bonusContainer.innerHTML = '';
        textEl.textContent = '';
        
        // Анимация печатания текста "УРОВЕНЬ ПРОЙДЕН"
        const fullText = 'УРОВЕНЬ ПРОЙДЕН!';
        this.animateTextTyping(fullText, textEl, () => {
            this.animateBonuses(bonuses, bonusContainer, totalBonusMoney);
        });
        
        overlay.classList.remove('hidden');
    }

    /**
     * Анимация появления текста
     * @param {string} text - Текст для анимации
     * @param {HTMLElement} element - Элемент для отображения текста
     * @param {Function} onComplete - Функция, вызываемая после завершения анимации
     */
    animateTextTyping(text, element, onComplete) {
        let i = 0;
        const typingInterval = setInterval(() => {
            element.textContent += text[i];
            i++;
            if (i >= text.length) {
                clearInterval(typingInterval);
                onComplete();
            }
        }, 100);
    }

    /**
     * Анимация появления бонусов
     * @param {Array} bonuses - Массив бонусов
     * @param {HTMLElement} container - Контейнер для бонусов
     * @param {number} totalBonusMoney - Общая сумма бонусов
     */
    animateBonuses(bonuses, container, totalBonusMoney) {
        let bonusIndex = 0;
        const showNextBonus = () => {
            if (bonusIndex < bonuses.length) {
                const b = bonuses[bonusIndex];
                const div = document.createElement('div');
                div.className = 'bonus-item';
                div.innerHTML = `<span>${b.name}</span><span>+${b.value}$</span>`;
                container.appendChild(div);
                bonusIndex++;
                setTimeout(showNextBonus, 150);
            } else {
                this.showTotalBonus(totalBonusMoney, container);
            }
        };
        showNextBonus();
    }

    /**
     * Отображение итогового бонуса и запуск анимации
     * @param {number} totalBonusMoney - Общая сумма бонусов
     * @param {HTMLElement} container - Контейнер для бонусов
     */
    showTotalBonus(totalBonusMoney, container) {
        const totalDiv = document.createElement('div');
        totalDiv.className = 'bonus-total';
        totalDiv.innerHTML = `ИТОГО: +${totalBonusMoney}$`;
        container.appendChild(totalDiv);

        const targetMoney = this.money + totalBonusMoney;
        const targetGlobalScore = this.globalScore + this.localScore;
        this.animateMoney(targetMoney);
        this.animateGlobalScore(targetGlobalScore);
    }

    /**
     * Запуск таймера для перехода к следующему уровню
     */
    startLevelCompleteTimer() {
        this.levelTimerValue = 5;
        document.getElementById('levelTimer').textContent = this.levelTimerValue;

        const startTime = performance.now();
        const updateTimer = (now) => {
            const elapsed = (now - startTime) / 1000;
            const remaining = Math.max(0, 5 - elapsed);
            document.getElementById('levelTimer').textContent = Math.ceil(remaining);
            if (remaining > 0) {
                this.levelTimerRequest = requestAnimationFrame(updateTimer);
            } else {
                this.nextLevel();
            }
        };
        this.levelTimerRequest = requestAnimationFrame(updateTimer);
    }

    gameLoop() {
        if (!this.paused && !this.gameOver && !this.levelComplete) {
            this.update();
        }
        this.renderer.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        this.paddle.move();
        this.balls.forEach(b => b.update());
        this.collision.handleCollisions();

        this.balls = this.balls.filter(b => b.active);

        if (this.balls.length === 0 && !this.levelComplete && !this.gameOver) {
            this.ballsLostThisLevel = true;
            this.loseLife(); // Используем метод loseLife вместо прямого уменьшения
            if (this.lives <= 0) {
                this.gameOverHandler();
            } else {
                this.initBall();
            }
        }

        this.updateBricks();
        this.renderer.updateDecor();
        this.items.update();
        this.effectManager.updateTimers();

        this.updateParticles();
        this.updateScorePopups();
        this.checkLevelComplete();
    }

    /**
     * Обновление состояния блоков
     */
    updateBricks() {
        for (let i = 0; i < this.bricks.length; i++) {
            const brick = this.bricks[i];
            if (!brick.active) continue;
            if (brick.movable && (brick.vx !== 0 || brick.vy !== 0)) {
                this.updateMovableBrick(i, brick);
            }
        }
    }

    /**
     * Обновление подвижного блока
     * @param {number} i - Индекс блока
     * @param {Brick} brick - Блок для обновления
     */
    updateMovableBrick(i, brick) {
        let oldX = brick.x;
        let oldY = brick.y;
        brick.x += brick.vx;
        brick.y += brick.vy;

        this.handleBrickBoundaries(brick);
        
        this.handleBrickCollisions(i, brick, oldX, oldY);
        
        this.updateBrickVelocity(brick);
    }

    /**
     * Обработка границ блока
     * @param {Brick} brick - Блок для обработки
     */
    handleBrickBoundaries(brick) {
        if (brick.x < 0) { 
            brick.x = 0; 
            brick.vx = -brick.vx * 0.5; 
        }
        if (brick.x + brick.width > this.canvas.width) { 
            brick.x = this.canvas.width - brick.width; 
            brick.vx = -brick.vx * 0.5; 
        }
        if (brick.y < 0) { 
            brick.y = 0; 
            brick.vy = -brick.vy * 0.5; 
        }
        if (brick.y + brick.height > this.canvas.height) {
            brick.active = false;
            this.createScorePopup(brick.x + brick.width/2, brick.y, '💡 упала');
            return;
        }
    }

    /**
     * Обработка коллизий блока с другими блоками
     * @param {number} i - Индекс блока
     * @param {Brick} brick - Блок для обработки
     * @param {number} oldX - Старая позиция X
     * @param {number} oldY - Старая позиция Y
     */
    handleBrickCollisions(i, brick, oldX, oldY) {
        for (let j = i + 1; j < this.bricks.length; j++) {
            const other = this.bricks[j];
            if (!other.active || !other.movable) continue;
            
            if (brick.x < other.x + other.width && brick.x + brick.width > other.x &&
                brick.y < other.y + other.height && brick.y + brick.height > other.y) {
                
                this.handleBrickBrickCollision(brick, other, oldX, oldY);
                break;
            }
        }
    }

    /**
     * Обработка коллизии двух блоков
     * @param {Brick} brick - Первый блок
     * @param {Brick} other - Второй блок
     * @param {number} oldX - Старая позиция X первого блока
     * @param {number} oldY - Старая позиция Y первого блока
     */
    handleBrickBrickCollision(brick, other, oldX, oldY) {
        let vx1 = brick.vx, vy1 = brick.vy;
        let vx2 = other.vx, vy2 = other.vy;
        brick.vx = vx2 * 0.9;
        brick.vy = vy2 * 0.9;
        other.vx = vx1 * 0.9;
        other.vy = vy1 * 0.9;
        
        let overlapX = (brick.x + brick.width/2) - (other.x + other.width/2);
        let overlapY = (brick.y + brick.height/2) - (other.y + other.height/2);
        
        if (Math.abs(overlapX) > Math.abs(overlapY)) {
            brick.x = oldX;
            brick.y = oldY;
        } else {
            brick.x = oldX;
            brick.y = oldY;
        }
    }

    /**
     * Обновление скорости блока
     * @param {Brick} brick - Блок для обработки
     */
    updateBrickVelocity(brick) {
        brick.vx *= 0.98;
        brick.vy *= 0.98;
        if (Math.abs(brick.vx) < 0.1) brick.vx = 0;
        if (Math.abs(brick.vy) < 0.1) brick.vy = 0;
    }

    /**
     * Обновление частиц
     */
    updateParticles() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life -= 0.015;
            p.size *= 0.98;
            return p.life > 0 && p.y < this.canvas.height + 50;
        });
    }

    /**
     * Обновление всплывающих подсказок со счетом
     */
    updateScorePopups() {
        this.scorePopups = this.scorePopups.filter(s => {
            s.y -= 1.5;
            s.life -= 0.015;
            return s.life > 0;
        });
    }

    createParticles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 4 + 2,
                color: color,
                life: 0.7 + Math.random() * 0.3
            });
        }
    }

    createScorePopup(x, y, value) {
        this.scorePopups.push({ x, y, value, life: 1.0 });
    }

    createHeart(x, y) {
        this.hearts.push({ x, y, width: 20, height: 20, speed: 2, collected: false });
    }

    createPenalty(x, y) {
        this.penalties.push({ x, y, width: 20, height: 20, speed: 2, collected: false });
    }

    createShield(x, y) {
        this.shields.push({ x, y, width: 20, height: 20, speed: 2, collected: false });
    }
}