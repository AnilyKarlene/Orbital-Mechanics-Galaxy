import { CONFIG } from './config.js';

export class EffectManager {
    constructor(game) {
        this.game = game;
        this.game.lampAngle = 0;
    }

    updateTimers() {
        if (this.game.giantBallTimer > 0) {
            this.game.giantBallTimer--;
            if (this.game.giantBallTimer <= 0) {
                this.game.balls.forEach(b => b.radius = b.normalRadius);
            }
        }
        if (this.game.piercingBallTimer > 0) {
            this.game.piercingBallTimer--;
            if (this.game.piercingBallTimer <= 0) {
                this.game.balls.forEach(b => { b.piercingTimer = 0; b.updateColor(); });
            }
        }
        if (this.game.silenceMode) {
            this.game.silenceCounter--;
            if (this.game.silenceCounter <= 0) this.game.silenceMode = false;
        }
        if (this.game.paddleEffectTimer > 0) {
            this.game.paddleEffectTimer--;
            if (this.game.paddleEffectTimer <= 0) {
                this.game.paddleEffect = null;
                this.game.paddle.speed = CONFIG.paddle.speed;
            }
        }

        this.game.lampAngle = (this.game.lampAngle + 0.02) % (2*Math.PI);

        let activeBricks = this.game.bricks.filter(b => b.active).length;
        if (activeBricks <= 5 && activeBricks > 0 && !this.game.lowBlockTriggered) {
            if (!this.game.lowBlockActive) {
                this.game.lowBlockActive = true;
                this.game.lowBlockTimer = CONFIG.effects.lowBlockTimerFrames;
            } else {
                this.game.lowBlockTimer--;
                if (this.game.lowBlockTimer <= 0 && !this.game.lowBlockTriggered) {
                    this.game.lowBlockTriggered = true;
                    this.game.lowBlockActive = false;
                    this.game.balls.forEach(b => {
                        if (!b.sourMode) {
                            b.activateBallEffect('sour');
                        }
                        b.homing = true;
                    });
                    this.game.createScorePopup(this.game.canvas.width/2, this.game.canvas.height/2 - 40, 'КИСЛЫЙ ГОМИНГ!');
                    this.game.sourHomingActivated = true; // устанавливаем флаг
                }
            }
        } else {
            this.game.lowBlockActive = false;
            this.game.lowBlockTimer = 0;
        }
    }
}