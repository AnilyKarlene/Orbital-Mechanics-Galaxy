import { Ball } from './ball.js';
import { CONFIG } from './config.js';

export class Collision {
    constructor(game) {
        this.game = game;
        // Создаем карту очков для разных типов блоков
        this.scoreMap = {
            'bonus': 25,
            'penalty': 30,
            'score': 50,
            'multiHit': 20,
            'violet': 10,
            'black': 40,
            'pink': 20,
            'silver': 30,
            'silverHard': 50,
            'orange': 35,
            'olo': 30,
            'chrono': 25
        };
    }

    /**
     * Основной метод обработки всех коллизий в игре
     */
    handleCollisions() {
        this.handlePaddleCollisions();
        this.handleBrickCollisions();
    }

    /**
     * Обрабатывает коллизии мяча с платформой
     */
    handlePaddleCollisions() {
        for (let bi = 0; bi < this.game.balls.length; bi++) {
            const ball = this.game.balls[bi];
            this.handleShieldCollision(ball);
            this.handlePaddleImpact(ball);
        }
    }

    /**
     * Обрабатывает столкновение с щитом
     * @param {Ball} ball - Мяч для обработки
     */
    handleShieldCollision(ball) {
        if (this.game.shieldCount > 0 && !ball.transparentMode && !ball.temporalMode && !ball.oloMode) {
            if (ball.y + ball.radius > this.game.paddle.y + this.game.paddle.height &&
                ball.y - ball.radius < this.game.paddle.y + this.game.paddle.height + 6 &&
                ball.x + ball.radius > 0 && ball.x - ball.radius < this.game.canvas.width) {
                
                ball.speedY = -Math.abs(ball.speedY);
                ball.y = this.game.paddle.y + this.game.paddle.height - ball.radius;
                this.game.shieldCount--;
                this.game.createScorePopup(
                    ball.x, 
                    ball.y - 20, 
                    `ЩИТ ${this.game.shieldCount + 1}→${this.game.shieldCount}`
                );
            }
        }
    }

    /**
     * Обрабатывает столкновение мяча с платформой
     * @param {Ball} ball - Мяч для обработки
     */
    handlePaddleImpact(ball) {
        const pad = this.game.paddle;
        const effectiveWidth = this.getEffectivePaddleWidth();
        
        if (ball.y + ball.radius > pad.y && 
            ball.y - ball.radius < pad.y + pad.height &&
            ball.x + ball.radius > pad.x && 
            ball.x - ball.radius < pad.x + effectiveWidth) {
            
            // Обрабатываем специальные эффекты шара
            this.processPaddleEffect(ball, pad, effectiveWidth);
            
            // Для пламенного шара не применяем стандартную обработку столкновения
            if (!ball.flameMode && !ball.temporalMode) {
                this.handleBallPaddleCollision(ball, pad);
            }
        }
    }

    /**
     * Возвращает ширину платформы с учетом активных эффектов
     * @returns {number} Эффективная ширина платформы
     */
    getEffectivePaddleWidth() {
        let effectiveWidth = this.game.paddle.width;
        if (this.game.paddleEffect === 'flame' && this.game.paddleEffectTimer > 0) {
            effectiveWidth = 150;
        } else if (this.game.paddleEffect === 'plasma' && this.game.paddleEffectTimer > 0) {
            effectiveWidth = 70;
        }
        return effectiveWidth;
    }

    /**
     * Обрабатывает эффекты платформы при столкновении
     * @param {Ball} ball - Мяч для обработки
     * @param {Object} pad - Платформа
     * @param {number} effectiveWidth - Эффективная ширина платформы
     */
    processPaddleEffect(ball, pad, effectiveWidth) {
        if (ball.flameMode) {
            ball.speedY = -Math.abs(ball.speedY);
            ball.y = pad.y - ball.radius;
            if (!this.game.silenceMode) {
                this.game.paddleEffect = 'flame';
                this.game.paddleEffectTimer = CONFIG.effects.paddleFlameDuration;
                this.game.createScorePopup(
                    this.game.canvas.width / 2, 
                    this.game.canvas.height / 2 - 30, 
                    'ПЛАМЕННАЯ ПЛАТФОРМА'
                );
            }
        }
    }

