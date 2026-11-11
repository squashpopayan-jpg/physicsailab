/* ===================================================================
   36-viz.js — Mapas de calor 2D y barra de color (EM.heat), para densidades de probabilidad en el plano,
   alfombras espacio–tiempo y orbitales.
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  /* Dibuja una función val(ix, iy) → t ∈ [0,1] (o [−1,1] con o.div) sobre el rectángulo r = {x, y, w, h}.
     iy = 0 es la fila superior. o: {cmap: 'seq' | 'div' | 'viridis' | 'inferno', color: '--c1'} */
  EM.heat = function (ctx, r, nx, ny, val, o = {}) {
    const key = '_heat' + nx + 'x' + ny;
    let oc = EM._heatCache && EM._heatCache[key];
    if (!oc) { oc = document.createElement('canvas'); oc.width = nx; oc.height = ny; EM._heatCache = EM._heatCache || {}; EM._heatCache[key] = oc; }
    const g = oc.getContext('2d'), img = g.createImageData(nx, ny), d = img.data, cm = o.cmap || 'seq';
    for (let iy = 0; iy < ny; iy++) for (let ix = 0; ix < nx; ix++) {
      const t = val(ix, iy);
      const c = cm === 'div' ? EM.cmap.diverging(t) : cm === 'viridis' ? EM.cmap.viridis(t) : cm === 'inferno' ? EM.cmap.inferno(t) : EM.cmap.seq(t, o.color || '--accent');
      const k = 4 * (iy * nx + ix); d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    ctx.save(); ctx.imageSmoothingEnabled = o.smooth !== false; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(oc, r.x, r.y, r.w, r.h);
    ctx.strokeStyle = EM.col('--axis'); ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h); ctx.restore();
  };
})();
