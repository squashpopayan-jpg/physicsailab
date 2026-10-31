/* Capítulo 19 — Teoría de perturbaciones independiente del tiempo */
(function () {
  'use strict';
  const EM = window.EM, PT = EM.qm.pert, M = EM.M;

  /* 19.1 Dos niveles: la serie y su radio de convergencia */
  EM.defineSim('pert-dos', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('v', { label: 'Acoplamiento V (en unidades de la separación Δ = 1)', min: 0.01, max: 1.2, step: 0.01, value: 0.3, fmt: (v) => EM.fix(v, 2) });
    sim.slider('o', { label: 'Orden de la serie (en potencias de V²: orden k → V^{2k})', min: 1, max: 6, step: 1, value: 2, fmt: (v) => 'k = ' + v.toFixed(0) });
    sim.out('e', 'Energía exacta del nivel inferior <i>E</i> = Δ/2 − √(Δ²/4 + <i>V</i>²) · serie hasta el orden k', { hl: true });
    sim.out('r', 'Error de la serie (serie − exacta) · radio de convergencia |<i>V</i>| &lt; Δ/2 (singularidades en <i>V</i> = ±i Δ/2)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p, k = Math.round(p.o);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 1.2, ymin: -1.0, ymax: 0.05, xlabel: 'V / Δ', ylabel: 'E (en unidades de Δ)', ml: 56, mr: 10, title: 'Nivel inferior de un sistema de dos niveles: exacto frente a la serie de perturbaciones' });
      pl.frame(); pl.fn((x) => PT.twoExact(1, x), { color: '--ink', width: 2.6 });
      for (let q = 1; q <= k; q++) pl.fn((x) => Math.max(-1.2, Math.min(0.3, PT.twoSeries(1, x, q))), { color: q === k ? '--accent' : '--ink-3', width: q === k ? 2.2 : 1.1, dash: q === k ? null : [4, 4] });
      pl.vline(0.5, { color: '--c2', dash: [6, 4], label: 'V = Δ/2', labelRight: true }); pl.dot(p.v, PT.twoExact(1, p.v), { color: '--accent', r: 5 });
      pl.legend([{ label: 'exacta', color: '--ink' }, { label: 'serie de orden k', color: '--accent' }, { label: 'órdenes menores', color: '--ink-3', dash: [4, 4] }], 'br');
      const ex = PT.twoExact(1, p.v), se = PT.twoSeries(1, p.v, k);
      sim.set('e', `${EM.fix(ex, 6)} · ${EM.fix(se, 6)}`);
      sim.set('r', `${EM.sci(se - ex, 3)} · ${p.v < 0.5 ? 'dentro (la serie converge)' : 'fuera (la serie diverge)'}`);
    });
  });

  /* 19.2 Oscilador anarmónico: una serie asintótica */
  EM.defineSim('anarmonico', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('g', { label: 'Acoplamiento g del término g x⁴ (ħ = m = ω = 1)', min: 0.005, max: 0.5, step: 0.001, value: 0.05, log: true, fmt: (v) => EM.fix(v, 3) });
    sim.slider('n', { label: 'Nivel n', min: 0, max: 3, step: 1, value: 0, fmt: (v) => v.toFixed(0) });
    sim.out('e', 'Energía exacta (diagonalización en 160 estados) · primer orden · segundo orden', { hl: true });
    sim.out('c', 'Coeficientes de la serie E<sub>k</sub> (k = 0…5) del nivel n');
    sim.out('o', 'Orden óptimo (menor término) y error mínimo alcanzable de la serie truncada');
    const KMAX = 16, MB = 100; let cache = {};
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, g = sim.p.g, n = Math.round(sim.p.n), key = n;
      if (!cache[key]) { const E0 = Array.from({ length: MB }, (_, i) => i + 0.5); cache[key] = PT.rs(E0, PT.hoX4(MB), n, KMAX); }
      const c = cache[key], ex = PT.anharmExact(g, 160, n + 1)[n];
      EM.draw.clear(cv);
      const part = []; let s = 0; for (let k = 0; k <= KMAX; k++) { s += c[k] * g ** k; part.push(s); }
      const err = part.map((x) => Math.abs(x - ex)), terms = c.map((x, k) => Math.abs(x * g ** k));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: KMAX, ymin: ex - 0.6 * Math.max(0.5, Math.abs(ex)), ymax: ex + 0.6 * Math.max(0.5, Math.abs(ex)), xlabel: 'orden K de la suma parcial', ylabel: 'Σ E_k g^k', ml: 54, mr: 8, title: 'Sumas parciales de la serie' });
      pl.frame(); pl.hline(ex, { color: '--c2', dash: [5, 4], label: 'exacta', labelRight: true });
      pl.xy(part.map((_, k) => k), part.map((x) => Math.max(pl.o.ymin, Math.min(pl.o.ymax, x))), { color: '--accent', width: 2 }); part.forEach((x, k) => pl.dot(k, Math.max(pl.o.ymin, Math.min(pl.o.ymax, x)), { color: '--accent', r: 3 }));
      const q = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: KMAX, ymin: -12, ymax: 6, xlabel: 'orden k', ylabel: 'log₁₀ (error o término)', ml: 50, mr: 8, title: 'Error de la suma parcial y tamaño del término k' });
      q.frame(); const lg = (x) => Math.max(-12, Math.min(6, Math.log10(Math.max(x, 1e-300))));
      q.xy(err.map((_, k) => k), err.map(lg), { color: '--accent', width: 2 }); q.xy(terms.map((_, k) => k), terms.map(lg), { color: '--c3', width: 1.6, dash: [4, 3] });
      q.legend([{ label: '|error|', color: '--accent' }, { label: '|E_k g^k|', color: '--c3', dash: [4, 3] }], 'tr');
      let kb = 1; for (let k = 1; k <= KMAX; k++) if (terms[k] < terms[kb]) kb = k;
      sim.set('e', `${EM.fix(ex, 7)} · ${EM.fix(part[1], 6)} · ${EM.fix(part[2], 6)}`);
      sim.set('c', c.slice(0, 6).map((x) => EM.sci(x, 5)).join(', '));
      sim.set('o', `k = ${kb} · ${EM.sci(Math.min(...err.slice(1)), 2)}${terms[KMAX] > terms[kb] ? ' (la serie diverge: términos crecientes)' : ''}`);
    });
  });

  /* 19.3 Efecto Stark del hidrógeno */
  EM.defineSim('stark-h', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('F', { label: 'Campo eléctrico F (MV/m)', min: 0.1, max: 200, step: 0.1, value: 20, log: true, fmt: (v) => EM.fix(v, 1) + ' MV/m' });
    sim.out('g', 'Estado fundamental: Δ<i>E</i> = −½α<i>F</i>² con α = (9/2)·4πε₀a₀³ (µeV) · momento dipolar inducido <i>d</i> = α<i>F</i> (10⁻³³ C·m)', { hl: true });
    sim.out('n', 'Nivel n = 2: desdoblamiento lineal ±3<i>ea</i>₀<i>F</i> (meV) · estados 2s ± 2p₀ (dipolo permanente de ±3<i>ea</i>₀)');
    sim.out('i', 'Campo de ionización clásica del nivel n = 2, <i>F</i> ≈ 1/(16<i>n</i>⁴) u. at. (V/m) · el campo aplicado como fracción de él');
    const FAU = 5.14220674763e11, EH = 27.211386246, A0 = 5.29177210903e-11, E = 1.602176634e-19;
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, FSI = sim.p.F * 1e6, fa = FSI / FAU;
      EM.draw.clear(cv);
      const fmax = 0.02, pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: fmax, ymin: -0.58, ymax: 0.0, xlabel: 'F (unidades atómicas; 1 u. at. = 5.14×10¹¹ V/m)', ylabel: 'E (hartree)', ml: 58, mr: 10, title: 'Niveles n = 1 y n = 2 del hidrógeno en un campo' });
      pl.frame(); pl.fn((f) => PT.starkGround(f), { color: '--c1', width: 2 }); pl.fn((f) => PT.starkN2(f)[0], { color: '--c2', width: 2 }); pl.fn((f) => PT.starkN2(f)[1], { color: '--c2', width: 2 }); pl.hline(-0.125, { color: '--c3', dash: [3, 4] });
      pl.vline(Math.min(fa, fmax), { color: '--accent', dash: [3, 3] }); pl.vline(1 / 256, { color: '--ink-3', dash: [6, 4], label: 'ionización clásica de n = 2', labelRight: true });
      pl.label(0.001, -0.5, '1s: −½ − (9/4)F²', { size: 11, color: '--c1', dy: 14 }); pl.label(0.0004, -0.1, '2s ± 2p₀: −⅛ ± 3F', { size: 11, color: '--c2', dy: -10 }); pl.label(0.0004, -0.125, '2p±1 (sin cambio lineal)', { size: 11, color: '--c3', dy: 14 });
      const alphaSI = 4.5 * 4 * Math.PI * 8.8541878128e-12 * A0 ** 3;
      const dE1 = 0.5 * alphaSI * FSI * FSI / E * 1e6, dind = alphaSI * FSI, dE2 = 3 * E * A0 * FSI / E * 1e3, Fion = 1 / (16 * 16) * FAU;
      sim.set('g', `${EM.fix(dE1, 4)} µeV (baja) · ${EM.fix(dind / 1e-33, 4)}`);
      sim.set('n', `±${EM.fix(dE2, 4)} meV (separación total ${EM.fix(2 * dE2, 4)} meV)`);
      sim.set('i', `${EM.sci(Fion, 3)} V/m · el campo aplicado es el ${EM.fix(100 * FSI / Fion, 3)} % de ese valor`);
    });
  });
})();
