import helper from './helper.js';
import drawing from './drawing.js';
import data from './data.js';

const app = {};

app.inventory = document.querySelector('.inventory');
app.isScratching = false;
app.isTransparent = false; //might have to go to the image 

// Create an interactive object from data and add it to the page
app.addItem = (scene, layerNum) => {
  const container = document.querySelector(`#layer_0${layerNum}  .objects-container`);
  const itemsArr = data[`scene_${scene}`][`layer_0${layerNum}`].interactive_items;
  
  itemsArr.map((item) => {
    const html = document.createElement('img');
    html.setAttribute('class', 'item');
    html.setAttribute('src', `${item.src}`);
    html.setAttribute('alt', `${item.alt}`);
    html.setAttribute('id', `${item.id}`);
    html.setAttribute('data-scene', `a`);
    html.setAttribute('data-layer', `${layerNum}`);
    container.appendChild(html);
  })
}

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


// As the user is scratching this function continuously checks if the area above an interactive item is fully scratched off
app.scratchItem = (ctx, itemPos) => {
  let pixelsData;
  if (app.isScratching) {
    // .getImageData returns a flat array representing RGBA values of each pixel in that order
    pixelsData = ctx.getImageData(itemPos.left, itemPos.top, itemPos.width, itemPos.height).data;
  
    // if checkTransparency returns 'true' set global isTransparent to true
    if (app.checkTransparency(pixelsData)) { app.isTransparent = true };
  }
}

// Draw an invisible square on the canvas in the same position as the clickable object below the canvas
app.createHitArea = (itemPos, ctx) => {
  const hitArea = new Path2D();
  hitArea.rect(itemPos.left, itemPos.top, itemPos.width, itemPos.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0, 1)';
  ctx.fill(hitArea);
  return hitArea;
}

// Detects if the user clicked on an interactive item
app.detectHitArea = (item, itemPos, ctx, canvas, e) => {
  // Using ctx.isPointInPath check if the click event is within the boundaries of corresponding hit area and check if the corresponding area is fully scratched off
  // if both conditions are satisfied, move the item to inventory and unmount the canvas
  const rect = app.createHitArea(itemPos, ctx);
  if (app.isTransparent && ctx.isPointInPath(rect, e.clientX, e.clientY)) {

    app.inventory.appendChild(item);
    canvas.parentNode.removeChild(canvas);
    app.isTransparent = false;
  }
}


//canvasId, scene, layerNum, itemId
app.canvasSetup = (scene, layerNum) => {
  const item = document.querySelector(`#item_${scene}_0${layerNum}_01`);

  console.log(item);
  const itemPos = data[`scene_${scene}`][`layer_0${layerNum}`].interactive_items[0].digSitePosition;
  

  const canvas = document.getElementById(`canvas_0${layerNum}`);
  const ctx = canvas.getContext('2d');
  canvas.width = 1000;
  canvas.height = 500;

  // Load overlay image
  const img = new Image();
  img.addEventListener('load', () => {
    ctx.drawImage(img, 0, 0);
  })
  img.src = `./assets/layer_${scene}_0${layerNum}.jpg`


  // set up the brush and load drawing functions 
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
  canvas.addEventListener('mousemove', () => app.scratchItem(ctx, itemPos))
  // detect an interactive object
  canvas.addEventListener('click', e => {
    app.detectHitArea(item, itemPos, ctx, canvas, e)
  })
};

// Find all items, calculate their respective positions on the dig site and store that in data object
//! modify this to traverse the data object and find the appropriate layer
app.saveAllItemPositions = () => {
  
  const itemsArr = helper.getElemsFromSelector('.item'); // the array of elements that represent the interactive items

  itemsArr.forEach(item => {
    const layerNum = item.dataset.layer;
    const dataArr = data.scene_a[`layer_0${layerNum}`].interactive_items; // the array in the data based on the layer
    const id = item.id;
    const itemPos = helper.getItemPosition(item);
    const index = helper.findObjectsIndex(dataArr, 'id', id);
    helper.updateProperty(dataArr, index, 'digSitePosition', itemPos);
    // console.log(dataArr[index]);
  })
}


app.init = () => {
  app.addItem('a', 1);
  app.addItem('a', 2);
  app.addItem('a', 3);

  setTimeout(() => {
    app.saveAllItemPositions();
  }, 500);

  setTimeout(() => {
    app.canvasSetup('a', 1);
    app.canvasSetup('a', 2);
    app.canvasSetup('a', 3);

  }, 1000)
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