    /**
     * Обрабатывает физику столкновения мяча с платформой
     * @param {Ball} ball - Мяч для обработки
     * @param {Object} pad - Платформа
     */
    handleBallPaddleCollision(ball, pad) {
        // Вычисляем точку удара и угол отскока
        const hitPoint = (ball.x - (pad.x + this.game.paddle.width / 2)) / (this.game.paddle.width / 2);
        const angle = hitPoint * Math.PI / 3;
        const speed = Math.hypot(ball.speedX, ball.speedY);
        
        ball.speedX = Math.sin(angle) * speed;
        ball.speedY = -Math.abs(Math.cos(angle) * speed);
        ball.y = pad.y - ball.radius;
        
        // Увеличиваем скорость при обычном режиме
        this.increaseBallSpeed(ball);
        
        // Создаем частицы при столкновении
        this.game.createParticles(ball.x, ball.y, ball.color, 6);
        
        // Обрабатываем эффекты мяча
        this.handlePaddleEffects(ball);
    }

    /**
     * Увеличивает скорость мяча при обычном режиме
     * @param {Ball} ball - Мяч для обработки
     */
    increaseBallSpeed(ball) {
        const isNormal = this.isNormalBallMode(ball);
        if (isNormal || this.game.giantBallTimer > 0) {
            const currentSpeed = Math.hypot(ball.speedX, ball.speedY);
            if (currentSpeed < ball.maxSpeed) {
                ball.speedX *= 1.01;
                ball.speedY *= 1.01;
                const newSpeed = Math.hypot(ball.speedX, ball.speedY);
                if (newSpeed > ball.maxSpeed) {
                    const ratio = ball.maxSpeed / newSpeed;
                    ball.speedX *= ratio;
                    ball.speedY *= ratio;
                }
            }
        }
    }

    /**
     * Проверяет, находится ли мяч в обычном режиме (без активных эффектов)
     * @param {Ball} ball - Мяч для проверки
     * @returns {boolean} true, если мяч в обычном режиме
     */
    isNormalBallMode(ball) {
        return !ball.sourMode && 
               !ball.lightMode && 
               ball.piercingTimer === 0 && 
               !ball.blackMode && 
               !ball.soapyMode && 
               !ball.silverMode && 
               !ball.flameMode && 
               !ball.plasmaMode && 
               !ball.goldMode && 
               !ball.transparentMode && 
               !ball.microMode && 
               !ball.temporalMode && 
               !ball.oloMode;
    }

    /**
     * Обрабатывает эффекты платформы, связанные с эффектами мяча
     * @param {Ball} ball - Мяч для обработки
     */
    handlePaddleEffects(ball) {
        if (ball.plasmaMode && !this.game.silenceMode) {
            this.game.paddleEffect = 'plasma';
            this.game.paddleEffectTimer = CONFIG.effects.paddlePlasmaDuration;
            this.game.paddle.speed = 4;
            this.game.createScorePopup(
                this.game.canvas.width / 2, 
                this.game.canvas.height / 2 - 30, 
                'ПЛАЗМЕННАЯ ПЛАТФОРМА'
            );
        }
        
        if (ball.goldMode) {
            this.game.addScore(5, false);
            this.game.createScorePopup(ball.x, ball.y - 20, 5);
        }
    }

    /**
     * Обрабатывает все коллизии мячей с блоками
     */
    handleBrickCollisions() {
        for (let bi = 0; bi < this.game.balls.length; bi++) {
            const ball = this.game.balls[bi];
            this.processBallBrickCollisions(ball, bi);
        }
    }

    /**
     * Обрабатывает коллизии конкретного мяча с блоками
     * @param {Ball} ball - Мяч для обработки
     * @param {number} ballIndex - Индекс мяча в массиве
     */
    processBallBrickCollisions(ball, ballIndex) {
        for (let i = 0; i < this.game.bricks.length; i++) {
            const brick = this.game.bricks[i];
            if (!brick.active) continue;
            
            const collisionResult = brick.collideBall(ball);
            if (!collisionResult.collision) continue;
            
            this.handleBrickCollision(ball, brick, collisionResult, ballIndex, i);
        }
    }

