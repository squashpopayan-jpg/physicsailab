/* Capítulo 16 — Leyes de velocidad */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, K = FQ.kin;
  const hash = (i, seed) => { const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };

  /* 16.1 Determinación del orden con linealizaciones */
  EM.defineSim('ordenes', function (sim) {
    const cv = sim.canvas({ aspect: 2.3 });
    sim.seg('n', { label: 'Orden verdadero de la reacción (oculto en un experimento real)', options: [[0, 'cero'], [1, 'primero'], [2, 'segundo']], value: 1 });
    sim.slider('k', { label: 'Constante de velocidad (en unidades de 1/tiempo para el primer orden)', min: 0.1, max: 3, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('noise', { label: 'Ruido de medida (% de [A]₀)', min: 0, max: 8, step: 0.1, value: 1.5, unit: '%', fmt: (v) => v.toFixed(1) });
    sim.slider('npts', { label: 'Número de puntos', min: 5, max: 30, step: 1, value: 12, fmt: (v) => v.toFixed(0) });
    sim.out('r2', 'r² de cada linealización: [A] vs t · ln[A] vs t · 1/[A] vs t', { hl: true });
    sim.out('id', 'Orden inferido');
    sim.out('kk', 'Constante estimada · vida media estimada');
    const A0 = 1;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, n = +p.n, k = n === 0 ? p.k * 0.5 : n === 1 ? p.k : p.k;
      EM.draw.clear(cv);
      const th = K.half(n, A0, k), tmax = (n === 0 ? 1.8 : 3.2) * th, ts = [], As = [];
      for (let i = 0; i < p.npts; i++) { const t = (tmax * i) / (p.npts - 1); const A = n === 0 ? K.zero(A0, k, t) : n === 1 ? K.first(A0, k, t) : K.second(A0, k, t); ts.push(t); As.push(Math.max(A + (p.noise / 100) * hash(i, 5 + n), 1e-3)); }
      const fits = [
        { y: As, lab: '[A]', col: '--c1' }, { y: As.map(Math.log), lab: 'ln[A]', col: '--c3' }, { y: As.map((v) => 1 / v), lab: '1/[A]', col: '--c2' }
      ].map((f) => Object.assign(f, FQ.linfit(ts, f.y)));
      const w = (W - 6) / 3;
      fits.forEach((f, j) => {
        const lo = Math.min(...f.y), hi = Math.max(...f.y), pad = (hi - lo) * 0.12 + 1e-9;
        const pl = new EM.Plot(ctx, { x: j * w, y: 0, w: w, h: H, xmin: 0, xmax: tmax, ymin: lo - pad, ymax: hi + pad, xlabel: 't', ylabel: f.lab, ml: 44, mr: 8, title: 'r² = ' + f.r2.toFixed(4) });
        pl.frame();
        pl.fn((t) => f.a + f.b * t, { color: f.col, width: 2, dash: [5, 4] });
        ts.forEach((t, i) => pl.dot(t, f.y[i], { color: f.col, r: 3.2 }));
      });
      const best = fits.reduce((m, f, j) => (f.r2 > fits[m].r2 ? j : m), 0);
      sim.set('r2', fits.map((f) => f.r2.toFixed(4)).join(' · '));
      sim.set('id', 'orden ' + best + (best === n ? ' (correcto)' : ' (se confunde con el verdadero; con ruido o pocas conversiones las tres rectas son parecidas)'));
      const kest = best === 0 ? -fits[0].b : best === 1 ? -fits[1].b : fits[2].b;
      sim.set('kk', EM.fix(kest, 3) + ' · t½ = ' + EM.fix(best === 0 ? A0 / (2 * kest) : best === 1 ? Math.LN2 / kest : 1 / (kest * A0), 3));
    });
  });

  /* 16.2 Reacciones consecutivas: A → B → C */
  EM.defineSim('consecutivas', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('k1', { label: 'k₁ (A → B)', min: 0.05, max: 10, step: 0.01, value: 1, log: true, fmt: (v) => v.toFixed(2) });
    sim.slider('k2', { label: 'k₂ (B → C)', min: 0.05, max: 10, step: 0.01, value: 0.4, log: true, fmt: (v) => v.toFixed(2) });
    sim.check('ss', { label: 'Mostrar la aproximación de estado estacionario de B', value: false });
    sim.out('tm', 'Instante del máximo de B · [B]<sub>máx</sub>', { hl: true });
    sim.out('rds', 'Etapa limitante');
    sim.out('ode', 'Integración numérica (Dormand–Prince) frente a la solución analítica en <i>t</i> = 3/<i>k</i><sub>1</sub>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, k1 = p.k1, k2 = p.k2, tmax = 5 / Math.min(k1, k2);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tmax, ymin: 0, ymax: 1.02, xlabel: 't', ylabel: 'concentración / [A]₀', ml: 50 });
      pl.frame();
      const xs = [], A = [], B = [], C = [], Bss = [];
      for (let i = 0; i <= 300; i++) { const t = (tmax * i) / 300, r = K.bateman(1, k1, k2, t); xs.push(t); A.push(r.A); B.push(r.B); C.push(r.C); Bss.push((k1 / k2) * Math.exp(-k1 * t)); }
      pl.xy(xs, A, { color: '--c1', width: 2.4 }); pl.xy(xs, B, { color: '--c4', width: 2.8 }); pl.xy(xs, C, { color: '--c3', width: 2.4 });
      if (p.ss) pl.xy(xs, Bss.map((v) => Math.min(v, 1.05)), { color: '--c4', width: 1.4, dash: [5, 4] });
      const tm = K.tmaxB(k1, k2), Bm = K.bateman(1, k1, k2, tm).B; pl.dot(tm, Bm, { color: '--accent', label: 'B máx', dy: -10 });
      pl.legend([{ label: 'A', color: '--c1' }, { label: 'B (intermedio)', color: '--c4' }, { label: 'C', color: '--c3' }].concat(p.ss ? [{ label: 'B estacionario (k₁/k₂)e^(−k₁t)', color: '--c4', dash: [5, 4] }] : []), 'tr');
      const sol = FQ.ode((t, y) => [-k1 * y[0], k1 * y[0] - k2 * y[1], k2 * y[1]], [1, 0, 0], [0, 3 / k1], { rtol: 1e-10, atol: 1e-13 }), an = K.bateman(1, k1, k2, 3 / k1);
      sim.set('tm', EM.fix(tm, 3) + ' · ' + EM.fix(Bm, 3));
      sim.set('rds', k1 > 3 * k2 ? 'B → C (la segunda es la lenta): B se acumula' : k2 > 3 * k1 ? 'A → B (la primera es la lenta): B nunca se acumula y [B] ≈ (k₁/k₂)[A]' : 'ninguna domina: las dos etapas cuentan');
      sim.set('ode', 'ΔB = ' + EM.sci(Math.abs(sol.y[1][1] - an.B), 1) + ' (error relativo ' + EM.sci(Math.abs(sol.y[1][1] - an.B) / an.B, 1) + ')');
    });
  });

  /* 16.3 Reacción reversible y relajación */
  EM.defineSim('relajacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('kf', { label: 'k directa k_f (A → B)', min: 0.01, max: 10, step: 0.01, value: 2, log: true, fmt: (v) => v.toFixed(2) });
    sim.slider('kb', { label: 'k inversa k_b (B → A)', min: 0.01, max: 10, step: 0.01, value: 0.5, log: true, fmt: (v) => v.toFixed(2) });
    sim.slider('A0', { label: 'Fracción inicial de A', min: 0, max: 1, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.out('K', 'Constante de equilibrio <i>K</i> = <i>k</i><sub>f</sub>/<i>k</i><sub>b</sub> (principio del balance detallado)', { hl: true });
    sim.out('tau', 'Tiempo de relajación τ = 1/(<i>k</i><sub>f</sub> + <i>k</i><sub>b</sub>)');
    sim.out('eq', '[A] y [B] en el equilibrio');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, tau = 1 / (p.kf + p.kb), tmax = 6 * tau;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: tmax, ymin: 0, ymax: 1, xlabel: 't', ylabel: 'fracción', ml: 48 });
      pl.frame();
      const ts = [], A = [], Bv = []; for (let i = 0; i <= 200; i++) { const t = (tmax * i) / 200; ts.push(t); const a = K.reversible(p.A0, 1 - p.A0, p.kf, p.kb, t); A.push(a); Bv.push(1 - a); }
      pl.xy(ts, A, { color: '--c1', width: 2.6 }); pl.xy(ts, Bv, { color: '--c2', width: 2.6 });
      const Ae = p.kb / (p.kf + p.kb); pl.hline(Ae, { color: '--ink-3', dash: [5, 4] }); pl.hline(1 - Ae, { color: '--ink-3', dash: [5, 4] });
      pl.vline(tau, { color: '--accent', label: 'τ' });
      pl.legend([{ label: '[A]', color: '--c1' }, { label: '[B]', color: '--c2' }], 'tr');
      sim.set('K', EM.fix(p.kf / p.kb, 3) + ' (ΔG° = −RT ln K = ' + EM.fix((-FQ.R * 298.15 * Math.log(p.kf / p.kb)) / 1e3, 2) + ' kJ/mol a 298 K)');
      sim.set('tau', EM.fix(tau, 3) + ' (el 63 % de la distancia al equilibrio se recorre en τ)');
      sim.set('eq', EM.fix(Ae, 3) + ' · ' + EM.fix(1 - Ae, 3));
    });
  });

  /* 16.4 Pseudo primer orden */
  EM.defineSim('pseudoprimer', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('k', { label: 'Constante de segundo orden verdadera k₂', min: 0.01, max: 5, step: 0.01, value: 0.5, unit: 'L/mol·s', fmt: (v) => v.toFixed(2) });
    sim.slider('B', { label: 'Exceso del reactivo B: [B]₀ / [A]₀', min: 1, max: 200, step: 1, value: 50, fmt: (v) => v.toFixed(0) });
    sim.out('kobs', 'Constante observada <i>k</i>′ = <i>k</i><sub>2</sub>[B]₀ (pseudo primer orden)', { hl: true });
    sim.out('err', 'Error de la aproximación frente a la solución exacta de segundo orden en <i>t</i>½');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, A0 = 0.01, B0 = A0 * p.B, kp = p.k * B0, tmax = 4 * Math.LN2 / kp;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.58, h: cv.h, xmin: 0, xmax: tmax, ymin: 0, ymax: 1.02, xlabel: 't (s)', ylabel: '[A]/[A]₀', ml: 50 });
      pl.frame();
      pl.fn((t) => K.abExact(A0, B0, p.k, t) / A0, { color: '--c1', width: 2.6 }); pl.fn((t) => Math.exp(-kp * t), { color: '--c2', width: 1.8, dash: [6, 4] });
      pl.legend([{ label: 'exacta (segundo orden)', color: '--c1' }, { label: 'pseudo primer orden', color: '--c2', dash: [6, 4] }], 'tr');
      const pl2 = new EM.Plot(ctx, { x: cv.w * 0.6, y: 0, w: cv.w * 0.4, h: cv.h, xmin: 0, xmax: 200 * A0, ymin: 0, ymax: p.k * 200 * A0 * 1.05, xlabel: '[B]₀ (mol/L)', ylabel: "k′ (1/s)", ml: 44, mr: 8 });
      pl2.frame(); pl2.fn((b) => p.k * b, { color: '--c3', width: 2 }); pl2.dot(B0, kp, { color: '--accent' });
      const th = Math.LN2 / kp, ex = K.abExact(A0, B0, p.k, th) / A0;
      sim.set('kobs', EM.fix(kp, 4) + ' s⁻¹ (t½ = ' + EM.fix(th, 2) + ' s)');
      sim.set('err', EM.fix((100 * Math.abs(ex - 0.5)) / 0.5, 2) + ' % ([A] exacta = ' + EM.fix(ex, 4) + ' [A]₀ en vez de 0.5)');
    });
  });
})();
