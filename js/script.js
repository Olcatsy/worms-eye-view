import drawing from './drawing.js';

const app = {};

app.inventory = document.querySelector('.inventory');
app.isScratching = false;
app.isTransparent = false; //might have to go to the image 
app.pixelsData = [];

// Checks transparency in a defined area. Returns true if all the pixels are transparent, and returns false as soon as it encounters a single non-transparent pixel
app.checkTransparency = (pixelData)  => {
  // accepts a Uint8ClampedArray (represents pixel data in RGBA format), iterates over each pixel and checks if it's alpha value is 0 (transparent)
  //? maybe change this to ~90% being scratched off, because otherwise if a single pixel isn't scratched off the whole thing doesn't work
  //? also if the user finishes scratching right on the item, it goes to the inventory right away, so I need to figure that out
  const l = pixelData.length;

  for (let i = 3; i < l; i += 4) {
    if (!(pixelData[i] === 0)) {
      return false;
    };
  }
  console.log('transparent');
  return true;
}

// Returns an object that stores dimensions and position of an interactive object on the canvas
app.getItemPosition = (itemId) => {
  const item = document.querySelector(`#${itemId}`);
  const itemRect = item.getBoundingClientRect();
  const itemPos = {
    top: itemRect.top,
    left: itemRect.left,
    width: itemRect.width,
    height: itemRect.height,
  }
  return itemPos;
}

// As the user is scratching this function continuously checks if the area above an interactive item is fully scratched off
app.scratchItem = (itemId, ctx) => {
  const itemPos = app.getItemPosition(itemId);
  if (app.isScratching) {
    // .getImageData returns a flat array representing RGBA values of each pixel in that order
    app.pixelsData = ctx.getImageData(itemPos.left, itemPos.top, itemPos.width, itemPos.height).data;
  
    // if checkTransparency returns 'true' set global isTransparent to true
    if (app.checkTransparency(app.pixelsData)) { app.isTransparent = true };
  }
}

// Draw an invisible square on the canvas in the same position as the clickable object below the canvas
app.createHitArea = (itemId, ctx) => {
  const itemPos = app.getItemPosition(itemId);
  const hitArea = new Path2D();
  hitArea.rect(itemPos.left, itemPos.top, itemPos.width, itemPos.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0, 1)';
  ctx.fill(hitArea);
  return hitArea;
}

// Detects if the user clicked on an interactive item
app.detectHitArea = (itemId, ctx, canvas, e) => {
  // Using ctx.isPointInPath check if the click event is within the boundaries of corresponding hit area and check if the corresponding area is fully scratched off
  // if both conditions are satisfied, move the item to inventory and unmount the canvas
  const item = document.querySelector(`#${itemId}`); // can I refactor this line?
  const rect = app.createHitArea(itemId, ctx);
  if (app.isTransparent && ctx.isPointInPath(rect, e.clientX, e.clientY)) {

    app.inventory.appendChild(item);
    canvas.parentNode.removeChild(canvas);
  }
}

app.canvasSetup = (canvasId, scene, layerNum, itemId) => {
  
  const canvas = document.getElementById(canvasId);
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
  drawing(canvas, ctx);

  // ***EVENT LISTENERS***--------------------
  // start scratching
  canvas.addEventListener('mousedown', () => app.isScratching = true);
  // end scratching
  canvas.addEventListener('mouseup', () => app.isScratching = false)
  // as the user is scratching, check if the defined area is fully scratched off 
  canvas.addEventListener('mousemove', () => app.scratchItem("item1", ctx))
  //*------------------------------------------

  //** INTERACTIONS WITH THE ITEM */

 
  canvas.addEventListener('click', e => {
    app.detectHitArea(itemId, ctx, canvas, e)
  })
};



app.init = () => {
  console.log("init!");
  app.canvasSetup('top-layer', 'a', 1, 'item1');
  app.canvasSetup('middle-layer', 'a', 2, 'item2');
  app.canvasSetup('bottom-layer', 'a', 3, 'item3');
};











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


docReady(function () {
  // DOM is loaded and ready for manipulation here
  app.init();
});