    /**
     * Основной обработчик коллизии мяча с блоком
     * @param {Ball} ball - Мяч для обработки
     * @param {Brick} brick - Блок для обработки
     * @param {Object} collisionResult - Результат коллизии
     * @param {number} ballIndex - Индекс мяча
     * @param {number} brickIndex - Индекс блока
     */
    handleBrickCollision(ball, brick, collisionResult, ballIndex, brickIndex) {
        // Сначала обрабатываем специальные режимы мяча
        if (this.handleSpecialBallModes(ball, brick, collisionResult, ballIndex, brickIndex)) {
            return;
        }
        
        // Обработка режима прозрачности
        if (ball.transparentMode) {
            this.handleTransparentMode(brick);
            return;
        }
        
        // Обработка режима временного шара
        if (ball.temporalMode) {
            this.handleTemporalMode(ball, brick, collisionResult);
            return;
        }
        
        // Обработка режима черного шара
        if (ball.blackMode) {
            this.handleBlackMode(ball, ballIndex);
            return;
        }
        
        // Обработка режима лампы
        if (brick.type === 'lamp') {
            this.handleLampBrick(ball, brick, collisionResult);
            return;
        }
        
        // Обработка режима мыльного шара
        if (ball.soapyMode) {
            this.handleSoapyMode(ball, brick, collisionResult);
            return;
        }
        
        // Обработка режима пламенного шара
        if (ball.flameMode) {
            this.handleFlameMode(brick);
            return;
        }
        
        // Обработка режима плазменного шара
        if (ball.plasmaMode) {
            this.handlePlasmaMode(ball, brick, collisionResult);
            return;
        }
        
        // Обработка режима золотого шара
        if (ball.goldMode) {
            this.handleGoldMode(ball, brick, collisionResult);
            return;
        }
        
        // Обработка режима микро-шара
        if (ball.microMode) {
            this.handleMicroMode(ball, brick, collisionResult);
            return;
        }
        
        // Обработка режима ОЛО-шара
        if (ball.oloMode) {
            this.handleOloMode(ball, brick, collisionResult);
            return;
        }
        
        // Обработка пробивного режима
        if (ball.piercingTimer > 0 && brick.type !== 'violet') {
            this.handlePiercingMode(ball, brick);
            return;
        }
        
        // Обработка обычной коллизии
        this.handleNormalCollision(ball, brick, collisionResult);
    }

    /**
     * Обрабатывает специальные режимы мяча (сур, свет, и т.д.)
     * @param {Ball} ball - Мяч для обработки
     * @param {Brick} brick - Блок для обработки
     * @param {Object} collisionResult - Результат коллизии
     * @param {number} ballIndex - Индекс мяча
     * @param {number} brickIndex - Индекс блока
     * @returns {boolean} true, если коллизия была обработана
     */
    handleSpecialBallModes(ball, brick, collisionResult, ballIndex, brickIndex) {
        // Здесь можно добавить обработку других специальных режимов
        return false;
    }

    /**
     * Обрабатывает режим прозрачного шара
     * @param {Brick} brick - Блок для обработки
     */
    handleTransparentMode(brick) {
        if (brick.type === 'multiHit' || brick.type === 'silverHard' || brick.type === 'chrono') {
            if (brick.hits > 1) {
                brick.hits--;
                this.game.createScorePopup(
                    brick.x + brick.width / 2, 
                    brick.y - 20, 
                    `-1 (${brick.hits})`
                );
            }
        }
    }

    /**
     * Обрабатывает режим временного шара
     * @param {Ball} ball - Мяч для обработки
     * @param {Brick} brick - Блок для обработки
     * @param {Object} collisionResult - Результат коллизии
     */
    handleTemporalMode(ball, brick, collisionResult) {
        this.adjustBallPosition(ball, collisionResult);
        this.reflectBallVelocity(ball, collisionResult);
        this.game.createParticles(ball.x, ball.y, ball.color, 6);
        
        if (brick.hit()) {
            this.handleBrickDestruction(ball, brick);
        } else {
            if (brick.type === 'chrono') {
                this.teleportChronoBlock(brick);
            }
        }
    }

    /**
     * Обрабатывает режим черного шара
     * @param {Ball} ball - Мяч для обработки
     * @param {number} ballIndex - Индекс мяча
     */
    handleBlackMode(ball, ballIndex) {
        this.createExplosion(ball.x, ball.y, ball);
        this.game.balls.splice(ballIndex, 1);
    }

    /**
     * Обрабатывает блок лампы
     * @param {Ball} ball - Мяч для обработки
     * @param {Brick} brick - Блок для обработки
     * @param {Object} collisionResult - Результат коллизии
     */
    handleLampBrick(ball, brick, collisionResult) {
        brick.vx = ball.speedX * 0.8;
        brick.vy = ball.speedY * 0.8;
        this.adjustBallPosition(ball, collisionResult);
        this.reflectBallVelocity(ball, collisionResult);
        this.game.createParticles(ball.x, ball.y, ball.color, 6);
    }

