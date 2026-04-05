import { CONFIG } from './config.js';

export class Paddle {
    constructor(game) {
        this.game = game;
        this.width = CONFIG.paddle.width;
        this.height = CONFIG.paddle.height;
        this.x = (game.canvas.width - this.width) / 2;
        this.y = game.canvas.height - 30;
        this.speed = CONFIG.paddle.speed;
        this.color = CONFIG.paddle.color;
    }

    resetPosition() {
        this.x = (this.game.canvas.width - this.width) / 2;
    }

    resetSpeed() {
        this.speed = CONFIG.paddle.speed;
    }

    move() {
        if (this.game.silenceMode) return;
        let effectiveSpeed = this.speed;
        let effectiveWidth = this.width;
        if (this.game.paddleEffect === 'plasma' && this.game.paddleEffectTimer > 0) {
            effectiveSpeed = 4;
        }
        if (this.game.paddleEffect === 'flame' && this.game.paddleEffectTimer > 0) {
            effectiveWidth = 150;
        }
        const input = this.game.input;
        if (input.rightPressed && this.x < this.game.canvas.width - effectiveWidth) this.x += effectiveSpeed;
        if (input.leftPressed && this.x > 0) this.x -= effectiveSpeed;
        if (input.mobileRight && this.x < this.game.canvas.width - effectiveWidth) this.x += effectiveSpeed;
        if (input.mobileLeft && this.x > 0) this.x -= effectiveSpeed;

        if (input.mouseX !== null && !this.game.paused && this.game.gameStarted && !this.game.gameOver && !this.game.levelComplete && !this.game.silenceMode) {
            let targetX = input.mouseX - effectiveWidth / 2;
            targetX = Math.max(0, Math.min(this.game.canvas.width - effectiveWidth, targetX));
            this.x = targetX;
        }
    }
}