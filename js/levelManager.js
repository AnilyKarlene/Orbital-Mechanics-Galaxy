import { Brick } from './brick.js';

export class LevelManager {
    constructor(game) {
        this.game = game;
        this.legacyPatterns = [[
            [0,0,1,0,0,1,0,0,1,0,0],
            [0,1,1,1,0,1,0,1,1,1,0],
            [1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1],
            [0,1,1,1,1,1,1,1,1,1,0],
            [0,0,1,1,1,1,1,1,1,0,0],
            [0,0,0,1,1,1,1,1,0,0,0],
            [0,0,0,0,1,1,1,0,0,0,0],
            [0,0,0,0,0,1,0,0,0,0,0]
        ]];

        this.customLevels = [
            (canvas) => {
                const blocks = [];
                const cols = 12, rows = 7;
                const margin = 20;
                const availableWidth = canvas.width - 2 * margin;
                const availableHeight = canvas.height * 0.45;
                const brickW = Math.min(60, availableWidth / cols - 6);
                const brickH = Math.min(30, availableHeight / rows - 4);
                const startX = (canvas.width - (cols * (brickW + 6) - 6)) / 2;
                const startY = 50;
                const used = new Set();
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (Math.random() < 0.75) {
                            const x = startX + c * (brickW + 6);
                            const y = startY + r * (brickH + 4);
                            const key = `${Math.round(x)},${Math.round(y)}`;
                            if (!used.has(key)) {
                                used.add(key);
                                let type = 'normal', color = '#06D6A0', hits = 1;
                                const rand = Math.random();
                                if (rand < 0.17) { type = 'penalty'; color = '#FF4444'; }
                                else if (rand < 0.34) { type = 'multiHit'; color = '#FFFFFF'; hits = 2 + Math.floor(Math.random() * 2); }
                                else if (rand < 0.48) { type = 'score'; color = '#FFD700'; }
                                else if (rand < 0.62) { type = 'bonus'; color = '#4169e1'; }
                                else if (rand < 0.70) { type = 'black'; color = '#000000'; }
                                else if (rand < 0.76) { type = 'pink'; color = '#FF69B4'; }
                                else if (rand < 0.80) { type = 'silver'; color = '#C0C0C0'; }
                                else if (rand < 0.83) { type = 'silverHard'; color = '#C0C0C0'; hits = 10 + Math.floor(Math.random() * 6); }
                                else if (rand < 0.86) { type = 'orange'; color = '#FFA500'; }
                                else if (rand < 0.89) { type = 'olo'; color = '#FF00FF'; }
                                else if (rand < 0.91) { type = 'chrono'; color = '#00FFFF'; hits = 3 + Math.floor(Math.random() * 3); }
                                blocks.push({ x, y, width: brickW, height: brickH, type, hits, color, shape: 'rect' });
                            }
                        }
                    }
                }
                for (let i = 0; i < 6; i++) {
                    const x = startX + i * (brickW + 6) * 1.5;
                    const y = startY - brickH - 10;
                    const key = `${Math.round(x)},${Math.round(y)}`;
                    if (!used.has(key)) {
                        used.add(key);
                        blocks.push({ x, y, width: brickW, height: brickH, type: 'penalty', hits: 1, color: '#FF4444', shape: 'rect' });
                    }
                }
                return blocks;
            }
        ];
    }

    convertPatternToBlocks(pattern) {
        const bricks = [];
        const brickWidth = 40, brickHeight = 20, brickPadding = 6;
        const rows = pattern.length, cols = pattern[0].length;
        const totalWidth = cols * (brickWidth + brickPadding) - brickPadding;
        const startX = (this.game.canvas.width - totalWidth) / 2;
        const brickOffsetTop = 40;
        const used = new Set();
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (pattern[r][c] === 1) {
                    const x = startX + c * (brickWidth + brickPadding);
                    const y = brickOffsetTop + r * (brickHeight + brickPadding);
                    const key = `${Math.round(x)},${Math.round(y)}`;
                    if (!used.has(key)) {
                        used.add(key);
                        let type = 'normal', color = '#06D6A0', hits = 1;
                        const rand = Math.random();
                        if (rand < 0.12) { type = 'bonus'; color = '#4169e1'; }
                        else if (rand < 0.24) { type = 'penalty'; color = '#FF4444'; }
                        else if (rand < 0.36) { type = 'multiHit'; color = '#FFFFFF'; hits = 2 + Math.floor(Math.random() * 2); }
                        else if (rand < 0.45) { type = 'score'; color = '#FFD700'; }
                        else if (rand < 0.51) { type = 'black'; color = '#000000'; }
                        else if (rand < 0.55) { type = 'pink'; color = '#FF69B4'; }
                        else if (rand < 0.58) { type = 'silver'; color = '#C0C0C0'; }
                        else if (rand < 0.60) { type = 'silverHard'; color = '#C0C0C0'; hits = 10 + Math.floor(Math.random() * 6); }
                        else if (rand < 0.62) { type = 'orange'; color = '#FFA500'; }
                        else if (rand < 0.64) { type = 'olo'; color = '#FF00FF'; }
                        else if (rand < 0.66) { type = 'chrono'; color = '#00FFFF'; hits = 3 + Math.floor(Math.random() * 3); }
                        bricks.push(new Brick(x, y, brickWidth, brickHeight, type, hits, color, 'rect'));
                    }
                }
            }
        }
        return bricks;
    }

    loadLevel(levelNum) {
        const idx = (levelNum - 1) % (this.legacyPatterns.length + this.customLevels.length);
        if (idx < this.legacyPatterns.length) {
            return this.convertPatternToBlocks(this.legacyPatterns[idx]);
        } else {
            const customIdx = idx - this.legacyPatterns.length;
            const generator = this.customLevels[customIdx];
            const rawBlocks = generator(this.game.canvas);
            return rawBlocks.map(b => new Brick(b.x, b.y, b.width, b.height, b.type, b.hits || 1, b.color, b.shape || 'rect'));
        }
    }
}