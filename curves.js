class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    equalsPoint(other) {
        return Math.sqrt(
            Math.pow(this.x - other.x, 2) +
            Math.pow(this.y - other.y, 2)
        )
            <= POINT_SIZE;
    }
    distance(other) {
        return Math.sqrt(
            Math.pow(this.x - other.x, 2) +
            Math.pow(this.y - other.y, 2)
        )
    }
}

// draw line from start to end
function drawLine(ctx, start, end, color) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color;
    ctx.stroke();
}

// draw path traced by points array
function drawPath(ctx, points, color) {
    if (points.length == 0) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = color;
    ctx.stroke();
}

// draw circle
function drawCircle(ctx, origin, radius, color, fill = false) {
    let sides = Math.PI * radius;
    drawEllipseFragmented(ctx, origin, radius, radius, 0, sides, color, fill);
}

// draw polygon
function drawPolygon(ctx, origin, radius, sides, rotation, color, fill = false) {
    drawEllipseFragmented(ctx, origin, radius, radius, rotation, sides, color, fill);
}

// draw ellipse
function drawEllipse(ctx, origin, hr, vr, rotation, color, fill = false) {
    let sides = Math.PI * Math.max(hr, vr);
    drawEllipseFragmented(ctx, origin, hr, vr, rotation, sides, color, fill = false);
}

// draw ellipse with rotation and number of sides
function drawEllipseFragmented(ctx, origin, hr, vr, rotation, sides, color, fill = false) {
    ctx.beginPath();

    // drawing one polygon/circle
    for (let t = 0; t <= 2 * Math.PI; t += 2 * Math.PI / sides) {
        // we get these formulas by applying rotation transformation matrix to hr*cos(t), vr*sin(t)
        // rotation matrix is derived by finding where i and j lands after rotation
        // i ==> (cos rot, sin rot), j ==> (-sin rot, cos rot)
        x = origin.x + Math.cos(t) * Math.cos(rotation) * hr - Math.sin(t) * Math.sin(rotation) * vr;
        y = origin.y + Math.sin(t) * Math.cos(rotation) * vr + Math.cos(t) * Math.sin(rotation) * hr;
        ctx.lineTo(x, y);
    }
    ctx.closePath();

    if (fill) {
        ctx.fillStyle = color;
        ctx.fill();
    }
    else {
        ctx.strokeStyle = color;
        ctx.stroke();
    }
}

// draw arc
function drawArc(ctx, origin, start, end, radius, type, color) {
    if (end < start) {
        let temp = start;
        start = end;
        end = temp;
    }
    ctx.beginPath();

    let startX = origin.x + Math.cos(degToRad(start)) * radius;
    let startY = origin.y + Math.sin(degToRad(start)) * radius;

    if (type == "segment") {
        ctx.moveTo(startX, startY);
    }
    if (type == "sector") {
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(startX, startY);
    }

    // drawing arc
    for (let t = degToRad(start); t <= degToRad(end); t += 0.01) {
        let x = origin.x + Math.cos(t) * radius;
        let y = origin.y + Math.sin(t) * radius;
        ctx.lineTo(x, y);
    }

    if (type == "sector") {
        ctx.lineTo(origin.x, origin.y);
    }
    if (type == "segment") {
        ctx.closePath();
    }

    ctx.strokeStyle = color;
    ctx.stroke();
}

// draw rectangle
function drawRect(ctx, start, width, height, color, fill = true) {
    if (fill) {
        ctx.fillStyle = color;
        ctx.fillRect(start.x, start.y, width, height);
    }
    else {
        ctx.strokeStyle = color;
        ctx.strokeRect(start.x, start.y, width, height);
    }
}

// draw sin or cosine
function drawTrig(ctx, width, height, amplitude, frequency, color, curveFunc, pd = 0, res = 1) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    let amplitudeInPx = (amplitude / 100) * height / 2; // amplitude is in %. ampHeight is relative to height of canvas.
    for (let x = -width / 2; x < width / 2; x += res) {
        y = curveFunc(x / width * 2 * Math.PI * frequency + degToRad(pd)) * amplitudeInPx;
        ctx.lineTo(x, y);
        ctx.stroke();
    }
}

// utility functions
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}