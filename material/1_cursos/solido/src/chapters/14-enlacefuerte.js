/* Capítulo 14 — El modelo de enlace fuerte */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd, L = EM.lin;
  const PI = Math.PI, S3 = Math.sqrt(3);

  /* 14.1 Cadena */
  EM.defineSim('tb-cadena', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('t', { label: 'Salto a primeros vecinos t', min: 0.1, max: 2, step: 0.01, value: 1, unit: 'eV', fmt: (v) => v.toFixed(2) });
    sim.slider('tp', { label: 'Salto a segundos vecinos t′', min: -0.6, max: 0.6, step: 0.01, value: 0, unit: 'eV', fmt: (v) => v.toFixed(2) });
    sim.slider('a', { label: 'Período a', min: 2, max: 5, step: 0.05, value: 3, unit: 'Å', fmt: (v) => v.toFixed(2) });
    sim.out('W', 'Ancho de banda', { hl: true });
    sim.out('m', 'Masa efectiva en el mínimo');
    const E = (k, t, tp) => -2 * t * Math.cos(k) - 2 * tp * Math.cos(2 * k);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const ks = EM.M.linspace(-PI, PI, 20001), Es = ks.map((k) => E(k, p.t, p.tp));
      const emin = Math.min(...Es), emax = Math.max(...Es), kmin = ks[Es.indexOf(emin)];
      const lo = -4.5, hi = 4.5, wl = W * 0.62;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: -1, xmax: 1, ymin: lo, ymax: hi, xlabel: 'k (π/a)', ylabel: 'E − ε₀ (eV)' });
      pl.frame();
      pl.fn((x) => E(x * PI, p.t, p.tp), { color: '--c1', width: 2.6 });
      /* masa efectiva: curvatura numérica en el mínimo */
      const h = 1e-4, c2 = (E(kmin + h, p.t, p.tp) - 2 * emin + E(kmin - h, p.t, p.tp)) / (h * h); /* eV por (1/a)² */
      pl.fn((x) => emin + 0.5 * c2 * Math.pow(x * PI - kmin, 2), { color: '--c2', width: 1.4, dash: [5, 4], from: kmin / PI - 0.35, to: kmin / PI + 0.35 });
      const nb = 60, hist = new Float64Array(nb);
      for (const e of Es) { const b = Math.floor(((e - lo) / (hi - lo)) * nb); if (b >= 0 && b < nb) hist[b]++; }
      const mx = Math.max(...hist);
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: 1.05, ymin: lo, ymax: hi, xticks: [], xlabel: 'g(E)', ml: 20 });
      p2.frame();
      for (let b = 0; b < nb; b++) { const y0 = p2.Y(lo + ((b + 1) * (hi - lo)) / nb), y1 = p2.Y(lo + (b * (hi - lo)) / nb); ctx.fillStyle = EM.alpha('--c1', 0.6); ctx.fillRect(p2.ix, y0, (hist[b] / mx) * p2.iw, y1 - y0 - 0.5); }
      const mstar = (2 * 3.80998) / (c2 / (p.a * p.a)); /* ħ²/m = 2·3.81 eV Å² */
      sim.set('W', EM.fix(emax - emin, 3) + ' eV (4t = ' + EM.fix(4 * p.t, 2) + ')');
      sim.set('m', EM.fix(mstar, 3) + ' m en k = ' + EM.fix(kmin / PI, 2) + ' π/a');
    });
  });

  /* 14.2 Red cuadrada */
  EM.defineSim('tb-cuadrada', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('n', { label: 'Electrones por sitio (dos espines)', min: 0.05, max: 1.95, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('tp', { label: 't′/t', min: -0.4, max: 0.4, step: 0.01, value: 0, fmt: (v) => v.toFixed(2) });
    sim.out('ef', 'Nivel de Fermi', { hl: true });
    sim.out('g', 'g(E_F) por sitio y espín');
    const NX = 160;
    let key = '', Ek = null, sorted = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      if (key !== String(p.tp)) {
        key = String(p.tp); Ek = new Float32Array(NX * NX);
        for (let j = 0; j < NX; j++) for (let i = 0; i < NX; i++) Ek[j * NX + i] = SS.tbSquare(-PI + (2 * PI * (i + 0.5)) / NX, PI - (2 * PI * (j + 0.5)) / NX, 1, p.tp);
        sorted = Float32Array.from(Ek).sort();
      }
      const EF = sorted[Math.min(sorted.length - 1, Math.floor((p.n / 2) * sorted.length))];
      const size = Math.min(W * 0.45, H) - 20, r = { x: 10, y: (H - size) / 2, w: size, h: size };
      const bg = EM.rgb('--canvas');
      D.paint(ctx, Ek, NX, NX, r, (e) => { const c = EM.cmap.diverging(e / 4.5); return e <= EF ? c : c.map((x, i) => 0.4 * x + 0.6 * bg[i]); });
      /* contorno de Fermi por marcha de cuadrados simple */
      ctx.fillStyle = EM.col('--ink');
      for (let j = 0; j < NX - 1; j++) for (let i = 0; i < NX - 1; i++) {
        const a = Ek[j * NX + i] - EF, b = Ek[j * NX + i + 1] - EF, c = Ek[(j + 1) * NX + i] - EF;
        if (a * b < 0 || a * c < 0) ctx.fillRect(r.x + ((i + 0.5) / NX) * r.w, r.y + ((j + 0.5) / NX) * r.h, 1.6, 1.6);
      }
      ctx.strokeStyle = EM.col('--ink-3'); ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
      EM.text(ctx, 'zona de Brillouin (k_x, k_y de −π/a a π/a)', r.x, r.y + r.h + 14, { size: 11, color: '--ink-3' });
      const x0 = r.x + r.w + 30;
      const pl = new EM.Plot(ctx, { x: x0, y: 0, w: W - x0, h: H, xmin: -4.6, xmax: 4.6, ymin: 0, ymax: 0.6, xlabel: 'E/t', ylabel: 'g(E)' });
      pl.frame();
      if (Math.abs(p.tp) < 1e-9) pl.fn((e) => SS.dosSquare(e), { color: '--c1', width: 2.2, n: 800, fill: '--c1', fillAlpha: 0.1, to: EF });
      if (Math.abs(p.tp) < 1e-9) pl.fn((e) => SS.dosSquare(e), { color: '--c1', width: 2.2, n: 800 });
      else {
        const nb = 90, h = new Float64Array(nb);
        for (const e of sorted) { const b = Math.floor(((e + 4.6) / 9.2) * nb); if (b >= 0 && b < nb) h[b]++; }
        const dE = 9.2 / nb, xs = [], ys = [];
        for (let b = 0; b < nb; b++) { xs.push(-4.6 + (b + 0.5) * dE); ys.push(h[b] / (sorted.length * dE)); }
        pl.xy(xs, ys, { color: '--c1', width: 2.2 });
      }
      pl.vline(EF, { color: '--c2', label: 'E_F' });
      sim.set('ef', EM.fix(EF, 3) + ' t');
      sim.set('g', Math.abs(p.tp) < 1e-9 ? EM.fix(SS.dosSquare(EF), 4) + ' /t' : 'ver histograma');
    });
  });

  /* 14.3 Grafeno */
  const KX = (4 * PI) / (3 * S3);
  EM.defineSim('grafeno', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    sim.slider('t', { label: 'Salto t', min: 2, max: 3.2, step: 0.01, value: 2.7, unit: 'eV', fmt: (v) => v.toFixed(2) });
    sim.slider('D', { label: 'Asimetría de subred Δ', min: 0, max: 3, step: 0.01, value: 0, unit: 'eV', fmt: (v) => v.toFixed(2) });
    sim.out('gap', 'Brecha en K', { hl: true });
    sim.out('vf', 'Velocidad de Fermi 3ta/2ħ');
    sim.out('m', 'Energía en M (ancho de la silla)');
    const NX = 140;
    let key = '', img = null, dos = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const E = (kx, ky) => Math.sqrt(p.D * p.D + Math.pow(p.t * SS.grapheneF(kx, ky), 2));
      const R = 2.7;
      if (key !== p.t + '|' + p.D) {
        key = p.t + '|' + p.D; img = new Float32Array(NX * NX);
        for (let j = 0; j < NX; j++) for (let i = 0; i < NX; i++) img[j * NX + i] = E(-R + (2 * R * (i + 0.5)) / NX, R - (2 * R * (j + 0.5)) / NX);
        /* DOS por histograma en la celda recíproca */
        const b1 = [(2 * PI) / S3, (2 * PI) / 3], b2 = [(-2 * PI) / S3, (2 * PI) / 3], nb = 80, n = 260, h = new Float64Array(nb);
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const kx = ((i + 0.5) / n) * b1[0] + ((j + 0.5) / n) * b2[0], ky = ((i + 0.5) / n) * b1[1] + ((j + 0.5) / n) * b2[1]; const e = E(kx, ky); const bb = Math.floor((e / 10) * nb); if (bb < nb) h[bb]++; }
        dos = Array.from(h, (x) => x / (n * n * (10 / nb)));
      }
      const w1 = W * 0.3;
      const size = Math.min(w1, H) - 16, r = { x: 8, y: (H - size) / 2, w: size, h: size };
      const emax = 3 * p.t;
      D.paint(ctx, img, NX, NX, r, (e) => EM.cmap.inferno(Math.pow(e / emax, 0.7)));
      const v = D.view(r, -R, R, -R, R);
      const hex = []; for (let k = 0; k < 6; k++) hex.push([KX * Math.cos((k * PI) / 3), KX * Math.sin((k * PI) / 3)]);
      D.polygon(ctx, v, hex, { stroke: '#FFFFFF', width: 1.5 });
      EM.text(ctx, 'K', v.X(KX) - 4, v.Y(0) - 8, { size: 12, color: '#FFFFFF', weight: 700 });
      EM.text(ctx, 'M', v.X(0) - 4, v.Y((2 * PI) / 3) - 8, { size: 12, color: '#FFFFFF', weight: 700 });
      /* bandas Γ–M–K–Γ */
      const pts = { Γ: [0, 0, 0], M: [0, (2 * PI) / 3, 0], K: [KX * Math.cos(PI / 3), KX * Math.sin(PI / 3), 0] };
      const path = SS.kpath(pts, ['Γ', 'M', 'K', 'Γ'], 40);
      const Es = path.map((q) => { const e = E(q.k[0], q.k[1]); return [-e, e]; });
      const w2 = W * 0.42;
      D.bands(ctx, { x: w1, y: 0, w: w2, h: H }, path, Es, { ymin: -9.5, ymax: 9.5, ef: 0, colors: ['--c1', '--c2'] });
      const pl = new EM.Plot(ctx, { x: w1 + w2, y: 0, w: W - w1 - w2, h: H, xmin: 0, xmax: 0.5, ymin: -9.5, ymax: 9.5, xlabel: 'g(E)', ml: 24, xticks: [] });
      pl.frame();
      const ys = dos.map((_, b) => (b + 0.5) * (10 / dos.length));
      pl.xy(dos, ys, { color: '--c2', width: 2 });
      pl.xy(dos, ys.map((y) => -y), { color: '--c1', width: 2 });
      sim.set('gap', EM.fix(2 * p.D, 2) + ' eV' + (p.D === 0 ? ' (conos de Dirac)' : ''));
      sim.set('vf', EM.sci((3 * p.t * SS.e * 1.42e-10) / (2 * SS.hbar), 3) + ' m/s');
      sim.set('m', '±' + EM.fix(E(0, (2 * PI) / 3), 2) + ' eV');
    });
  });

  /* 14.4 SSH */
  EM.defineSim('ssh', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('v', { label: 'Salto intracelda v (w = 1)', min: 0, max: 2, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.out('wind', 'Número de enrollamiento', { hl: true });
    sim.out('gap', 'Brecha de volumen 2|v − w|');
    sim.out('edge', 'Menor |E| de la cadena abierta');
    const Nc = 20;
    let fan = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      if (!fan) { fan = []; for (let i = 0; i <= 120; i++) { const vv = (2 * i) / 120; fan.push([vv, SS.sshOpen(Nc, vv, 1)]); } }
      const w1 = W * 0.42;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: w1, h: H, xmin: 0, xmax: 2, ymin: -3, ymax: 3, xlabel: 'v/w', ylabel: 'E/w' });
      pl.frame();
      ctx.fillStyle = EM.alpha('--c1', 0.7);
      for (const [vv, es] of fan) for (const e of es) { ctx.fillRect(pl.X(vv) - 1, pl.Y(e) - 1, 2, 2); }
      pl.vline(p.v, { color: '--accent', dash: [], width: 1.6 });
      pl.vline(1, { color: '--ink-3' });
      /* curva h(k) */
      const w2 = W * 0.27;
      const v = D.view({ x: w1 + 10, y: 20, w: w2 - 20, h: H - 40 }, -3.2, 3.2, -3.2, 3.2);
      ctx.strokeStyle = EM.col('--grid-2'); ctx.beginPath(); ctx.moveTo(v.X(-3.2), v.Y(0)); ctx.lineTo(v.X(3.2), v.Y(0)); ctx.moveTo(v.X(0), v.Y(-3.2)); ctx.lineTo(v.X(0), v.Y(3.2)); ctx.stroke();
      const curve = []; for (let i = 0; i <= 200; i++) { const k = (2 * PI * i) / 200; curve.push([p.v + Math.cos(k), Math.sin(k)]); }
      D.polygon(ctx, v, curve, { stroke: '--c2', width: 2.4 });
      ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(v.X(0), v.Y(0), 4, 0, 7); ctx.fill();
      EM.text(ctx, 'h(k) = (v + w cos k, w sen k)', v.X(-3.1), v.Y(3.0), { size: 11, color: '--ink-2' });
      /* estado de menor |E| */
      const n = 2 * Nc, A = new Float64Array(n * n);
      for (let i = 0; i < n - 1; i++) { const tt = i % 2 === 0 ? -p.v : -1; A[i * n + i + 1] = tt; A[(i + 1) * n + i] = tt; }
      const r = L.symEig(A, n, true);
      let im = 0; r.val.forEach((e, i) => { if (Math.abs(e) < Math.abs(r.val[im])) im = i; });
      const x0 = w1 + w2;
      const p3 = new EM.Plot(ctx, { x: x0, y: 0, w: W - x0, h: H, xmin: 0, xmax: n - 1, ymin: 0, ymax: 0.6, xlabel: 'sitio', ylabel: '|ψ|²', ml: 40 });
      p3.frame();
      const vec = r.vec[im];
      for (let i = 0; i < n; i++) { const y = vec[i] * vec[i]; ctx.fillStyle = EM.col(i % 2 ? '--c2' : '--c1'); ctx.fillRect(p3.X(i) - 2, p3.Y(y), 4, p3.Y(0) - p3.Y(y)); }
      sim.set('wind', p.v < 1 ? '1 (topológica: estados de borde)' : p.v > 1 ? '0 (trivial)' : 'indefinido (brecha cerrada)');
      sim.set('gap', EM.fix(2 * Math.abs(p.v - 1), 3) + ' w');
      sim.set('edge', EM.sci(Math.abs(r.val[im]), 3) + ' w');
    });
  });
})();
