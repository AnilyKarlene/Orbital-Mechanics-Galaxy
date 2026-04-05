export class Items {
    constructor(game) {
        this.game = game;
    }

    update() {
        for (let i = this.game.hearts.length - 1; i >= 0; i--) {
            let h = this.game.hearts[i];
            if (h.collected) { this.game.hearts.splice(i,1); continue; }
            h.y += h.speed;
            if (h.y + h.height > this.game.paddle.y && h.y < this.game.paddle.y + this.game.paddle.height &&
                h.x + h.width > this.game.paddle.x && h.x < this.game.paddle.x + this.game.paddle.width) {
                this.game.lives++; this.game.updateScore(); h.collected = true; this.game.createScorePopup(h.x + h.width/2, h.y, '❤️');
            } else if (h.y > this.game.canvas.height) { this.game.hearts.splice(i,1); }
        }
        for (let i = this.game.penalties.length - 1; i >= 0; i--) {
            let p = this.game.penalties[i];
            if (p.collected) { this.game.penalties.splice(i,1); continue; }
            p.y += p.speed;
            if (p.y + p.height > this.game.paddle.y && p.y < this.game.paddle.y + this.game.paddle.height &&
                p.x + p.width > this.game.paddle.x && p.x < this.game.paddle.x + this.game.paddle.width) {
                this.game.lives = Math.max(0, this.game.lives - 1); this.game.updateScore(); p.collected = true; this.game.createScorePopup(p.x + p.width/2, p.y, '-1');
            } else if (p.y > this.game.canvas.height) { this.game.penalties.splice(i,1); }
        }
        for (let i = this.game.shields.length - 1; i >= 0; i--) {
            let s = this.game.shields[i];
            if (s.collected) { this.game.shields.splice(i,1); continue; }
            s.y += s.speed;
            if (s.y + s.height > this.game.paddle.y && s.y < this.game.paddle.y + this.game.paddle.height &&
                s.x + s.width > this.game.paddle.x && s.x < this.game.paddle.x + this.game.paddle.width) {
                this.game.shieldCount++; s.collected = true; this.game.createScorePopup(s.x + s.width/2, s.y, `🛡️+1 (${this.game.shieldCount})`);
            } else if (s.y > this.game.canvas.height) { this.game.shields.splice(i,1); }
        }
    }
}