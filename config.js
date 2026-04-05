// Конфигурация игры
export const CONFIG = {
    canvas: { width: 900, height: 600 },
    ball: { radius: 10, speed: 3, maxSpeed: 12 },
    paddle: { width: 100, height: 15, speed: 8, color: '#8a2be2' },
    effects: {
        giantBallDuration: 15 * 60,
        piercingDuration: 10 * 60,
        silenceDuration: 3 * 60,
        paddleFlameDuration: 5 * 60,
        paddlePlasmaDuration: 5 * 60,
        lowBlockTimerFrames: 20 * 60,
        lightSpeedMultiplier: 2.0,
        giantChance: 0.2
    },
    bonuses: {
        levelComplete: 100,
        under30sec: 150,
        under60sec: 50,
        noSourHoming: 150,
        perYellowBlock: 25,
        extraBall: 50,
        goldenBall: 100,
        noLifeLost: 100,
        noBallLost: 150,
        blackBallPresent: 50,
        highSpeed: 50
    }
};

export const THEME_NAME = 'Лунное затмение';