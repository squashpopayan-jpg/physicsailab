/* Capítulo 15 — Interferencia de haces múltiples */
(function () {
  'use strict';
  const EM = window.EM, OP = EM.op, D = EM.od;
  const DEG = Math.PI / 180;
  const stack = (layers, ns, l0) => { const n = [1], d = [Infinity]; for (const [ni, q] of layers) { n.push(ni); d.push((q * l0) / ni); } n.push(ns); d.push(Infinity); return { n, d }; };

  /* 15.1 Fabry–Pérot */
  EM.defineSim('fabry-perot', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('R', { label: 'Reflectancia de los espejos', min: 0.04, max: 0.99, step: 0.005, value: 0.85, fmt: (v) => v.toFixed(3) });
    sim.slider('d', { label: 'Separación de los espejos', min: 0.5, max: 10, step: 0.05, value: 5, unit: 'mm', fmt: (v) => v.toFixed(2) });
    sim.seg('src', { label: 'Fuente', options: [['1', 'Una línea (589.0 nm)'], ['na', 'Doblete del sodio']], value: 'na' });
    sim.out('F', 'Finura', { hl: true });
    sim.out('fsr', 'Rango espectral libre');
    sim.out('w', 'Ancho de cada pico');
    sim.out('rp', 'Poder resolutivo mF');
    const N = 170, vals = new Float32Array(N * N);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, d = p.d * 1e-3;
      EM.draw.clear(cv);
      const lines = p.src === 'na' ? [[588.995, 1], [589.592, 0.5]] : [[588.995, 1]];
      const Tl = (lam, cth) => OP.fpT(p.R, (4 * Math.PI * d * cth) / (lam * 1e-9));
      const fsr = OP.c / (2 * d), F = OP.finesse(p.R);
      /* transmisión frente a la frecuencia (desfase relativo a la línea 1) */
      const nu0 = OP.c / (588.995e-9);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: -1.3, xmax: 1.3, ymin: 0, ymax: 1.08, xlabel: 'frecuencia relativa (en rangos espectrales libres)', ylabel: 'transmisión' });
      pl.frame();
      pl.fn((x) => OP.fpT(p.R, 2 * Math.PI * x), { color: '--accent', width: 2.2, n: 1200 });
      if (p.src === 'na') { const dx = ((OP.c / 589.592e-9 - nu0) / fsr) % 1; pl.fn((x) => 0.5 * OP.fpT(p.R, 2 * Math.PI * (x - dx)), { color: '--c2', width: 1.6, n: 1200 }); }
      /* anillos */
      const thmax = Math.sqrt((5.5 * 589e-9) / d);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = (i + 0.5) / N - 0.5, y = (j + 0.5) / N - 0.5, th = 2 * thmax * Math.hypot(x, y), c = Math.cos(th);
        let s = 0; for (const [l, w] of lines) s += w * Tl(l, c);
        vals[j * N + i] = s / (p.src === 'na' ? 1.5 : 1);
      }
      const S = Math.min(H - 10, W * 0.43), rgb = OP.lambdaRGB(589, 1, 0.4);
      D.paint(ctx, vals, N, N, { x: W * 0.56, y: (H - S) / 2, w: S, h: S }, D.tint(rgb, 0.6));
      sim.set('F', EM.fix(F, 1));
      sim.set('fsr', EM.fix(fsr / 1e9, 2) + ' GHz = ' + EM.fix((589 * 589) / (2 * d * 1e9), 4) + ' nm');
      sim.set('w', EM.fix(fsr / F / 1e6, 1) + ' MHz');
      sim.set('rp', EM.sci(((2 * d) / 589e-9) * F, 3) + ' (doblete: 987)');
    });
  });

  /* 15.2 Antirreflejantes */
  EM.defineSim('antirreflejo', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.seg('t', { label: 'Recubrimiento', options: [['0', 'Ninguno'], ['1', 'MgF₂ λ/4'], ['v', 'En V (2 capas)'], ['b', 'Banda ancha (3)']], value: '1' });
    sim.slider('l0', { label: 'Longitud de onda de diseño', min: 450, max: 650, step: 1, value: 550, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('th', { label: 'Ángulo de incidencia', min: 0, max: 60, step: 1, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('Rm', 'Reflectancia media 420–680 nm', { hl: true });
    sim.out('R0', 'Reflectancia en λ₀');
    sim.out('col', 'Color del reflejo residual');
    const DES = { 0: [], 1: [[1.38, 0.25]], v: [[1.38, 0.25], [1.63, 0.25]], b: [[1.38, 0.25], [2.05, 0.5], [1.63, 0.25]] };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = p.th * DEG;
      EM.draw.clear(cv);
      const st = stack(DES[p.t], 1.5168, p.l0);
      const R = (l) => OP.tmmU(st.n, st.d, th, l).R;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.72, h: H, xmin: 380, xmax: 780, ymin: 0, ymax: 6, xlabel: 'λ (nm)', ylabel: 'reflectancia (%)' });
      D.spectrumBar(ctx, { x: pl.ix, y: pl.iy + pl.ih + 1, w: pl.iw, h: 5 }, 380, 780);
      pl.frame();
      pl.fn((l) => 100 * OP.tmmU([1, 1.5168], [Infinity, Infinity], th, l).R, { color: '--ink-3', width: 1.4, dash: [5, 4] });
      pl.fn((l) => 100 * R(l), { color: '--accent', width: 2.4, n: 500 });
      let s = 0, n = 0; for (let l = 420; l <= 680; l += 5) { s += R(l); n++; }
      const xyz = OP.reflXYZ(R), k = 1 / Math.max(xyz[1], 1e-4) * 0.6, c = OP.xyz2srgb(xyz[0] * k, xyz[1] * k, xyz[2] * k);
      D.swatch(ctx, W * 0.76, H * 0.25, W * 0.2, H * 0.4, OP.rgb255(c), 'tono (brillo normalizado)');
      sim.set('Rm', EM.fix((100 * s) / n, 3) + ' % (vidrio desnudo ' + EM.fix(100 * OP.tmmU([1, 1.5168], [Infinity, Infinity], th, 550).R, 2) + ' %)');
      sim.set('R0', EM.fix(100 * R(p.l0), 3) + ' %');
      sim.set('col', `<span style="display:inline-block;width:2.2em;height:1em;vertical-align:-2px;border:1px solid var(--rule-strong);background:${D.css(c)}"></span>`);
    });
  });

  /* 15.3 Espejo de Bragg */
  EM.defineSim('bragg', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('N', { label: 'Número de pares HL', min: 1, max: 15, step: 1, value: 6, fmt: (v) => v.toFixed(0) });
    sim.slider('nH', { label: 'Índice alto n_H', min: 1.6, max: 2.6, step: 0.01, value: 2.35, fmt: (v) => v.toFixed(2) });
    sim.slider('nL', { label: 'Índice bajo n_L', min: 1.3, max: 1.8, step: 0.01, value: 1.46, fmt: (v) => v.toFixed(2) });
    sim.slider('l0', { label: 'Longitud de onda de diseño', min: 450, max: 700, step: 1, value: 550, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.out('R', 'R(λ₀) por matrices / fórmula', { hl: true });
    sim.out('w', 'Ancho de la banda (fórmula)');
    sim.out('c', 'Color reflejado');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const L = []; for (let i = 0; i < p.N; i++) L.push([p.nH, 0.25], [p.nL, 0.25]); L.push([p.nH, 0.25]);
      const st = stack(L, 1.52, p.l0);
      const R = (l) => OP.tmm('s', st.n, st.d, 0, l).R;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.72, h: H, xmin: 350, xmax: 950, ymin: 0, ymax: 1.05, xlabel: 'λ (nm)', ylabel: 'reflectancia' });
      pl.frame();
      pl.band(380, 780, { color: '--gold', alpha: 0.06 });
      pl.fn(R, { color: '--accent', width: 2.2, n: 900 });
      const Rf = OP.braggPeak(1, p.nH, p.nL, 1.52, p.N);
      pl.hline(Rf, { color: '--c2' });
      const dg = OP.braggWidth(p.nH, p.nL), g0 = 1 / p.l0;
      pl.band(1 / (g0 * (1 + dg / 2)), 1 / (g0 * (1 - dg / 2)), { color: '--c3', alpha: 0.08 });
      const xyz = OP.reflXYZ(R), c = OP.xyz2srgb(...xyz);
      D.swatch(ctx, W * 0.76, H * 0.25, W * 0.2, H * 0.4, OP.rgb255(c), 'reflejo bajo D65');
      sim.set('R', EM.fix(R(p.l0), 6) + ' / ' + EM.fix(Rf, 6));
      sim.set('w', EM.fix(1 / (g0 * (1 + dg / 2)), 0) + '–' + EM.fix(1 / (g0 * (1 - dg / 2)), 0) + ' nm (Δg = ' + EM.fix(dg, 3) + ')');
      sim.set('c', `<span style="display:inline-block;width:2.2em;height:1em;vertical-align:-2px;border:1px solid var(--rule-strong);background:${D.css(c)}"></span>`);
    });
  });

  /* 15.4 Filtro interferencial */
  EM.defineSim('filtro', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('N', { label: 'Pares en cada espejo', min: 2, max: 8, step: 1, value: 5, fmt: (v) => v.toFixed(0) });
    sim.slider('th', { label: 'Inclinación del filtro', min: 0, max: 40, step: 0.5, value: 0, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.out('pk', 'Pico de transmisión', { hl: true });
    sim.out('fw', 'Ancho a media altura');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, l0 = 550, th = p.th * DEG;
      EM.draw.clear(cv);
      const L = [];
      for (let i = 0; i < p.N; i++) L.push([2.35, 0.25], [1.46, 0.25]);
      L.push([2.35, 0.5]);
      for (let i = 0; i < p.N; i++) L.push([1.46, 0.25], [2.35, 0.25]);
      const st = stack(L, 1.52, l0);
      const T = (l) => OP.tmmU(st.n, st.d, th, l).T;
      let best = 0, lb = l0; for (let l = 480; l <= 600; l += 0.05) { const t = T(l); if (t > best) { best = t; lb = l; } }
      let a = lb, b = lb; while (a > 470 && T(a) > best / 2) a -= 0.01; while (b < 610 && T(b) > best / 2) b += 0.01;
      const span = Math.max(4, (b - a) * 6);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H * 0.6, xmin: 470, xmax: 630, ymin: 0, ymax: 1.05, xlabel: 'λ (nm)', ylabel: 'transmisión' });
      pl.frame();
      pl.fn(T, { color: '--accent', width: 2, n: 1600 });
      const pz = new EM.Plot(ctx, { x: 0, y: H * 0.6, w: W, h: H * 0.4, xmin: lb - span / 2, xmax: lb + span / 2, ymin: 0, ymax: 1.05, xlabel: 'λ (nm), ampliado alrededor del pico', ylabel: 'T' });
      pz.frame();
      pz.fn(T, { color: '--accent', width: 2, n: 600 });
      pz.band(a, b, { color: '--c3', alpha: 0.15 });
      sim.set('pk', EM.fix(lb, 2) + ' nm, T = ' + EM.fix(best, 4));
      sim.set('fw', EM.fix(b - a, 3) + ' nm');
    });
  });
})();
