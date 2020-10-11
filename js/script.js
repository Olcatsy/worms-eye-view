import drawing from './drawing.js';
import data from './data.js';


const inventory = document.querySelector('.inventory');
let pixelsData; 
let isScratching = false;
let isTransparent = false; //keeps track of whether the image above the interactive object is fully scratched off
let itemPos;


// accepts a Uint8ClampedArray (represents pixel data in RGBA format), iterates over each pixel and checks if it's transparent (has alpha value of 0)
// returns false as soon as it encounters a non-transparent pixel, and returns true if all pixels are transparent
//? maybe change this to ~90% being scratched off, because otherwise if a single pixel isn't scratched off the whole thing doesn't work
//? also if the user finishes scratching right on the item, it goes to the inventory right away, so I need to figure that out
function checkTransparency(data) {
  //returns true if all pixels in the area are transparent
  const l = data.length;

  for (let i = 3; i < l; i += 4) {
    if (!(data[i] === 0)) {
      return false;
    };
  }
  console.log('transparent');
  return true;
}



// could be adapted to apply to every canvas if I pass canvas id into it 
function app() {

  // *** ITEM SETUP --------------------------------
  const item = document.querySelector('.item1');
  const itemRect = item.getBoundingClientRect();
  //stores the position and dimensions of the interactive object
  itemPos = {
    top: itemRect.top,
    left: itemRect.left,
    width: itemRect.width,
    height: itemRect.height,
  }

  
  
  //*--------------------------------------------


  // *** CANVAS SETUP *** -----------------------
  function canvasSetup(canvasId, scene, layerNum) {
    const  canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    
    // Load overlay image -------------
    const img = new Image();
    img.addEventListener('load', () => {
      ctx.drawImage(img, 0, 0);
    })
    img.src = `./assets/layer_${scene}_0${layerNum}.jpg`


    // set up the brush and load drawing functions -------
    ctx.strokeStyle = 'white';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 40;

    drawing(canvas, ctx)
    // ------------------------
    //*-----------------------------------------


    


    //** INTERACTIONS WITH THE ITEM */
    // Draw an invisible square on the canvas in the same position as the clickable object below the canvas
    const rectangle = new Path2D();
    console.log(itemPos)
    rectangle.rect(itemPos.left, itemPos.top, itemPos.width, itemPos.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0, 1)';
    ctx.fill(rectangle);

    // Using ctx.isPointInPath check if the click event is within the boundaries of the rectangle and check if the corresponding area is fully scratched off
    // if both conditions are satisfied, move the item to inventory and unmount the canvas
    canvas.addEventListener('click', e => {
      if (isTransparent && ctx.isPointInPath(rectangle, e.clientX, e.clientY)) {

        inventory.appendChild(item);
        canvas.parentNode.removeChild(canvas);
      }
    })
  }

  canvasSetup('top-layer', 'a', 1);
  canvasSetup('middle-layer', 'a', 2);
  canvasSetup('bottom-layer', 'a', 3);
}










// Wait for the DOM to be fully loaded and ready before running the app function
function docReady(fn) {
  // see if DOM is already available
  if (document.readyState === "complete" || document.readyState === "interactive") {
      // call on next available tick
      setTimeout(fn, 1);
  } else {
      document.addEventListener("DOMContentLoaded", fn);
  }
} 


docReady(function() {
  // DOM is loaded and ready for manipulation here
  app();
});


