/* Capítulo 19 — Costos, gestión activa e indexación */
(function () {
  'use strict';
  const CC = window.CC, L = CC.L, I = L.inv, S = L.stat, T = L.tvm;

  /* Saldo con aportes mensuales y comisión anual f cobrada mes a mes */
  const conComision = (A, r, f, anos) => {
    const rm = T.eaToPeriodic(r, 12), fm = 1 - Math.pow(1 - f, 1 / 12), out = [0];
    let W = 0;
    for (let m = 1; m <= anos * 12; m++) { W = W * (1 + rm) * (1 - fm) + A; if (m % 12 === 0) out.push(W); }
    return out;
  };
  L.inv.conComision = conComision;

  /* 19.1 Comisiones */
  CC.defineSim('comisiones', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Saldo con un fondo barato y uno caro' });
    sim.group('Ahorro');
    sim.slider('A', { label: 'Aporte mensual', min: 50000, max: 5000000, step: 50000, value: 500000, fmt: CC.cop });
    sim.slider('n', { label: 'Años', min: 1, max: 45, step: 1, value: 25, fmt: (v) => CC.nf(v) });
    sim.slider('r', { label: 'Rentabilidad bruta anual', min: 0, max: 0.12, step: 0.0025, value: 0.07, fmt: (v) => CC.pct(v, 2) });
    sim.group('Comisiones anuales');
    sim.slider('f1', { label: 'Fondo barato', min: 0, max: 0.03, step: 0.0005, value: 0.003, fmt: (v) => CC.pct(v, 2) });
    sim.slider('f2', { label: 'Fondo caro', min: 0, max: 0.04, step: 0.0005, value: 0.018, fmt: (v) => CC.pct(v, 2) });
    sim.out('w1', 'Saldo final, fondo barato');
    sim.out('w2', 'Saldo final, fondo caro');
    sim.out('d', 'Lo que se lleva la diferencia de comisión', { hl: true });
    sim.out('fr', 'Como fracción del saldo del fondo barato');
    sim.onDraw(() => {
      const n = Math.round(sim.p.n);
      const a = conComision(sim.p.A, sim.p.r, sim.p.f1, n), b = conComision(sim.p.A, sim.p.r, sim.p.f2, n), ap = a.map((_, y) => sim.p.A * 12 * y);
      const xs = a.map((_, y) => y);
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: n, ymin: 0, ymax: Math.max(...a) * 1.08, xlabel: 'años', yfmt: CC.copAxis, ml: 70 });
      pl.frame();
      pl.between(xs, b, a, { color: '--loss', alpha: 0.25 });
      pl.xy(xs, ap, { color: '--ink-3', width: 1.6, dash: [5, 4] });
      pl.xy(xs, a, { color: '--c3', width: 2.6 });
      pl.xy(xs, b, { color: '--c2', width: 2.4 });
      pl.legend([{ label: `fondo barato (${CC.pct(sim.p.f1, 2)})`, color: '--c3' }, { label: `fondo caro (${CC.pct(sim.p.f2, 2)})`, color: '--c2' }, { label: 'lo aportado', color: '--ink-3', dash: [5, 4] }, { label: 'lo que cobra de más el fondo caro', color: '--loss', kind: 'sq' }], 'tl');
      sim.set('w1', CC.copS(a[n]));
      sim.set('w2', CC.copS(b[n]));
      sim.set('d', CC.copS(a[n] - b[n]));
      sim.set('fr', CC.pct((a[n] - b[n]) / a[n], 0));
    });
  });

  /* 19.2 Gestores activos */
  CC.defineSim('activos-pasivos', function (sim) {
    sim.cols2();
    const ch = sim.canvas({ aspect: 1.1, label: 'Distribución del exceso acumulado frente al índice' }), cp = sim.canvas({ aspect: 1.1, label: 'Persistencia de los mejores gestores' });
    sim.group('Gestores');
    sim.slider('sa', { label: 'Dispersión de la habilidad antes de costos', min: 0, max: 0.04, step: 0.0025, value: 0.01, fmt: (v) => CC.pct(v, 2) });
    sim.slider('te', { label: 'Error de seguimiento anual', min: 0.01, max: 0.12, step: 0.005, value: 0.05, fmt: (v) => CC.pct(v, 1) });
    sim.slider('fee', { label: 'Costo anual sobre el índice', min: 0, max: 0.03, step: 0.0025, value: 0.015, fmt: (v) => CC.pct(v, 2) });
    sim.slider('T', { label: 'Años', min: 1, max: 30, step: 1, value: 15, fmt: (v) => CC.nf(v) });
    sim.out('b', 'Gestores que superan al índice', { hl: true });
    sim.out('med', 'Exceso acumulado mediano');
    sim.out('per', 'Persistencia del mejor cuarto (azar = 25 %)');
    sim.onDraw(() => {
      const Tn = Math.round(sim.p.T);
      const m = I.managers({ M: 1000, T: Math.max(Tn, 2), sa: sim.p.sa, te: sim.p.te, fee: sim.p.fee, seed: 7 });
      const cum = m.map((x) => { let s = 0; for (let t = 0; t < Tn; t++) s += Math.log1p(x.ex[t]); return Math.expm1(s); });
      const lo = Math.min(...cum), hi = Math.max(...cum), nb = 30, w = (hi - lo) / nb || 1, bins = new Array(nb).fill(0);
      cum.forEach((v) => { bins[Math.min(nb - 1, Math.floor((v - lo) / w))]++; });
      CC.draw.clear(ch);
      const p1 = new CC.Plot(ch.ctx, { x: 0, y: 0, w: ch.w, h: ch.h, xmin: lo, xmax: hi, ymin: 0, ymax: Math.max(...bins) * 1.15, xlabel: 'exceso acumulado frente al índice', title: `${Tn} años, 1.000 gestores`, xfmt: CC.pctAxis, yfmt: (v) => CC.nf(v) });
      p1.frame();
      p1.bars(bins.map((_, k) => lo + (k + 0.5) * w), bins, { colors: bins.map((_, k) => (lo + (k + 0.5) * w >= 0 ? '--gain' : '--loss')), w: w * 0.92 });
      p1.vline(0, { color: '--ink', label: 'índice', dash: [] });
      /* persistencia: dos mitades del periodo */
      const h = Math.max(1, Math.floor(Tn / 2));
      const f1 = m.map((x) => { let s = 0; for (let t = 0; t < h; t++) s += Math.log1p(x.ex[t]); return s; });
      const f2 = m.map((x) => { let s = 0; for (let t = h; t < Math.max(2 * h, h + 1); t++) s += Math.log1p(x.ex[t] ?? 0); return s; });
      const q75a = S.quantile(f1, 0.75), q75b = S.quantile(f2, 0.75);
      const quart = (v, arr) => { const q = [0.25, 0.5, 0.75].map((p) => S.quantile(arr, p)); return v < q[0] ? 0 : v < q[1] ? 1 : v < q[2] ? 2 : 3; };
      const top = m.map((_, i) => f1[i] >= q75a);
      const dist = [0, 0, 0, 0];
      m.forEach((_, i) => { if (top[i]) dist[quart(f2[i], f2)]++; });
      const nt = dist.reduce((s, v) => s + v, 0);
      CC.draw.clear(cp);
      const p2 = new CC.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: -0.6, xmax: 3.6, ymin: 0, ymax: 0.6, xticks: [], title: 'dónde terminan los del mejor cuarto inicial', yfmt: CC.pctAxis, mb: 34 });
      p2.frame();
      p2.hline(0.25, { color: '--ink-3', label: 'azar', labelRight: true });
      p2.bars([0, 1, 2, 3], dist.map((v) => v / nt), { colors: ['--c2', '--c4', '--c6', '--c3'], w: 0.6, labels: true, fmt: (v) => CC.pct(v, 0) });
      ['peor cuarto', '2.º', '3.º', 'mejor cuarto'].forEach((t, k) => CC.text(cp.ctx, t, p2.X(k), p2.iy + p2.ih + 16, { size: 11.5, align: 'center', color: '--ink-2' }));
      sim.set('b', CC.pct(cum.filter((v) => v > 0).length / cum.length, 1));
      sim.set('med', CC.pct(S.quantile(cum, 0.5), 1));
      sim.set('per', CC.pct(dist[3] / nt, 0));
    });
  });

  /* 19.3 Años para distinguir habilidad */
  CC.defineSim('suerte-habilidad', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Años necesarios para distinguir habilidad de suerte' });
    sim.group('Gestor');
    sim.slider('a', { label: 'Habilidad real α (exceso anual)', min: 0.0025, max: 0.06, step: 0.0025, value: 0.02, fmt: (v) => CC.pct(v, 2) });
    sim.slider('te', { label: 'Error de seguimiento anual', min: 0.01, max: 0.15, step: 0.005, value: 0.06, fmt: (v) => CC.pct(v, 1) });
    sim.seg('z', { label: 'Confianza', options: [[1.645, '90 %'], [1.96, '95 %'], [2.576, '99 %']], value: 1.96 });
    sim.out('n', 'Años de historial necesarios', { hl: true });
    sim.out('p', 'Probabilidad de que supere al índice en 5 años');
    sim.onDraw(() => {
      const { a, te } = sim.p, z = +sim.p.z;
      CC.draw.clear(cv);
      const pl = new CC.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.0025, xmax: 0.06, ymin: 1, ymax: 1000, ylog: true, xlabel: 'habilidad α (exceso anual sobre el índice)', ylabel: 'años necesarios', xfmt: CC.pctAxis, yfmt: (v) => CC.nf(v) });
      pl.frame();
      pl.band(0.0025, 0.06, { color: '--c6', alpha: 0.03 });
      pl.hline(40, { color: '--ink-3', label: 'una carrera de inversión (40 años)', labelRight: true });
      [0.03, 0.06, 0.1].forEach((t, k) => pl.fn((x) => I.yearsToDetect(x, t, z), { color: ['--c3', '--c1', '--c2'][k], width: 1.6, dash: [4, 3], from: 0.0025 }));
      pl.fn((x) => I.yearsToDetect(x, te, z), { color: '--accent', width: 2.8, from: 0.0025 });
      const n = I.yearsToDetect(a, te, z);
      pl.dot(a, Math.min(999, n), { color: '--accent', label: CC.nf(n, 0) + ' años' });
      pl.legend([{ label: `error de seguimiento ${CC.pct(te, 1)}`, color: '--accent' }, { label: '3 %, 6 % y 10 %', color: '--ink-3', dash: [4, 3] }], 'tr');
      sim.set('n', CC.nf(n, 1));
      sim.set('p', CC.pct(S.normCDF((a * Math.sqrt(5)) / te), 0));
    });
  });
})();
