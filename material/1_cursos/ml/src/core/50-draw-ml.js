/* ===================================================================
   50-draw-ml.js — Dibujo propio del aprendizaje automático: puntos por
   clase, mapas de decisión y de probabilidad, fronteras, matrices de
   confusión, barras, árboles, dendrogramas, redes y elipses.
   Funciona sobre ML.View2D (aspecto 1:1) o ML.Plot (ejes libres).
   =================================================================== */
(function () {
  'use strict';
  const ML = window.ML;
  const C = (c) => (c && c.startsWith && c.startsWith('--') ? ML.col(c) : c);
  const KC = ['--k0', '--k1', '--k2', '--k3', '--k4', '--k5'];
  ML.kvar = (k) => KC[((k % KC.length) + KC.length) % KC.length];
  ML.kcol = (k) => ML.col(ML.kvar(k));

  /* Adaptador: convierte View2D o Plot en {X, Y, wx, wy, x0, y0, w, h, ctx} */
  ML.frame = function (v) {
    if (v instanceof ML.Plot) return { X: (x) => v.X(x), Y: (y) => v.Y(y), wx: (p) => v.invX(p), wy: (p) => v.invY(p), x0: v.ix, y0: v.iy, w: v.iw, h: v.ih, ctx: v.ctx, plot: v };
    return { X: (x) => v.X(x), Y: (y) => v.Y(y), wx: (p) => v.wx(p), wy: (p) => v.wy(p), x0: 0, y0: 0, w: v.cv.w, h: v.cv.h, ctx: v.cv.ctx, view: v };
  };

  /* Mapa de color por píxel: fn(x, y) → [r, g, b, a(0..1)] en coordenadas del mundo */
  const offs = new WeakMap();
  ML.heatmap = function (v, fn, o = {}) {
    const F = ML.frame(v), res = o.res || 4;
    const nx = Math.max(1, Math.ceil(F.w / res)), ny = Math.max(1, Math.ceil(F.h / res));
    let off = offs.get(F.ctx);
    if (!off || off.width !== nx || off.height !== ny) { off = document.createElement('canvas'); off.width = nx; off.height = ny; offs.set(F.ctx, off); }
    const octx = off.getContext('2d'), img = octx.createImageData(nx, ny), d = img.data;
    for (let j = 0; j < ny; j++) {
      const y = F.wy(F.y0 + (j + 0.5) * res);
      for (let i = 0; i < nx; i++) {
        const c = fn(F.wx(F.x0 + (i + 0.5) * res), y);
        const k = (j * nx + i) * 4;
        d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = Math.round(255 * (c[3] === undefined ? 1 : c[3]));
      }
    }
    octx.putImageData(img, 0, 0);
    const ctx = F.ctx;
    ctx.save();
    ctx.beginPath(); ctx.rect(F.x0, F.y0, F.w, F.h); ctx.clip();
    ctx.imageSmoothingEnabled = o.smooth !== false;
    ctx.drawImage(off, F.x0, F.y0, nx * res, ny * res);
    ctx.restore();
  };
  /* Mapa de probabilidad: pfn(x, y) devuelve p(clase 1) (binario) o un vector de probabilidades.
     o.hard: colorea solo la clase ganadora; o.alpha: opacidad máxima */
  ML.probMap = function (v, pfn, o = {}) {
    const bg = ML.rgb('--canvas');
    const cols = KC.map((k) => ML.rgb(k));
    const amax = o.alpha === undefined ? 0.55 : o.alpha;
    ML.heatmap(v, (x, y) => {
      let p = pfn(x, y);
      if (typeof p === 'number') p = [1 - p, p];
      let k = 0;
      for (let c = 1; c < p.length; c++) if (p[c] > p[k]) k = c;
      let conf = p[k];
      const K = p.length;
      let t = o.hard ? 1 : K > 1 ? (conf - 1 / K) / (1 - 1 / K) : 1;
      t = Math.pow(ML.M.clamp(t, 0, 1), o.gamma || 0.8) * amax;
      if (o.hard) t = amax * 0.7;
      const c = cols[k % cols.length];
      return [bg[0] + (c[0] - bg[0]) * t, bg[1] + (c[1] - bg[1]) * t, bg[2] + (c[2] - bg[2]) * t, 1];
    }, o);
  };
  /* Curva de nivel f = level (frontera de decisión) por marching squares */
  ML.contour = function (v, fn, levels, o = {}) {
    const F = ML.frame(v), res = o.res || 4;
    const nx = Math.ceil(F.w / res) + 1, ny = Math.ceil(F.h / res) + 1;
    const vals = new Float64Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) vals[j * nx + i] = fn(F.wx(F.x0 + i * res), F.wy(F.y0 + j * res));
    const ctx = F.ctx;
    ctx.save();
    ctx.beginPath(); ctx.rect(F.x0, F.y0, F.w, F.h); ctx.clip();
    ctx.lineWidth = o.width || 2;
    ctx.lineJoin = 'round';
    ctx.setLineDash(o.dash || []);
    for (const Lv of Array.isArray(levels) ? levels : [levels]) {
      ctx.strokeStyle = typeof o.color === 'function' ? o.color(Lv) : C(o.color || '--ink');
      ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
      ctx.beginPath();
      for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const a = vals[j * nx + i], b = vals[j * nx + i + 1], c = vals[(j + 1) * nx + i + 1], d = vals[(j + 1) * nx + i];
        if (!(isFinite(a) && isFinite(b) && isFinite(c) && isFinite(d))) continue;
        let idx = 0;
        if (a > Lv) idx |= 8; if (b > Lv) idx |= 4; if (c > Lv) idx |= 2; if (d > Lv) idx |= 1;
        if (idx === 0 || idx === 15) continue;
        const x = F.x0 + i * res, y = F.y0 + j * res;
        const top = () => [x + (res * (Lv - a)) / (b - a), y];
        const right = () => [x + res, y + (res * (Lv - b)) / (c - b)];
        const bottom = () => [x + (res * (Lv - d)) / (c - d), y + res];
        const left = () => [x, y + (res * (Lv - a)) / (d - a)];
        const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
        switch (idx) {
          case 1: case 14: seg(left(), bottom()); break;
          case 2: case 13: seg(bottom(), right()); break;
          case 3: case 12: seg(left(), right()); break;
          case 4: case 11: seg(top(), right()); break;
          case 6: case 9: seg(top(), bottom()); break;
          case 7: case 8: seg(left(), top()); break;
          case 5: case 10: { const ctr = (a + b + c + d) / 4; if ((idx === 5) === (ctr > Lv)) { seg(left(), top()); seg(bottom(), right()); } else { seg(left(), bottom()); seg(top(), right()); } break; }
        }
      }
      ctx.stroke();
    }
    ctx.restore();
  };
  /* Frontera de una clasificación multiclase (cambios de etiqueta) */
  ML.labelEdges = function (v, lfn, o = {}) {
    const F = ML.frame(v), res = o.res || 4;
    const nx = Math.ceil(F.w / res), ny = Math.ceil(F.h / res);
    const lab = new Int16Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) lab[j * nx + i] = lfn(F.wx(F.x0 + (i + 0.5) * res), F.wy(F.y0 + (j + 0.5) * res));
    const ctx = F.ctx;
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ink');
    ctx.globalAlpha = o.alpha === undefined ? 0.8 : o.alpha;
    ctx.lineWidth = o.width || 1.6;
    ctx.beginPath();
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const L0 = lab[j * nx + i];
      if (i + 1 < nx && lab[j * nx + i + 1] !== L0) { const x = F.x0 + (i + 1) * res; ctx.moveTo(x, F.y0 + j * res); ctx.lineTo(x, F.y0 + (j + 1) * res); }
      if (j + 1 < ny && lab[(j + 1) * nx + i] !== L0) { const y = F.y0 + (j + 1) * res; ctx.moveTo(F.x0 + i * res, y); ctx.lineTo(F.x0 + (i + 1) * res, y); }
    }
    ctx.stroke();
    ctx.restore();
    return lab;
  };

  /* Puntos por clase. o = {r, hollow: Set/array de índices, wrong: Set, size: arreglo de escalas,
     mark: índice resaltado, shapes: true (círculo/cuadrado/triángulo), alpha} */
  ML.points = function (v, X, y, o = {}) {
    const F = ML.frame(v), ctx = F.ctx, r0 = o.r || 4.2;
    const hollow = o.hollow ? new Set(o.hollow) : null, wrong = o.wrong ? new Set(o.wrong) : null;
    const edge = ML.col('--canvas');
    ctx.save();
    ctx.beginPath(); ctx.rect(F.x0 - 6, F.y0 - 6, F.w + 12, F.h + 12); ctx.clip();
    for (let i = 0; i < X.length; i++) {
      const px = F.X(X[i][0]), py = F.Y(X[i][1]);
      const k = y ? y[i] : 0;
      const r = r0 * (o.size ? o.size[i] : 1);
      const col = k < 0 ? ML.col('--ink-3') : ML.kcol(k);
      ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
      ctx.beginPath();
      const shape = o.shapes ? k % 3 : 0;
      if (shape === 1) ctx.rect(px - r * 0.88, py - r * 0.88, r * 1.76, r * 1.76);
      else if (shape === 2) { ctx.moveTo(px, py - r * 1.15); ctx.lineTo(px + r * 1.05, py + r * 0.75); ctx.lineTo(px - r * 1.05, py + r * 0.75); ctx.closePath(); }
      else ctx.arc(px, py, r, 0, 2 * Math.PI);
      if (hollow && hollow.has(i)) { ctx.lineWidth = 1.8; ctx.strokeStyle = col; ctx.fillStyle = edge; ctx.fill(); ctx.stroke(); }
      else { ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = edge; ctx.stroke(); }
      if (wrong && wrong.has(i)) { ctx.globalAlpha = 1; ctx.lineWidth = 1.6; ctx.strokeStyle = ML.col('--ink'); ctx.beginPath(); ctx.arc(px, py, r + 3, 0, 2 * Math.PI); ctx.stroke(); }
      if (o.mark === i) { ctx.globalAlpha = 1; ctx.lineWidth = 2.2; ctx.strokeStyle = ML.col('--accent'); ctx.beginPath(); ctx.arc(px, py, r + 5, 0, 2 * Math.PI); ctx.stroke(); }
    }
    ctx.restore();
  };
  /* Elipse de covarianza (nsd desviaciones) */
  ML.ellipse = function (v, m, S, o = {}) {
    const F = ML.frame(v), ctx = F.ctx, ns = o.nsd || 2;
    const a = S[0][0], b = S[0][1], d = S[1][1];
    const tr = (a + d) / 2, det = Math.sqrt(Math.max(0, ((a - d) / 2) ** 2 + b * b));
    const l1 = tr + det, l2 = Math.max(0, tr - det);
    const th = Math.abs(b) < 1e-14 ? (a >= d ? 0 : Math.PI / 2) : Math.atan2(l1 - a, b);
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ink');
    ctx.lineWidth = o.width || 1.8;
    ctx.setLineDash(o.dash || []);
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    ctx.beginPath();
    for (let t = 0; t <= 64; t++) {
      const u = (2 * Math.PI * t) / 64;
      const ex = ns * Math.sqrt(l1) * Math.cos(u), ey = ns * Math.sqrt(l2) * Math.sin(u);
      const x = m[0] + ex * Math.cos(th) - ey * Math.sin(th), y = m[1] + ex * Math.sin(th) + ey * Math.cos(th);
      if (t === 0) ctx.moveTo(F.X(x), F.Y(y)); else ctx.lineTo(F.X(x), F.Y(y));
    }
    if (o.fill) { ctx.fillStyle = C(o.fill); ctx.globalAlpha = o.fillAlpha || 0.12; ctx.fill(); ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha; }
    ctx.stroke();
    ctx.restore();
  };
  /* Cruz para centroides */
  ML.cross = function (v, x, y, o = {}) {
    const F = ML.frame(v), ctx = F.ctx, s = o.s || 7, px = F.X(x), py = F.Y(y);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = ML.col('--canvas'); ctx.lineWidth = 5.5;
    ctx.beginPath(); ctx.moveTo(px - s, py - s); ctx.lineTo(px + s, py + s); ctx.moveTo(px + s, py - s); ctx.lineTo(px - s, py + s); ctx.stroke();
    ctx.strokeStyle = C(o.color || '--ink'); ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();
  };

  /* Histograma sobre un Plot (h de L.stat.hist) */
  ML.drawHist = function (plot, h, o = {}) {
    const ctx = plot.ctx;
    plot.clip(() => {
      ctx.fillStyle = ML.alpha(o.color || '--c1', o.alpha || 0.45);
      ctx.strokeStyle = C(o.color || '--c1');
      const vals = o.counts ? h.counts : h.dens;
      for (let b = 0; b < h.nb; b++) {
        const x0 = plot.X(h.lo + b * h.w), x1 = plot.X(h.lo + (b + 1) * h.w);
        const y0 = plot.Y(0), y1 = plot.Y(vals[b] * (o.scale || 1));
        ctx.fillRect(x0 + 0.5, y1, Math.max(1, x1 - x0 - 1), y0 - y1);
      }
    });
  };
  /* Barras horizontales: items [{label, value, color, err}] dentro de una caja */
  ML.hbars = function (ctx, box, items, o = {}) {
    const n = items.length, lw = o.labelW || 120, pad = 6;
    const vmax = o.max !== undefined ? o.max : Math.max(1e-12, ...items.map((it) => Math.abs(it.value) + (it.err || 0)));
    const vmin = o.min !== undefined ? o.min : Math.min(0, ...items.map((it) => it.value - (it.err || 0)));
    const x0 = box.x + lw, w = box.w - lw - (o.right || 46);
    const X = (v) => x0 + ((v - vmin) / (vmax - vmin)) * w;
    const bh = Math.min(o.barH || 22, (box.h - pad) / n - 4);
    if (vmin < 0) { ctx.strokeStyle = ML.col('--axis'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(0) + 0.5, box.y); ctx.lineTo(X(0) + 0.5, box.y + box.h); ctx.stroke(); }
    items.forEach((it, i) => {
      const yc = box.y + pad + i * ((box.h - pad) / n) + bh / 2;
      const a = X(Math.min(0, it.value)), b = X(Math.max(0, it.value));
      ctx.fillStyle = C(it.color || o.color || '--c1');
      ctx.globalAlpha = it.alpha === undefined ? 0.85 : it.alpha;
      ctx.fillRect(a, yc - bh / 2, Math.max(1, b - a), bh);
      ctx.globalAlpha = 1;
      if (it.err) { ctx.strokeStyle = ML.col('--ink'); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(X(it.value - it.err), yc); ctx.lineTo(X(it.value + it.err), yc); ctx.moveTo(X(it.value - it.err), yc - 4); ctx.lineTo(X(it.value - it.err), yc + 4); ctx.moveTo(X(it.value + it.err), yc - 4); ctx.lineTo(X(it.value + it.err), yc + 4); ctx.stroke(); }
      ML.text(ctx, it.label, box.x + lw - 8, yc, { size: o.size || 12, color: '--ink-2', align: 'right', baseline: 'middle' });
      const fmt = o.fmt || ((v) => ML.fix(v, 3));
      const tx = it.value >= 0 ? Math.max(b, it.err ? X(it.value + it.err) : b) + 5 : Math.max(X(0), it.err ? X(it.value + it.err) : X(0)) + 5;
      ML.text(ctx, fmt(it.value), tx, yc, { size: 11, mono: true, color: '--ink-2', align: 'left', baseline: 'middle', halo: true });
    });
  };
  /* Matriz con colores (confusión, correlación, atención). o = {rows, cols, fmt, cmap, max, title} */
  ML.matrix = function (ctx, box, M, o = {}) {
    const nr = M.length, nc = M[0].length;
    const lw = o.rowW === undefined ? 70 : o.rowW, th = o.colH === undefined ? 34 : o.colH;
    const cw = (box.w - lw) / nc, ch = (box.h - th) / nr;
    const flat = M.flat().filter(isFinite);
    const vmax = o.max !== undefined ? o.max : Math.max(...flat.map(Math.abs), 1e-12);
    const bg = ML.rgb('--canvas');
    for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) {
      const v = M[i][j], x = box.x + lw + j * cw, y = box.y + th + i * ch;
      let col;
      if (o.cmap) col = o.cmap(v, i, j);
      else { const t = ML.M.clamp(Math.abs(v) / vmax, 0, 1); const e = ML.rgb(o.diag && i === j ? '--c3' : o.color || '--c1'); col = [bg[0] + (e[0] - bg[0]) * t * 0.85, bg[1] + (e[1] - bg[1]) * t * 0.85, bg[2] + (e[2] - bg[2]) * t * 0.85]; }
      ctx.fillStyle = ML.rgbStr(col);
      ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
      if (o.fmt !== null && cw > 22 && ch > 14) {
        const lum = (0.299 * col[0] + 0.587 * col[1] + 0.114 * col[2]) / 255;
        ML.text(ctx, o.fmt ? o.fmt(v) : String(v), x + cw / 2, y + ch / 2, { size: Math.min(15, ch * 0.42, cw * 0.32), mono: true, align: 'center', baseline: 'middle', color: lum < 0.5 ? '#FFFFFF' : '#10201E', weight: 600 });
      }
    }
    if (o.rows) o.rows.forEach((t, i) => ML.text(ctx, t, box.x + lw - 6, box.y + th + (i + 0.5) * ch, { size: 11.5, color: '--ink-2', align: 'right', baseline: 'middle' }));
    if (o.cols) o.cols.forEach((t, j) => ML.text(ctx, t, box.x + lw + (j + 0.5) * cw, box.y + th - 8, { size: 11.5, color: '--ink-2', align: 'center' }));
    if (o.title) ML.text(ctx, o.title, box.x + lw, box.y + 11, { size: 11.5, color: '--ink-2', weight: 650 });
    if (o.ylab) { ctx.save(); ctx.translate(box.x + 10, box.y + th + (nr * ch) / 2); ctx.rotate(-Math.PI / 2); ML.text(ctx, o.ylab, 0, 0, { size: 11, color: '--ink-3', align: 'center', baseline: 'middle' }); ctx.restore(); }
    return { cw, ch, lw, th };
  };
  ML.confusionHTML = function (M, names) {
    const K = M.length;
    let h = '<table class="sim-tab"><tr><th>real \\ pred.</th>' + names.map((n) => `<th>${n}</th>`).join('') + '</tr>';
    for (let i = 0; i < K; i++) h += `<tr><td>${names[i]}</td>` + M[i].map((v, j) => `<td${i === j ? ' style="font-weight:700"' : ''}>${v}</td>`).join('') + '</tr>';
    return h + '</table>';
  };

  /* Diagrama de un árbol de decisión (L.tree). o = {names, classes, highlight: Set de ids, maxDepth} */
  ML.drawTree = function (ctx, box, tree, o = {}) {
    const leaves = [];
    const md = o.maxDepth === undefined ? Infinity : o.maxDepth;
    const walk = (nd, d) => { if (nd.leaf || d >= md) { leaves.push(nd); return; } walk(nd.left, d + 1); walk(nd.right, d + 1); };
    walk(tree.root, 0);
    const pos = new Map();
    leaves.forEach((nd, i) => pos.set(nd, (i + 0.5) / leaves.length));
    const place = (nd, d) => { if (nd.leaf || d >= md) return pos.get(nd); const x = (place(nd.left, d + 1) + place(nd.right, d + 1)) / 2; pos.set(nd, x); return x; };
    place(tree.root, 0);
    const depth = Math.min(md, tree.depth ? tree.depth() : 6);
    const dy = (box.h - 34) / Math.max(1, depth);
    const P = (nd) => [box.x + pos.get(nd) * box.w, box.y + 16 + nd.depth * dy];
    const names = o.names || ['x₁', 'x₂', 'x₃', 'x₄'];
    ctx.save();
    ctx.strokeStyle = ML.col('--rule-strong');
    ctx.lineWidth = 1.2;
    const edges = (nd, d) => { if (nd.leaf || d >= md) return; for (const ch of [nd.left, nd.right]) { const a = P(nd), b = P(ch); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.strokeStyle = o.highlight && o.highlight.has(ch.id) ? ML.col('--accent') : ML.col('--rule-strong'); ctx.lineWidth = o.highlight && o.highlight.has(ch.id) ? 2.6 : 1.2; ctx.stroke(); edges(ch, d + 1); } };
    edges(tree.root, 0);
    const R = Math.max(5, Math.min(13, box.w / (leaves.length * 2.6)));
    const nodes = (nd, d) => {
      const [x, y] = P(nd);
      const isLeaf = nd.leaf || d >= md;
      let col;
      if (tree.task === 'clf') { const k = nd.value.indexOf(Math.max(...nd.value)); const pur = Math.max(...nd.value); col = ML.mix('--canvas', ML.kvar(k), 0.25 + 0.75 * ((pur - 1 / tree.K) / (1 - 1 / tree.K))); }
      else { const t = o.vmin !== undefined ? (nd.value - o.vmin) / (o.vmax - o.vmin) : 0.5; col = ML.rgbStr(ML.cmap.viridis(ML.M.clamp(t, 0, 1))); }
      ctx.beginPath();
      if (isLeaf) ctx.rect(x - R, y - R * 0.8, 2 * R, 1.6 * R); else ctx.arc(x, y, R * 0.85, 0, 2 * Math.PI);
      ctx.fillStyle = col; ctx.fill();
      ctx.lineWidth = o.highlight && o.highlight.has(nd.id) ? 2.6 : 1;
      ctx.strokeStyle = o.highlight && o.highlight.has(nd.id) ? ML.col('--accent') : ML.col('--ink-3');
      ctx.stroke();
      if (!isLeaf && box.w / leaves.length > 34) ML.text(ctx, `${names[nd.feature]} ≤ ${ML.fix(nd.thr, 2)}`, x, y - R - 4, { size: 10.5, mono: true, color: '--ink', align: 'center', halo: true });
      if (isLeaf && o.leafText && box.w / leaves.length > 30) ML.text(ctx, o.leafText(nd), x, y + R + 11, { size: 10, mono: true, color: '--ink-2', align: 'center', halo: true });
      if (!isLeaf) { nodes(nd.left, d + 1); nodes(nd.right, d + 1); }
    };
    nodes(tree.root, 0);
    ctx.restore();
  };

  /* Dendrograma de merges de L.clu.agglo. Devuelve la escala vertical (altura → píxel) */
  ML.drawDendro = function (ctx, box, merges, n, o = {}) {
    const hmax = Math.max(...merges.map((m) => m[2])) * 1.05 || 1;
    const Y = (h) => box.y + box.h - (h / hmax) * box.h;
    const children = new Map();
    merges.forEach((m, s) => children.set(n + s, [m[0], m[1], m[2]]));
    const order = [];
    const walk = (id) => { if (id < n) { order.push(id); return; } const [a, b] = children.get(id); walk(a); walk(b); };
    walk(2 * n - 2);
    const xpos = new Map();
    order.forEach((id, i) => xpos.set(id, box.x + ((i + 0.5) / n) * box.w));
    const hpos = new Map();
    for (let i = 0; i < n; i++) hpos.set(i, 0);
    ctx.save();
    ctx.lineWidth = 1.3;
    merges.forEach((m, s) => {
      const id = n + s, [a, b, h] = m;
      const xa = xpos.get(a), xb = xpos.get(b);
      xpos.set(id, (xa + xb) / 2); hpos.set(id, h);
      const cut = o.cut !== undefined && h > o.cut;
      ctx.strokeStyle = cut ? ML.col('--ink-3') : o.colorOf ? o.colorOf(id) : ML.col('--c1');
      ctx.beginPath();
      ctx.moveTo(xa, Y(hpos.get(a))); ctx.lineTo(xa, Y(h)); ctx.lineTo(xb, Y(h)); ctx.lineTo(xb, Y(hpos.get(b)));
      ctx.stroke();
    });
    if (o.cut !== undefined) { ctx.strokeStyle = ML.col('--c2'); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(box.x, Y(o.cut)); ctx.lineTo(box.x + box.w, Y(o.cut)); ctx.stroke(); }
    ctx.restore();
    return { Y, hmax, order, xpos };
  };

  /* Red neuronal: círculos por capa, conexiones con grosor ∝ |w| y color por signo */
  ML.drawNet = function (ctx, box, net, o = {}) {
    const sizes = net.sizes, nl = sizes.length;
    const pos = sizes.map((s, l) => Array.from({ length: s }, (_, i) => [box.x + ((l + 0.5) / nl) * box.w, box.y + ((i + 0.5) / s) * box.h]));
    let wmax = 1e-9;
    for (let l = 0; l < nl - 1; l++) for (let q = 0; q < sizes[l] * sizes[l + 1]; q++) wmax = Math.max(wmax, Math.abs(net.params[net.off[l].W + q]));
    ctx.save();
    for (let l = 0; l < nl - 1; l++) for (let j = 0; j < sizes[l + 1]; j++) for (let i = 0; i < sizes[l]; i++) {
      const w = net.W(l, j, i), t = Math.abs(w) / wmax;
      ctx.strokeStyle = ML.alpha(w >= 0 ? '--k1' : '--k0', 0.15 + 0.75 * t);
      ctx.lineWidth = 0.4 + 3.2 * t;
      ctx.beginPath(); ctx.moveTo(pos[l][i][0], pos[l][i][1]); ctx.lineTo(pos[l + 1][j][0], pos[l + 1][j][1]); ctx.stroke();
    }
    const R = Math.max(4, Math.min(12, box.h / (2.6 * Math.max(...sizes))));
    pos.forEach((col, l) => col.forEach(([x, y], i) => {
      ctx.beginPath(); ctx.arc(x, y, R, 0, 2 * Math.PI);
      const a = o.acts && o.acts[l] ? o.acts[l][i] : null;
      ctx.fillStyle = a === null ? ML.col('--surface') : ML.rgbStr(ML.cmap.diverging(ML.M.clamp(a, -1, 1)));
      ctx.fill(); ctx.lineWidth = 1.3; ctx.strokeStyle = ML.col('--ink-2'); ctx.stroke();
    }));
    if (o.labels) o.labels.forEach((t, l) => ML.text(ctx, t, pos[l][0][0], box.y + box.h + 2, { size: 11, color: '--ink-3', align: 'center', baseline: 'top' }));
    ctx.restore();
    return pos;
  };

  /* Imagen en escala de grises (vector de h·w valores en [vmin, vmax]) */
  ML.drawImage = function (ctx, box, img, h, w, o = {}) {
    const vmin = o.vmin === undefined ? Math.min(...img) : o.vmin, vmax = o.vmax === undefined ? Math.max(...img) : o.vmax;
    const cw = box.w / w, ch = box.h / h;
    for (let i = 0; i < h; i++) for (let j = 0; j < w; j++) {
      const v = img[i * w + j];
      let col;
      if (o.diverging) col = ML.cmap.diverging(ML.M.clamp(v / Math.max(Math.abs(vmin), Math.abs(vmax), 1e-12), -1, 1));
      else { const t = ML.M.clamp((v - vmin) / ((vmax - vmin) || 1), 0, 1); const a = ML.rgb('--canvas'), b = ML.rgb('--ink'); col = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
      ctx.fillStyle = ML.rgbStr(col);
      ctx.fillRect(box.x + j * cw, box.y + i * ch, Math.ceil(cw), Math.ceil(ch));
    }
    if (o.grid) { ctx.strokeStyle = ML.alpha('--rule-strong', 0.6); ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i <= h; i++) { ctx.moveTo(box.x, box.y + i * ch); ctx.lineTo(box.x + box.w, box.y + i * ch); } for (let j = 0; j <= w; j++) { ctx.moveTo(box.x + j * cw, box.y); ctx.lineTo(box.x + j * cw, box.y + box.h); } ctx.stroke(); }
    if (o.frame !== false) { ctx.strokeStyle = ML.col('--rule-strong'); ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w, box.h); }
  };

  /* Selector estándar de conjunto de datos 2D para las simulaciones */
  ML.dataControls = function (sim, o = {}) {
    sim.group(o.title || 'Datos');
    sim.select('kind', { label: 'Conjunto de datos', options: o.kinds || ML.L.data.KINDS.filter((k) => o.multi || k[0] !== 'blobs3'), value: o.kind || 'moons' });
    sim.slider('n', { label: 'Número de puntos', min: 20, max: o.nmax || 400, step: 10, value: o.n || 200, fmt: (v) => ML.fix(v, 0) });
    sim.slider('noise', { label: 'Ruido', min: 0, max: 1, step: 0.01, value: o.noise === undefined ? 0.35 : o.noise, fmt: (v) => ML.fix(v, 2) });
    if (o.seed !== false) sim.button('Nueva muestra', () => { sim.p.seed = (sim.p.seed || 1) + 1; if (sim.onData) sim.onData(); }, { id: 'resample' });
    sim.p.seed = o.seedValue || 1;
  };
  ML.makeData = function (sim, extra = 0) {
    const rng = ML.L.rng(1000 * (sim.p.seed || 1) + 7 + extra);
    return ML.L.data.make2d(sim.p.kind, Math.round(sim.p.n), sim.p.noise, rng);
  };
  /* Vista 2D estándar con cuadrícula para datos en [-2, 2]² */
  ML.view2 = function (cv, r = 2.1) { const v = new ML.View2D(cv, { xmin: -r, xmax: r, ymin: -r, ymax: r }); return v; };
})();
