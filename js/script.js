import helper from './helper.js';
import drawing from './drawing.js';
import data from './data.js';

const app = {
  inventory: document.querySelector('.inventory'),
  isScratching: false,
  canvasPos: {},

  // Stores canvas' position on the page
  getCanvasPos: () => {
    app.canvasPos = helper.getItemPosition(document.getElementById('canvas_01'));
    console.log(app.canvasPos);
  },

  // Checks if the randomly generated grid cell is already taken up by another element. Accepts an array that stores occupied cell id's, the element and the grid cell generated for it
  assignCells: (arr, element, cell) => {
    if (arr.includes(cell)) {
      cell = `c${helper.getRandomInt(1, 16)}`;
      app.assignCells(arr, element, cell);
    } else {
      arr.push(cell);
      element.style.gridArea = `${cell}`;
      return;
    }
  },

  // Create an interactive object from data and add it to the page
  addItem: (scene, layerNum) => {
    const container = document.querySelector(`#layer_${layerNum}  .objects-container`);
    const itemsArr = data[`scene_${scene}`].layers[`layer${layerNum}`].interactive_items;

    //keeps track of which grid cells have an item placed in them on each layer
    let cellsTaken = [];
    
    itemsArr.map((item) => {
      const el = document.createElement('div');
      el.innerHTML = `<img src="${item.src}" alt="${item.alt}">`
      el.setAttribute('class', 'item');
      el.setAttribute('id', `${item.id}`);
      el.setAttribute('data-scene', `a`);
      el.setAttribute('data-layer', `${layerNum}`);
      container.appendChild(el);

      //assigning a grid cell to the item
      let cell = `c${helper.getRandomInt(1, 16)}`;
      app.assignCells(cellsTaken, el, cell)
    })
  },

  // Calls addItems on a layer data object to set all items at once
  addAllItems: () => {
    for (const layer in data.scene_a.layers) {
      app.addItem('a', data.scene_a.layers[layer].layerNum);
    }
    return;
  },

  // Find all items, calculate their respective positions on the dig site and store that in the data object
  saveAllItemPositions: () => {
    const itemsArr = helper.getElemsFromSelector('.item'); // the array of elements that represent the interactive items

    itemsArr.forEach(item => {
      const layerNum = item.dataset.layer;
      const scene = item.dataset.scene;
      const dataArr = data[`scene_${scene}`].layers[`layer${layerNum}`].interactive_items; // the array in the data based on the layer
      const id = item.id;
      const img = item.querySelector('img');
      const itemPos = helper.getItemPosition(img);
      const index = helper.findObjectsIndex(dataArr, 'id', id);

      helper.updateProperty(dataArr, index, 'digSitePosition', itemPos);
    })
    return;
  },

  // Checks transparency in a defined area. Returns true if a percent (threshold percentage) of the pixels are transparent, otherwise returns false
  checkTransparency: (pixelData, threshold)  => {
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
  },


  // As the user is scratching this function continuously checks if the area above an interactive item is fully scratched off
  scratchItem: (ctx, item, dataArr, canvas) => {
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
        console.log(item.id, 'transparent')
      };
    }
  },


  // Draw an invisible square on the canvas in the same position as the clickable object below the canvas
  createHitArea: (itemPos, ctx, canvas) => {
    const hitArea = new Path2D();
    const canvasPos = canvas.getBoundingClientRect();
    hitArea.rect(itemPos.left - canvasPos.left, itemPos.top - canvasPos.top, itemPos.width, itemPos.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fill(hitArea);
    return hitArea;
  },


  // Detects if the user clicked on an interactive item
  detectHitArea: (item, dataArr, ctx, canvas,  e) => {
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
  },


  // Removes the current layer if all objects on it have been found
  handleLayerClick: (item, dataArr, ctx, canvas, e) => {
    app.detectHitArea(item, dataArr, ctx, canvas, e);

    // when all images are found, remove canvas' container
    if (helper.foundAllItems(dataArr) && canvas.parentNode) {
      canvas.parentElement.remove();
    };
  },


  // Sets ups a layer: draws an overlay image on the canvas, sets up drawing functions, and deals with finding items on the layer
  layerSetup: (scene, layerNum) => {
    const layerData = data[`scene_${scene}`].layers[`layer${layerNum}`];

    //* Canvas setup -----
    const canvas = document.getElementById(`canvas_${layerNum}`);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth - 500;
    canvas.height = window.innerHeight - 200;
    
    // canvas.style.cursor = 

    // Load overlay image
    const img = new Image();
    img.addEventListener('load', () => {
      ctx.drawImage(img, 0, 0);
    })
    //!change source to database link
    img.src = `./assets/overlays/layer_${scene}_${layerNum}.jpg`

    // set up the brush and load drawing functions 
    ctx.strokeStyle = 'white';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 60;
    drawing(canvas, ctx);
    //*------------------------------


    // find all items on the layer
    const itemsArr = helper.getElemsFromSelector(`.item[id^="item_${scene}_${layerNum}_"]`);
    // find the corresponding dataset that stores data for these items
    const dataArr = data[`scene_${scene}`].layers[`layer${layerNum}`].interactive_items;
    
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
  },


  // Calls layerSetup on a layer data object to set all layers at once
  setUpAllLayers: () => {
    for (const layer in data.scene_a.layers) {
      app.layerSetup('a', data.scene_a.layers[layer].layerNum);
    }
    return;
  },


  // INIT
  init: () => {

    app.addAllItems()
    
    setTimeout(() => {
      app.saveAllItemPositions();
    }, 500)

    
    setTimeout(() => {
      app.setUpAllLayers();
    }, 700)
  },
}

    





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