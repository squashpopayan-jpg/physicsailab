/* ===================================================================
   35-draw.js — Dibujo óptico: vistas con escala, imágenes de intensidad,
   lentes, espejos, objetos, rayos, espectros y colores de la luz
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op;
  const C = (c) => (c && c.startsWith && c.startsWith('--') ? EM.col(c) : c);
  const D = (EM.od = {});

  /* Vista mundo → píxeles en el rectángulo r = {x, y, w, h}; equal: misma escala en ambos ejes */
  D.view = function (r, x0, x1, y0, y1, equal = true) {
    let sx = r.w / (x1 - x0), sy = r.h / (y1 - y0), ox = r.x, oy = r.y;
    if (equal) {
      const s = Math.min(sx, sy);
      ox += (r.w - s * (x1 - x0)) / 2; oy += (r.h - s * (y1 - y0)) / 2;
      sx = sy = s;
    }
    const v = {
      r, x0, x1, y0, y1, sx, sy,
      X: (x) => ox + (x - x0) * sx,
      Y: (y) => oy + (y1 - y) * sy,
      map: (p) => [ox + (p[0] - x0) * sx, oy + (y1 - p[1]) * sy],
      ix: (px) => x0 + (px - ox) / sx,
      iy: (py) => y1 - (py - oy) / sy
    };
    return v;
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
  /* Mapa de intensidad teñido con un color de luz (fondo negro, como una pantalla en la oscuridad) */
  D.tint = (rgb, gamma = 0.6) => (v) => { const t = Math.pow(Math.max(0, Math.min(1, v)), gamma); return [rgb[0] * t, rgb[1] * t, rgb[2] * t]; };
  /* Color de presentación de una longitud de onda (nm) como cadena CSS */
  D.lam = (nm, a = 1) => { const c = OP.lambdaRGB(nm, 1, 0.3); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  /* Color con brillo completo (para rayos dibujados sobre fondo claro u oscuro) */
  D.lamRay = (nm, a = 1) => { const c = OP.lambdaRGB(Math.min(700, Math.max(400, nm)), 1.0); const k = 255 / Math.max(1, c[0], c[1], c[2]); return `rgba(${Math.round(c[0] * k * 0.92)},${Math.round(c[1] * k * 0.92)},${Math.round(c[2] * k * 0.92)},${a})`; };

  /* Banda del espectro visible en el rectángulo r (λ de l0 a l1) */
  D.spectrumBar = function (ctx, r, l0 = 380, l1 = 750) {
    for (let i = 0; i < r.w; i++) {
      const l = l0 + ((l1 - l0) * i) / r.w;
      ctx.fillStyle = D.lam(l);
      ctx.fillRect(r.x + i, r.y, 1.5, r.h);
    }
  };

  /* Eje óptico */
  D.axis = function (ctx, v, o = {}) {
    ctx.save();
    ctx.strokeStyle = C(o.color || '--grid-2'); ctx.lineWidth = 1; ctx.setLineDash(o.dash || [6, 4]);
    ctx.beginPath(); ctx.moveTo(v.X(v.x0), v.Y(0)); ctx.lineTo(v.X(v.x1), v.Y(0)); ctx.stroke();
    ctx.restore();
  };
  /* Lente delgada esquemática en x con semialtura h (mundo); f > 0 convergente */
  D.thinLens = function (ctx, v, x, h, f, o = {}) {
    const X = v.X(x), y1 = v.Y(h), y2 = v.Y(-h), w = Math.max(5, Math.min(14, (y2 - y1) * 0.06));
    ctx.save();
    ctx.fillStyle = EM.alpha('--glass', o.alpha || 0.28);
    ctx.strokeStyle = C('--glass'); ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (f > 0) {
      ctx.moveTo(X, y1); ctx.quadraticCurveTo(X + w * 2, (y1 + y2) / 2, X, y2); ctx.quadraticCurveTo(X - w * 2, (y1 + y2) / 2, X, y1);
    } else {
      ctx.moveTo(X - w, y1); ctx.lineTo(X + w, y1); ctx.quadraticCurveTo(X + w * 0.1, (y1 + y2) / 2, X + w, y2); ctx.lineTo(X - w, y2); ctx.quadraticCurveTo(X - w * 0.1, (y1 + y2) / 2, X - w, y1);
    }
    ctx.fill(); ctx.stroke();
    if (o.label) EM.text(ctx, o.label, X, y1 - 7, { size: 11.5, align: 'center', color: '--ink-2', halo: true });
    ctx.restore();
  };
  /* Lente con su forma real a partir de radios (mundo): vértices en z1 = x y z2 = x + t */
  D.realLens = function (ctx, v, x, t, R1, R2, ap, o = {}) {
    const sag = (R, y) => (isFinite(R) ? R - Math.sign(R) * Math.sqrt(Math.max(0, R * R - y * y)) : 0);
    const pts = [];
    const n = 40;
    for (let i = 0; i <= n; i++) { const y = ap - (2 * ap * i) / n; pts.push([x + sag(R1, y), y]); }
    for (let i = 0; i <= n; i++) { const y = -ap + (2 * ap * i) / n; pts.push([x + t + sag(R2, y), y]); }
    ctx.save();
    ctx.beginPath();
    pts.forEach((p, i) => { const q = v.map(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
    ctx.closePath();
    ctx.fillStyle = o.fill || EM.alpha('--glass', 0.3); ctx.fill();
    ctx.strokeStyle = C(o.stroke || '--glass'); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();
  };
  /* Espejo esférico de radio R (mundo) con vértice en x; R > 0: centro a la izquierda (cóncavo para luz que llega de la izquierda) */
  D.mirror = function (ctx, v, x, R, h, o = {}) {
    ctx.save();
    ctx.strokeStyle = C(o.color || '--mirror'); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const y = -h + (2 * h * i) / 40;
      const xx = isFinite(R) ? x + (R > 0 ? 1 : -1) * (Math.abs(R) - Math.sqrt(Math.max(0, R * R - y * y))) * -1 : x;
      const p = v.map([xx, y]);
      i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
    }
    ctx.stroke();
    /* rayado del dorso */
    ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    for (let i = 0; i <= 10; i++) {
      const y = -h + (2 * h * i) / 10;
      const xx = isFinite(R) ? x + (R > 0 ? 1 : -1) * (Math.abs(R) - Math.sqrt(Math.max(0, R * R - y * y))) * -1 : x;
      const p = v.map([xx, y]);
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0] + 6, p[1] + 6); ctx.stroke();
    }
    ctx.restore();
  };
  /* Objeto (flecha vertical) de altura y en x */
  D.object = function (ctx, v, x, y, o = {}) {
    const col = o.color || '--c2';
    EM.draw.arrow(ctx, v.X(x), v.Y(0), v.X(x), v.Y(y), { color: col, width: o.width || 2.6, dash: o.dash });
    if (o.label) EM.text(ctx, o.label, v.X(x) + 6, v.Y(y) + (y >= 0 ? -4 : 14), { size: 12, color: col, halo: true });
  };
  /* Punto focal */
  D.focus = function (ctx, v, x, label, o = {}) {
    const X = v.X(x), Y = v.Y(0);
    ctx.save(); ctx.fillStyle = C(o.color || '--ink-2');
    ctx.beginPath(); ctx.arc(X, Y, 3.2, 0, 7); ctx.fill(); ctx.restore();
    if (label) EM.text(ctx, label, X, Y + 15, { size: 11.5, align: 'center', color: o.color || '--ink-2', halo: true, italic: true, family: EM.FONT_MATH });
  };
  /* Rayo: polilínea de puntos del mundo; virtual → discontinuo; flecha en el primer tramo */
  D.ray = function (ctx, v, pts, o = {}) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ray'); ctx.lineWidth = o.width || 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath();
    pts.forEach((p, i) => { const q = v.map(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
    ctx.stroke();
    ctx.restore();
    if (o.arrow !== false && !o.dash) {
      const a = v.map(pts[0]), b = v.map(pts[1]), t = o.arrowAt || 0.55;
      const mx = a[0] + (b[0] - a[0]) * t, my = a[1] + (b[1] - a[1]) * t, L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L > 24) EM.draw.arrow(ctx, mx - ((b[0] - a[0]) / L) * 8, my - ((b[1] - a[1]) / L) * 8, mx, my, { color: o.color || '--ray', width: o.width || 1.6, head: 8, alpha: o.alpha });
    }
  };
  /* Frente de onda circular o recta */
  D.wavefront = function (ctx, v, cx, cy, r, a0, a1, o = {}) {
    ctx.save();
    ctx.strokeStyle = C(o.color || '--accent'); ctx.lineWidth = o.width || 1.2; ctx.globalAlpha = o.alpha || 0.6;
    ctx.beginPath();
    ctx.arc(v.X(cx), v.Y(cy), r * v.sx, -a1, -a0);
    ctx.stroke(); ctx.restore();
  };
  /* Medio (rectángulo del mundo) con índice: tono proporcional a n − 1 */
  D.medium = function (ctx, v, x0, y0, x1, y1, n, o = {}) {
    const a = Math.min(0.55, 0.06 + 0.35 * (n - 1));
    ctx.save();
    ctx.fillStyle = EM.alpha(o.color || '--glass', a);
    ctx.fillRect(Math.min(v.X(x0), v.X(x1)), Math.min(v.Y(y0), v.Y(y1)), Math.abs(v.X(x1) - v.X(x0)), Math.abs(v.Y(y1) - v.Y(y0)));
    ctx.restore();
  };
  /* Pantalla con un patrón de intensidad 1D I(s) (s ∈ [−1, 1]) en un rectángulo, teñido de color */
  D.screen = function (ctx, r, I, rgb, o = {}) {
    const n = Math.max(2, Math.round(o.vertical ? r.h : r.w));
    const vals = new Float32Array(n);
    let mx = o.max || 0;
    for (let i = 0; i < n; i++) { vals[i] = I(-1 + (2 * i) / (n - 1)); if (!o.max) mx = Math.max(mx, vals[i]); }
    const g = o.gamma || 0.7;
    for (let i = 0; i < n; i++) {
      const t = Math.pow(Math.max(0, vals[i] / (mx || 1)), g), c = typeof rgb === 'function' ? rgb(-1 + (2 * i) / (n - 1)) : rgb;
      ctx.fillStyle = `rgb(${Math.round(c[0] * t)},${Math.round(c[1] * t)},${Math.round(c[2] * t)})`;
      if (o.vertical) ctx.fillRect(r.x, r.y + r.h - i - 1, r.w, 1.5); else ctx.fillRect(r.x + i, r.y, 1.5, r.h);
    }
  };

  /* Rayos principales de una lente delgada en xL con focal f; objeto {x, h}. Devuelve la imagen {x, h, real} */
  D.lensRays = function (ctx, v, xL, f, ob, o = {}) {
    const so = xL - ob.x, si = (so * f) / (so - f), xi = xL + si, hi = (-ob.h * si) / so, real = si > 0;
    const xe = o.xend === undefined ? v.x1 : o.xend;
    const cols = o.colors || ['--ray', '--c3', '--c5'];
    const O = [ob.x, ob.h];
    /* 1: paralelo → por F' */
    const after1 = (x) => ob.h + ((0 - ob.h) / f) * (x - xL);
    /* 2: por el centro */
    const s2 = -ob.h / so;
    /* 3: hacia F → paralelo */
    const y3 = (-ob.h * f) / (so - f);
    const rays = [
      { pre: [O, [xL, ob.h]], post: (x) => after1(x), c: cols[0] },
      { pre: [O, [xL, 0]], post: (x) => s2 * (x - xL), c: cols[1] },
      { pre: [O, [xL, y3]], post: () => y3, c: cols[2] }
    ];
    if (o.only) rays.splice(o.only);
    for (const r of rays) {
      if (Math.abs(r.pre[1][1]) > (o.ap || Infinity)) continue;
      D.ray(ctx, v, r.pre, { color: r.c, width: o.width || 1.6 });
      D.ray(ctx, v, [r.pre[1], [xe, r.post(xe)]], { color: r.c, width: o.width || 1.6, arrow: false });
      if (!real && isFinite(xi)) D.ray(ctx, v, [r.pre[1], [xi, r.post(xi)]], { color: r.c, width: 1.1, dash: [5, 4], alpha: 0.75 });
    }
    return { x: xi, h: hi, real, si, m: -si / so };
  };
  /* Rayos principales de un espejo esférico (plano del vértice en xM, focal f > 0 cóncavo); la luz llega desde la izquierda */
  D.mirrorRays = function (ctx, v, xM, f, ob, o = {}) {
    const so = xM - ob.x, si = (so * f) / (so - f), xi = xM - si, hi = (-ob.h * si) / so, real = si > 0;
    const xe = o.xend === undefined ? v.x0 : o.xend;
    const O = [ob.x, ob.h], cols = o.colors || ['--ray', '--c3', '--c5'];
    /* 1: paralelo → refleja por F (o como si viniera de F si f < 0) */
    const r1 = (x) => ob.h + (ob.h / f) * (x - xM); /* pasa por (xM − f, 0) */
    /* 2: al vértice → refleja simétrico */
    const r2 = (x) => (-ob.h / so) * (xM - x);
    /* 3: hacia F → refleja paralelo */
    const y3 = (-ob.h * f) / (so - f);
    const rays = [
      { pre: [O, [xM, ob.h]], post: r1, c: cols[0] },
      { pre: [O, [xM, 0]], post: r2, c: cols[1] },
      { pre: [O, [xM, y3]], post: () => y3, c: cols[2] }
    ];
    for (const r of rays) {
      if (Math.abs(r.pre[1][1]) > (o.ap || Infinity)) continue;
      D.ray(ctx, v, r.pre, { color: r.c, width: 1.6 });
      D.ray(ctx, v, [r.pre[1], [xe, r.post(xe)]], { color: r.c, width: 1.6, arrow: false });
      if (!real && isFinite(xi)) D.ray(ctx, v, [r.pre[1], [xi, r.post(xi)]], { color: r.c, width: 1.1, dash: [5, 4], alpha: 0.75 });
    }
    return { x: xi, h: hi, real, si, m: -si / so };
  };
  /* Muestra de color (swatch) con borde */
  D.swatch = function (ctx, x, y, w, h, rgb, label) {
    ctx.save();
    ctx.fillStyle = Array.isArray(rgb) ? `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` : rgb;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = C('--rule-strong'); ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.restore();
    if (label) EM.text(ctx, label, x + w / 2, y + h + 14, { size: 11, align: 'center', color: '--ink-2' });
  };
  /* sRGB [0,1] → cadena CSS */
  D.css = (g, a = 1) => `rgba(${Math.round(255 * g[0])},${Math.round(255 * g[1])},${Math.round(255 * g[2])},${a})`;
  /* Fondo oscuro de laboratorio */
  D.dark = function (cv) { EM.draw.clear(cv, EM.isDark() ? '#05070A' : '#0B0E14'); };
})();
