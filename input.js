import { isMobile } from './utils.js';

export class Input {
    constructor(game) {
        this.game = game;
        this.rightPressed = false;
        this.leftPressed = false;
        this.mobileLeft = false;
        this.mobileRight = false;
        this.mouseX = null;
    }

    setup() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.rightPressed = true;
            else if (e.key === 'ArrowLeft') this.leftPressed = true;
            else if (e.key === ' ') {
                if (this.game.gameOver) this.game.restart();
                else this.game.startGame();
            } else if (e.key === 'p' || e.key === 'P') {
                this.game.togglePause();
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowRight') this.rightPressed = false;
            else if (e.key === 'ArrowLeft') this.leftPressed = false;
        });

        this.game.canvas.addEventListener('mousemove', (e) => {
            if (this.game.paused || !this.game.gameStarted || this.game.gameOver || this.game.levelComplete || this.game.silenceMode) return;
            const rect = this.game.canvas.getBoundingClientRect();
            const canvasAspect = this.game.canvas.width / this.game.canvas.height;
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

            const mouseX = e.clientX - rect.left - offsetX;
            const mouseY = e.clientY - rect.top - offsetY;

            if (mouseX >= 0 && mouseX <= displayedWidth && mouseY >= 0 && mouseY <= displayedHeight) {
                this.mouseX = (mouseX / displayedWidth) * this.game.canvas.width;
            } else {
                this.mouseX = null;
            }
        });

        this.game.canvas.addEventListener('mouseleave', () => {
            this.mouseX = null;
        });

        this.game.canvas.addEventListener('click', () => {
            if (this.game.gameOver) this.game.restart();
            else if (this.game.paused || !this.game.gameStarted) this.game.startGame();
        });

        const leftBtn = document.querySelector('.left-btn');
        const rightBtn = document.querySelector('.right-btn');
        if (leftBtn && rightBtn) {
            const setLeft = (v) => { if (!this.game.levelComplete && !this.game.paused && !this.game.gameOver && !this.game.silenceMode) this.mobileLeft = v; };
            const setRight = (v) => { if (!this.game.levelComplete && !this.game.paused && !this.game.gameOver && !this.game.silenceMode) this.mobileRight = v; };
            leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setLeft(true); });
            leftBtn.addEventListener('touchend', (e) => { e.preventDefault(); setLeft(false); });
            leftBtn.addEventListener('mousedown', () => setLeft(true));
            leftBtn.addEventListener('mouseup', () => setLeft(false));
            leftBtn.addEventListener('mouseleave', () => setLeft(false));

            rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setRight(true); });
            rightBtn.addEventListener('touchend', (e) => { e.preventDefault(); setRight(false); });
            rightBtn.addEventListener('mousedown', () => setRight(true));
            rightBtn.addEventListener('mouseup', () => setRight(false));
            rightBtn.addEventListener('mouseleave', () => setRight(false));
        }

        document.getElementById('startButton').addEventListener('click', () => this.game.startGame());
    }
}