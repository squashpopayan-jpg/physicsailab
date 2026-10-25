/* Capítulo 8 — Calor específico de la red */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, DATA = EM.data;
  const PI = Math.PI;
  /* Calor específico del cobre a presión constante (J mol⁻¹ K⁻¹), White y Collocott 1984, redondeado */
  const CU = [[10, 0.055], [20, 0.46], [30, 1.69], [40, 3.79], [50, 6.15], [60, 8.43], [100, 16.0], [298, 24.44]];

  /* 8.3 Einstein y Debye */
  EM.defineSim('debye-einstein', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('thD', { label: 'θ_D (Debye)', min: 100, max: 700, step: 1, value: 343, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('thE', { label: 'θ_E (Einstein)', min: 100, max: 700, step: 1, value: 260, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.check('data', { label: 'Mediciones del cobre', value: true });
    sim.out('cd', 'Debye a 300 K', { hl: true });
    sim.out('ce', 'Einstein a 300 K');
    sim.out('err', 'Error cuadrático con los datos (Debye / Einstein)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 400, ymin: 0, ymax: 27, xlabel: 'T (K)', ylabel: 'C (J mol⁻¹ K⁻¹)' });
      pl.frame();
      pl.hline(3 * SS.R, { label: '3R (Dulong–Petit)', labelRight: true });
      pl.fn((T) => SS.debyeC(T, p.thD), { color: '--c1', width: 2.4, n: 300 });
      pl.fn((T) => SS.einsteinC(T, p.thE), { color: '--c2', width: 2.4, n: 300 });
      if (p.data) for (const [T, C] of CU) pl.dot(T, C, { color: '--ink', r: 4.5 });
      pl.legend([{ label: 'Debye', color: '--c1' }, { label: 'Einstein', color: '--c2' }].concat(p.data ? [{ label: 'Cu medido', color: '--ink', kind: 'dot' }] : []), 'br');
      const e = (f) => Math.sqrt(CU.slice(0, 7).reduce((s, [T, C]) => s + Math.pow(f(T) - C, 2), 0) / 7);
      sim.set('cd', EM.fix(SS.debyeC(300, p.thD), 2) + ' J/(mol·K)');
      sim.set('ce', EM.fix(SS.einsteinC(300, p.thE), 2) + ' J/(mol·K)');
      sim.set('err', EM.fix(e((T) => SS.debyeC(T, p.thD) + 0.000695 * T), 2) + ' / ' + EM.fix(e((T) => SS.einsteinC(T, p.thE) + 0.000695 * T), 2) + ' J/(mol·K) (T ≤ 100 K)');
    });
  });

  /* 8.3b Ley T³ */
  EM.defineSim('ley-t3', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('th', { label: 'θ_D = θ_E', min: 50, max: 2500, step: 1, value: 343, log: true, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('t', 'T donde la ley T³ se desvía 5 %', { hl: true });
    sim.out('r', 'Debye / Einstein a θ/20');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1, xmax: 3000, xlog: true, ymin: 1e-5, ymax: 100, ylog: true, xlabel: 'T (K)', ylabel: 'C (J mol⁻¹ K⁻¹)' });
      pl.frame();
      pl.fn((T) => SS.debyeC(T, p.th), { color: '--c1', width: 2.4, n: 300 });
      pl.fn((T) => SS.einsteinC(T, p.th), { color: '--c2', width: 2.2, n: 300 });
      pl.fn((T) => SS.debyeT3(T, p.th), { color: '--ink-3', width: 1.4, dash: [6, 4] });
      pl.hline(3 * SS.R, { color: '--ink-3' });
      pl.legend([{ label: 'Debye', color: '--c1' }, { label: 'Einstein', color: '--c2' }, { label: 'ley T³', color: '--ink-3', dash: [6, 4] }], 'br');
      const t5 = EM.lin.brent((T) => SS.debyeC(T, p.th) / SS.debyeT3(T, p.th) - 0.95, p.th / 200, p.th);
      sim.set('t', EM.fix(t5, 1) + ' K = θ_D/' + EM.fix(p.th / t5, 1));
      sim.set('r', EM.sci(SS.debyeC(p.th / 20, p.th) / SS.einsteinC(p.th / 20, p.th), 3));
    });
  });

  /* 8.4 γ y β */
  EM.defineSim('gamma-beta', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    const mets = Object.keys(DATA.gamma).filter((k) => DATA.debye[k]);
    sim.select('m', { label: 'Metal', options: mets.map((k) => [k, k]), value: 'Cu' });
    sim.slider('Tm', { label: 'Temperatura máxima', min: 2, max: 20, step: 0.5, value: 8, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.out('g', 'γ (mJ mol⁻¹ K⁻²)', { hl: true });
    sim.out('b', 'β = 1944/θ_D³ (mJ mol⁻¹ K⁻⁴)');
    sim.out('tx', 'Temperatura de cruce √(γ/β)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const g = DATA.gamma[p.m][0], th = DATA.debye[p.m], b = (1944 / Math.pow(th, 3)) * 1000;
      const wl = W * 0.5, Tm = p.Tm;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0, xmax: Tm * Tm, ymin: 0, ymax: (g + b * Tm * Tm) * 1.1, xlabel: 'T² (K²)', ylabel: 'C/T (mJ mol⁻¹ K⁻²)' });
      pl.frame();
      pl.fn((x) => g + b * x, { color: '--c1', width: 2.4 });
      pl.hline(g, { color: '--c2', label: 'γ', dash: [5, 4] });
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: Tm, ymin: 0, ymax: (g * Tm + b * Tm * Tm * Tm) * 1.05, xlabel: 'T (K)', ylabel: 'C (mJ mol⁻¹ K⁻¹)' });
      p2.frame();
      p2.fn((T) => g * T, { color: '--c2', width: 2 });
      p2.fn((T) => b * T * T * T, { color: '--c3', width: 2 });
      p2.fn((T) => g * T + b * T * T * T, { color: '--c1', width: 2.4 });
      p2.legend([{ label: 'electrones γT', color: '--c2' }, { label: 'red βT³', color: '--c3' }, { label: 'total', color: '--c1' }], 'tl');
      sim.set('g', String(g) + ' (electrón libre: ' + DATA.gamma[p.m][1] + ')');
      sim.set('b', EM.fix(b, 4) + ' (θ_D = ' + th + ' K)');
      sim.set('tx', EM.fix(Math.sqrt(g / b), 2) + ' K');
    });
  });

  /* 8.5 Temperatura de Debye efectiva */
  let cuModes = null;
  const getModes = () => {
    if (cuModes) return cuModes;
    const aCu = 3.615e-10, M = 63.546 * 1.66053906660e-27, C1 = (M * Math.pow(2 * PI * 7.25e12, 2)) / 8;
    const nb = SS.cubicNeighbors('fcc', aCu, C1), B = SS.recip(SS.primitive('fcc', aCu));
    const nk = 16, out = [];
    for (let i = 0; i < nk; i++) for (let j = 0; j < nk; j++) for (let l = 0; l < nk; l++) {
      const f = [(i + 0.5) / nk, (j + 0.5) / nk, (l + 0.5) / nk];
      const k = [0, 1, 2].map((m) => f[0] * B[0][m] + f[1] * B[1][m] + f[2] * B[2][m]);
      for (const w of SS.dynCentral(nb, M, k)) out.push((SS.hbar * w) / SS.kB); /* en K */
    }
    cuModes = out;
    return out;
  };
  EM.defineSim('theta-efectiva', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.check('data', { label: 'Mediciones (menos γT)', value: true });
    sim.out('t0', 'θ_D(T → 0) del modelo', { hl: true });
    sim.out('tmin', 'Mínimo de θ_D(T)');
    sim.out('tinf', 'θ_D a 300 K');
    let curve = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      if (!curve) {
        const modes = getModes(), n = modes.length;
        const C = (T) => { let s = 0; for (const th of modes) { const x = th / T; if (x < 700) s += (x * x * Math.exp(-x)) / Math.pow(-Math.expm1(-x), 2); } return (3 * SS.R * s) / n; };
        curve = [];
        for (let T = 12; T <= 400; T *= 1.05) curve.push([T, SS.debyeThetaFrom(T, C(T))]);
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 400, ymin: 250, ymax: 420, xlabel: 'T (K)', ylabel: 'θ_D efectiva (K)' });
      pl.frame();
      pl.xy(curve.map((q) => q[0]), curve.map((q) => q[1]), { color: '--c1', width: 2.4 });
      if (p.data) for (const [T, C] of CU.slice(0, 7)) pl.dot(T, SS.debyeThetaFrom(T, C - 0.000695 * T), { color: '--accent', r: 5 });
      pl.hline(343, { label: 'θ_D = 343 K (calorimétrica)', labelRight: true });
      pl.legend([{ label: 'modelo de fuerzas centrales (Cu)', color: '--c1' }].concat(p.data ? [{ label: 'medido', color: '--accent', kind: 'dot' }] : []), 'tr');
      const mn = curve.reduce((a, b) => (b[1] < a[1] ? b : a));
      sim.set('t0', EM.fix(curve[0][1], 0) + ' K');
      sim.set('tmin', EM.fix(mn[1], 0) + ' K hacia ' + EM.fix(mn[0], 0) + ' K');
      sim.set('tinf', EM.fix(curve[curve.length - 1][1], 0) + ' K');
    });
  });
})();
