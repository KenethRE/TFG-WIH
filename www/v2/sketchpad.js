    // Get the specific canvas element from the HTML document
    var canvas = document.getElementById('sketchpad');

    // If the browser supports the canvas tag, get the 2d drawing context for this canvas
    if (canvas.getContext)
        var ctx = canvas.getContext('2d');

    // Draws a dot at a specific position on the supplied canvas name
    // Parameters are: A canvas context, the x position, the y position
    function drawDot(ctx,x,y) {
        // Let's use black by setting RGB values to 0, and 255 alpha (completely opaque)
        r=0; g=0; b=0; a=255;

        // Select a fill style
        ctx.fillStyle = "rgba("+r+","+g+","+b+","+(a/255)+")";
        // Draw a filled circle
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
    }

     // Define some variables to keep track of the mouse status 
     var mouseX,mouseY,mouseDown=0;

     function sketchpad_mouseDown() {
         mouseDown=1;
         drawDot(ctx,mouseX,mouseY);
     }
 
     function sketchpad_mouseUp() {
         mouseDown=0;
     }
 
     function sketchpad_mouseMove(e) { 
         // Update the mouse co-ordinates when moved
         getMousePos(e);
 
         // Draw a pixel if the mouse button is currently being pressed 
         if (mouseDown==1) { 
             drawDot(ctx,mouseX,mouseY); 
         }
     }
 
     // Get the current mouse position relative to the top-left of the canvas
     function getMousePos(e) {
         if (!e)
          var e = event;
 
         if (e.offsetX) {
             mouseX = e.offsetX;
             mouseY = e.offsetY;
         }
         else if (e.layerX) {
             mouseX = e.layerX;
             mouseY = e.layerY;
         }
     }

canvas.addEventListener('mousedown', sketchpad_mouseDown, false);
canvas.addEventListener('mousemove', sketchpad_mouseMove, false);
window.addEventListener('mouseup', sketchpad_mouseUp, false);