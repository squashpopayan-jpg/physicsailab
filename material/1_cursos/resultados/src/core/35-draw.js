/* ===================================================================
   35-draw.js — Dibujo del curso (EM.sd): vistas con escala, mapas de
   valores, esferas sombreadas, colores de átomos, diagramas de bandas
   con puntos de alta simetría, redes 2D y lectura de datos de tablas.
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  const C = (c) => (c && c.startsWith && c.startsWith('--') ? EM.col(c) : c);
  const D = (EM.sd = {});

  /* Vista mundo → píxeles en el rectángulo r = {x, y, w, h}; equal: misma escala en ambos ejes */
  D.view = function (r, x0, x1, y0, y1, equal = true) {
    let sx = r.w / (x1 - x0), sy = r.h / (y1 - y0), ox = r.x, oy = r.y;
    if (equal) {
      const s = Math.min(sx, sy);
      ox += (r.w - s * (x1 - x0)) / 2; oy += (r.h - s * (y1 - y0)) / 2;
      sx = sy = s;
    }
    return {
      r, x0, x1, y0, y1, sx, sy,
      X: (x) => ox + (x - x0) * sx,
      Y: (y) => oy + (y1 - y) * sy,
      map: (p) => [ox + (p[0] - x0) * sx, oy + (y1 - p[1]) * sy],
      ix: (px) => x0 + (px - ox) / sx,
      iy: (py) => y1 - (py - oy) / sy
    };
  };

  /* Imagen a partir de valores (nx × ny, fila 0 arriba): map(v) → [r, g, b] */
  const offs = new Map();
  D.paint = function (ctx, vals, nx, ny, r, map, o = {}) {
    const key = nx + 'x' + ny;
    let e = offs.get(key);
    if (!e) {
      const cv = document.createElement('canvas'); cv.width = nx; cv.height = ny;
      const cx = cv.getContext('2d');
      e = { cv, cx, img: cx.createImageData(nx, ny) };
      offs.set(key, e);
    }
    const d = e.img.data;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i, c = map(vals[k], i, j), p = 4 * k;
      d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = c.length > 3 ? c[3] : 255;
    }
    e.cx.putImageData(e.img, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = o.smooth !== false;
    ctx.drawImage(e.cv, 0, 0, nx, ny, r.x, r.y, r.w, r.h);
    ctx.restore();
  };
  D.css = (g, a = 1) => `rgba(${Math.round(255 * g[0])},${Math.round(255 * g[1])},${Math.round(255 * g[2])},${a})`;
  D.dark = function (cv) { EM.draw.clear(cv, EM.isDark() ? '#05070A' : '#0B0E14'); };

  /* Colores de átomos (convención CPK ajustada a los dos temas) */
  const ATOM = {
    H: '#E8E8E8', Li: '#B57EDC', Be: '#7FBF7F', C: '#5A5A5A', N: '#3050F8', O: '#E8393C', F: '#8FD14F', Na: '#AB5CF2', Mg: '#5FB760',
    Al: '#A6A6B8', Si: '#D9A85B', P: '#FF8000', S: '#E8C437', Cl: '#2FBF55', K: '#8F40D4', Ca: '#4F7F4F', Ti: '#9AA2AE', Cr: '#8A99C7',
    Fe: '#D2691E', Co: '#5063C4', Ni: '#50B050', Cu: '#C88033', Zn: '#7D80B0', Ga: '#C28F8F', Ge: '#668F8F', As: '#BD80E3', Se: '#FFA100',
    Br: '#A62929', Sr: '#3FBFBF', Nb: '#73C2C9', Mo: '#54B5B5', Ag: '#C0C0C0', Cd: '#FFD98F', In: '#A67573', Sn: '#668080', Sb: '#9E63B5',
    Te: '#D47A00', I: '#940094', Cs: '#57178F', Ba: '#00C900', W: '#2194D6', Pt: '#D0D0E0', Au: '#E6B422', Pb: '#575961', Ar: '#80D1E3',
    Ne: '#B3E3F5', Kr: '#5CB8D1', Xe: '#429EB0', Po: '#AB5C00', Gd: '#45FFC7'
  };
  D.atomColor = (el, i = 0) => ATOM[el] || ['#4F83D9', '#D98A4F', '#43A37A', '#B455C2'][i % 4];
  /* Esfera sombreada */
  D.ball = function (ctx, x, y, r, color, o = {}) {
    if (r <= 0.3) return;
    const c = C(color);
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.38, r * 0.08, x, y, r);
    g.addColorStop(0, EM.shade(c, 1.55));
    g.addColorStop(0.55, c);
    g.addColorStop(1, EM.shade(c, 0.62));
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = g; ctx.fill();
    if (o.ring) { ctx.lineWidth = o.ringW || 2; ctx.strokeStyle = C(o.ring); ctx.stroke(); }
    ctx.restore();
  };

  /* Diagrama de bandas sobre un recorrido de la zona de Brillouin.
     path: [{s, label}], E: arreglo (por punto k) de arreglos de energías.
     o: {ymin, ymax, ylabel, colors, ef, efLabel, gapFill, highlight:[índices de banda]} */
  D.bands = function (ctx, r, path, E, o = {}) {
    const smax = path[path.length - 1].s;
    const labels = path.filter((p) => p.label);
    const pl = new EM.Plot(ctx, Object.assign({ x: r.x, y: r.y, w: r.w, h: r.h, xmin: 0, xmax: smax, ymin: o.ymin, ymax: o.ymax, ylabel: o.ylabel || 'E (eV)', xticks: [], xlabel: '', grid: true }, o.plot || {}));
    pl.frame();
    const ctx2 = ctx;
    for (const p of labels) {
      pl.vline(p.s, { color: '--grid-2', dash: [], width: 1 });
      EM.text(ctx2, p.label, pl.X(p.s), pl.iy + pl.ih + 16, { size: 12.5, align: 'center', color: '--ink-2', weight: 600 });
    }
    if (o.ef !== undefined) pl.hline(o.ef, { color: '--c2', dash: [6, 4], width: 1.3, label: o.efLabel || '', labelRight: true });
    const nb = Math.max(...E.map((e) => e.length));
    const cols = o.colors || ['--c1'];
    for (let b = 0; b < nb; b++) {
      const xs = path.map((p) => p.s), ys = E.map((e) => (b < e.length ? e[b] : NaN));
      const col = typeof cols === 'function' ? cols(b) : cols[b % cols.length];
      pl.xy(xs, ys, { color: col, width: o.highlight && o.highlight.includes(b) ? 2.6 : o.width || 1.8 });
    }
    return pl;
  };

  /* Red 2D con base: puntos r = m a1 + n a2 + b_j dentro de la vista */
  D.lattice2d = function (ctx, v, a1, a2, basis, o = {}) {
    const N = o.N || 12, out = [];
    for (let m = -N; m <= N; m++) for (let n = -N; n <= N; n++) {
      basis.forEach((b, j) => {
        const x = m * a1[0] + n * a2[0] + b[0], y = m * a1[1] + n * a2[1] + b[1];
        if (x < v.x0 - 0.5 || x > v.x1 + 0.5 || y < v.y0 - 0.5 || y > v.y1 + 0.5) return;
        out.push([x, y, j, m, n]);
      });
    }
    if (o.draw !== false) for (const [x, y, j] of out) {
      const col = (o.colors || ['--c1', '--c2', '--c3'])[j % 3];
      D.ball(ctx, v.X(x), v.Y(y), (o.r || 0.12) * v.sx, col);
    }
    return out;
  };
  /* Polígono en coordenadas del mundo */
  D.polygon = function (ctx, v, pts, o = {}) {
    if (!pts.length) return;
    ctx.save();
    ctx.beginPath();
    pts.forEach((p, i) => { const q = v.map(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
    ctx.closePath();
    if (o.fill) { ctx.fillStyle = o.fill.startsWith('--') ? EM.alpha(o.fill, o.alpha === undefined ? 0.15 : o.alpha) : o.fill; ctx.fill(); }
    if (o.stroke !== false) { ctx.strokeStyle = C(o.stroke || '--ink-2'); ctx.lineWidth = o.width || 1.5; if (o.dash) ctx.setLineDash(o.dash); ctx.stroke(); }
    ctx.restore();
  };
  /* Flecha en coordenadas del mundo */
  D.arrow = (ctx, v, a, b, o = {}) => EM.draw.arrow(ctx, v.X(a[0]), v.Y(a[1]), v.X(b[0]), v.Y(b[1]), o);
  /* Resorte entre dos puntos en píxeles */
  D.spring = (ctx, x1, y1, x2, y2, o = {}) => EM.draw.zigzag(ctx, x1, y1, x2, y2, Object.assign({ n: 5, amp: 5, color: '--ink-3', width: 1.4 }, o));

  /* Mapa de color secuencial "térmico" (fondo → acento → amarillo) para densidades */
  D.heat = function (t) {
    t = Math.max(0, Math.min(1, t));
    return EM.cmap.inferno(t);
  };
  /* Colores para zonas de Brillouin (índice n) */
  const ZC = ['#4F83D9', '#D98A4F', '#43A37A', '#B455C2', '#D9C24F', '#4FC1D9', '#D94F7A', '#8A9A4F', '#7A6FD9', '#D96F4F'];
  D.zoneColor = (n) => ZC[(n - 1) % ZC.length];
  /* Hex → [r, g, b] */
  D.rgb = (hex) => EM.rgb(hex);
})();
