import { CONFIG } from './config.js';

export class Ball {
    constructor(x, y, speedX, speedY, game) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.radius = CONFIG.ball.radius;
        this.normalRadius = CONFIG.ball.radius;
        this.speedX = speedX;
        this.speedY = speedY;
        this.savedSpeedX = 0;
        this.savedSpeedY = 0;
        this.active = true;
        this.maxSpeed = CONFIG.ball.maxSpeed;
        this.color = '#ff4757';

        this.piercingTimer = 0;
        this.sourMode = false;
        this.sourTimer = 0;
        this.lightMode = false;
        this.lightTimer = 0;
        this.lightTail = [];
        this.blackMode = false;
        this.blackTimer = 0;
        this.soapyMode = false;
        this.soapyTimer = 0;
        this.silverMode = false;
        this.silverTimer = 0;
        this.flameMode = false;
        this.flameTimer = 0;
        this.flameTail = [];
        this.plasmaMode = false;
        this.plasmaTimer = 0;
        this.plasmaTail = [];
        this.goldMode = false;
        this.goldTimer = 0;
        this.goldTail = [];
        this.transparentMode = false;
        this.transparentTimer = 0;
        this.blinkState = 0;
        this.blinkCounter = 0;
        this.microMode = false;
        this.microTimer = 0;
        this.temporalMode = false;
        this.temporalTimer = 0;
        this.temporalSpeedFactor = 1.0;
        this.temporalPhase = 0;
        this.oloMode = false;
        this.oloTimer = 0;
        this.homing = false;
    }

    activateBallEffect(effect, durationMultiplier = 1) {
        this.piercingTimer = 0;
        this.sourMode = false; this.sourTimer = 0;
        this.lightMode = false; this.lightTimer = 0; this.lightTail = [];
        this.blackMode = false; this.blackTimer = 0;
        this.soapyMode = false; this.soapyTimer = 0;
        this.silverMode = false; this.silverTimer = 0;
        this.flameMode = false; this.flameTimer = 0; this.flameTail = [];
        this.plasmaMode = false; this.plasmaTimer = 0; this.plasmaTail = [];
        this.goldMode = false; this.goldTimer = 0; this.goldTail = [];
        this.transparentMode = false; this.transparentTimer = 0;
        this.microMode = false; this.microTimer = 0;
        this.temporalMode = false; this.temporalTimer = 0;
        this.oloMode = false; this.oloTimer = 0;
        this.homing = false;
        this.radius = this.normalRadius;
        switch (effect) {
            case 'piercing':
                this.piercingTimer = Math.floor(CONFIG.effects.piercingDuration * durationMultiplier);
                this.color = '#FF69B4';
                break;
            case 'sour':
                this.sourMode = true;
                this.sourTimer = Math.floor(10 * 60 * durationMultiplier);
                this.color = '#32CD32';
                break;
            case 'light':
                this.lightMode = true;
                this.lightTimer = Math.floor(8 * 60 * durationMultiplier);
                this.color = '#FFFFFF';
                let sp = Math.hypot(this.speedX, this.speedY);
                if (sp > 0) {
                    let f = CONFIG.effects.lightSpeedMultiplier;
                    this.speedX = (this.speedX / sp) * (sp * f);
                    this.speedY = (this.speedY / sp) * (sp * f);
                }
                this.savedSpeedX = this.speedX;
                this.savedSpeedY = this.speedY;
                break;
            case 'black':
                this.blackMode = true;
                this.blackTimer = Math.floor(60 * 60 * durationMultiplier);
                this.color = '#000000';
                break;
            case 'soapy':
                this.soapyMode = true;
                this.soapyTimer = Math.floor(10 * 60 * durationMultiplier);
                this.color = '#AA80FF';
                this.radius = 6;
                this.maxSpeed = 15;
                break;
            case 'silver':
                this.silverMode = true;
                this.silverTimer = Math.floor(15 * 60 * durationMultiplier);
                this.color = '#C0C0C0';
                this.speedX *= 0.5;
                this.speedY *= 0.5;
                break;
            case 'flame':
                this.flameMode = true;
                this.flameTimer = Math.floor(10 * 60 * durationMultiplier);
                this.color = '#FF8C00';
                break;
            case 'plasma':
                this.plasmaMode = true;
                this.plasmaTimer = Math.floor(10 * 60 * durationMultiplier);
                this.color = '#4169E1';
                break;
            case 'gold':
                this.goldMode = true;
                this.goldTimer = Math.floor(17 * 60 * durationMultiplier);
                this.color = '#FFD700';
                break;
            case 'transparent':
                this.transparentMode = true;
                this.transparentTimer = Math.floor(15 * 60 * durationMultiplier);
                this.color = 'rgba(255,255,255,0.8)';
                this.blinkState = 1;
                this.blinkCounter = 0;
                break;
            case 'micro':
                this.microMode = true;
                this.microTimer = Math.floor(10 * 60 * durationMultiplier);
                this.color = '#AAAAAA';
                this.radius = 5;
                this.normalRadius = 5;
                let spm = Math.hypot(this.speedX, this.speedY);
                if (spm > 0) {
                    let f = 1.5;
                    this.speedX = (this.speedX / spm) * (spm * f);
                    this.speedY = (this.speedY / spm) * (spm * f);
                }
                break;
            case 'temporal':
                this.temporalMode = true;
                this.temporalTimer = Math.floor(12 * 60 * durationMultiplier);
                this.color = '#00FFFF';
                this.temporalPhase = Math.random() * 2 * Math.PI;
                break;
            case 'olo':
                this.oloMode = true;
                this.oloTimer = Math.floor(15 * 60 * durationMultiplier);
                this.color = '#FF00FF';
                this.homing = true;
                break;
        }
        if (this.game.giantBallTimer > 0) {
            this.radius = 40;
        }
    }

    stop() { this.speedX = 0; this.speedY = 0; }

    clearEffects() {
        this.activateBallEffect('none');
        this.color = '#ff4757';
    }

    update() {
        this.applyEffects();
        this.move();
        this.wallCollision();
    }

    applyEffects() {
        if (this.piercingTimer > 0 && --this.piercingTimer === 0 && !this.hasAnyEffect()) this.color = '#ff4757';
        if (this.sourMode && --this.sourTimer === 0) { this.sourMode = false; this.updateColor(); }
        if (this.lightMode && --this.lightTimer === 0) { this.lightMode = false; this.restoreSpeed(); this.updateColor(); }
        if (this.blackMode && --this.blackTimer === 0) { this.blackMode = false; this.updateColor(); }
        if (this.soapyMode && --this.soapyTimer === 0) { this.soapyMode = false; this.radius = this.normalRadius; this.maxSpeed = CONFIG.ball.maxSpeed; this.updateColor(); }
        if (this.silverMode && --this.silverTimer === 0) { this.silverMode = false; this.speedX *= 2; this.speedY *= 2; this.updateColor(); }
        if (this.flameMode && --this.flameTimer === 0) { this.flameMode = false; this.flameTail = []; this.updateColor(); }
        if (this.plasmaMode && --this.plasmaTimer === 0) { this.plasmaMode = false; this.plasmaTail = []; this.updateColor(); }
        if (this.goldMode && --this.goldTimer === 0) { this.goldMode = false; this.goldTail = []; this.updateColor(); }
        if (this.transparentMode) {
            if (--this.transparentTimer <= 0) {
                this.transparentMode = false;
                this.updateColor();
            } else {
                this.blinkCounter++;
                if (this.blinkCounter >= 5) {
                    this.blinkCounter = 0;
                    this.blinkState = 1 - this.blinkState;
                }
                this.color = this.blinkState ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)';
            }
        }
        if (this.microMode && --this.microTimer === 0) { this.microMode = false; this.radius = this.normalRadius; this.updateColor(); }
        if (this.temporalMode && --this.temporalTimer === 0) { this.temporalMode = false; this.updateColor(); }
        if (this.oloMode && --this.oloTimer === 0) { this.oloMode = false; this.homing = false; this.updateColor(); }

        if (this.lightMode) this.updateLightTail();
        if (this.flameMode) this.updateFlameTail();
        if (this.plasmaMode) this.updatePlasmaTail();
        if (this.goldMode) this.updateGoldTail();
        if (this.temporalMode) this.updateTemporal();
    }

    hasAnyEffect() {
        return this.sourMode || this.lightMode || this.blackMode || this.soapyMode || this.silverMode
            || this.flameMode || this.plasmaMode || this.goldMode || this.transparentMode
            || this.microMode || this.temporalMode || this.oloMode;
    }

    updateColor() {
        if (this.piercingTimer > 0) this.color = '#FF69B4';
        else if (this.sourMode) this.color = '#32CD32';
        else if (this.lightMode) this.color = '#FFFFFF';
        else if (this.blackMode) this.color = '#000000';
        else if (this.soapyMode) this.color = '#AA80FF';
        else if (this.silverMode) this.color = '#C0C0C0';
        else if (this.flameMode) this.color = '#FF8C00';
        else if (this.plasmaMode) this.color = '#4169E1';
        else if (this.goldMode) this.color = '#FFD700';
        else if (this.transparentMode) this.color = 'rgba(255,255,255,0.8)';
        else if (this.microMode) this.color = '#AAAAAA';
        else if (this.temporalMode) this.color = '#00FFFF';
        else if (this.oloMode) this.color = '#FF00FF';
        else this.color = '#ff4757';
    }

    restoreSpeed() {
        if (this.savedSpeedX !== 0 && this.savedSpeedY !== 0) {
            let sp = Math.hypot(this.speedX, this.speedY);
            let savedSp = Math.hypot(this.savedSpeedX, this.savedSpeedY);
            if (savedSp > 0) {
                let f = savedSp / sp;
                this.speedX *= f;
                this.speedY *= f;
            }
            this.savedSpeedX = 0;
            this.savedSpeedY = 0;
        }
    }

    updateLightTail() {
        for (let i=0; i<2; i++) {
            this.lightTail.push({ x: this.x, y: this.y, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 0.7+Math.random()*0.3, size: 3+Math.random()*4 });
        }
        this.lightTail = this.lightTail.filter(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; p.size *= 0.98; return p.life > 0 && p.y < this.game.canvas.height+50 && p.x > -50 && p.x < this.game.canvas.width+50; });
    }

    updateFlameTail() {
        for (let i=0; i<2; i++) {
            this.flameTail.push({ x: this.x, y: this.y, vx: (Math.random()-0.5)*7, vy: (Math.random()-0.5)*7, life: 0.8+Math.random()*0.3, size: 4+Math.random()*6, color: Math.random()<0.5?'#FF4500':'#FFD700' });
        }
        this.flameTail = this.flameTail.filter(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.025; p.size *= 0.97; return p.life > 0 && p.y < this.game.canvas.height+50 && p.x > -50 && p.x < this.game.canvas.width+50; });
    }

    updatePlasmaTail() {
        for (let i=0; i<1; i++) {
            this.plasmaTail.push({ x: this.x, y: this.y, vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5, life: 0.7+Math.random()*0.3, size: 3+Math.random()*5, color: Math.random()<0.5?'#4169E1':'#1E90FF' });
        }
        this.plasmaTail = this.plasmaTail.filter(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; p.size *= 0.98; return p.life > 0; });
    }

    updateGoldTail() {
        for (let i=0; i<2; i++) {
            this.goldTail.push({ x: this.x, y: this.y, vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5, life: 0.6+Math.random()*0.3, size: 3+Math.random()*4, color: '#FFD700' });
        }
        this.goldTail = this.goldTail.filter(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; p.size *= 0.98; return p.life > 0; });
    }

    updateTemporal() {
        this.temporalPhase += 0.02;
        let sinVal = Math.sin(this.temporalPhase);
        this.temporalSpeedFactor = 1.0 + sinVal * 0.7;
        let sp = Math.hypot(this.speedX, this.speedY);
        if (sp > 0) {
            this.speedX = (this.speedX / sp) * (sp * this.temporalSpeedFactor);
            this.speedY = (this.speedY / sp) * (sp * this.temporalSpeedFactor);
        }
        this.speedX += (Math.random() - 0.5) * 0.2;
        this.speedY += (Math.random() - 0.5) * 0.2;
    }

    move() {
        this.prevX = this.x;
        this.prevY = this.y;

        if (this.game.silenceMode && this.lightMode) {
            if (this.savedSpeedX === 0) {
                this.savedSpeedX = this.speedX;
                this.savedSpeedY = this.speedY;
                this.speedX = 0;
                this.speedY = 0;
            }
        } else if (this.lightMode && this.speedX === 0 && this.speedY === 0) {
            this.speedX = this.savedSpeedX;
            this.speedY = this.savedSpeedY;
            this.savedSpeedX = 0;
            this.savedSpeedY = 0;
        }

        if (this.sourMode) {
            this.speedX += (Math.random() - 0.5) * 1.2;
            this.speedY += (Math.random() - 0.5) * 1.2;
            let sp = Math.hypot(this.speedX, this.speedY);
            if (sp < 2) {
                this.speedX = (this.speedX / sp) * 2.1;
                this.speedY = (this.speedY / sp) * 2.1;
            }
        }

        if (this.homing) {
            this.applyHoming();
        }

        this.x += this.speedX;
        this.y += this.speedY;
    }

    applyHoming() {
        let closestDist = Infinity;
        let closestBrick = null;
        for (let brick of this.game.bricks) {
            if (!brick.active) continue;
            let dx = brick.x + brick.width/2 - this.x;
            let dy = brick.y + brick.height/2 - this.y;
            let dist = Math.hypot(dx, dy);
            if (dist < closestDist) {
                closestDist = dist;
                closestBrick = brick;
            }
        }
        if (closestBrick) {
            let dx = closestBrick.x + closestBrick.width/2 - this.x;
            let dy = closestBrick.y + closestBrick.height/2 - this.y;
            let len = Math.hypot(dx, dy);
            if (len > 0.1) {
                let normX = dx / len;
                let normY = dy / len;
                this.speedX += normX * 0.15;
                this.speedY += normY * 0.15;
                let sp = Math.hypot(this.speedX, this.speedY);
                if (sp > this.maxSpeed) {
                    this.speedX = (this.speedX / sp) * this.maxSpeed;
                    this.speedY = (this.speedY / sp) * this.maxSpeed;
                }
            }
        }
    }

    wallCollision() {
        if (this.x + this.radius > this.game.canvas.width) {
            this.x = this.game.canvas.width - this.radius;
            this.speedX = -Math.abs(this.speedX);
            this.game.createParticles(this.x, this.y, this.color, 5);
        }
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.speedX = Math.abs(this.speedX);
            this.game.createParticles(this.x, this.y, this.color, 5);
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.speedY = Math.abs(this.speedY);
            this.game.createParticles(this.x, this.y, this.color, 5);
        }
        if (this.y + this.radius > this.game.canvas.height) {
            this.active = false;
        }
    }
}