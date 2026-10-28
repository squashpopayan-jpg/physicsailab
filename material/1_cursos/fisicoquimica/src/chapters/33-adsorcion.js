/* Capítulo 33 — Adsorción */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, A = FQ.ads, R = 8.314462618;

  /* 33.1 Isotermas */
  EM.defineSim('isotermas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Modelo', options: [['lang', 'Langmuir: θ = KP/(1 + KP)'], ['diss', 'Langmuir con adsorción disociativa: θ = √KP/(1 + √KP)'], ['freu', 'Freundlich: n = k P^(1/n)'], ['bet', 'BET (multicapa)']], value: 'lang' });
    sim.slider('K', { label: 'Constante K (Langmuir), o k (Freundlich), o C (BET)', min: 0.01, max: 1000, step: 0.01, value: 5, log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('n', { label: 'Exponente 1/n (Freundlich)', min: 0.1, max: 1, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.out('d', 'Pendiente inicial y límite de alta presión', { hl: true });
    sim.out('l', 'Representación lineal que permite ajustar los parámetros');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, K = p.K, xs = Array.from({ length: 200 }, (_, i) => 0.005 + (i * (p.m === 'bet' ? 0.95 : 4.995)) / 199);
      const f = (x) => (p.m === 'lang' ? A.langmuir(K, x) : p.m === 'diss' ? A.langmuirDiss(K, x) : p.m === 'freu' ? Math.min(A.freundlich(K * 0.1, 1 / p.n, x), 4) : A.bet(K, x));
      EM.draw.clear(cv);
      const xl = p.m === 'bet' ? 'P/P₀' : 'P (u. arbitrarias)', pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0, xmax: p.m === 'bet' ? 1 : 5, ymin: 0, ymax: p.m === 'bet' ? 8 : 1.1, xlabel: xl, ylabel: p.m === 'bet' ? 'n/n_m' : 'cobertura θ (o n relativo)', ml: 46, title: 'Isoterma' });
      pl.frame(); pl.xy(xs, xs.map(f), { color: '--c1', width: 2.8 }); if (p.m === 'lang') pl.hline(1, { color: '--ink-3', dash: [4, 3], label: 'monocapa completa' });
      const lin = (x) => (p.m === 'lang' ? x / A.langmuir(K, x) : p.m === 'diss' ? x / Math.pow(A.langmuirDiss(K, x), 2) : p.m === 'freu' ? Math.log10(f(x)) : x / (A.bet(K, x) * (1 - x)));
      const lx = (x) => (p.m === 'freu' ? Math.log10(x) : x), ys = xs.map(lin), pl2 = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.42, h: H, xmin: Math.min(...xs.map(lx)), xmax: Math.max(...xs.map(lx)), ymin: Math.min(...ys), ymax: Math.max(...ys) * 1.05 + 0.01, xlabel: p.m === 'freu' ? 'log P' : p.m === 'bet' ? 'P/P₀' : 'P', ylabel: p.m === 'lang' ? 'P/θ' : p.m === 'diss' ? 'P/θ²' : p.m === 'freu' ? 'log n' : 'x/[n(1 − x)]', ml: 44, mr: 8, title: 'Linealización' });
      pl2.frame(); pl2.xy(xs.map(lx), ys, { color: '--c2', width: 2.6 });
      sim.set('d', p.m === 'lang' ? `θ ≈ KP = ${EM.fix(K, 2)}P a P pequeño; θ → 1` : p.m === 'diss' ? 'θ ∝ P^½ a P pequeño (cada molécula ocupa dos sitios); θ → 1' : p.m === 'freu' ? 'sin saturación: la ley de potencias es empírica (media de sitios con energías distintas)' : `n/n_m = C x en x pequeño; diverge en x → 1 (condensación); con C = ${EM.fix(K, 1)} el codo de la monocapa está en x ≈ ${EM.fix(1 / (1 + Math.sqrt(K)), 3)}`);
      sim.set('l', p.m === 'lang' ? 'P/θ = 1/K + P: recta de ordenada 1/K y pendiente 1' : p.m === 'diss' ? 'P/θ² = 1/K + 2P/√K·√P... (usar P^½/θ = K^−½ + P^½)' : p.m === 'freu' ? 'log n = log k + (1/n) log P' : 'x/[n(1 − x)] = 1/(n_mC) + (C − 1)x/(n_mC) (válida en 0.05 < x < 0.30)');
    });
  });

  /* 33.2 Área superficial por BET */
  EM.defineSim('bet-area', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('S', { label: 'Área superficial verdadera del sólido', min: 5, max: 1500, step: 1, value: 250, log: true, unit: 'm²/g', fmt: (v) => v.toFixed(0) });
    sim.slider('C', { label: 'Constante BET C (afinidad por la superficie)', min: 5, max: 400, step: 1, value: 90, log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('lo', { label: 'Extremo inferior del intervalo de ajuste (P/P₀)', min: 0.02, max: 0.2, step: 0.01, value: 0.05, fmt: (v) => v.toFixed(2) });
    sim.slider('hi', { label: 'Extremo superior del intervalo de ajuste (P/P₀)', min: 0.15, max: 0.6, step: 0.01, value: 0.30, fmt: (v) => v.toFixed(2) });
    sim.out('a', 'Capacidad de la monocapa ajustada <i>n</i><sub>m</sub> · área BET (σ(N₂) = 0.162 nm²) frente al área verdadera', { hl: true });
    sim.out('c', 'Constante BET ajustada · energía neta de adsorción de la primera capa ≈ <i>RT</i> ln <i>C</i> (77 K)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, nm0 = A.nmFromArea(p.S, 0.162), xs = Array.from({ length: 30 }, (_, i) => 0.02 + (i * 0.58) / 29), ns = xs.map((x, i) => nm0 * A.bet(p.C, x) * (1 + 0.01 * Math.sin(37 * i + 3)));
      EM.draw.clear(cv);
      const sel = xs.map((x, i) => i).filter((i) => xs[i] >= p.lo - 1e-9 && xs[i] <= p.hi + 1e-9), fit = sel.length >= 2 ? A.betFit(sel.map((i) => xs[i]), sel.map((i) => ns[i])) : { nm: NaN, C: NaN, slope: 0, icpt: 0 };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 0.6, ymin: 0, ymax: Math.max(...ns) * 1.05, xlabel: 'P/P₀', ylabel: 'n (cm³ STP/g)', ml: 48, title: 'Isoterma de N₂ a 77 K (datos con 1 % de ruido)' });
      pl.frame(); pl.xy(xs, xs.map((x) => nm0 * A.bet(p.C, x)), { color: '--c1', width: 1.4, dash: [4, 3] }); xs.forEach((x, i) => pl.dot(x, ns[i], { color: sel.includes(i) ? '--c2' : '--ink-3', r: 3.2 }));
      const yb = ns.map((n, i) => xs[i] / (n * (1 - xs[i]))), pl2 = new EM.Plot(ctx, { x: W * 0.53, y: 0, w: W * 0.47, h: H, xmin: 0, xmax: 0.6, ymin: 0, ymax: Math.max(...yb) * 1.1, xlabel: 'P/P₀', ylabel: 'x/[n(1 − x)] (g/cm³)', ml: 50, mr: 8, title: 'Representación BET' });
      pl2.frame(); xs.forEach((x, i) => pl2.dot(x, yb[i], { color: sel.includes(i) ? '--c2' : '--ink-3', r: 3.2 })); if (isFinite(fit.nm)) pl2.path([[0, fit.icpt], [0.6, fit.icpt + fit.slope * 0.6]], { color: '--accent', width: 1.8 });
      const areaFit = A.area(fit.nm, 0.162);
      sim.set('a', EM.fix(fit.nm, 1) + ' cm³/g (verdadera ' + EM.fix(nm0, 1) + ') · ' + EM.fix(areaFit, 0) + ' m²/g · ' + EM.fix(p.S, 0) + ' m²/g (' + EM.fix(100 * (areaFit - p.S) / p.S, 1) + ' %)');
      sim.set('c', EM.fix(fit.C, 1) + ' (verdadera ' + p.C + ') · ' + EM.fix((R * 77.35 * Math.log(fit.C)) / 1e3, 2) + ' kJ/mol' + (fit.C < 0 || fit.icpt <= 0 ? ' (¡ordenada negativa: intervalo de ajuste inválido!)' : ''));
    });
  });

  /* 33.3 Desorción térmica programada */
  EM.defineSim('tpd', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('E', { label: 'Energía de desorción E_d', min: 20, max: 250, step: 1, value: 120, unit: 'kJ/mol', fmt: (v) => v.toFixed(0) });
    sim.slider('nu', { label: 'Factor preexponencial ν', min: 1e8, max: 1e16, step: 1, value: 1e13, log: true, unit: 's⁻¹', fmt: (v) => EM.sci(v, 1) });
    sim.slider('b', { label: 'Velocidad de calentamiento β', min: 0.1, max: 50, step: 0.1, value: 2, log: true, unit: 'K/s', fmt: (v) => v.toFixed(1) });
    sim.out('Tp', 'Temperatura del pico <i>T</i><sub>p</sub> (integración) · fórmula de Redhead <i>E</i> = <i>RT</i><sub>p</sub>[ln(ν<i>T</i><sub>p</sub>/β) − 3.46]', { hl: true });
    sim.out('r', '<i>E</i><sub>d</sub> deducida de <i>T</i><sub>p</sub> por Redhead · error');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, t = A.tpd(p.E * 1e3, p.nu, p.b, 100, 1500);
      EM.draw.clear(cv);
      const mx = Math.max(...t.rate), pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 100, xmax: Math.min(1500, t.Tp * 1.5 + 50), ymin: 0, ymax: mx * 1.1, xlabel: 'temperatura (K)', ylabel: 'velocidad de desorción −dθ/dt (s⁻¹)', ml: 52 });
      pl.frame(); pl.xy(t.T, t.rate, { color: '--c1', width: 2.8, fill: '--c1', fillAlpha: 0.15 }); pl.vline(t.Tp, { color: '--accent', dash: [4, 3], label: 'T_p' });
      const Er = A.redhead(t.Tp, p.nu, p.b);
      sim.set('Tp', EM.fix(t.Tp, 1) + ' K · ' + EM.fix(A.redheadTp(p.E * 1e3, p.nu, p.b), 1) + ' K');
      sim.set('r', EM.fix(Er / 1e3, 2) + ' kJ/mol · ' + EM.fix(100 * (Er / 1e3 - p.E) / p.E, 2) + ' %');
    });
  });
})();
