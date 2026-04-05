import { circlePolygonCollision } from './utils.js';

export class Brick {
    constructor(x, y, width, height, type, hits = 1, color, shape = 'rect') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.hits = hits;
        this.color = color || this.defaultColor();
        this.shape = shape;
        this.active = true;
        this.movable = (type === 'lamp');
        this.vx = 0;
        this.vy = 0;
    }

    defaultColor() {
        const map = {
            normal: '#06D6A0',
            bonus: '#4169e1',
            penalty: '#FF4444',
            multiHit: '#FFFFFF',
            violet: '#8A2BE2',
            black: '#000000',
            pink: '#FF69B4',
            silver: '#C0C0C0',
            silverHard: '#C0C0C0',
            orange: '#FFA500',
            olo: '#FF00FF',
            chrono: '#00FFFF',
            score: '#FFD700',
            lamp: '#FFFFFF'
        };
        return map[this.type] || '#06D6A0';
    }

    hit() {
        this.hits--;
        if (this.hits <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }

    getVertices() {
        const w = this.width;
        const h = this.height;
        const x = this.x;
        const y = this.y;
        const vertices = [];

        switch (this.shape) {
            case 'rect':
                vertices.push({ x, y });
                vertices.push({ x: x + w, y });
                vertices.push({ x: x + w, y: y + h });
                vertices.push({ x, y: y + h });
                break;
            case 'circle':
                return null;
            case 'triangle':
                vertices.push({ x, y: y + h });
                vertices.push({ x, y });
                vertices.push({ x: x + w, y: y + h });
                break;
            case 'trapezoid':
                {
                    const topWidth = w * 0.6;
                    const offset = (w - topWidth) / 2;
                    vertices.push({ x: x + offset, y });
                    vertices.push({ x: x + w - offset, y });
                    vertices.push({ x: x + w, y: y + h });
                    vertices.push({ x, y: y + h });
                }
                break;
            case 'skew':
                {
                    const skew = h * 0.3;
                    vertices.push({ x: x + skew, y });
                    vertices.push({ x: x + w + skew, y });
                    vertices.push({ x: x + w, y: y + h });
                    vertices.push({ x, y: y + h });
                }
                break;
            case 'diamond':
                vertices.push({ x: x + w/2, y });
                vertices.push({ x: x + w, y: y + h/2 });
                vertices.push({ x: x + w/2, y: y + h });
                vertices.push({ x, y: y + h/2 });
                break;
            case 'pentagon':
                {
                    const cx = x + w/2;
                    const cy = y + h/2;
                    const r = Math.min(w, h) / 2;
                    for (let i = 0; i < 5; i++) {
                        const angle = (i * 2 * Math.PI / 5) - Math.PI/2;
                        vertices.push({
                            x: cx + r * Math.cos(angle),
                            y: cy + r * Math.sin(angle)
                        });
                    }
                }
                break;
            case 'hexagon':
                {
                    const cx = x + w/2;
                    const cy = y + h/2;
                    const r = Math.min(w, h) / 2;
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * 2 * Math.PI / 6) - Math.PI/2;
                        vertices.push({
                            x: cx + r * Math.cos(angle),
                            y: cy + r * Math.sin(angle)
                        });
                    }
                }
                break;
            case 'star':
                {
                    const cx = x + w/2;
                    const cy = y + h/2;
                    const outerR = Math.min(w, h) / 2;
                    const innerR = outerR * 0.4;
                    for (let i = 0; i < 10; i++) {
                        const r = (i % 2 === 0) ? outerR : innerR;
                        const angle = (i * Math.PI / 5) - Math.PI/2;
                        vertices.push({
                            x: cx + r * Math.cos(angle),
                            y: cy + r * Math.sin(angle)
                        });
                    }
                }
                break;
            case 'invtriangle':
                vertices.push({ x, y });
                vertices.push({ x: x + w, y });
                vertices.push({ x: x + w/2, y: y + h });
                break;
            case 'parallelogram':
                {
                    const offset = w * 0.2;
                    vertices.push({ x: x + offset, y });
                    vertices.push({ x: x + w, y });
                    vertices.push({ x: x + w - offset, y: y + h });
                    vertices.push({ x, y: y + h });
                }
                break;
            case 'trapezoid_inv':
                {
                    const topWidth = w * 0.6;
                    const offset = (w - topWidth) / 2;
                    vertices.push({ x, y });
                    vertices.push({ x: x + w, y });
                    vertices.push({ x: x + w - offset, y: y + h });
                    vertices.push({ x: x + offset, y: y + h });
                }
                break;
            case 'octagon':
                {
                    const offset = Math.min(w, h) * 0.2;
                    vertices.push({ x: x + offset, y });
                    vertices.push({ x: x + w - offset, y });
                    vertices.push({ x: x + w, y: y + offset });
                    vertices.push({ x: x + w, y: y + h - offset });
                    vertices.push({ x: x + w - offset, y: y + h });
                    vertices.push({ x: x + offset, y: y + h });
                    vertices.push({ x, y: y + h - offset });
                    vertices.push({ x, y: y + offset });
                }
                break;
            case 'house':
                {
                    vertices.push({ x, y: y + h * 0.3 });
                    vertices.push({ x: x + w/2, y });
                    vertices.push({ x: x + w, y: y + h * 0.3 });
                    vertices.push({ x: x + w, y: y + h });
                    vertices.push({ x, y: y + h });
                }
                break;
            case 'cutcorner':
                {
                    const cut = Math.min(w, h) * 0.2;
                    vertices.push({ x, y });
                    vertices.push({ x: x + w - cut, y });
                    vertices.push({ x: x + w, y: y + cut });
                    vertices.push({ x: x + w, y: y + h });
                    vertices.push({ x, y: y + h });
                }
                break;
            case 'plus':
            case 'xcross':
                return null;
            default:
                vertices.push({ x, y });
                vertices.push({ x: x + w, y });
                vertices.push({ x: x + w, y: y + h });
                vertices.push({ x, y: y + h });
        }
        return vertices;
    }

    // Новый swept-тест для прямоугольника (с использованием предыдущей позиции)
    sweepRectBall(prevX, prevY, ballX, ballY, r, nx, ny) {
        // упрощённо: проверяем пересечение отрезка с прямоугольником AABB
        let dirX = ballX - prevX;
        let dirY = ballY - prevY;
        let dist = Math.hypot(dirX, dirY);
        if (dist < 1e-6) return null; // мяч не двигался

        // нормализуем направление
        let vx = dirX / dist;
        let vy = dirY / dist;

        // вычислим время столкновения с каждой из плоскостей блока
        let tMin = 0, tMax = 1;
        let normal = { x: 0, y: 0 };

        // по X
        if (vx > 0) {
            tMin = Math.max(tMin, (this.x - r - prevX) / vx);
            tMax = Math.min(tMax, (this.x + this.width + r - prevX) / vx);
            normal.x = -1;
        } else if (vx < 0) {
            tMin = Math.max(tMin, (this.x + this.width + r - prevX) / vx);
            tMax = Math.min(tMax, (this.x - r - prevX) / vx);
            normal.x = 1;
        } else {
            // параллельно X – проверка, находится ли мяч в пределах по X
            if (prevX + r < this.x || prevX - r > this.x + this.width) return null;
        }

        // по Y
        if (vy > 0) {
            tMin = Math.max(tMin, (this.y - r - prevY) / vy);
            tMax = Math.min(tMax, (this.y + this.height + r - prevY) / vy);
            normal.y = -1;
        } else if (vy < 0) {
            tMin = Math.max(tMin, (this.y + this.height + r - prevY) / vy);
            tMax = Math.min(tMax, (this.y - r - prevY) / vy);
            normal.y = 1;
        } else {
            if (prevY + r < this.y || prevY - r > this.y + this.height) return null;
        }

        if (tMin <= tMax && tMin >= 0 && tMin <= 1) {
            // столкновение произошло
            let hitX = prevX + vx * tMin;
            let hitY = prevY + vy * tMin;
            // нормаль: выбираем ту, по которой было столкновение
            let nx = 0, ny = 0;
            if (Math.abs(normal.x) > Math.abs(normal.y)) {
                nx = normal.x;
            } else {
                ny = normal.y;
            }
            return { t: tMin, nx, ny, hitX, hitY };
        }
        return null;
    }

    collideBall(ball) {
        if (this.shape === 'circle') {
            let centerX = this.x + this.width/2;
            let centerY = this.y + this.height/2;
            let brickRadius = Math.min(this.width, this.height) / 2;
            let dx = ball.x - centerX;
            let dy = ball.y - centerY;
            let dist = Math.hypot(dx, dy);
            if (dist <= ball.radius + brickRadius) {
                let overlap = ball.radius + brickRadius - dist;
                if (dist > 0) {
                    let nx = dx / dist;
                    let ny = dy / dist;
                    return { collision: true, nx, ny, depth: overlap };
                } else {
                    return { collision: true, nx: 1, ny: 0, depth: overlap };
                }
            }
            return { collision: false };
        } else if (this.shape === 'plus' || this.shape === 'xcross') {
            // используем старую прямоугольную проверку для этих форм
            return this.collideRect(ball);
        } else {
            // для многоугольников используем polygon collision
            let vertices = this.getVertices();
            if (!vertices) {
                return this.collideRect(ball);
            }
            let result = circlePolygonCollision(ball.x, ball.y, ball.radius, vertices);
            // если столкновение произошло, depth уже есть
            return result;
        }
    }

    // Улучшенный collideRect с swept-тестом
    collideRect(ball) {
        // сначала пробуем swept-тест, если мяч двигался
        if (ball.prevX !== undefined && ball.prevY !== undefined) {
            let sweep = this.sweepRectBall(ball.prevX, ball.prevY, ball.x, ball.y, ball.radius);
            if (sweep) {
                // вычислим глубину проникновения – в момент столкновения мяч касается блока
                // можно установить depth как малое число, но для отскока нам нужна нормаль
                return { collision: true, nx: sweep.nx, ny: sweep.ny, depth: 0.1 }; // небольшая глубина для коррекции
            }
        }

        // если swept не дал результата, используем статическую проверку
        let left = this.x - ball.radius;
        let right = this.x + this.width + ball.radius;
        let top = this.y - ball.radius;
        let bottom = this.y + this.height + ball.radius;
        if (ball.x < left || ball.x > right || ball.y < top || ball.y > bottom) return { collision: false };
        let closestX = Math.max(this.x, Math.min(ball.x, this.x + this.width));
        let closestY = Math.max(this.y, Math.min(ball.y, this.y + this.height));
        let dx = ball.x - closestX;
        let dy = ball.y - closestY;
        let dist = Math.hypot(dx, dy);
        if (dist <= ball.radius) {
            let overlap = ball.radius - dist;
            if (dist > 0) {
                let nx = dx / dist;
                let ny = dy / dist;
                return { collision: true, nx, ny, depth: overlap };
            } else {
                let dl = ball.x - this.x;
                let dr = this.x + this.width - ball.x;
                let dt = ball.y - this.y;
                let db = this.y + this.height - ball.y;
                let minDist = Math.min(dl, dr, dt, db);
                if (minDist === dl) return { collision: true, nx: -1, ny: 0, depth: dl + ball.radius };
                if (minDist === dr) return { collision: true, nx: 1, ny: 0, depth: dr + ball.radius };
                if (minDist === dt) return { collision: true, nx: 0, ny: -1, depth: dt + ball.radius };
                return { collision: true, nx: 0, ny: 1, depth: db + ball.radius };
            }
        }
        return { collision: false };
    }
}