let isDrawing = false;
let isErasing = false;

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


// Create stroke size slider
const strokeSlider = document.getElementById('sizeRange') || document.createElement('input');
strokeSlider.type = 'range';
strokeSlider.min = 1;
strokeSlider.max = 50;
strokeSlider.value = 5;
strokeSlider.style.verticalAlign = 'middle';
strokeSlider.style.marginRight = '10px';

const sliderValue = document.getElementById('sizeValue') || document.createElement('span');
sliderValue.textContent = strokeSlider.value;

strokeSlider.addEventListener('input', () => {
    sliderValue.textContent = strokeSlider.value;
});

sliderValue.addEventListener('change', () => {
    sliderValue.textContent = strokeSlider.value;
});