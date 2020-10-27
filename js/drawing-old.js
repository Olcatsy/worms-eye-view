const drawing = (canvas, ctx) => {

  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
  ctx.lineJoin = ctx.lineCap = 'round';
  ctx.lineWidth = 60;


  const startDrawing = (e) => {
    isDrawing = true;
    let x = 0,
      y = 0;

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

  const draw = (e) => {
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
    ctx.beginPath(); // start from
    ctx.moveTo(lastX, lastY); // go to
    ctx.lineTo(x, y);
    ctx.stroke();

    // allows to erase
    ctx.globalCompositeOperation = 'destination-out';

    [lastX, lastY] = [x, y];
  }

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', () => isDrawing = false);
}

export default drawing;