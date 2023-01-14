const BG_COLOR = 'rgb(255,255,255)';
const GRID_COLOR = 'rgba(120,120,120)';
const UNDO_LIMIT = 16;

const myCanvas = document.querySelector(".myCanvas");
const gridCanvas = document.querySelector(".gridCanvas");
const toolbar = document.querySelector(".toolbar");
const width = myCanvas.width = window.innerWidth - toolbar.offsetWidth;
const height = myCanvas.height = window.innerHeight;
gridCanvas.width = width;
gridCanvas.height = height;

const ctx = myCanvas.getContext("2d");
const grid_ctx = gridCanvas.getContext("2d");

// variables to track mouse position and state of pressed
let startPos; // mouse position when it is pressed - used for drawing shapes
let prevPos; // previous mouse position when it is moving - used for mandala
let currPos; // current mouse position 
let drawing = false; // to indicate if mouse if pressed
let snapshot; // image data of current frame 
let undoStack = [], redoStack = [];


// variables from user input
let type = "pen";
let mandala = false, showGrid = false, sectorCount = 16;

const colorPicker = document.querySelector('input[type="color"]');
const sizePicker = document.querySelector('input[type="range"]');
// selecting brush type
document.querySelectorAll('input[name="type"]').forEach(typeRadio =>
    typeRadio.addEventListener('click', () => {
        type = typeRadio.value;
    })
);

document.getElementById('mandala').addEventListener(
    'click', () => {
        mandala = !mandala;
        if (!mandala) {
            showGrid = false;
            grid_ctx.clearRect(0, 0, width, height);
            document.getElementById('showGrid').checked = false;
        }
        document.getElementById('showGrid').disabled = !mandala;
    }
);
document.getElementById('showGrid').addEventListener(
    'click', () => {
        showGrid = !showGrid;
        if (showGrid) drawMandalaGrid(grid_ctx);
        else grid_ctx.clearRect(0, 0, width, height);
    }
);

document.getElementById('sectorCount').addEventListener(
    'input', () => {
        sectorCount = parseInt(document.getElementById('sectorCount').value);
        drawMandalaGrid(grid_ctx);
    }
)

// change the cursor according to type selected
// use circle for pen and eraser
// use crosshair for shapes - circle, rectangle, line
const penCursor = document.querySelector('.pen');

document.addEventListener('mousemove', e => draw(e));
document.addEventListener('mousedown', (e) => startDraw(e));
document.addEventListener('mouseup', (e) => finishDraw(e));

document.querySelector('.clearButton').addEventListener('click', () => {
    ctx.clearRect(0, 0, width, height);
    trackStep();
});

document.querySelector('.saveButton').addEventListener('click', () => {
    const link = document.createElement("a"); // creating <a> element
    link.download = `${Date.now()}.png`; // passing current date as link download value
    link.href = myCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream"); // passing canvasData as link href value
    link.click(); // clicking link to download image
})

const undoBtn = document.querySelector('.undoButton');
const redoBtn = document.querySelector('.redoButton');
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);


// undo redo functions
function trackStep() {
    if (undoStack.length <= UNDO_LIMIT) {
        undoStack.push(ctx.getImageData(0, 0, width, height));
        undoBtn.disabled = (undoStack.length <= 1);
    }
}

function undo() {
    if (undoStack.length <= 1) return;

    // push the top frame to redo stack
    redoStack.push(undoStack.pop());

    // display the next top frame of undo stack after removing topmost frame
    ctx.putImageData(undoStack[undoStack.length - 1], 0, 0);

    redoBtn.disabled = (redoStack.length == 0);
    undoBtn.disabled = (undoStack.length <= 1);
}

function redo() {
    if (redoStack.length <= 0) return;

    // display top frame of redo stack
    ctx.putImageData(redoStack[redoStack.length - 1], 0, 0);

    // push the top frame to undo stack
    undoStack.push(redoStack.pop());

    redoBtn.disabled = (redoStack.length == 0);
    undoBtn.disabled = (undoStack.length <= 1);
}

