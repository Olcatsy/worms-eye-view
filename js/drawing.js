const drawing = (canvas, ctx) => {

  // Brush implementation is based on Kangax's article "Exploring Canvas Drawing Techniques" (http://perfectionkills.com/exploring-canvas-drawing-techniques/)

  const distanceBetween = (point1, point2) => Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));

  const angleBetween = (point1, point2) => Math.atan2(point2.x - point1.x, point2.y - point1.y);

  const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  let isDrawing = false;
  let lastPoint = {
    x: 0,
    y: 0,
  }

  const brush = new Image();
  brush.src = './assets/brush1.svg';
  brush.width = 60;

  ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
  ctx.lineJoin = ctx.lineCap = 'round';
  ctx.lineWidth = 60;


  const startDrawing = (e) => {
    isDrawing = true;
    lastPoint = {
      x: e.offsetX,
      y: e.offsetY,
    }
  }

  const draw = (e) => {
    if (!isDrawing) return; 
    
    const currentPoint = {
      x: e.clientX,
      y: e.clientY,
    }
    const dist = distanceBetween(lastPoint, currentPoint);
    const angle = angleBetween(lastPoint, currentPoint);

    for (let i = 0; i < dist; i++) {
      let x = lastPoint.x + (Math.sin(angle) * i);
      let y = lastPoint.y + (Math.cos(angle) * i);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(0.5, 0.5);
      ctx.rotate(Math.PI * 180 / getRandomInt(0, 180));
      ctx.globalCompositeOperation = 'destination-out'; // allows to erase
      ctx.drawImage(brush, 0, 0);
      ctx.restore();
    }

    lastPoint = currentPoint;
  }

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', () => isDrawing = false);
}

export default drawing;