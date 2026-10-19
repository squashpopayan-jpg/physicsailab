/* ===================================================================
   35-helpers.js — Ayudas compartidas: puntos arrastrables, vectores
   en coordenadas del mundo, rótulos de magnitudes, ejes cartesianos
   =================================================================== */
(function () {
  'use strict';
  const MC = window.MC;
  const D = MC.draw;

  /* Puntos arrastrables sobre una vista del mundo.
     getList() → [{id, x, y, r?}] (coordenadas del mundo); onDrag(id, wx, wy, e) */
  MC.handles = function (sim, cv, view, getList, onDrag, o = {}) {
    const hit = (px, py) => {
      let best = null, bd = Infinity;
      for (const h of getList()) {
        const d = Math.hypot(view.X(h.x) - px, view.Y(h.y) - py);
        if (d < (h.r || 18) && d < bd) { bd = d; best = h; }
      }
      return best;
    };
    MC.pointer(cv, {
      down: (px, py, e) => {
        const h = hit(px, py);
        if (!h) return o.down ? o.down(view.wx(px), view.wy(py), e) : null;
        if (o.start) o.start(h.id);
        return h.id;
      },
      move: (id, px, py, e) => { onDrag(id, view.wx(px), view.wy(py), e); sim.redraw(); },
      up: (id) => { if (o.up) o.up(id); sim.redraw(); },
      hover: (px, py) => !!hit(px, py),
      touch: o.touch
    });
  };

  /* Vector en coordenadas del mundo: origen (x, y) en m, componentes (vx, vy) en unidades
     físicas y factor k (m de dibujo por unidad física) */
  MC.wvec = function (ctx, view, x, y, vx, vy, k, o = {}) {
    D.vec(ctx, view.X(x), view.Y(y), vx * k * view.s, -vy * k * view.s, o);
  };

  /* Ejes cartesianos con flechas y nombres */
  MC.axes = function (ctx, view, o = {}) {
    const w = view.cv.w, h = view.cv.h;
    const X0 = view.X(0), Y0 = view.Y(0);
    const col = o.color || '--axis';
    if (Y0 > 0 && Y0 < h) D.arrow(ctx, 4, Y0, w - 6, Y0, { color: col, width: 1.3, head: 9 });
    if (X0 > 0 && X0 < w) D.arrow(ctx, X0, h - 4, X0, 6, { color: col, width: 1.3, head: 9 });
    if (o.names !== false) {
      if (Y0 > 0 && Y0 < h) MC.text(ctx, o.xname || 'x', w - 10, Y0 - 9, { size: 14, math: true, color: '--ink-2', align: 'right' });
      if (X0 > 0 && X0 < w) MC.text(ctx, o.yname || 'y', X0 + 9, 18, { size: 14, math: true, color: '--ink-2' });
    }
  };

  /* Formato "a î + b ĵ" */
  MC.vfmt = (x, y, n = 2, u = '') => `(${MC.fix(x, n)}, ${MC.fix(y, n)})${u ? ' ' + u : ''}`;

  /* Ángulo en grados en [0, 360) */
  MC.angDeg = (x, y) => { let a = (Math.atan2(y, x) * 180) / Math.PI; if (a < 0) a += 360; return a; };

  /* Circulito con signo ⊙ (sale) o ⊗ (entra) de tamaño r */
  D.outIn = function (ctx, x, y, r, sign, o = {}) {
    const col = MC.col(o.color || '--ink');
    ctx.save();
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = Math.max(1.4, r * 0.13);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.stroke();
    if (sign > 0) { ctx.beginPath(); ctx.arc(x, y, r * 0.28, 0, 2 * Math.PI); ctx.fill(); }
    else if (sign < 0) {
      const s = r * 0.62;
      ctx.beginPath();
      ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
      ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s);
      ctx.stroke();
    }
    ctx.restore();
  };

  /* Flecha curva (arco con punta) para indicar sentido de giro: ángulos matemáticos */
  D.arcArrow = function (ctx, cx, cy, r, a0, a1, o = {}) {
    const col = o.color || '--ink-2';
    ctx.save();
    ctx.strokeStyle = MC.col(col);
    ctx.lineWidth = o.width || 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -a0, -a1, a1 > a0);
    ctx.stroke();
    ctx.restore();
    const s = a1 > a0 ? 1 : -1;
    const ex = cx + r * Math.cos(a1), ey = cy - r * Math.sin(a1);
    const tx = -Math.sin(a1) * s, ty = -Math.cos(a1) * s;
    D.arrow(ctx, ex - tx * 8, ey - ty * 8, ex + tx * 2, ey + ty * 2, { color: col, width: o.width || 1.8, head: 9 });
  };
})();
