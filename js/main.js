import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        window.game = new Game();
    } catch (e) {
        console.error('Ошибка инициализации игры:', e);
        alert('Не удалось запустить игру. Проверьте консоль.');
    }
});