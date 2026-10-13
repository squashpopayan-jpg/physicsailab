/* Capítulo 27 — Redes convolucionales */
(function () {
  'use strict';
  const ML = window.ML, L = ML.L, U = L.util;
  const f2 = (v) => ML.fix(v, 2), pct = (v) => ML.fix(100 * v, 1) + ' %';
  /* Lienzo de dibujo en una cuadrícula h×w; devuelve la caja dibujada */
  const paintable = (sim, cv, img, H, W, getBox, o = {}) => {
    let down = false;
    const paint = (px, py, e) => {
      const b = getBox(); if (!b) return;
      const j = Math.floor(((px - b.x) / b.w) * W), i = Math.floor(((py - b.y) / b.h) * H);
      if (i < 0 || j < 0 || i >= H || j >= W) return;
      const erase = e && (e.buttons === 2 || e.shiftKey);
      for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) {
        const ii = i + a, jj = j + c; if (ii < 0 || jj < 0 || ii >= H || jj >= W) continue;
        const w = a === 0 && c === 0 ? 1 : o.soft || 0;
        img[ii * W + jj] = erase ? 0 : Math.min(o.max || 1, img[ii * W + jj] + w * (o.max || 1));
      }
      sim.redraw();
    };
    ML.pointer(cv, { down: (px, py, e) => { const b = getBox(); if (!b || px < b.x || py < b.y || px > b.x + b.w || py > b.y + b.h) return null; down = true; paint(px, py, e); return 1; }, move: (k, px, py, e) => { if (down) paint(px, py, e); }, up: () => { down = false; if (o.onUp) o.onUp(); }, hover: (px, py) => { const b = getBox(); return b && px >= b.x && py >= b.y && px <= b.x + b.w && py <= b.y + b.h ? 'crosshair' : false; } });
    cv.el.addEventListener('contextmenu', (e) => e.preventDefault());
  };

  /* ======================================================================
     27.1 Convolución, ReLU y agrupación sobre un dibujo
     ====================================================================== */
  const KER = {
    vert: { n: 'Borde vertical (Sobel x)', k: [[1, 0, -1], [2, 0, -2], [1, 0, -1]] },
    horz: { n: 'Borde horizontal (Sobel y)', k: [[1, 2, 1], [0, 0, 0], [-1, -2, -1]] },
    diag: { n: 'Diagonal', k: [[2, 1, 0], [1, 0, -1], [0, -1, -2]] },
    blur: { n: 'Desenfoque (promedio)', k: [[1, 1, 1], [1, 1, 1], [1, 1, 1]].map((r) => r.map((v) => v / 9)) },
    sharp: { n: 'Realce', k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] },
    lap: { n: 'Laplaciano (bordes en todas direcciones)', k: [[0, 1, 0], [1, -4, 1], [0, 1, 0]] }
  };
  const SEED16 = () => { const img = new Float64Array(256); for (let i = 3; i < 13; i++) { img[i * 16 + 4] = 1; img[i * 16 + 5] = 1; } for (let j = 4; j < 12; j++) { img[3 * 16 + j] = 1; img[4 * 16 + j] = 1; } for (let k = 0; k < 9; k++) { const i = 4 + k, j = 11 - Math.round(k * 0.6); img[i * 16 + j] = 1; } return img; };
  ML.defineSim('convolucion-dibujo', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    sim.group('Filtro');
    sim.select('ker', { label: 'Núcleo 3×3', options: Object.keys(KER).map((k) => [k, KER[k].n]), value: 'vert' });
    sim.slider('stride', { label: 'Paso (stride)', min: 1, max: 2, step: 1, value: 1, fmt: (v) => ML.fix(v, 0) });
    sim.check('pad', { label: 'Relleno de 1 píxel (padding)', value: true });
    sim.button('Borrar', () => { img.fill(0); }, { id: 'clear' });
    sim.button('Ejemplo', () => { img.set(SEED16()); }, { id: 'seed' });
    sim.note('Dibuje con el ratón sobre la imagen de entrada (clic derecho o Mayús para borrar).');
    sim.out('size', 'Tamaños: entrada → convolución → agrupación', { hl: true });
    sim.out('k', 'Núcleo', { wide: true });
    const img = SEED16();
    let box = null;
    paintable(sim, cv, img, 16, 16, () => box, { soft: 0.25 });
    sim.onDraw(() => {
      const ctx = cv.ctx, K = KER[sim.p.ker].k, pad = sim.p.pad ? 1 : 0, s = sim.p.stride;
      const c = L.nn.conv2d(img, 16, 16, K, { pad, stride: s });
      const r = Array.from(c.out, (v) => Math.max(0, v));
      const pl = L.nn.pool(Float64Array.from(r), c.h, c.w, 2, 'max');
      ML.draw.clear(cv);
      const S = Math.min(cv.h - 44, (cv.w - 60) / 4.4);
      box = { x: 10, y: 26, w: S, h: S };
      ML.drawImage(ctx, box, img, 16, 16, { vmin: 0, vmax: 1, grid: true });
      const b2 = { x: 20 + S * 1.05, y: 26, w: S * (c.w / 16), h: S * (c.h / 16) };
      ML.drawImage(ctx, b2, c.out, c.h, c.w, { diverging: true });
      const b3 = { x: 30 + S * 2.1, y: 26, w: S * (c.w / 16), h: S * (c.h / 16) };
      ML.drawImage(ctx, b3, r, c.h, c.w, { vmin: 0, vmax: Math.max(1e-9, ...r) });
      const b4 = { x: 40 + S * 3.15, y: 26, w: S * (pl.w / 16), h: S * (pl.h / 16) };
      ML.drawImage(ctx, b4, pl.out, pl.h, pl.w, { vmin: 0, vmax: Math.max(1e-9, ...pl.out), grid: true });
      ML.text(ctx, 'entrada 16×16 (dibuje aquí)', box.x, 16, { size: 11.5, color: '--ink-2' });
      ML.text(ctx, `convolución ${c.h}×${c.w}`, b2.x, 16, { size: 11.5, color: '--ink-2' });
      ML.text(ctx, 'tras ReLU', b3.x, 16, { size: 11.5, color: '--ink-2' });
      ML.text(ctx, `máx. 2×2 → ${pl.h}×${pl.w}`, b4.x, 16, { size: 11.5, color: '--ink-2' });
      sim.set('size', `16×16 → ${c.h}×${c.w} → ${pl.h}×${pl.w}`);
      sim.set('k', `<pre style="margin:0;font:12px var(--font-mono)">${K.map((row) => row.map((v) => ML.minus(v.toFixed(2)).padStart(6)).join(' ')).join('<br>')}</pre>`);
    });
  });

  /* ======================================================================
     27.2 Calculadora de tamaños, parámetros y campo receptivo
     ====================================================================== */
  ML.defineSim('calculadora-capas', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    sim.group('Capa convolucional');
    sim.slider('N', { label: 'Tamaño de la entrada (alto = ancho)', min: 5, max: 224, step: 1, value: 32, fmt: (v) => ML.fix(v, 0) });
    sim.slider('C', { label: 'Canales de entrada', min: 1, max: 256, step: 1, value: 3, fmt: (v) => ML.fix(v, 0) });
    sim.slider('k', { label: 'Tamaño del núcleo k', min: 1, max: 11, step: 2, value: 3, fmt: (v) => ML.fix(v, 0) });
    sim.slider('s', { label: 'Paso s', min: 1, max: 4, step: 1, value: 1, fmt: (v) => ML.fix(v, 0) });
    sim.slider('p', { label: 'Relleno p', min: 0, max: 5, step: 1, value: 1, fmt: (v) => ML.fix(v, 0) });
    sim.slider('F', { label: 'Filtros (canales de salida)', min: 1, max: 512, step: 1, value: 64, fmt: (v) => ML.fix(v, 0) });
    sim.slider('depth', { label: 'Capas 3×3 apiladas (campo receptivo)', min: 1, max: 10, step: 1, value: 3, fmt: (v) => ML.fix(v, 0) });
    sim.out('out', 'Salida: alto × ancho × canales', { hl: true });
    sim.out('par', 'Parámetros de la capa');
    sim.out('dense', 'Una capa densa equivalente tendría');
    sim.out('rf', 'Campo receptivo de la pila de capas 3×3');
    sim.onDraw(() => {
      const { N, C, k, s, p, F } = sim.p, D = Math.round(sim.p.depth);
      const out = Math.floor((N + 2 * p - k) / s) + 1;
      const par = F * (k * k * C + 1), dense = N * N * C * (Math.max(out, 0) * Math.max(out, 0) * F) + out * out * F;
      const ctx = cv.ctx;
      ML.draw.clear(cv);
      const n = Math.min(N + 2 * p, 24), cell = Math.min(24, (cv.w - 40) / n);
      const y0 = 40;
      ML.text(ctx, `una fila de la entrada (${N} píxeles${p ? ` + ${p} de relleno a cada lado` : ''}${N + 2 * p > 24 ? ', se muestran 24' : ''}) y las posiciones del núcleo`, 14, 20, { size: 11.5, color: '--ink-2' });
      for (let j = 0; j < n; j++) { const isPad = j < p || j >= N + p; ctx.fillStyle = isPad ? ML.alpha('--ink-3', 0.15) : ML.alpha('--c1', 0.25); ctx.fillRect(20 + j * cell, y0, cell - 2, cell - 2); }
      for (let o = 0, row = 0; o * s + k <= n; o++, row++) {
        if (row > 6) break;
        ctx.strokeStyle = ML.col(ML.kvar(row)); ctx.lineWidth = 2;
        ctx.strokeRect(20 + o * s * cell, y0 + cell + 6 + row * 9, k * cell - 2, 6);
      }
      const rf = 1 + 2 * D;
      const yb = cv.h - 60;
      ML.text(ctx, `campo receptivo de ${D} capa${D > 1 ? 's' : ''} 3×3 apilada${D > 1 ? 's' : ''}: ${rf}×${rf} píxeles de la entrada`, 14, yb - 10, { size: 11.5, color: '--ink-2' });
      for (let d = 0; d <= D; d++) { const w = (1 + 2 * d) * 6; ctx.strokeStyle = ML.alpha('--c5', 0.3 + 0.7 * (d / D)); ctx.lineWidth = 1.5; ctx.strokeRect(cv.w / 2 - w / 2, yb + 30 - w / 2, w, w); }
      sim.set('out', out > 0 ? `${out} × ${out} × ${F}` : 'imposible: el núcleo no cabe');
      sim.set('par', `${F} × (${k}·${k}·${C} + 1) = ${par.toLocaleString('es')}`);
      sim.set('dense', out > 0 ? `${dense.toLocaleString('es')} parámetros` : '—');
      sim.set('rf', `${rf}×${rf} con ${D * 9 * 1} pesos por canal (una capa ${rf}×${rf} tendría ${rf * rf})`);
    });
  });

  /* ======================================================================
     27.3 Una red entrenada en el navegador reconoce sus dígitos
     ====================================================================== */
  ML.defineSim('digitos-red', function (sim) {
    sim.cols2();
    const cd = sim.canvas({ aspect: 1 }), cp = sim.canvas({ aspect: 1 });
    sim.group('Red 64–32–10 (densa)');
    sim.button('Borrar el dibujo', () => { img.fill(0); }, { id: 'clear' });
    sim.button('Tomar una imagen de prueba', () => { const k = L.rng(Date.now() % 1e6).int(te.length); img.set(L.ds.digits.X[te[k]]); }, { id: 'sample' });
    sim.note('Dibuje un dígito del 0 al 9 en la cuadrícula de 8×8 (como las imágenes de entrenamiento, trazo grueso y centrado). Clic derecho o Mayús para borrar.');
    sim.out('st', 'Entrenamiento');
    sim.out('acc', 'Exactitud en 200 imágenes de prueba', { hl: true });
    sim.out('pred', 'Predicción para su dibujo', { hl: true });
    const X = L.ds.digits.X.map((r) => r.map((v) => v / 16)), Y = L.ds.digits.y;
    const perm = L.rng(1).perm(X.length), te = perm.slice(0, 200), tr = perm.slice(200);
    const net = L.nn.mlp({ sizes: [64, 32, 10], act: 'relu', out: 'softmax', rng: L.rng(3), init: 'he' }), opt = L.opt.make('adam', { lr: 0.005 });
    const Xtr = tr.map((i) => X[i]), Ytr = tr.map((i) => Y[i]);
    let ep = 0;
    const img = new Float64Array(64);
    img.set(L.ds.digits.X[te[0]]);
    let box = null;
    paintable(sim, cd, img, 8, 8, () => box, { soft: 0.35, max: 16 });
    sim.animate(() => { if (ep < 60) { net.epoch(Xtr, Ytr, opt, { batch: 32, rng: L.rng(ep + 5) }); ep++; } });
    sim.onDraw(() => {
      ML.draw.clear(cd);
      const S = Math.min(cd.w, cd.h) - 30;
      box = { x: (cd.w - S) / 2, y: 20, w: S, h: S };
      ML.drawImage(cd.ctx, box, img, 8, 8, { vmin: 0, vmax: 16, grid: true });
      ML.text(cd.ctx, 'su dígito (8×8, intensidad 0–16)', box.x, 13, { size: 11.5, color: '--ink-2' });
      const p = net.predict1(Array.from(img, (v) => v / 16));
      ML.draw.clear(cp);
      ML.hbars(cp.ctx, { x: 6, y: 10, w: cp.w - 12, h: cp.h - 20 }, Array.from(p).map((v, k) => ({ label: `dígito ${k}`, value: v, color: k === U.argmax(Array.from(p)) ? '--c3' : '--c6' })), { labelW: 70, min: 0, max: 1, fmt: (v) => ML.fix(v, 3), barH: 16 });
      const acc = L.met.accuracy(te.map((i) => Y[i]), te.map((i) => U.argmax(Array.from(net.predict1(X[i])))));
      sim.set('st', ep < 60 ? `entrenando… época ${ep} de 60` : `terminado (60 épocas, ${tr.length} imágenes)`);
      sim.set('acc', pct(acc));
      sim.set('pred', `${U.argmax(Array.from(p))} (probabilidad ${f2(Math.max(...p))})`);
    });
  });
})();
