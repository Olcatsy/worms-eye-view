import helper from './helper.js';
import drawing from './drawing.js';
import data from './data.js';

const app = {
  inventory: document.querySelector('#inventory'),
  modal: document.querySelector('#modal'),
  modalImg: document.querySelector('#modalImg'),
  modalText: document.querySelector('#modalText'),
  realmButtons: document.querySelectorAll('.realm-button'),
  moveonButtons: document.querySelectorAll('.move-on-button'),
  loadingButtons: document.querySelectorAll('.loading-button'),
  miscButtons: document.querySelectorAll('.misc-button'),
  isScratching: false,


//* ITEM RELATED FUNCTIONS
  // Checks if the randomly generated grid cell is already taken up by another element. Accepts an array that stores occupied cells id's, the element and the grid cell generated for it. If the grid cell is unoccupied, the element is assigned to it using CSS property 'grid-area'
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
    const container = document.querySelector(`#layer_${scene}_${layerNum}  .objects`);
    const itemsArr = data[`scene_${scene}`].layers[layerNum - 1].interactive_items;

    //keeps track of which grid cells have an item placed in them on each layer
    let cellsTaken = [];
    
    // creates an element, adds necessary attributes, appends it to the DOM and assigns it a random cell on the objects container grid
    itemsArr.map((item) => {
      const el = document.createElement('div');
      el.innerHTML = `<img src="${item.src}" alt="${item.alt}">`
      el.setAttribute('class', 'item');
      el.setAttribute('data-inventoryId', `${item.inventoryId}`);
      el.setAttribute('id', `${item.id}`);
      el.setAttribute('data-scene', `${scene}`);
      el.setAttribute('data-layer', `${layerNum}`);
      container.appendChild(el);

      //assigning a grid cell to the item
      let cell = `c${helper.getRandomInt(1, 16)}`;
      app.assignCells(cellsTaken, el, cell)
    })
  },


  // Calls addItems on a layer data object to set all items at once
  addAllItems: (scene) => {
    data[`scene_${scene}`].layers.forEach(layer => {
      app.addItem(scene, layer.layerNum);
    })
    return;
  },


  // Finds all items, calculate the positions of their children 'img' elements on the dig site and stores that in the data object
  saveAllItemPositions: () => {
    const itemsArr = helper.getElemsFromSelector('.item'); // the array of elements that represent the interactive items

    itemsArr.forEach(item => {
      const layerNum = item.dataset.layer;
      const scene = item.dataset.scene;
      const dataArr = data[`scene_${scene}`].layers[layerNum - 1].interactive_items; // the array in the data based on the layer
      const id = item.id;
      const img = item.querySelector('img');
      const itemPos = helper.getItemPosition(img);
      const index = helper.findObjectsIndex(dataArr, 'id', id);

      helper.updateProperty(dataArr, index, 'digSitePosition', itemPos);
    })
    return;
  },



