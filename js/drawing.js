export default function drawing(canvas, context) {

  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  function startDrawing(e) {
    isDrawing = true;
    let x = 0;
    let y = 0;

    if (e.type === 'touchstart') {
      const r = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - r.left;
      y = e.touches[0].clientY - r.top; 
    } else {
      x = e.offsetX;
      y = e.offsetY;
    }

    [lastX, lastY] = [x, y];
  }

  function draw(e) {
    if (!isDrawing) return; 
    let x = 0;
    let y = 0;

    if (e.type === 'touchmove') {
      const r = canvas.getBoundingClientRect(); 
      x = e.touches[0].clientX - r.left;
      y = e.touches[0].clientY - r.top;
    } else {
      x = e.offsetX;
      y = e.offsetY;
    }
    context.beginPath(); // start from
    context.moveTo(lastX, lastY); // go to
    context.lineTo(x, y);
    context.stroke();
    // allows to erase
    context.globalCompositeOperation = 'destination-out';
    [lastX, lastY] = [x, y];
  }

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', () => isDrawing = false);






}