// functions to draw on canvas
function drawMandalaGrid(ctx) {
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    for (let theta = 0; theta <= 2 * Math.PI; theta += 2 * Math.PI / sectorCount) {
        ctx.moveTo(width / 2, height / 2);
        // translate point with origin as center of the canvas
        ctx.lineTo(width * Math.cos(theta) + width / 2, height / 2 - width * Math.sin(theta));
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = GRID_COLOR;
    ctx.stroke();
}

function startDraw(e) {
    if(e.pageX > width) return;
    e.preventDefault();
    drawing = true;

    // set start position for drawing shapes
    startPos = new Point(e.pageX, e.pageY);
    prevPos = startPos;

    // setting color and other attributes
    if (type == "eraser") {
        ctx.strokeStyle = BG_COLOR;
    }
    else {
        ctx.fillStyle = colorPicker.value;
        ctx.strokeStyle = colorPicker.value;
    }
    ctx.lineWidth = sizePicker.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // get snapshot of the canvas
    snapshot = ctx.getImageData(0, 0, width, height);

    if (type == "fill") {
        floodfill(snapshot.data, startPos.x, startPos.y, width, height);
        drawing = false;
    }
    if (type == "text") {
        ctx.font = "30px Arial";
        let userEnteredText = prompt("Enter the text: ");
        if (userEnteredText) {
            ctx.fillText(userEnteredText, currPos.x, currPos.y);
        }
        drawing = false;
    }

    ctx.beginPath();
}

function floodfill(data, x, y, w, h) {
    let c = getClampedIndex(x, y, w);
    let selectedColor = new RGBAColor(data[c], data[c + 1], data[c + 2], data[c + 3]);
    let targetColor = hexToRgba(colorPicker.value);

    // use BFS to go through all the pixels which are within the boundary of other color
    let queue = [];
    queue.push(new Point(x, y));

    let visited = new Array(w).fill(false).map(() => new Array(h).fill(false));
    console.log(visited.length, visited[0].length);

    while (queue.length > 0) {
        let currPoint = queue.pop();

        // set the color to target color
        let currClampedIndex = getClampedIndex(currPoint.x, currPoint.y, w);
        snapshot.data[currClampedIndex] = targetColor.r;
        snapshot.data[currClampedIndex + 1] = targetColor.g;
        snapshot.data[currClampedIndex + 2] = targetColor.b;
        snapshot.data[currClampedIndex + 3] = targetColor.a;

        // go through each adjacent pixel, check if it needs to be filled and add in the queue if not visited
        let adj = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
        adj.forEach(offset => {
            let adjPixel = checkToFill(data, currPoint.x + offset[0], currPoint.y + offset[1], w, h, selectedColor);
            if (adjPixel && !visited[adjPixel.x][adjPixel.y]) {
                visited[adjPixel.x][adjPixel.y] = true;
                queue.push(adjPixel);
            }
        });
    }

    // display the new calculated pixel data 
    ctx.putImageData(snapshot, 0, 0);
    drawing = false;
}

// check if the pixel needs to be filled - if it is within the canvas and if the pixel has same color as of selected pixel
function checkToFill(data, x, y, w, h, selectedColor) {
    let index = getClampedIndex(x, y, w);
    if (0 <= x && x < w && 0 <= y && y < h &&
        new RGBAColor(data[index], data[index + 1], data[index + 2], data[index + 3]).equals(selectedColor, 10)) {
        return new Point(x, y);
    }
    return undefined;
}

function draw(e) {
    if(e.pageX > width) return;
    e.preventDefault();
    currPos = new Point(e.pageX, e.pageY);

    let penSize = parseFloat(sizePicker.value);

    // setting cursor for mouse move
    if (type == "pen" || type == "eraser" || type == "fill") {
        myCanvas.style.cursor = "none";
        gridCanvas.style.cursor = "none";
        penCursor.style.background = type == "eraser" ? BG_COLOR : colorPicker.value;
        penCursor.style.width = penSize + 'px';
        penCursor.style.height = penSize + 'px';
        penCursor.style.display = 'block';
        penCursor.style.transform = `translate3d(${currPos.x}px, ${currPos.y}px, 0)`;
    }
    else {
        penCursor.style.display = "none";
        myCanvas.style.cursor = "crosshair";
        gridCanvas.style.cursor = "crosshair";
    }

    if (!drawing) return;

    // put snapshot of the canvas same as of mouse drag start
    ctx.putImageData(snapshot, 0, 0);

    // draw
    if (type == "pen" || type == "eraser") {
        if (mandala) {
            // draw in all sectors
            for (let i = 0; i < sectorCount; i++) {
                let prevPosInMandala = translateInMandala(prevPos, i, sectorCount);
                let currPosInMandala = translateInMandala(currPos, i, sectorCount);
                ctx.moveTo(prevPosInMandala.x, prevPosInMandala.y);
                ctx.lineTo(currPosInMandala.x, currPosInMandala.y);
            }
        }
        else {
            ctx.lineTo(currPos.x, currPos.y);
        }
        ctx.stroke();
        prevPos = currPos;
    }
    // draw shapes
    else if (type == "rectangle") {
        drawRect(ctx, startPos, currPos.x - startPos.x, currPos.y - startPos.y, colorPicker.value, false);
    }
    else if (type == "circle") {
        drawCircle(ctx, startPos, startPos.distance(currPos), colorPicker.value, false);
    }
    else if (type == "line") {
        drawLine(ctx, startPos, currPos, colorPicker.value);
    }

}

function finishDraw(e) {
    if(e.pageX > width) return;
    drawing = false;
    trackStep();
}

//utils
class RGBAColor {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    equals(other, margin = 0) {
        return this.r - other.r <= margin &&
            this.g - other.g <= margin &&
            this.b - other.b <= margin &&
            this.a - other.a <= margin;
    }
}

/** Given index of a pixel, get its index in clamped array */
function getClampedIndex(x, y, w) {
    return (x + y * w) * 4;
}

/** Convert hex string to rgba color */
function hexToRgba(color) {
    return new RGBAColor(
        parseInt('0x' + color.substring(1, 3)),
        parseInt('0x' + color.substring(3, 5)),
        parseInt('0x' + color.substring(5, 7)),
        255
    )
}

/** Get coordinates of a point in i th sector out of n sectors in mandala */
function translateInMandala(mousePos, i, n) {
    // convert the point to coordinate system with origin at center of canvas
    let pt = new Point(mousePos.x - width / 2, height / 2 - mousePos.y);

    // calculate the position of point in mandala
    let r = pt.distance(new Point(0, 0));
    let theta = Math.atan2(pt.y, pt.x);
    let mTrans = new Point(r * Math.cos(theta + i * 2 * Math.PI / n), r * Math.sin(theta + i * 2 * Math.PI / n));

    // convert the point back to coordinate system with origin at canvas start
    return new Point(mTrans.x + width / 2, height / 2 - mTrans.y);
}