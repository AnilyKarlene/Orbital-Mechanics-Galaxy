// Вспомогательные функции

export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || (window.innerWidth <= 768);
}

// Проверка пересечения круга с выпуклым многоугольником
export function circlePolygonCollision(cx, cy, r, vertices) {
    let collision = false;
    let closestDist = Infinity;
    let normal = { x: 0, y: 0 };

    for (let i = 0; i < vertices.length; i++) {
        let j = (i + 1) % vertices.length;
        let a = vertices[i];
        let b = vertices[j];

        let ab = { x: b.x - a.x, y: b.y - a.y };
        let len = Math.hypot(ab.x, ab.y);
        if (len === 0) continue;
        let abNorm = { x: ab.x / len, y: ab.y / len };

        let ac = { x: cx - a.x, y: cy - a.y };
        let t = ac.x * abNorm.x + ac.y * abNorm.y;
        t = Math.max(0, Math.min(len, t));
        let proj = { x: a.x + abNorm.x * t, y: a.y + abNorm.y * t };

        let dx = cx - proj.x;
        let dy = cy - proj.y;
        let dist = Math.hypot(dx, dy);
        if (dist < closestDist) {
            closestDist = dist;
            if (dist > 0) {
                normal.x = dx / dist;
                normal.y = dy / dist;
            } else {
                normal.x = -abNorm.y;
                normal.y = abNorm.x;
            }
        }
    }

    if (closestDist <= r) {
        return { collision: true, nx: normal.x, ny: normal.y, depth: r - closestDist };
    }
    return { collision: false };
}

// Метод roundRect для контекста рисования
CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    return this;
};