/* Capítulo 20 — Entropía y microestados */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;

  /* 20.1 Modelo de Ehrenfest */
  EM.defineSim('ehrenfest', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('N', { label: 'Número de partículas', min: 4, max: 1000, step: 1, value: 50, log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('sp', { label: 'Saltos por segundo', min: 10, max: 5000, step: 10, value: 300, log: true, fmt: (v) => v.toFixed(0) });
    sim.resetButton(() => reset());
    sim.out('n', 'Partículas a la izquierda', { hl: true });
    sim.out('S', 'Entropía ln Ω(n) / ln Ω(N/2)');
    sim.out('p', 'Probabilidad de volver a tenerlas todas a la izquierda');
    let n, t, trace, hist, acc;
    const reset = () => { const N = Math.round(sim.p.N); n = N; t = 0; trace = [[0, N]]; hist = new Float64Array(N + 1); acc = 0; };
    reset();
    sim.onChange = (id) => { if (id === 'N') reset(); };
    sim.animate((dt) => {
      if (!(dt > 0)) return;
      const N = Math.round(sim.p.N);
      acc += dt * sim.p.sp;
      while (acc >= 1) { acc -= 1; if (Math.random() < n / N) n--; else n++; t++; hist[n]++; if (t % Math.max(1, Math.round(sim.p.sp / 60)) === 0) { trace.push([t, n]); if (trace.length > 1500) trace.shift(); } }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, N = Math.round(p.N);
      EM.draw.clear(cv);
      /* caja */
      const bx = 10, by = 14, bw = W * 0.28, bh = H * 0.42;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(bx + bw / 2, by); ctx.lineTo(bx + bw / 2, by + bh); ctx.stroke(); ctx.setLineDash([]);
      const show = Math.min(N, 300), sc = show / N;
      let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < show; i++) { const left = i < Math.round(n * sc); ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(bx + 4 + (left ? 0 : bw / 2) + rnd() * (bw / 2 - 8), by + 4 + rnd() * (bh - 8), 2.2, 0, 7); ctx.fill(); }
      /* traza */
      const pl = new EM.Plot(ctx, { x: W * 0.3, y: 0, w: W * 0.7, h: H * 0.55, xmin: trace[0][0], xmax: Math.max(trace[trace.length - 1][0], trace[0][0] + 10), ymin: 0, ymax: N, xlabel: 'saltos', ylabel: 'n izquierda', mb: 30 });
      pl.frame(); pl.hline(N / 2, { color: '--c3' }); pl.path(trace, { color: '--accent', width: 1.6 });
      /* histograma frente a binomial */
      const tot = hist.reduce((a, b) => a + b, 0) || 1;
      const p2 = new EM.Plot(ctx, { x: 0, y: H * 0.55, w: W, h: H * 0.45, xmin: 0, xmax: N, ymin: 0, ymax: Math.exp(TH.lnChoose(N, Math.floor(N / 2)) - N * Math.log(2)) * 1.3, xlabel: 'n', ylabel: 'P(n)', mb: 30 });
      p2.frame();
      ctx.fillStyle = EM.alpha('--c1', 0.4);
      for (let k = 0; k <= N; k++) if (hist[k]) { const x0 = p2.X(k - 0.5), x1 = p2.X(k + 0.5); ctx.fillRect(x0, p2.Y(hist[k] / tot), Math.max(1, x1 - x0), p2.Y(0) - p2.Y(hist[k] / tot)); }
      p2.fn((k) => Math.exp(TH.lnChoose(N, Math.round(k)) - N * Math.log(2)), { color: '--accent', width: 1.8 });
      sim.set('n', n + ' de ' + N);
      sim.set('S', EM.fix(TH.lnChoose(N, n) / TH.lnChoose(N, Math.floor(N / 2)), 4));
      sim.set('p', '2' + EM.sup('-' + N) + ' = ' + EM.sci(Math.pow(2, -N), 3));
    });
  });

  /* 20.2 Dos sólidos de Einstein */
  EM.defineSim('solidos-einstein', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('NA', { label: 'Osciladores del sólido A', min: 10, max: 600, step: 10, value: 300, fmt: (v) => v.toFixed(0) });
    sim.slider('NB', { label: 'Osciladores del sólido B', min: 10, max: 600, step: 10, value: 200, fmt: (v) => v.toFixed(0) });
    sim.slider('q', { label: 'Cuantos de energía en total', min: 10, max: 600, step: 10, value: 100, fmt: (v) => v.toFixed(0) });
    sim.resetButton(() => reset());
    sim.out('qa', '<i>q<sub>A</sub></i> actual · más probable', { hl: true });
    sim.out('T', 'Temperaturas <i>k<sub>B</sub>T</i>/ħω de A y B');
    sim.out('r', 'Probabilidad relativa del estado inicial');
    let osc, NA, NB, trace, t;
    const reset = () => { const p = sim.p; NA = p.NA; NB = p.NB; osc = new Int32Array(NA + NB); for (let i = 0; i < p.q; i++) osc[NA + Math.floor(Math.random() * NB)]++; trace = []; t = 0; };
    reset();
    sim.onChange = reset;
    const qA = () => { let s = 0; for (let i = 0; i < NA; i++) s += osc[i]; return s; };
    sim.animate((dt) => {
      if (!(dt > 0)) return;
      for (let k = 0; k < 300; k++) { const a = Math.floor(Math.random() * osc.length); if (osc[a] === 0) continue; const b = Math.floor(Math.random() * osc.length); osc[a]--; osc[b]++; }
      t++; trace.push([t, qA()]); if (trace.length > 600) trace.shift();
    });
    const Tof = (N, q) => 1 / Math.log(1 + N / Math.max(q, 1e-9)); /* k_BT/ħω de un sólido de Einstein */
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, q = p.q;
      EM.draw.clear(cv);
      const lnO = (a) => TH.lnOmegaE(NA, a) + TH.lnOmegaE(NB, q - a);
      let best = 0; for (let a = 0; a <= q; a++) if (lnO(a) > lnO(best)) best = a;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W / 2, h: H, xmin: 0, xmax: q, ymin: lnO(0) - 2, ymax: lnO(best) + 3, xlabel: 'q_A', ylabel: 'ln(Ω_A Ω_B)' });
      pl.frame();
      pl.fn((a) => lnO(Math.round(a)), { color: '--accent', width: 2.4 });
      const cur = qA();
      pl.vline(best, { color: '--c3', label: 'máximo' });
      pl.dot(cur, lnO(cur), { color: '--c1', r: 6 });
      const p2 = new EM.Plot(ctx, { x: W / 2, y: 0, w: W / 2, h: H, xmin: trace.length ? trace[0][0] : 0, xmax: Math.max(10, trace.length ? trace[trace.length - 1][0] : 10), ymin: 0, ymax: q, xlabel: 'tiempo (pasos)', ylabel: 'q_A' });
      p2.frame(); p2.hline(best, { color: '--c3' }); p2.path(trace, { color: '--c1', width: 1.8 });
      sim.set('qa', cur + ' · ' + best + ' (= q·N_A/(N_A+N_B) = ' + EM.fix((q * NA) / (NA + NB), 1) + ')');
      sim.set('T', EM.fix(Tof(NA, cur), 3) + ' · ' + EM.fix(Tof(NB, q - cur), 3));
      sim.set('r', 'exp(' + EM.fix(lnO(0) - lnO(best), 1) + ') = ' + EM.sci(Math.exp(lnO(0) - lnO(best)), 2));
    });
  });

  /* 20.3 Intercambio aleatorio de cuantos */
  EM.defineSim('intercambio', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('N', { label: 'Número de osciladores', min: 100, max: 5000, step: 100, value: 2000, fmt: (v) => v.toFixed(0) });
    sim.slider('m', { label: 'Cuantos por oscilador al inicio', min: 1, max: 10, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.resetButton(() => reset());
    sim.out('S', 'Entropía por oscilador (en <i>k<sub>B</sub></i>)', { hl: true });
    sim.out('Sm', 'Máximo teórico');
    sim.out('t', 'Intercambios realizados');
    let osc, t, Strace;
    const reset = () => { osc = new Int32Array(sim.p.N).fill(sim.p.m); t = 0; Strace = []; };
    reset();
    sim.onChange = reset;
    const Sof = () => {
      /* entropía de la distribución de ocupaciones: ln de la multiplicidad multinomial por oscilador */
      const cnt = new Map(); for (const v of osc) cnt.set(v, (cnt.get(v) || 0) + 1);
      let S = 0; for (const c of cnt.values()) { const pr = c / osc.length; S -= pr * Math.log(pr); }
      return S;
    };
    sim.animate((dt) => {
      if (!(dt > 0)) return;
      const N = osc.length;
      for (let k = 0; k < 4000; k++) { const a = Math.floor(Math.random() * N); if (osc[a] === 0) continue; const b = Math.floor(Math.random() * N); osc[a]--; osc[b]++; t++; }
      Strace.push([t, Sof()]); if (Strace.length > 500) Strace.shift();
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, N = osc.length, m = p.m;
      EM.draw.clear(cv);
      const nmax = Math.max(10, 6 * m), hist = new Float64Array(nmax + 1);
      for (const v of osc) if (v <= nmax) hist[v]++;
      const x = m / (1 + m);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: -0.5, xmax: nmax + 0.5, ymin: 0, ymax: Math.max(1 - x, 0.05) * 1.2, xlabel: 'cuantos n de un oscilador', ylabel: 'fracción de osciladores' });
      pl.frame();
      ctx.fillStyle = EM.alpha('--c1', 0.5);
      for (let k = 0; k <= nmax; k++) { const f = hist[k] / N; ctx.fillRect(pl.X(k - 0.4), pl.Y(Math.min(f, pl.o.ymax)), pl.X(0.8) - pl.X(0), pl.Y(0) - pl.Y(Math.min(f, pl.o.ymax))); }
      pl.fn((k) => (1 - x) * Math.pow(x, k), { color: '--accent', width: 2.4 });
      pl.legend([{ label: 'simulación', color: '--c1', kind: 'sq' }, { label: 'Boltzmann (1 − x)xⁿ', color: '--accent' }], 'tr');
      const Smax = (1 + m) * Math.log(1 + m) - m * Math.log(m);
      const p2 = new EM.Plot(ctx, { x: W * 0.6, y: 0, w: W * 0.4, h: H, xmin: Strace.length ? Strace[0][0] : 0, xmax: Strace.length ? Math.max(Strace[Strace.length - 1][0], 1) : 1, ymin: 0, ymax: Smax * 1.2, xlabel: 'intercambios', ylabel: 'S/(N k_B)' });
      p2.frame(); p2.hline(Smax, { color: '--c3', label: 'máximo' }); p2.path(Strace, { color: '--accent', width: 2 });
      sim.set('S', EM.fix(Strace.length ? Strace[Strace.length - 1][1] : 0, 4));
      sim.set('Sm', EM.fix(Smax, 4) + ' = (1+m) ln(1+m) − m ln m, con m cuantos medios');
      sim.set('t', t.toLocaleString('es-CO'));
    });
  });

  /* 20.4 Sackur–Tetrode */
  const NOB = { He: ['Helio', 4.0026, 126.153, '--c5'], Ne: ['Neón', 20.1797, 146.328, '--c4'], Ar: ['Argón', 39.948, 154.846, '--c1'], Kr: ['Kriptón', 83.798, 164.085, '--c3'], Xe: ['Xenón', 131.293, 169.685, '--c2'] };
  EM.defineSim('sackur', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('P', { label: 'Presión', min: 0.001, max: 100, step: 0.001, value: 1, unit: 'bar', log: true, fmt: (v) => v.toPrecision(3) });
    sim.slider('T', { label: 'Temperatura (para la lectura)', min: 5, max: 2000, step: 1, value: 298, unit: 'K', log: true, fmt: (v) => v.toFixed(0) });
    sim.out('s', 'Entropía molar a <i>T</i> y <i>P</i>', { hl: true });
    sim.out('l', 'Longitud de onda térmica del argón · <i>n</i>λ³');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, P = p.P * 1e5;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 5, xmax: 2000, xlog: true, ymin: 0, ymax: 250, xlabel: 'T (K)', ylabel: 'S° (J/mol·K)' });
      pl.frame();
      for (const k of Object.keys(NOB)) { pl.fn((T) => TH.sackur(NOB[k][1], T, P), { color: NOB[k][3], width: 2 }); pl.dot(298.15, NOB[k][2] - TH.R * Math.log(p.P), { color: NOB[k][3], r: 4 }); }
      pl.vline(p.T, { color: '--accent' });
      pl.legend(Object.keys(NOB).map((k) => ({ label: NOB[k][0], color: NOB[k][3] })), 'br');
      const lam = TH.h / Math.sqrt(2 * Math.PI * ((39.948e-3) / TH.NA) * TH.kB * p.T), n = P / (TH.kB * p.T);
      sim.set('s', Object.keys(NOB).map((k) => NOB[k][0] + ': ' + EM.fix(TH.sackur(NOB[k][1], p.T, P), 2)).join('<br>'));
      sim.set('l', EM.fix(lam * 1e9, 4) + ' nm · ' + EM.sci(n * lam * lam * lam, 3));
    });
  });
})();
