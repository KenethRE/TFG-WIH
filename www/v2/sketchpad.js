const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

let isDrawing = false;
let isErasing = false;

// Set initial drawing properties
ctx.lineWidth = 5; // Line width
ctx.lineCap = 'round'; // Round the corners of the lines
ctx.strokeStyle = 'black'; // Set the color of the strokes

// Adjust the mouse event coordinates relative to the canvas
function getCanvasCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX || e.touches[0].clientX;  // Handle mouse or touch
        const y = e.clientY || e.touches[0].clientY;  // Handle mouse or touch
        return {
            x: x - rect.left,
            y: y - rect.top
        };
    }

// Create color picker
const colorLabel = document.getElementById('colorLabel') || document.createElement('label');
colorLabel.textContent = 'Color: ';
colorLabel.style.margin = '10px';

const colorPicker = document.getElementById('colorPicker') || document.createElement('input');
colorPicker.type = 'color';
colorPicker.value = '#000000';
colorPicker.style.verticalAlign = 'middle';
colorPicker.style.marginRight = '10px';

colorPicker.addEventListener('input', () => {
    if (!isErasing) {
        ctx.strokeStyle = colorPicker.value;
    }
});

// Create toggle erase button
const eraseBtn = document.getElementById('eraseBtn') || document.createElement('button');
eraseBtn.textContent = 'Toggle Erase';
eraseBtn.style.margin = '10px';

eraseBtn.addEventListener('click', () => {
    isErasing = !isErasing;
    if (isErasing) {
        ctx.strokeStyle = 'white';
        eraseBtn.textContent = 'Erase Mode';
    } else {
        ctx.strokeStyle = colorPicker.value;
        eraseBtn.textContent = 'Drawing Mode';
    }
});

// Create clear canvas button
const clearButton = document.getElementById('clearButton') || document.createElement('button');
clearButton.textContent = 'Clear Canvas';
clearButton.style.margin = '10px';

// Add event listener to clear the canvas
clearButton.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Create stroke size slider
const strokeSlider = document.getElementById('sizeRange') || document.createElement('input');
strokeSlider.type = 'range';
strokeSlider.min = 1;
strokeSlider.max = 50;
strokeSlider.value = ctx.lineWidth;
strokeSlider.style.verticalAlign = 'middle';
strokeSlider.style.marginRight = '10px';

const sliderValue = document.getElementById('sizeValue') || document.createElement('span');
sliderValue.textContent = ctx.lineWidth;

strokeSlider.addEventListener('input', () => {
    ctx.lineWidth = strokeSlider.value;
    sliderValue.textContent = strokeSlider.value;
});

sliderValue.addEventListener('change', () => {
    sliderValue.textContent = strokeSlider.value;
});

// Start drawing when mouse is pressed
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    ctx.beginPath();  // Start a new path
    const { x, y } = getCanvasCoordinates(e);
    ctx.moveTo(x, y);  // Move to mouse position, make sure we are inside the canvas
});

// Draw when mouse is moved while pressed
canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);  // Draw a line to the current mouse position
    ctx.stroke();  // Apply the stroke
});

// Stop drawing when mouse is released
canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

// Optionally, stop drawing when mouse leaves the canvas
canvas.addEventListener('mouseout', () => {
    isDrawing = false;
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();  // Prevent default touch behavior
    isDrawing = true;
    const touch = e.touches[0];
    ctx.beginPath();
    const { x, y } = getCanvasCoordinates(touch);
    ctx.moveTo(x, y);  // Move to touch position, make sure we are inside the canvas
});
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();  // Prevent default touch behavior
    if (!isDrawing) return;
    const touch = e.touches[0];
    const { x, y } = getCanvasCoordinates(touch);
    ctx.lineTo(x, y);  // Draw a line to the current touch position
    ctx.stroke();
});
canvas.addEventListener('touchend', () => {
    isDrawing = false;
});
canvas.addEventListener('touchcancel', () => {
    isDrawing = false;
});
