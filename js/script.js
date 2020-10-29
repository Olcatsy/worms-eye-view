import helper from './helper.js';
import drawing from './drawing.js';
import data from './data.js';

const app = {};

app.inventory = document.querySelector('.inventory');
app.isScratching = false;

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

// Find all items, calculate their respective positions on the dig site and store that in the data object
app.saveAllItemPositions = () => {

  const itemsArr = helper.getElemsFromSelector('.item'); // the array of elements that represent the interactive items

  itemsArr.forEach(item => {
    const layerNum = item.dataset.layer;
    const scene = item.dataset.scene;
    const dataArr = data[`scene_${scene}`][`layer_0${layerNum}`].interactive_items; // the array in the data based on the layer
    const id = item.id;
    const itemPos = helper.getItemPosition(item);
    const index = helper.findObjectsIndex(dataArr, 'id', id);

    helper.updateProperty(dataArr, index, 'digSitePosition', itemPos);
  })
}

// Checks transparency in a defined area. Returns true if a percent (threshold percentage) of the pixels are transparent, otherwise returns false
app.checkTransparency = (pixelData, threshold)  => {
  // accepts a Uint8ClampedArray (represents pixel data in RGBA format), iterates over each pixel and checks if it's alpha value is 0 (transparent)
  //? also if the user finishes scratching right on the item, it goes to the inventory right away, so I need to figure that out
  const l = pixelData.length,
        pixelsNum =  l / 4;
  let count = 0;

  for (let i = 3; i < l; i += 4) {
    if ((pixelData[i] < 0.3)) {
      count ++;
      if (helper.calculatePercentage(count, pixelsNum) > threshold) {
        return true;
      }
    } else {
      return false;
    };
  }
}


// As the user is scratching this function continuously checks if the area above an interactive item is fully scratched off
app.scratchItem = (ctx, item, dataArr, canvas) => {
  const itemPos = helper.findPropertyValue(dataArr, item.id, 'digSitePosition');
  const canvasPos = canvas.getBoundingClientRect();
  const i = helper.findObjectsIndex(dataArr, 'id', item.id);
  let pixelsData;
  if (app.isScratching) {
    // .getImageData returns a flat array representing RGBA values of each pixel in that order
    pixelsData = ctx.getImageData(itemPos.left - canvasPos.left, itemPos.top - canvasPos.top, itemPos.width, itemPos.height).data;
  
    // if checkTransparency returns 'true' item's isTransparent to true
    if (app.checkTransparency(pixelsData, 20)) {
      helper.updateProperty(dataArr, i, 'isTransparent', true);
      item.classList.add('found-item');
    };
  }
}

// Draw an invisible square on the canvas in the same position as the clickable object below the canvas
app.createHitArea = (itemPos, ctx, canvas) => {
  const hitArea = new Path2D();
  const canvasPos = canvas.getBoundingClientRect();
  hitArea.rect(itemPos.left - canvasPos.left, itemPos.top - canvasPos.top, itemPos.width, itemPos.height);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fill(hitArea);
  return hitArea;
}

// Detects if the user clicked on an interactive item
app.detectHitArea = (item, dataArr, ctx, canvas,  e) => {
  // Using ctx.isPointInPath check if the click event is within the boundaries of corresponding hit area and check if the corresponding area is fully scratched off
  // if both conditions are satisfied, move the item to inventory and unmount the canvas
  const id = item.id;
  const itemPos = helper.findPropertyValue(dataArr, id, 'digSitePosition');
  const i = helper.findObjectsIndex(dataArr, 'id', id);
  const rect = app.createHitArea(itemPos, ctx, canvas);
  const isTransparent = helper.findPropertyValue(dataArr, id, 'isTransparent');

  if (isTransparent && ctx.isPointInPath(rect, e.offsetX, e.offsetY)) {
    app.inventory.appendChild(item);
    helper.updateProperty(dataArr, i, 'inInventory', true);

    // workaround for the hardcoded grid positions (for now)
    item.setAttribute("style", "grid-column-start: initial; grid-column-end: initial;");
    item.classList.remove('found-item')
  }
}

app.handleLayerClick = (item, dataArr, ctx, canvas, e) => {
  app.detectHitArea(item, dataArr, ctx, canvas, e);

  // when all images are found, remove canvas' container
  if (helper.foundAllItems(dataArr) && canvas.parentNode) {
    canvas.parentElement.remove();
  };
}


//canvasId, scene, layerNum, itemId
app.layerSetup = (scene, layerNum) => {
  //* Canvas setup -----
  const canvas = document.getElementById(`canvas_0${layerNum}`);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth - 500;
  canvas.height = window.innerHeight - 200;
  
  // canvas.width = 1000;
  // canvas.height = 600;


  // Load overlay image
  const img = new Image();
  img.addEventListener('load', () => {
    ctx.drawImage(img, 0, 0);
  })
  img.src = `./assets/overlays/layer_${scene}_0${layerNum}.jpg`


  // set up the brush and load drawing functions 
  ctx.strokeStyle = 'white';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 60;
  drawing(canvas, ctx);
  //*------------------------------

  // find all items on the layer
  const itemsArr = helper.getElemsFromSelector(`.item[id^="item_${scene}_0${layerNum}_"]`);
  // find the corresponding dataset that stores data for these items
  const dataArr = data[`scene_${scene}`][`layer_0${layerNum}`].interactive_items;
  
  // ***EVENT LISTENERS***--------------------
  // start scratching
  canvas.addEventListener('mousedown', () => app.isScratching = true);
  // end scratching
  canvas.addEventListener('mouseup', () => app.isScratching = false);
  // as the user is scratching, check if the defined area is fully scratched off 
  canvas.addEventListener('mousemove', () => {
    itemsArr.forEach(item => {
      app.scratchItem(ctx, item, dataArr, canvas);
    })
  })
  // detect an interactive object
  canvas.addEventListener('click', e => {
    itemsArr.forEach(item => {
      app.handleLayerClick(item, dataArr, ctx, canvas, e);
    })
  })
};



// INIT
app.init = () => {

  app.addItem('a', 1);
  app.addItem('a', 2);
  app.addItem('a', 3);
  
  setTimeout(() => {
    app.saveAllItemPositions();
  }, 500);
  
  
  setTimeout(() => {
    app.layerSetup('a', 1);
    app.layerSetup('a', 2);
    app.layerSetup('a', 3);
  }, 1000)
};










//DOCREADY
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