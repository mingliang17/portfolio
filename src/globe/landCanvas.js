// src/globe/landCanvas.js — paints every country's fill onto an equirectangular canvas (the globe's land texture).
// The canvas is transparent where there is ocean, so the shader can put the ocean colour underneath.

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('./topo.js').Country[]} countries
 * @param {{ width:number, height:number, fill:string, contentFill:string, contentKeys:Set<string> }} opts
 */
export function drawLand(ctx, countries, { width, height, fill, contentFill, contentKeys }) {
  ctx.clearRect(0, 0, width, height);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.2; // a thin stroke in the fill colour closes the hairline gaps between neighbours

  const sx = width / 360;
  const sy = height / 180;

  for (const country of countries) {
    const colour = contentKeys.has(country.key) ? contentFill : fill;
    ctx.fillStyle = colour;
    ctx.strokeStyle = colour;
    ctx.beginPath();
    for (const poly of country.polygons) {
      // Unwrapped polygons can poke past ±180°; draw them again shifted so both edges of the map get their half.
      const shifts = [0];
      if (poly.bbox[2] > 180) shifts.push(-360);
      if (poly.bbox[0] < -180) shifts.push(360);
      for (const shift of shifts) {
        for (const ring of poly.rings) {
          for (let i = 0; i < ring.length; i += 2) {
            const x = (ring[i] + shift + 180) * sx;
            const y = (90 - ring[i + 1]) * sy;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        }
      }
    }
    ctx.fill('evenodd');
    ctx.stroke();
  }
}