//* LAYERS RELATED FUNCTIONS
  // Checks transparency in a defined area. Returns true if a threshold percentage of the pixels are transparent, otherwise returns false
  checkTransparency: (pixelData, threshold)  => {
    // accepts a Uint8ClampedArray (represents pixel data in RGBA format), iterates over each pixel and checks if it's alpha value less than a given alpha value
    const l = pixelData.length,
          pixelsNum =  l / 4;
    let count = 0;

    for (let i = 3; i < l; i += 4) {
      // check pixelData[i] against alpha value within 0-255 range
      if ((pixelData[i] < 255)) {
        count ++;
        if (helper.calculatePercentage(count, pixelsNum) > threshold) {
          return true;
        }
      } else {
        return false;
      };
    }
  },


  // As the user is scratching, this function continuously checks if the area above an interactive item is fully scratched off
  scratchItem: (ctx, item, dataArr, canvas) => {
    const itemPos = helper.findPropertyValue(dataArr, item.id, 'digSitePosition');
    const canvasPos = canvas.getBoundingClientRect();
    const i = helper.findObjectsIndex(dataArr, 'id', item.id);
    let pixelsData;
    if (app.isScratching) {
      // .getImageData returns a flat array representing RGBA values of each pixel in that order
      pixelsData = ctx.getImageData(itemPos.left - canvasPos.left, itemPos.top - canvasPos.top, itemPos.width, itemPos.height).data;
    
      // if checkTransparency returns 'true' item's isTransparent to true
      // The second argument is the percent of pixels scratched off in the area
      if (app.checkTransparency(pixelsData, 15)) {
        helper.updateProperty(dataArr, i, 'isTransparent', true);
        item.classList.add('found-item');
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


  // Returns true if the user clicked on an interactive item
  detectHitArea: (item, dataArr, ctx, canvas,  e) => {
    const id = item.id;
    const itemPos = helper.findPropertyValue(dataArr, id, 'digSitePosition');
    const rect = app.createHitArea(itemPos, ctx, canvas);
    const isTransparent = helper.findPropertyValue(dataArr, id, 'isTransparent');

    if (isTransparent && ctx.isPointInPath(rect, e.offsetX, e.offsetY)) {
      return true;
    }
  },
 

  // moves the given item element to the inventory, applies relevant styles and adds an click event listener that opens the image in a modal
  moveItemToInventory: (item, dataArr, i) => {
    const scene = item.dataset.scene;
    helper.updateProperty(dataArr, i, 'inInventory', true);
    const inventoryItemId = item.dataset.inventoryid;
    const inventoryItem = document.querySelector(`#${inventoryItemId}`);
    inventoryItem.classList.add('faded-in', 
    'in-inventory');          

    inventoryItem.addEventListener('click', () => {
      app.modal.classList.add('open');
      app.modalImg.src = dataArr[i].src;
      app.modalText.innerHTML = dataArr[i].copy;
    })
    inventoryItem.addEventListener('keyup', (e) => {
      if (e.code === 'Enter') {
        app.modal.classList.add('open');
        app.modalImg.src = dataArr[i].src;
        app.modalText.innerHTML = dataArr[i].copy;
      }
    })
  },


  // checks if all items in all the scene have been found, and shows the "You worm!"
  youWorm: () => {
    for (let scene in data) {
      if (!data[scene].clearedAllLayers) {
        console.log('no');
        return;
      }
      // insert 'You worm' into the layer 
    }
  },



  // Moves found items to the inventory when the user clicks on them and removes the current layer if all objects on it have been found
  handleLayerClick: (item, ctx, canvas, e, scene, layerNum) => {
    const sceneData = data[`scene_${scene}`];
    const layersArr = sceneData.layers
    const layerData = layersArr[layerNum -1];
    const dataArr = layerData.interactive_items;
    const i = helper.findObjectsIndex(dataArr, 'id', item.id);
    const l = layersArr.length;
    
    
    if ( app.detectHitArea(item, dataArr, ctx, canvas, e)) {
      item.classList.add('faded-out');
      item.addEventListener('transitionend', () => {
        app.moveItemToInventory(item, dataArr, i);
        // when all images on the layer are found, remove layer and update corresponding layer data entry 
        if (helper.foundAllItems(dataArr) && canvas.parentNode) {
          layerData.allItemsFound = true;
          helper.unmount(canvas);
        };
        
        if (layersArr[l-1].allItemsFound) {
          sceneData.clearedAllLayers = true;
          const moveOn = document.querySelector(`#move-on-${scene}`)
          console.log(moveOn);
          moveOn.classList.add('faded-in')
        };

        // checks winning condition
        app.youWorm();
      })

    }
  },



  // Sets ups a layer: draws an overlay image on the canvas, sets up drawing functions, and deals with finding items on the layer
  layerSetup: (scene, layerNum) => {
    //* Canvas setup -----
    const canvas = document.getElementById(`canvas_${scene}_${layerNum}`);
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;


    // Load overlay image
    const img = new Image();
    img.addEventListener('load', () => {
      ctx.drawImage(img, 0, 0);
    })
    img.src = `./assets/overlays/layer_${scene}_${layerNum}.jpg`

    // set up the brush and load drawing functions 
    drawing(canvas, ctx, scene);
    //*------------------------------


    // find all items on the layer
    const itemsArr = helper.getElemsFromSelector(`.item[id^="item_${scene}_${layerNum}_"]`);
    // find the corresponding dataset that stores data for these items
    const dataArr = data[`scene_${scene}`].layers[layerNum - 1].interactive_items;
    
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
        app.handleLayerClick(item, ctx, canvas, e, scene, layerNum);
      })
    })
  },


  // Calls layerSetup on a layer data object to set all layers at once
  setUpAllLayers: (scene) => {
    data[`scene_${scene}`].layers.forEach(layer => {
      app.layerSetup(scene, layer.layerNum);
    })
    return;
  },



