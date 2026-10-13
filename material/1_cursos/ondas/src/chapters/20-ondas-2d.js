/* Capítulo 20 — Ondas en dos y tres dimensiones */
(function () {
  'use strict';
  const EM = window.EM, M = EM.M;
  const f2 = (v) => EM.fix(v, 2);

  /* ======================================================================
     20.1 Cubeta de ondas
     ====================================================================== */
  EM.defineSim('ripple-tank', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    const B = 18, NXi = 220, NYi = 142, NX = NXi + 2 * B, NY = NYi + 2 * B;
    sim.select('mode', { label: 'Experimento', options: [['drops', 'Gotas (clic)'], ['point', 'Fuente puntual'], ['two', 'Dos fuentes en fase'], ['plane', 'Onda plana'], ['slit', 'Onda plana y rendija'], ['double', 'Onda plana y doble rendija'], ['parab', 'Reflector parabólico'], ['wall', 'Reflexión en una pared']], value: 'two', onInput: () => build() });
    sim.slider('lam', { label: 'Longitud de onda (celdas)', min: 8, max: 40, step: 1, value: 16, fmt: (v) => v.toFixed(0), onInput: () => build() });
    sim.slider('sep', { label: 'Separación de fuentes o rendijas (en λ)', min: 0.5, max: 5, step: 0.1, value: 2.5, fmt: (v) => EM.fix(v, 1), onInput: () => build() });
    sim.slider('spf', { label: 'Pasos por cuadro', min: 1, max: 6, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.check('en', { label: 'Mostrar intensidad promedio', value: false });
    sim.resetButton(() => build());
    sim.hint('Clic: dejar caer una gota', cv);
    let F, avg, t;
    const build = () => {
      F = new EM.Wave2D(NX, NY, { border: B, courant: 0.5 });
      avg = new Float32Array(NX * NY);
      t = 0;
      const p = sim.p, lam = p.lam, mid = NY >> 1;
      if (p.mode === 'slit' || p.mode === 'double') {
        const ix = B + Math.round(NXi * 0.3), gap = Math.round(lam * (p.mode === 'slit' ? 1.5 : 0.5)), sep = Math.round(lam * p.sep);
        for (let j = 0; j < NY; j++) for (let d = 0; d < 3; d++) {
          const y = j - mid;
          const open = p.mode === 'slit' ? Math.abs(y) <= gap / 2 : Math.abs(y - sep / 2) <= gap / 2 || Math.abs(y + sep / 2) <= gap / 2;
          if (!open) F.mask[j * NX + ix + d] = 1;
        }
      } else if (p.mode === 'parab') {
        const fx = B + NXi * 0.45, xv = B + NXi * 0.85, f = xv - fx;
        for (let j = B; j < NY - B; j++) { const y = j - mid, x = Math.round(xv - (y * y) / (4 * f)); for (let d = 0; d < 3; d++) if (x + d < NX - B) F.mask[j * NX + x + d] = 1; }
      } else if (p.mode === 'wall') {
        for (let j = 0; j < NY; j++) for (let d = 0; d < 3; d++) { const x = Math.round(B + NXi * 0.75 + (j - mid) * 0.5) + d; if (x > 0 && x < NX) F.mask[j * NX + x] = 1; }
      }
    };
    build();
    let view = null;
    EM.pointer(cv, {
      down: (x, y) => { const i = Math.round(B + (x / cv.w) * NXi), j = Math.round(B + (y / cv.h) * NYi); for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) F.add(i + a, j + b, 2.5 * Math.exp(-(a * a + b * b) / 2)); return null; },
      hover: () => 'crosshair'
    });
    void view;
    sim.animate(() => {
      const p = sim.p, w = (2 * Math.PI * 0.5) / p.lam, mid = NY >> 1;
      for (let s = 0; s < p.spf; s++) {
        const ramp = Math.min(1, t / 60), src = Math.sin(w * t) * ramp;
        if (p.mode === 'point') F.add(B + Math.round(NXi * 0.3), mid, src);
        else if (p.mode === 'two' || p.mode === 'wall') {
          if (p.mode === 'wall') F.add(B + Math.round(NXi * 0.35), mid, src);
          else { const d = Math.round((p.lam * p.sep) / 2); F.add(B + Math.round(NXi * 0.25), mid - d, src); F.add(B + Math.round(NXi * 0.25), mid + d, src); }
        } else if (p.mode !== 'drops') for (let j = 1; j < NY - 1; j++) F.u[j * NX + B + 3] = 0.35 * src;
        F.step();
        t += 1;
        if (p.en) for (let k = 0; k < avg.length; k++) avg[k] += 0.004 * (F.u[k] * F.u[k] - avg[k]);
      }
    });
    sim.onDraw(() => {
      const p = sim.p;
      EM.draw.clear(cv);
      if (p.en) F.render(cv, { data: avg, energy: true, scale: p.mode === 'point' || p.mode === 'two' || p.mode === 'wall' ? 2.2 : 6 });
      else F.render(cv, { scale: p.mode === 'drops' ? 2.2 : p.mode === 'point' || p.mode === 'two' || p.mode === 'wall' ? 1.6 : 2.6 });
    });
  });

  /* ======================================================================
     20.2 Refracción de olas
     ====================================================================== */
  EM.defineSim('refraction-tank', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    const B = 18, NXi = 220, NYi = 142, NX = NXi + 2 * B, NY = NYi + 2 * B;
    sim.slider('th', { label: 'Ángulo de incidencia <i>θ</i><sub>1</sub>', min: 0, max: 70, step: 1, value: 35, unit: '°', fmt: (v) => v.toFixed(0), onInput: () => build() });
    sim.slider('r', { label: 'Razón de velocidades <i>v</i><sub>2</sub>/<i>v</i><sub>1</sub>', min: 0.3, max: 2, step: 0.01, value: 0.55, fmt: f2, onInput: () => build() });
    sim.check('rays', { label: 'Dibujar rayos teóricos', value: true });
    sim.resetButton(() => build());
    sim.out('t2', 'Ángulo de refracción <i>θ</i><sub>2</sub>', { hl: true });
    sim.out('tc', 'Ángulo crítico');
    let F, t;
    const xi = B + Math.round(NXi * 0.5);
    const build = () => {
      F = new EM.Wave2D(NX, NY, { border: B, courant: 0.45 });
      const c2 = sim.p.r * sim.p.r;
      if (sim.p.r > 1) F.courant = 0.45 / sim.p.r;
      for (let j = 0; j < NY; j++) for (let i = xi; i < NX; i++) F.c2[j * NX + i] = c2;
      t = 0;
    };
    build();
    sim.animate(() => {
      const p = sim.p, th = M.rad(p.th), lam = 16, w = (2 * Math.PI) / lam * F.courant;
      const nx = Math.cos(th), ny = Math.sin(th);
      /* fuente lineal oblicua: puntos con distancia a la recta < 0.6, en la zona izquierda */
      for (let s = 0; s < 3; s++) {
        const ramp = Math.min(1, t / 80), val = 0.35 * Math.sin(w * t) * ramp;
        const c0 = (xi - 70 * nx) * nx + ((NY >> 1) - 70 * ny) * ny;
        for (let j = B; j < NY - B; j++) for (let i = B; i < xi - 4; i++) { const d = i * nx + j * ny - c0; if (Math.abs(d) < 0.6) F.u[j * NX + i] = val; }
        F.step(); t += 1;
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      F.render(cv, { scale: 2.6 });
      const X = (i) => ((i - B) / NXi) * W, Y = (j) => ((j - B) / NYi) * H;
      ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(X(xi), 0); ctx.lineTo(X(xi), H); ctx.stroke(); ctx.setLineDash([]);
      EM.text(ctx, 'v₁', X(xi) - 30, 18, { size: 13, color: '--ink', halo: true });
      EM.text(ctx, 'v₂ = ' + EM.fix(p.r, 2) + ' v₁', X(xi) + 10, 18, { size: 13, color: '--ink', halo: true });
      const s2 = p.r * Math.sin(M.rad(p.th));
      if (p.rays) {
        const yc = H / 2, L = 160;
        const a1 = M.rad(p.th);
        EM.draw.arrow(ctx, X(xi) - L * Math.cos(a1), yc - L * Math.sin(a1), X(xi), yc, { color: '--gold', width: 2.4 });
        if (s2 < 1) { const a2 = Math.asin(s2); EM.draw.arrow(ctx, X(xi), yc, X(xi) + L * Math.cos(a2), yc + L * Math.sin(a2), { color: '--gold', width: 2.4 }); }
        EM.draw.arrow(ctx, X(xi), yc, X(xi) - L * Math.cos(a1), yc + L * Math.sin(a1), { color: '--gold', width: 1.2, alpha: 0.6 });
      }
      sim.set('t2', s2 < 1 ? EM.fix(M.deg(Math.asin(s2)), 1) + '°' : 'reflexión total');
      sim.set('tc', p.r > 1 ? EM.fix(M.deg(Math.asin(1 / p.r)), 1) + '°' : '— (pasa a un medio más lento)');
    });
  });

  /* Pinta un campo escalar sobre un lienzo con el mapa divergente (resolución n × m) */
  function paintField(cv, n, m, f, o = {}) {
    if (!cv._off || cv._off.width !== n || cv._off.height !== m) { cv._off = document.createElement('canvas'); cv._off.width = n; cv._off.height = m; cv._img = cv._off.getContext('2d').createImageData(n, m); }
    const d = cv._img.data, bg = EM.rgb('--canvas');
    for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) {
      const v = f(i / (n - 1), j / (m - 1));
      const c = v === null ? bg : EM.cmap.diverging(v);
      const k = 4 * (j * n + i);
      d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
    }
    cv._off.getContext('2d').putImageData(cv._img, 0, 0);
    const ctx = cv.ctx;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(cv._off, o.x || 0, o.y || 0, o.w || cv.w, o.h || cv.h);
  }
  EM.paintField = paintField;

  /* ======================================================================
     20.3 Membrana rectangular
     ====================================================================== */
  EM.defineSim('membrane-rect', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('m', { label: 'Índice <i>m</i> (dirección <i>x</i>)', min: 1, max: 6, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('n', { label: 'Índice <i>n</i> (dirección <i>y</i>)', min: 1, max: 6, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.slider('b', { label: 'Razón de lados <i>b</i>/<i>a</i>', min: 0.4, max: 1, step: 0.01, value: 1, fmt: f2 });
    sim.slider('mix', { label: 'Mezcla con el modo (<i>n</i>, <i>m</i>)', min: -1, max: 1, step: 0.05, value: 0, fmt: f2 });
    sim.out('f', '<i>f<sub>mn</sub></i>/<i>f</i><sub>11</sub>', { hl: true });
    sim.out('deg', 'Degeneración');
    sim.out('nl', 'Líneas nodales');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const bh = Math.min(H - 20, (W - 20) * p.b), bw = bh / p.b;
      const x0 = (W - bw) / 2, y0 = (H - bh) / 2;
      const c = Math.cos(2.2 * t);
      const mix = p.b === 1 ? p.mix : 0;
      paintField(cv, 160, Math.round(160 * p.b), (u, v) => (Math.sin(p.m * Math.PI * u) * Math.sin(p.n * Math.PI * v) + mix * Math.sin(p.n * Math.PI * u) * Math.sin(p.m * Math.PI * v)) * c / (1 + Math.abs(mix)), { x: x0, y: y0, w: bw, h: bh });
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(x0, y0, bw, bh);
      const f = (m, n) => Math.sqrt(m * m + (n / p.b) ** 2) / Math.sqrt(1 + 1 / (p.b * p.b));
      sim.set('f', EM.fix(f(p.m, p.n), 4));
      sim.set('deg', p.b === 1 && p.m !== p.n ? 'el modo (' + p.n + ', ' + p.m + ') tiene la misma frecuencia' : p.b === 1 ? 'no (m = n)' : 'no (lados distintos)');
      sim.set('nl', mix === 0 ? (p.m - 1) + ' verticales y ' + (p.n - 1) + ' horizontales' : 'curvas (combinación de modos degenerados)');
    });
  });

  /* ======================================================================
     20.4 Tambor circular
     ====================================================================== */
  EM.defineSim('drum-modes', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 1 });
    const cs = sim.canvas({ aspect: 1 });
    sim.slider('m', { label: 'Diámetros nodales <i>m</i>', min: 0, max: 4, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('n', { label: 'Índice radial <i>n</i> (círculos nodales + 1)', min: 1, max: 3, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('f01', { label: 'Fundamental <i>f</i><sub>01</sub> (sonido)', min: 60, max: 400, step: 1, value: 150, unit: 'Hz', fmt: (v) => v.toFixed(0) });
    sim.slider('r0', { label: 'Punto de golpe <i>r</i>/<i>a</i>', min: 0, max: 0.95, step: 0.01, value: 0.6, fmt: f2 });
    const j01 = EM.besselZeros(0, 1)[0];
    const modes = () => { const out = []; for (let m = 0; m <= 5; m++) EM.besselZeros(m, 4).forEach((z, k) => out.push([m, k + 1, z])); return out.sort((a, b) => a[2] - b[2]); };
    const ML = modes();
    EM.listenButton(sim, () => {
      const p = sim.p, parts = [];
      ML.forEach(([m, n, z]) => { if (parts.length > 14) return; const a = EM.besselJn(m, z * p.r0) / Math.max(0.3, n); if (Math.abs(a) > 0.01) parts.push([(p.f01 * z) / j01, a, 2 + 1.5 * (z / j01)]); });
      return { fn: (t) => parts.reduce((s, [f, a, d]) => s + a * Math.sin(2 * Math.PI * f * t) * Math.exp(-d * t), 0), dur: 2 };
    }, { label: '♪ Golpear el tambor' });
    EM.listenButton(sim, () => { const z = EM.besselZeros(sim.p.m, sim.p.n)[sim.p.n - 1]; const f = (sim.p.f01 * z) / j01; return { fn: (t) => Math.sin(2 * Math.PI * f * t) * Math.exp(-2 * t), dur: 1.6 }; }, { label: '♪ Sólo este modo' });
    sim.out('f', '<i>f<sub>mn</sub></i>/<i>f</i><sub>01</sub>', { hl: true });
    sim.out('z', 'Cero de Bessel <i>j<sub>mn</sub></i>');
    let t = 0;
    sim.animate((dt) => { t += dt; });
    sim.onDraw(() => {
      const p = sim.p, z = EM.besselZeros(p.m, p.n)[p.n - 1], c = Math.cos(2.2 * t);
      EM.draw.clear(cv);
      const W = cv.w, H = cv.h, R = Math.min(W, H) / 2 - 8;
      const nrm = Math.max(...Array.from({ length: 60 }, (_, i) => Math.abs(EM.besselJn(p.m, (z * i) / 59))));
      paintField(cv, 150, 150, (u, v) => { const x = 2 * u - 1, y = 2 * v - 1, r = Math.hypot(x, y); if (r > 1) return null; return (EM.besselJn(p.m, z * r) / nrm) * Math.cos(p.m * Math.atan2(y, x)) * c; }, { x: W / 2 - R, y: H / 2 - R, w: 2 * R, h: 2 * R });
      const ctx = cv.ctx;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W / 2, H / 2, R, 0, 7); ctx.stroke();
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(W / 2 + p.r0 * R, H / 2, 4, 0, 7); ctx.fill();
      EM.draw.clear(cs);
      const ps = new EM.Plot(cs.ctx, { x: 0, y: 0, w: cs.w, h: cs.h, xmin: 0, xmax: 4.5, ymin: -0.5, ymax: 5.5, xlabel: 'f / f₀₁', ylabel: 'm', ml: 44, yticks: [0, 1, 2, 3, 4, 5] });
      ps.frame();
      for (let k = 1; k <= 4; k++) ps.vline(k, { color: '--ink-3', alpha: 0.5 });
      ML.forEach(([m, n, zz]) => { const r = zz / j01; if (r < 4.5) ps.dot(r, m, { color: m === p.m && n === p.n ? '--accent' : '--c1', r: m === p.m && n === p.n ? 7 : 4.5, label: m === p.m && n === p.n ? '(' + m + ',' + n + ')' : '' }); });
      ps.label(0.1, 5.25, 'líneas grises: serie armónica', { size: 11, color: '--ink-3' });
      sim.set('f', EM.fix(z / j01, 4));
      sim.set('z', EM.fix(z, 4));
    });
  });

  /* ======================================================================
     20.5 Figuras de Chladni
     ====================================================================== */
  EM.defineSim('chladni', function (sim) {
    const cv = sim.canvas({ aspect: 1.3 });
    sim.slider('m', { label: 'Índice <i>m</i>', min: 0, max: 8, step: 1, value: 1, fmt: (v) => v.toFixed(0), onInput: () => scatter() });
    sim.slider('n', { label: 'Índice <i>n</i>', min: 0, max: 8, step: 1, value: 4, fmt: (v) => v.toFixed(0), onInput: () => scatter() });
    sim.seg('sg', { label: 'Combinación', options: [[1, 'suma'], [-1, 'resta']], value: -1, onInput: () => scatter() });
    sim.check('field', { label: 'Mostrar el desplazamiento de la placa', value: false });
    sim.button('Esparcir arena', () => scatter());
    const NP = 5000;
    let P = new Float32Array(NP * 2);
    const scatter = () => { for (let i = 0; i < NP; i++) { P[2 * i] = Math.random(); P[2 * i + 1] = Math.random(); } };
    scatter();
    const U = (x, y) => { const p = sim.p; return Math.cos(p.m * Math.PI * x) * Math.cos(p.n * Math.PI * y) + p.sg * Math.cos(p.n * Math.PI * x) * Math.cos(p.m * Math.PI * y); };
    sim.animate(() => {
      const h = 1e-3;
      for (let it = 0; it < 3; it++) for (let i = 0; i < NP; i++) {
        const x = P[2 * i], y = P[2 * i + 1], u = U(x, y), a = Math.abs(u);
        const gx = (U(x + h, y) ** 2 - U(x - h, y) ** 2) / (2 * h), gy = (U(x, y + h) ** 2 - U(x, y - h) ** 2) / (2 * h);
        const s = 0.025 * Math.min(1, a);
        P[2 * i] = M.clamp(x - 0.0007 * gx + (Math.random() - 0.5) * s, 0, 1);
        P[2 * i + 1] = M.clamp(y - 0.0007 * gy + (Math.random() - 0.5) * s, 0, 1);
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const L = Math.min(W, H) - 20, x0 = (W - L) / 2, y0 = (H - L) / 2;
      if (p.field) paintField(cv, 120, 120, (u, v) => U(u, v) / 2, { x: x0, y: y0, w: L, h: L });
      else { ctx.fillStyle = EM.isDark() ? '#2a2f36' : '#30353c'; ctx.fillRect(x0, y0, L, L); }
      ctx.fillStyle = 'rgba(240,226,190,0.85)';
      for (let i = 0; i < NP; i++) ctx.fillRect(x0 + P[2 * i] * L - 0.8, y0 + P[2 * i + 1] * L - 0.8, 1.7, 1.7);
      if (p.m === p.n && p.sg < 0) EM.text(ctx, 'con m = n la resta se anula: elija índices distintos', W / 2, H / 2, { size: 13, color: '#fff', align: 'center', halo: '#000' });
    });
  });
})();