    /**
     * Обрабатывает режим мыльного шара
     * @param {Ball} ball - Мяч для обработки
     * @param {Brick} brick - Блок для обработки
     * @param {Object} collisionResult - Результат коллизии
     */
    handleSoapyMode(ball, brick, collisionResult) {
        if (brick.type === 'violet' || brick.type === 'pink') {
            this.destroyBrick(brick, 10);
        } else {
            this.handlePinkConversion(brick);
        }
        
        this.adjustBallPosition(ball, collisionResult);
        this.reflectBallVelocity(ball, collisionResult);
        this.game.createParticles(ball.x, ball.y, ball.color, 6);
    }

    /**
     * Обрабатывает конвертацию блока в розовый
     * @param {Brick} brick - Блок для обработки
     */
    handlePinkConversion(brick) {
        if (Math.random() < 0.4) {
            brick.type = 'pink';
            brick.color = '#FF69B4';
            brick.hits = 1;
            this.game.createScorePopup(brick.x + brick.width / 2, brick.y - 10, '🌸');
        }
    }

    /**
     * Обрабатывает режим пламенного шара
     * @param {Brick} brick - Блок для обработки
     */
    handleFlameMode(brick) {
        this.destroyBrick(brick, 20);
    }

    /**
     * Обрабатывает режим плазменного шара
     * @param {Ball} ball - Мяч для обработки
     * @param {Brick} brick - Блок для обработки
     * @param {Object} collisionResult - Результат коллизии
     */
    handlePlasmaMode(ball, brick, collisionResult) {
        if (brick.type !== 'black' && brick.type !== 'violet') {
            this.tryPlasmaRepaint(brick);
        }
        
        this.adjustBallPosition(ball, collisionResult);
        this.reflectBallVelocity(ball, collisionResult);
        this.game.createParticles(ball.x, ball.y, ball.color, 6);
    }

