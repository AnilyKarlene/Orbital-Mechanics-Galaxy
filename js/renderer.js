export class Renderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.time = 0;
        this.decor = [];
        for (let i = 0; i < 30; i++) {
            this.decor.push({
                x: Math.random() * game.canvas.width,
                y: Math.random() * game.canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                type: Math.random() < 0.5 ? 'star' : 'circle',
                size: Math.random() * 4 + 2,
                alpha: Math.random() * 0.3 + 0.1
            });
        }
    }

    updateDecor() {
        for (let d of this.decor) {
            d.x += d.vx;
            d.y += d.vy;
            if (d.x < 0 || d.x > this.game.canvas.width) d.vx *= -1;
            if (d.y < 0 || d.y > this.game.canvas.height) d.vy *= -1;
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;

        this.time += 0.01;
        const gradientTime = this.time * 0.5;
        const gradient = ctx.createLinearGradient(
            w/2 + Math.cos(gradientTime) * w/2,
            h/2 + Math.sin(gradientTime) * h/2,
            w/2 + Math.cos(gradientTime + Math.PI) * w/2,
            h/2 + Math.sin(gradientTime + Math.PI) * h/2
        );
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        const flicker = Math.sin(this.time * 3) * 0.1 + 0.9;
        ctx.fillStyle = `rgba(138,43,226,${0.05 * flicker})`;
        ctx.fillRect(0, 0, w, h);

        // Декоративные звёзды и шары
        ctx.save();
        ctx.shadowBlur = 0;
        for (let d of this.decor) {
            ctx.globalAlpha = d.alpha;
            if (d.type === 'star') {
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 72 - 36) * Math.PI / 180;
                    const x = d.x + d.size * Math.cos(angle);
                    const y = d.y + d.size * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.size, 0, 2*Math.PI);
                ctx.fillStyle = '#000000';
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        this.drawGrid();
        this.drawBricks();
        this.drawItems();
        this.drawPaddle();
        this.drawBalls();
        this.drawParticles();
        this.drawScorePopups();

        if (this.game.gameOver) this.drawGameOver();
    }

    drawGrid() {
        const ctx = this.ctx;
        const w = this.game.canvas.width;
        const h = this.game.canvas.height;
        const time = this.time * 5;

        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, 'rgba(138,43,226,0.3)');
        gradient.addColorStop(0.5, 'rgba(65,105,225,0.3)');
        gradient.addColorStop(1, 'rgba(138,43,226,0.3)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;

        for (let x = 0; x <= w; x += 40) {
            const offsetX = Math.sin(x * 0.02 + time) * 10;
            ctx.beginPath();
            ctx.moveTo(x + offsetX, 0);
            ctx.lineTo(x + offsetX + 15 * Math.sin(x * 0.03 + time), h);
            ctx.stroke();
        }
        for (let y = 0; y <= h; y += 40) {
            const offsetY = Math.cos(y * 0.02 + time) * 10;
            ctx.beginPath();
            ctx.moveTo(0, y + offsetY);
            ctx.lineTo(w, y + offsetY + 15 * Math.cos(y * 0.03 + time));
            ctx.stroke();
        }
    }

    drawPaddle() {
        const ctx = this.ctx;
        const pad = this.game.paddle;
        let w = pad.width;
        let color = pad.color;
        if (this.game.paddleEffect === 'flame' && this.game.paddleEffectTimer > 0) {
            w = 150;
            color = '#FF8C00';
        }
        if (this.game.paddleEffect === 'plasma' && this.game.paddleEffectTimer > 0) {
            w = 70;
            color = '#4169E1';
        }
        if (this.game.silenceMode) {
            color = '#555555';
        }
        ctx.beginPath();
        ctx.roundRect(pad.x, pad.y, w, pad.height, 8);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
        if (this.game.shieldCount > 0) {
            ctx.beginPath();
            ctx.moveTo(0, pad.y + pad.height);
            ctx.lineTo(this.game.canvas.width, pad.y + pad.height);
            ctx.lineWidth = 6;
            ctx.strokeStyle = this.game.shieldCount >= 4 ? '#FF0000' : this.game.shieldCount === 3 ? '#FFA500' : '#4169E1';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    drawBalls() {
        const ctx = this.ctx;
        this.game.balls.forEach(b => {
            if (b.lightMode) this.drawLightTail(b);
            if (b.flameMode) this.drawFlameTail(b);
            if (b.plasmaMode) this.drawPlasmaTail(b);
            if (b.goldMode) this.drawGoldTail(b);
            
            // Определяем радиус с учетом пульсации для кислого шара
            let radius = b.radius;
            if (b.sourMode) {
                // Пульсация: радиус колеблется от 95% до 105% базового радиуса
                // Частота пульсации: this.time * 3 (регулируется множителем)
                const pulseFactor = 1 + 0.05 * Math.sin(this.time * 3);
                radius = b.radius * pulseFactor;
            }
            
            ctx.beginPath();
            ctx.arc(b.x, b.y, radius, 0, 2*Math.PI);
            ctx.fillStyle = b.color;
            ctx.shadowColor = b.color;
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            if (b.blackMode) {
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius + 1, 0, 2*Math.PI);
                ctx.strokeStyle = 'rgba(255,255,255,0.7)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        });
    }

    drawLightTail(b) {
        const ctx = this.ctx;
        b.lightTail.forEach(p => {
            ctx.fillStyle = `rgba(255,255,255,${p.life})`;
            ctx.shadowColor = '#FFF';
            ctx.shadowBlur = 8;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        });
    }
    drawFlameTail(b) {
        const ctx = this.ctx;
        b.flameTail.forEach(p => {
            ctx.fillStyle = `rgba(${p.color === '#FF4500' ? '255,69,0' : '255,215,0'},${p.life})`;
            ctx.shadowColor = '#FF8C00';
            ctx.shadowBlur = 10;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        });
    }
    drawPlasmaTail(b) {
        const ctx = this.ctx;
        b.plasmaTail.forEach(p => {
            ctx.fillStyle = `rgba(${p.color === '#4169E1' ? '65,105,225' : '30,144,255'},${p.life})`;
            ctx.shadowColor = '#4169E1';
            ctx.shadowBlur = 8;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        });
    }
    drawGoldTail(b) {
        const ctx = this.ctx;
        b.goldTail.forEach(p => {
            ctx.fillStyle = `rgba(255,215,0,${p.life})`;
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 8;
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        });
    }

    strokeBlackBlock(ctx, brick) {
        const { x, y, width, height } = brick;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.stroke();
        ctx.restore();
    }

    drawBlock(ctx, brick) {
        const { x, y, width, height, type, hits, shape, color } = brick;
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 5;

        switch (shape) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(x + width/2, y + height/2, Math.min(width, height)/2, 0, 2*Math.PI);
                ctx.fill();
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(x, y + height);
                ctx.lineTo(x, y);
                ctx.lineTo(x + width, y + height);
                ctx.closePath();
                ctx.fill();
                break;
            case 'trapezoid':
                {
                    const topWidth = width * 0.6;
                    const offset = (width - topWidth) / 2;
                    ctx.beginPath();
                    ctx.moveTo(x + offset, y);
                    ctx.lineTo(x + width - offset, y);
                    ctx.lineTo(x + width, y + height);
                    ctx.lineTo(x, y + height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'skew':
                {
                    const skew = height * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(x + skew, y);
                    ctx.lineTo(x + width + skew, y);
                    ctx.lineTo(x + width, y + height);
                    ctx.lineTo(x, y + height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'diamond':
                ctx.beginPath();
                ctx.moveTo(x + width/2, y);
                ctx.lineTo(x + width, y + height/2);
                ctx.lineTo(x + width/2, y + height);
                ctx.lineTo(x, y + height/2);
                ctx.closePath();
                ctx.fill();
                break;
            case 'pentagon':
                {
                    const cx = x + width/2;
                    const cy = y + height/2;
                    const r = Math.min(width, height) / 2;
                    ctx.beginPath();
                    for (let i = 0; i < 5; i++) {
                        const angle = (i * 2 * Math.PI / 5) - Math.PI/2;
                        const px = cx + r * Math.cos(angle);
                        const py = cy + r * Math.sin(angle);
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'hexagon':
                {
                    const cx = x + width/2;
                    const cy = y + height/2;
                    const r = Math.min(width, height) / 2;
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * 2 * Math.PI / 6) - Math.PI/2;
                        const px = cx + r * Math.cos(angle);
                        const py = cy + r * Math.sin(angle);
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'star':
                {
                    const cx = x + width/2;
                    const cy = y + height/2;
                    const outerR = Math.min(width, height) / 2;
                    const innerR = outerR * 0.4;
                    ctx.beginPath();
                    for (let i = 0; i < 10; i++) {
                        const r = (i % 2 === 0) ? outerR : innerR;
                        const angle = (i * Math.PI / 5) - Math.PI/2;
                        const px = cx + r * Math.cos(angle);
                        const py = cy + r * Math.sin(angle);
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'semicircle':
                {
                    const radius = Math.min(width/2, height);
                    ctx.beginPath();
                    ctx.arc(x + width/2, y, radius, 0, Math.PI, true);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'invtriangle':
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + width, y);
                ctx.lineTo(x + width/2, y + height);
                ctx.closePath();
                ctx.fill();
                break;
            case 'parallelogram':
                {
                    const offset = width * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(x + offset, y);
                    ctx.lineTo(x + width, y);
                    ctx.lineTo(x + width - offset, y + height);
                    ctx.lineTo(x, y + height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'trapezoid_inv':
                {
                    const topWidth = width * 0.6;
                    const offset = (width - topWidth) / 2;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + width, y);
                    ctx.lineTo(x + width - offset, y + height);
                    ctx.lineTo(x + offset, y + height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'sector':
                ctx.beginPath();
                ctx.moveTo(x + width/2, y + height/2);
                ctx.arc(x + width/2, y + height/2, Math.min(width, height)/2, 0, Math.PI/2);
                ctx.closePath();
                ctx.fill();
                break;
            case 'drop':
                ctx.beginPath();
                ctx.moveTo(x + width/2, y);
                ctx.quadraticCurveTo(x + width, y + height/2, x + width/2, y + height);
                ctx.quadraticCurveTo(x, y + height/2, x + width/2, y);
                ctx.fill();
                break;
            case 'roundedRect':
                ctx.beginPath();
                ctx.roundRect(x, y, width, height, Math.min(width, height) * 0.2);
                ctx.fill();
                break;
            case 'ellipse':
                ctx.beginPath();
                ctx.ellipse(x + width/2, y + height/2, width/2, height/2, 0, 0, 2*Math.PI);
                ctx.fill();
                break;
            case 'capsule':
                {
                    const radius = Math.min(width, height) / 2;
                    ctx.beginPath();
                    if (width > height) {
                        ctx.moveTo(x + radius, y);
                        ctx.lineTo(x + width - radius, y);
                        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                        ctx.lineTo(x + width, y + height - radius);
                        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                        ctx.lineTo(x + radius, y + height);
                        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                        ctx.lineTo(x, y + radius);
                        ctx.quadraticCurveTo(x, y, x + radius, y);
                    } else {
                        ctx.moveTo(x, y + radius);
                        ctx.lineTo(x, y + height - radius);
                        ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
                        ctx.lineTo(x + width - radius, y + height);
                        ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
                        ctx.lineTo(x + width, y + radius);
                        ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
                        ctx.lineTo(x + radius, y);
                        ctx.quadraticCurveTo(x, y, x, y + radius);
                    }
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'plus':
                {
                    const thick = Math.min(width, height) * 0.2;
                    ctx.fillRect(x + width/2 - thick/2, y, thick, height);
                    ctx.fillRect(x, y + height/2 - thick/2, width, thick);
                }
                break;
            case 'xcross':
                {
                    const thick = Math.min(width, height) * 0.15;
                    ctx.save();
                    ctx.translate(x + width/2, y + height/2);
                    ctx.rotate(Math.PI/4);
                    ctx.fillRect(-thick/2, -Math.max(width, height)/2, thick, Math.max(width, height));
                    ctx.fillRect(-Math.max(width, height)/2, -thick/2, Math.max(width, height), thick);
                    ctx.restore();
                }
                break;
            case 'octagon':
                {
                    const offset = Math.min(width, height) * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(x + offset, y);
                    ctx.lineTo(x + width - offset, y);
                    ctx.lineTo(x + width, y + offset);
                    ctx.lineTo(x + width, y + height - offset);
                    ctx.lineTo(x + width - offset, y + height);
                    ctx.lineTo(x + offset, y + height);
                    ctx.lineTo(x, y + height - offset);
                    ctx.lineTo(x, y + offset);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'house':
                {
                    ctx.beginPath();
                    ctx.moveTo(x, y + height*0.3);
                    ctx.lineTo(x + width/2, y);
                    ctx.lineTo(x + width, y + height*0.3);
                    ctx.lineTo(x + width, y + height);
                    ctx.lineTo(x, y + height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'arch':
                {
                    const radius = Math.min(width/2, height);
                    ctx.beginPath();
                    ctx.moveTo(x, y + height);
                    ctx.lineTo(x, y + radius);
                    ctx.quadraticCurveTo(x, y, x + radius, y);
                    ctx.lineTo(x + width - radius, y);
                    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                    ctx.lineTo(x + width, y + height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'cutcorner':
                {
                    const cut = Math.min(width, height) * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + width - cut, y);
                    ctx.lineTo(x + width, y + cut);
                    ctx.lineTo(x + width, y + height);
                    ctx.lineTo(x, y + height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'wave':
                {
                    ctx.beginPath();
                    ctx.moveTo(x, y + height);
                    ctx.quadraticCurveTo(x + width*0.3, y + height*0.3, x + width*0.5, y + height*0.5);
                    ctx.quadraticCurveTo(x + width*0.7, y + height*0.7, x + width, y + height*0.3);
                    ctx.lineTo(x + width, y + height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'zigzag':
                {
                    ctx.beginPath();
                    ctx.moveTo(x, y + height);
                    ctx.lineTo(x + width*0.2, y);
                    ctx.lineTo(x + width*0.4, y + height);
                    ctx.lineTo(x + width*0.6, y);
                    ctx.lineTo(x + width*0.8, y + height);
                    ctx.lineTo(x + width, y);
                    ctx.lineTo(x + width, y + height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'coil':
                {
                    ctx.beginPath();
                    ctx.moveTo(x, y + height*0.8);
                    ctx.quadraticCurveTo(x + width*0.3, y + height*0.2, x + width*0.5, y + height*0.5);
                    ctx.quadraticCurveTo(x + width*0.7, y + height*0.8, x + width, y + height*0.3);
                    ctx.lineTo(x + width, y + height);
                    ctx.lineTo(x, y + height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'bent':
                {
                    ctx.beginPath();
                    ctx.moveTo(x, y + height);
                    ctx.quadraticCurveTo(x + width*0.2, y + height*0.2, x + width*0.5, y);
                    ctx.quadraticCurveTo(x + width*0.8, y + height*0.2, x + width, y + height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'doublewave':
                {
                    ctx.beginPath();
                    ctx.moveTo(x, y + height);
                    ctx.quadraticCurveTo(x + width*0.25, y + height*0.3, x + width*0.5, y + height*0.5);
                    ctx.quadraticCurveTo(x + width*0.75, y + height*0.7, x + width, y + height*0.3);
                    ctx.lineTo(x + width, y + height);
                    ctx.lineTo(x, y + height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'spiral':
                {
                    ctx.beginPath();
                    ctx.moveTo(x, y + height*0.8);
                    ctx.quadraticCurveTo(x + width*0.2, y + height*0.1, x + width*0.5, y + height*0.2);
                    ctx.quadraticCurveTo(x + width*0.8, y + height*0.4, x + width, y + height*0.6);
                    ctx.lineTo(x + width, y + height);
                    ctx.lineTo(x, y + height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'chevron':
                {
                    ctx.beginPath();
                    ctx.moveTo(x, y + height);
                    ctx.lineTo(x + width*0.3, y);
                    ctx.lineTo(x + width*0.7, y);
                    ctx.lineTo(x + width, y + height);
                    ctx.closePath();
                    ctx.fill();
                }
                break;
            case 'frame':
                {
                    const thick = Math.min(width, height) * 0.2;
                    ctx.fillRect(x, y, width, thick);
                    ctx.fillRect(x, y + height - thick, width, thick);
                    ctx.fillRect(x, y, thick, height);
                    ctx.fillRect(x + width - thick, y, thick, height);
                }
                break;
            default:
                ctx.fillRect(x, y, width, height);
        }

        ctx.shadowBlur = 0;

        if (type === 'black') {
            this.strokeBlackBlock(ctx, brick);
        }

        if (type === 'pink') {
            ctx.font = `bold ${Math.min(20, Math.min(width, height) * 0.8)}px "Segoe UI", "Arial Unicode MS", sans-serif`;
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 8;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✦', x + width/2, y + height/2);
            ctx.shadowBlur = 0;
        }
        if ((type === 'multiHit' || type === 'silverHard' || type === 'chrono') && hits > 1) {
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(hits, x + width/2, y + height/2);
        }

        if (type === 'lamp') {
            ctx.save();
            ctx.translate(x + width/2, y + height/2);
            ctx.rotate(this.game.lampAngle || 0);
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, Math.min(width, height)/2 * 0.8, 0, Math.PI/2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }

    drawBricks() {
        const ctx = this.ctx;
        this.game.bricks.forEach(b => {
            if (!b.active) return;
            this.drawBlock(ctx, b);
        });
    }

    drawItems() {
        const ctx = this.ctx;
        this.game.hearts.forEach(h => {
            if (h.collected) return;
            ctx.save(); ctx.translate(h.x + h.width/2, h.y + h.height/2);
            ctx.beginPath(); ctx.moveTo(0,-5); ctx.bezierCurveTo(-8,-10,-12,-5,-5,5); ctx.bezierCurveTo(-2,8,0,10,2,8); ctx.bezierCurveTo(5,-5,8,-10,0,-5);
            ctx.fillStyle = '#ff4757'; ctx.shadowColor = '#ff4757'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
        });
        this.game.penalties.forEach(p => {
            if (p.collected) return;
            ctx.save(); ctx.translate(p.x + p.width/2, p.y + p.height/2);
            ctx.beginPath(); ctx.moveTo(0,-5); ctx.bezierCurveTo(-8,-10,-12,-5,-5,5); ctx.bezierCurveTo(-2,8,0,10,2,8); ctx.bezierCurveTo(5,-5,8,-10,0,-5);
            ctx.fillStyle = '#8B0000'; ctx.shadowColor = '#8B0000'; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(8,0); ctx.lineWidth = 3; ctx.strokeStyle = 'black'; ctx.stroke(); ctx.restore();
        });
        this.game.shields.forEach(s => {
            if (s.collected) return;
            ctx.save(); ctx.translate(s.x + s.width/2, s.y + s.height/2);
            ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.shadowColor = '#FFF'; ctx.shadowBlur = 10; ctx.fillRect(-10,-10,20,20); ctx.shadowBlur = 0;
            ctx.fillStyle = '#4169E1'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🛡️',0,0); ctx.restore();
        });
    }

    drawParticles() {
        const ctx = this.ctx;
        this.game.particles.forEach(p => {
            ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.shadowColor = p.color; ctx.shadowBlur = 8; ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        });
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }

    drawScorePopups() {
        const ctx = this.ctx;
        this.game.scorePopups.forEach(s => {
            ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(255,215,0,${s.life})`; ctx.fillText(`+${s.value}`, s.x, s.y);
        });
    }

    drawGameOver() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0,0,this.game.canvas.width,this.game.canvas.height);
        ctx.fillStyle = '#ff4757';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.game.canvas.width/2, this.game.canvas.height/2 - 50);
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${this.game.score}`, this.game.canvas.width/2, this.game.canvas.height/2);
        ctx.fillText('Click to restart', this.game.canvas.width/2, this.game.canvas.height/2 + 50);
    }
}