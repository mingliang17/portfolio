// src/sphere/renderer.js — draws the active sphere pattern(s) on a 2D canvas. No React.

import { makeFrame } from './math.js';
import { PATTERNS } from './patterns.js';

const LINE_RGB = '206, 210, 218'; // light gray

export class SphereRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 0;
    this.H = 0;
    this.dpr = 1;
  }

  resize(W, H, dpr = 1) {
    this.W = W;
    this.H = H;
    this.dpr = Math.min(2, dpr || 1);
    this.canvas.width = Math.max(1, Math.round(W * this.dpr));
    this.canvas.height = Math.max(1, Math.round(H * this.dpr));
  }

  /**
   * @param {number} screens  scroll position in screens (drives the rotation)
   * @param {{name:string, w:number}[]} layers  patterns to draw with their opacity (cross-fade)
   */
  draw(screens, layers) {
    const { ctx, W, H, dpr } = this;
    if (!ctx || !W || !H) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';

    for (const layer of layers) {
      const def = PATTERNS[layer.name];
      if (!def || layer.w <= 0) continue;
      const f = makeFrame({ W, H, screens, base: def.base });

      const lines = new Path2D();
      const dots = [new Path2D(), new Path2D()];
      const sink = {
        m: (x, y) => lines.moveTo(x, y),
        l: (x, y) => lines.lineTo(x, y),
        d: (x, y, tier) => {
          const r = tier ? 1.5 : 0.95;
          dots[tier ? 1 : 0].rect(x - r, y - r, r * 2, r * 2);
        },
      };
      def.draw(f, sink);

      if (def.line > 0) {
        ctx.strokeStyle = `rgba(${LINE_RGB}, ${def.line * layer.w})`;
        ctx.stroke(lines);
      }
      if (def.dot > 0) {
        ctx.fillStyle = `rgba(${LINE_RGB}, ${def.dot * layer.w})`;
        ctx.fill(dots[0]);
        ctx.fillStyle = `rgba(${LINE_RGB}, ${Math.min(1, def.dot * 1.5) * layer.w})`;
        ctx.fill(dots[1]);
      }
    }
  }
}