//* SCENES RELATED FUNCTIONS
  // moves class .current-scene to the next scene
  switchScene: (current, next, className) => {
    current.classList.remove(className);
    next.classList.add(className);
  },


  // switches scenes when user clicks on a radio button in "Choose your realm" section
  realmButtonHandler: () => {
    app.realmButtons.forEach(button => {
      button.addEventListener('click', () => {
        const currentScene = document.querySelector('.current-scene')
        const nextScene = document.querySelector(`#${button.value}`);
        app.switchScene(currentScene, nextScene, 'current-scene');
      })
    })
  },

  // goes to the next scene when the user clicks on the button on the last layer of each scene. The order is like this: 
  // A -> B -> C -> A
  moveonButtonHandler: () => {
    app.moveonButtons.forEach(button => {
      button.addEventListener('click', () => {
        const currentScene = document.querySelector('.current-scene');
        const nextScene = document.querySelector(`#${button.dataset.scene}`)
        app.switchScene(currentScene, nextScene, 'current-scene');
      })
    })
  },



//* MISC FUNCTIONS
  // Allows to close modal when user clicks on the cross icon or presses ESC
  closeModal: () => {
    const closeButton = document.querySelector('#modalClose');
    // clicking on Close button
    closeButton.addEventListener('click', () => {
      app.modal.classList.remove('open');
    });
    // pressing ESC
    document.addEventListener('keyup', (e) => {
      if (app.modal.classList.contains('open') && e.code === 'Escape') {
        app.modal.classList.remove('open');
      }
    })
  },


  loadingButtonHandler: () => {
    app.loadingButtons.forEach(button => {
      button.addEventListener('click', () => {
        const current = document.querySelector(`.current-screen`);
        if (button.dataset.nextscreen === 'dig-site') {
          current.classList.add('faded-out');
          return;
        } else {
          const next = document.querySelector(`#${button.dataset.nextscreen}`);
          app.switchScene(current, next, 'current-screen');
        }
      })
    })
  },


  closeMiscScreen: () => {
    const close = document.querySelectorAll('.close-misc');
    close.forEach(button => {
      button.addEventListener('click', () => {
        const screen = document.querySelector(`#${button.dataset.screen}`);
        screen.classList.remove('faded-in');
        screen.classList.add('faded-out');
      })
      document.addEventListener('keyup', (e) => {
        if (e.code === 'Escape') {
          const screen = document.querySelector(`#${button.dataset.screen}`);
          screen.classList.remove('faded-in');
          screen.classList.add('faded-out');
        }
      })
    })
  },


  openMiscScreen: () => {
    app.miscButtons.forEach(button => {
      button.addEventListener('click', () => {
        console.log(button.dataset.screen);
        const screen = document.querySelector(`#${button.dataset.screen}`);
        screen.classList.add('faded-in');
      })
    })
  },


//* INIT
  init: () => {
    for (const scene in data) {
      const letter = data[scene].letter;
      app.addAllItems(letter);
    }
    
    setTimeout(() => {
      app.saveAllItemPositions();
    }, 500)
    
    
    setTimeout(() => {
      for (const scene in data) {
        const letter = data[scene].letter;
        app.setUpAllLayers(letter);
      }
    }, 700)
    
    app.closeModal();
    app.realmButtonHandler();
    app.moveonButtonHandler();
    app.loadingButtonHandler();
    app.closeMiscScreen();
    app.openMiscScreen()
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