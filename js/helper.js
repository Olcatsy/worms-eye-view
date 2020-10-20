const helper = {
  // returns an array of items with the defined selector
  getElemsFromSelector: (selector) => {
    return Array.from(document.querySelectorAll(selector));
  },

  // Returns an object that stores dimensions and position of an element
  getItemPosition: (item) => {
    const itemRect = item.getBoundingClientRect();
    const itemPos = {
      top: itemRect.top,
      left: itemRect.left,
      width: itemRect.width,
      height: itemRect.height,
    }
    return itemPos;
  },

  // returns index of an object that contains a given property value in a given array
  findObjectsIndex: (arr, prop, propValue) => {

    const i = arr.findIndex(obj => obj[prop] === propValue);
    return i;
  },

  // update a given property of an object based on its index in a given array
  updateProperty: (arr, index, prop, newValue) => {
    arr[index][prop] = newValue;
  }
};

export default helper;