    /**
     * Обрабатывает режим золотого шара
     * @param {Ball} ball - Мяч для обработки
     * @param {Brick} brick - Блок для обработки
     * @param {Object} collisionResult - Результат коллизии
     */
    handleGoldMode(ball, brick, collisionResult) {
        this.adjustBallPosition(ball, collisionResult);
        this.reflectBallVelocity(ball, collisionResult);
        this.game.createParticles(ball.x, ball.y, ball.color, 6);
        
        if (brick.hit()) {
            const baseScore = this.getBaseScore(brick.type);
            const points = baseScore + 20;
            
            this.game.addScore(points, false);
            this.game.createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 12);
            this.game.createScorePopup(brick.x + brick.width / 2, brick.y + brick.height / 2, points);
            
            this.applyBrickEffect(ball, brick);
        } else {
            if (brick.type === 'chrono') {
                this.teleportChronoBlock(brick);
            }
        }
    }

    /**
     * Обрабатывает режим микро-шара
     * @param {Ball} ball - Мяч для обработки
     * @param {Brick} brick - Блок для обработки
     * @param {Object} collisionResult - Результат коллизии
     */
    handleMicroMode(ball, brick, collisionResult) {
        this.handleNormalCollision(ball, brick, collisionResult);
    }

    /**
     * Обрабатывает режим ОЛО-шара
     * @param {Ball} ball - Мяч для обработки
     * @param {Brick} brick - Блок для обработки
     * @param {Object} collisionResult - Результат коллизии
     */
    handleOloMode(ball, brick, collisionResult) {
        this.adjustBallPosition(ball, collisionResult);
        this.reflectBallVelocity(ball, collisionResult);
        this.game.createParticles(ball.x, ball.y, ball.color, 6);
        
        if (brick.hit()) {
            this.game.addScore(30, false);
            this.game.createParticles(
                brick.x + brick.width / 2, 
                brick.y + brick.height / 2, 
                brick.color, 
                12
            );
            this.game.createScorePopup(
                brick.x + brick.width / 2, 
                brick.y + brick.height / 2, 
                30
            );
        } else {
            if (brick.type === 'chrono') {
                this.teleportChronoBlock(brick);
            }
        }
    }

    /**
     * Обрабатывает пробивной режим
     * @param {Ball} ball - Мяч для обработки
     * @param {Brick} brick - Блок для обработки
     */
    handlePiercingMode(ball, brick) {
        if (brick.type === 'silverHard') {
            brick.active = false;
        } else {
            if (brick.hit()) {
                brick.active = false;
            }
        }
        
        if (!brick.active) {
            this.handleBrickDestruction(ball, brick);
        } else {
            if (brick.type === 'chrono') {
                this.teleportChronoBlock(brick);
            }
        }
    }

    /**
     * Обрабатывает обычную коллизию без активных эффектов
     * @param {Ball} ball - Мяч для обработки
     * @param {Brick} brick - Блок для обработки
     * @param {Object} collisionResult - Результат коллизии
     */
    handleNormalCollision(ball, brick, collisionResult) {
        this.adjustBallPosition(ball, collisionResult);
        this.reflectBallVelocity(ball, collisionResult);
        
        // Увеличиваем скорость при обычном режиме
        this.increaseBallSpeed(ball);
        
        // Создаем частицы при столкновении
        this.game.createParticles(ball.x, ball.y, ball.color, 6);
        
        if (brick.hit()) {
            this.handleBrickDestruction(ball, brick);
        } else {
            if (brick.type === 'chrono') {
                this.teleportChronoBlock(brick);
            }
        }
    }

    /**
     * Уничтожает блок и обрабатывает его эффекты
     * @param {Ball} ball - Мяч для обработки
     * @param {Brick} brick - Блок для обработки
     */
    handleBrickDestruction(ball, brick) {
        const points = this.getBaseScore(brick.type);
        this.game.addScore(points, brick.type === 'score');
        
        if (brick.type !== 'score') {
            this.game.updateScore();
        }
        
        this.game.createParticles(
            brick.x + brick.width / 2, 
            brick.y + brick.height / 2, 
            brick.color, 
            12
        );
        this.game.createScorePopup(
            brick.x + brick.width / 2, 
            brick.y + brick.height / 2, 
            points
        );
        
        this.applyBrickEffect(ball, brick);
    }

    /**
     * Применяет эффект блока при его уничтожении
     * @param {Ball} ball - Мяч для обработки
     * @param {Brick} brick - Блок для обработки
     */
    applyBrickEffect(ball, brick) {
        switch (brick.type) {
            case 'bonus': this.applyBonusEffect(brick); break;
            case 'penalty': this.applyPenaltyEffect(ball, brick); break;
            case 'black': this.applyBlackEffect(ball, brick); break;
            case 'pink': this.applyPinkEffect(ball, brick); break;
            case 'silver':
            case 'silverHard': this.applySilverEffect(ball, brick); break;
            case 'orange': this.applyOrangeEffect(ball, brick); break;
            case 'olo': this.applyOloEffect(ball, brick); break;
            case 'score': this.applyScoreEffect(ball, brick); break;
        }
    }

    /**
     * Возвращает базовый счет за блок по его типу
     * @param {string} type - Тип блока
     * @returns {number} Базовый счет
     */
    getBaseScore(type) {
        return this.scoreMap[type] || 10;
    }

    /**
     * Уничтожает блок и создает визуальные эффекты
     * @param {Brick} brick - Блок для уничтожения
     * @param {number} points - Количество очков за уничтожение
     */
    destroyBrick(brick, points) {
        brick.active = false;
        this.game.addScore(points, false);
        this.game.createParticles(
            brick.x + brick.width / 2, 
            brick.y + brick.height / 2, 
            brick.color, 
            12
        );
        this.game.createScorePopup(
            brick.x + brick.width / 2, 
            brick.y + brick.height / 2, 
            points
        );
    }

    /**
     * Корректирует позицию мяча после коллизии
     * @param {Ball} ball - Мяч для обработки
     * @param {Object} collisionResult - Результат коллизии
     */
    adjustBallPosition(ball, collisionResult) {
        ball.x += collisionResult.nx * collisionResult.depth;
        ball.y += collisionResult.ny * collisionResult.depth;
    }

    /**
     * Отражает вектор скорости мяча при коллизии
     * @param {Ball} ball - Мяч для обработки
     * @param {Object} collisionResult - Результат коллизии
     */
    reflectBallVelocity(ball, collisionResult) {
        const dot = ball.speedX * collisionResult.nx + ball.speedY * collisionResult.ny;
        if (dot < 0) {
            ball.speedX -= 2 * dot * collisionResult.nx;
            ball.speedY -= 2 * dot * collisionResult.ny;
        }
    }

    // Остальные методы остаются без изменений (applyBonusEffect, applyPenaltyEffect и т.д.)
    // Они уже имеют приемлемую структуру и не требуют рефакторинга

    applyBonusEffect(brick) {
        const x = brick.x + brick.width/2 - 10;
        const y = brick.y;
        const rand = Math.random();
        if (rand < 0.3) {
            this.game.createHeart(x, y);
        } else if (rand < 0.3 + CONFIG.effects.giantChance) {
            this.game.giantBallTimer = CONFIG.effects.giantBallDuration;
            this.game.balls.forEach(b => b.radius = 40);
            this.game.createScorePopup(this.game.canvas.width/2, this.game.canvas.height/2 - 60, 'ГИГАНТСКИЙ ШАР');
        } else if (rand < 0.7) {
            this.game.piercingBallTimer = CONFIG.effects.piercingDuration;
            this.game.balls.forEach(b => {
                b.activateBallEffect('piercing');
            });
            this.game.createScorePopup(this.game.canvas.width/2, this.game.canvas.height/2 - 60, 'ПРОБИВНОЙ ШАР');
        } else {
            this.game.createShield(x, y);
            this.game.createScorePopup(x, y - 30, 'ЩИТ');
        }
    }

    applyPenaltyEffect(ball, brick) {
        const x = brick.x + brick.width/2 - 10;
        const y = brick.y;
        const rand = Math.random();
        if (rand < 0.1) {
            ball.activateBallEffect('micro');
            this.game.createScorePopup(ball.x, ball.y - 30, 'МИКРО-ШАР');
        } else {
            const eff = ['life', 'silence', 'split', 'sour', 'light'][Math.floor(Math.random() * 5)];
            if (eff === 'life') this.game.createPenalty(x, y);
            else if (eff === 'silence') {
                this.game.silenceMode = true;
                this.game.silenceCounter = CONFIG.effects.silenceDuration;
                this.game.createScorePopup(this.game.canvas.width/2, this.game.canvas.height/2 - 30, 'МОЛЧАНИЕ');
            } else if (eff === 'split') {
                for (let i = 0; i < 3; i++) {
                    let a = (i * 2 * Math.PI / 3) + Math.random() * 0.5;
                    let sp = CONFIG.ball.speed * 1.2;
                    let nb = new Ball(ball.x, ball.y, Math.cos(a) * sp, Math.sin(a) * sp, this.game);
                    nb.radius = 8;
                    nb.active = true;
                    if (this.game.giantBallTimer > 0) nb.radius = 40;
                    this.game.balls.push(nb);
                }
                this.game.createScorePopup(this.game.canvas.width/2, this.game.canvas.height/2 - 30, 'РАЗДВОЕНИЕ');
            } else if (eff === 'sour') {
                // Устанавливаем флаг, что кислый гоминг был активирован
                this.game.sourHomingActivated = true;
                ball.activateBallEffect('sour');
                this.game.createScorePopup(ball.x, ball.y - 30, 'КИСЛЫЙ ШАР');
            } else if (eff === 'light') {
                ball.activateBallEffect('light');
                this.game.createScorePopup(ball.x, ball.y - 30, 'СВЕТОВОЙ ШАР');
            }
        }
    }

    applyBlackEffect(ball, brick) {
        const x = brick.x + brick.width/2 - 10;
        const y = brick.y;
        const eff = ['piercing', 'sour', 'light', 'black', 'flame', 'plasma', 'gold'];
        if (Math.random() < 0.25) {
            let a = Math.random() * 2 * Math.PI;
            let sp = CONFIG.ball.speed * 1.2;
            let nb = new Ball(ball.x, ball.y, Math.cos(a) * sp, Math.sin(a) * sp, this.game);
            nb.active = true;
            if (this.game.giantBallTimer > 0) nb.radius = 40;
            nb.activateBallEffect('transparent');
            this.game.balls.push(nb);
            this.game.createScorePopup(this.game.canvas.width/2, this.game.canvas.height/2 - 30, 'ПРОЗРАЧНЫЙ ШАР');
        } else {
            for (let i = 0; i < 3; i++) {
                let a = (i * 2 * Math.PI / 3) + Math.random() * 0.5;
                let sp = CONFIG.ball.speed * 1.2;
                let nb = new Ball(ball.x, ball.y, Math.cos(a) * sp, Math.sin(a) * sp, this.game);
                nb.radius = 8;
                nb.active = true;
                if (this.game.giantBallTimer > 0) nb.radius = 40;
                const randEff = eff[Math.floor(Math.random() * eff.length)];
                nb.activateBallEffect(randEff);
                this.game.balls.push(nb);
            }
            this.game.createScorePopup(this.game.canvas.width/2, this.game.canvas.height/2 - 30, 'ЧЁРНОЕ РАЗДВОЕНИЕ');
        }
    }

    applyPinkEffect(ball, brick) {
        const x = brick.x + brick.width/2 - 10;
        const y = brick.y;
        const eff = ['sour', 'soapy', 'flame', 'plasma', 'gold'];
        const ch = eff[Math.floor(Math.random() * eff.length)];
        if (ch === 'sour') {
            // Устанавливаем флаг, что кислый гоминг был активирован
            this.game.sourHomingActivated = true;
            ball.activateBallEffect('sour');
            this.game.createScorePopup(ball.x, ball.y - 30, 'КИСЛЫЙ ШАР');
        } else if (ch === 'soapy') {
            for (let i = 0; i < 5; i++) {
                let a = (i * 2 * Math.PI / 5) + Math.random() * 0.3;
                let sp = CONFIG.ball.speed * 1.8;
                let nb = new Ball(ball.x, ball.y, Math.cos(a) * sp, Math.sin(a) * sp, this.game);
                nb.radius = 6;
                nb.active = true;
                if (this.game.giantBallTimer > 0) nb.radius = 40;
                nb.activateBallEffect('soapy');
                this.game.balls.push(nb);
            }
            this.game.createScorePopup(this.game.canvas.width/2, this.game.canvas.height/2 - 30, 'МЫЛЬНЫЕ ШАРЫ');
        } else if (ch === 'flame') {
            ball.activateBallEffect('flame');
            this.game.createScorePopup(ball.x, ball.y - 30, 'ПЛАМЕННЫЙ ШАР');
        } else if (ch === 'plasma') {
            for (let i = 0; i < 2; i++) {
                let a = (i * 2 * Math.PI / 2) + Math.random() * 0.5;
                let sp = CONFIG.ball.speed * 1.2;
                let nb = new Ball(ball.x, ball.y, Math.cos(a) * sp, Math.sin(a) * sp, this.game);
                nb.radius = 8;
                nb.active = true;
                if (this.game.giantBallTimer > 0) nb.radius = 40;
                nb.activateBallEffect('plasma');
                this.game.balls.push(nb);
            }
            this.game.createScorePopup(this.game.canvas.width/2, this.game.canvas.height/2 - 30, 'ПЛАЗМЕННЫЕ ШАРЫ');
        } else if (ch === 'gold') {
            ball.activateBallEffect('gold');
            this.game.createScorePopup(ball.x, ball.y - 30, 'ЗОЛОТОЙ ШАР');
        }
    }

    applySilverEffect(ball, brick) {
        ball.activateBallEffect('silver');
        this.game.createScorePopup(ball.x, ball.y - 30, 'СЕРЕБРЯНЫЙ ШАР');
    }

    applyOrangeEffect(ball, brick) {
        const eff = ['flame', 'piercing', 'plasma', 'gold', 'temporal'];
        const ch = eff[Math.floor(Math.random() * eff.length)];
        if (ch === 'flame') {
            ball.activateBallEffect('flame');
            this.game.createScorePopup(ball.x, ball.y - 30, 'ПЛАМЕННЫЙ ШАР');
        } else if (ch === 'piercing') {
            ball.activateBallEffect('piercing');
            this.game.createScorePopup(ball.x, ball.y - 30, 'ПРОБИВНОЙ ШАР');
        } else if (ch === 'plasma') {
            for (let i = 0; i < 2; i++) {
                let a = (i * 2 * Math.PI / 2) + Math.random() * 0.5;
                let sp = CONFIG.ball.speed * 1.2;
                let nb = new Ball(ball.x, ball.y, Math.cos(a) * sp, Math.sin(a) * sp, this.game);
                nb.radius = 8;
                nb.active = true;
                if (this.game.giantBallTimer > 0) nb.radius = 40;
                nb.activateBallEffect('plasma');
                this.game.balls.push(nb);
            }
            this.game.createScorePopup(this.game.canvas.width/2, this.game.canvas.height/2 - 30, 'ПЛАЗМЕННЫЕ ШАРЫ');
        } else if (ch === 'gold') {
            ball.activateBallEffect('gold');
            this.game.createScorePopup(ball.x, ball.y - 30, 'ЗОЛОТОЙ ШАР');
        } else if (ch === 'temporal') {
            ball.activateBallEffect('temporal');
            this.game.createScorePopup(ball.x, ball.y - 30, 'ВРЕМЕННЫЙ ШАР');
        }
    }

    applyScoreEffect(ball, brick) {
        const x = brick.x + brick.width/2 - 10;
        const y = brick.y;
        const r = Math.random();
        if (r < 0.2) {
            ball.activateBallEffect('gold');
            this.game.createScorePopup(ball.x, ball.y - 30, 'ЗОЛОТОЙ ШАР');
        } else if (r < 0.5) {
            this.game.createShield(x, y);
            this.game.createScorePopup(x, y - 30, 'ЩИТ');
        } else {
            if (Math.random() < 0.15) {
                let a = Math.random() * 2 * Math.PI;
                let sp = CONFIG.ball.speed * 1.2;
                let nb = new Ball(ball.x, ball.y, Math.cos(a) * sp, Math.sin(a) * sp, this.game);
                nb.active = true;
                if (this.game.giantBallTimer > 0) nb.radius = 40;
                nb.activateBallEffect('transparent');
                this.game.balls.push(nb);
                this.game.createScorePopup(this.game.canvas.width/2, this.game.canvas.height/2 - 30, 'ПРОЗРАЧНЫЙ ШАР');
            }
        }
    }

    applyOloEffect(ball, brick) {
        const x = brick.x + brick.width/2 - 10;
        const y = brick.y;
        const rand = Math.random();
        if (rand < 0.33) {
            // Устанавливаем флаг, что кислый гоминг был активирован
            this.game.sourHomingActivated = true;
            ball.activateBallEffect('sour');
            this.game.createScorePopup(ball.x, ball.y - 30, 'КИСЛЫЙ ШАР');
        } else if (rand < 0.66) {
            ball.activateBallEffect('plasma');
            this.game.createScorePopup(ball.x, ball.y - 30, 'ПЛАЗМЕННЫЙ ШАР');
        } else {
            let a = Math.random() * 2 * Math.PI;
            let sp = CONFIG.ball.speed * 1.2;
            let nb = new Ball(ball.x, ball.y, Math.cos(a) * sp, Math.sin(a) * sp, this.game);
            nb.active = true;
            if (this.game.giantBallTimer > 0) nb.radius = 40;
            nb.activateBallEffect('olo');
            this.game.balls.push(nb);
            this.game.createScorePopup(this.game.canvas.width/2, this.game.canvas.height/2 - 30, 'ОЛО ШАР');
        }
    }

    tryPlasmaRepaint(brick) {
        if (!brick || !brick.active || brick.type === 'black' || brick.type === 'violet') return;
        brick.type = 'bonus';
        brick.color = '#4169E1';
        brick.hits = 1;
        this.game.createScorePopup(brick.x + brick.width/2, brick.y - 10, '🔵');
    }

    teleportChronoBlock(brick) {
        if (brick.type !== 'chrono') return;
        const margin = 10;
        const maxAttempts = 200;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const newX = margin + Math.random() * (this.game.canvas.width - brick.width - 2 * margin);
            const newY = margin + Math.random() * (this.game.canvas.height * 0.6 - brick.height - margin);
            let collides = false;
            for (let b of this.game.bricks) {
                if (b.active && b !== brick) {
                    if (newX < b.x + b.width && newX + brick.width > b.x &&
                        newY < b.y + b.height && newY + brick.height > b.y) {
                        collides = true;
                        break;
                    }
                }
            }
            if (!collides) {
                brick.x = newX;
                brick.y = newY;
                this.game.createScorePopup(brick.x + brick.width/2, brick.y - 20, 'ТЕЛЕПОРТ');
                break;
            }
        }
    }

    createExplosion(x, y, ball) {
        let radius = 80;
        if (ball && ball.blackMode && this.game.giantBallTimer > 0) radius = 150;
        const cols = ['#FFF','#FFAA00','#FF5500','#FF0000','#FFFF00'];
        for (let i = 0; i < 40; i++) {
            this.game.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.8) * 14,
                size: Math.random() * 8 + 4,
                color: cols[Math.floor(Math.random() * cols.length)],
                life: 1.0
            });
        }
        this.game.bricks.forEach(b => {
            if (b.active) {
                let cx = b.x + b.width/2, cy = b.y + b.height/2;
                let dist = Math.hypot(cx - x, cy - y);
                if (dist < radius) {
                    b.active = false;
                    this.game.addScore(5, false);
                    this.game.createParticles(cx, cy, b.color, 12);
                    this.game.createScorePopup(cx, cy, 5);
                }
            }
        });
        this.game.updateScore();
    }
}