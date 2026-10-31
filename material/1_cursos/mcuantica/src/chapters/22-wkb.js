/* Capítulo 22 — La aproximación WKB */
(function () {
  'use strict';
  const EM = window.EM, WK = EM.qm.wkb, SC = EM.qm.scat, Q = EM.P.q1d, M = EM.M, PI = Math.PI;

  /* 22.1 Reglas de cuantización de Bohr–Sommerfeld frente a la solución exacta */
  const POTS = {
    ho: { name: 'Oscilador armónico ½x²', V: (x) => 0.5 * x * x, xm: 0, L: 30, a: -9, b: 9, n: 6 },
    lin: { name: 'Potencial lineal |x|', V: (x) => Math.abs(x), xm: 0, L: 60, a: -16, b: 16, n: 6 },
    quar: { name: 'Potencial cuártico x⁴', V: (x) => x ** 4, xm: 0, L: 20, a: -6, b: 6, n: 6 },
    mor: { name: 'Potencial de Morse D(1 − e^{−x})², D = 12', V: (x) => 12 * (1 - Math.exp(-x)) ** 2, xm: 0, L: 30, a: -2.5, b: 14, n: 4 }
  };
  EM.defineSim('wkb-niveles', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('pot', { label: 'Potencial (ħ = m = 1)', options: Object.entries(POTS).map(([k, v]) => [k, v.name]), value: 'lin' });
    sim.out('w', 'Energías de Bohr–Sommerfeld ∫p dx = (n + ½)πħ para n = 0, 1, 2, 3…', { hl: true });
    sim.out('e', 'Energías exactas (diferencias finitas, 1200 puntos)');
    sim.out('r', 'Error relativo de WKB (%) para cada n (decrece como 1/n² para n grande)');
    const cache = {};
    sim.onDraw(() => {
      const P = POTS[sim.p.pot], key = sim.p.pot;
      if (!cache[key]) { const ex = Q.fdEigen(P.V, P.a, P.b, 1200, P.n + 1).E, wk = ex.map((_, n) => WK.level(P.V, n, P.xm, P.L)); cache[key] = { ex, wk }; }
      const { ex, wk } = cache[key], ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const emax = Math.max(...ex) * 1.15, xr = (P.V === POTS.mor.V) ? [-2, 6] : (sim.p.pot === 'ho' ? [-5, 5] : sim.p.pot === 'lin' ? [-9, 9] : [-2.6, 2.6]);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: xr[0], xmax: xr[1], ymin: 0, ymax: emax, xlabel: 'x', ylabel: 'E', ml: 50, mr: 8, title: P.name });
      pl.frame(); pl.fn(P.V, { color: '--ink-3', width: 2 });
      ex.forEach((e, n) => { pl.hline(e, { color: '--accent', width: 2 }); pl.hline(wk[n], { color: '--c2', width: 1.4, dash: [5, 3] }); });
      pl.legend([{ label: 'exactos', color: '--accent' }, { label: 'WKB', color: '--c2', dash: [5, 3] }], 'tr');
      const err = ex.map((e, n) => Math.abs((wk[n] - e) / e) * 100);
      const q = new EM.Plot(ctx, { x: W * 0.62, y: 0, w: W * 0.38, h: H, xmin: -0.5, xmax: ex.length - 0.5, ymin: 0, ymax: Math.max(...err, 1) * 1.15, xlabel: 'n', ylabel: 'error de WKB (%)', ml: 46, mr: 8, title: 'Error relativo' });
      q.frame(); err.forEach((e, n) => q.path([[n, 0], [n, e]], { color: '--c2', width: 12 }));
      sim.set('w', wk.map((e) => EM.fix(e, 4)).join(', '));
      sim.set('e', ex.map((e) => EM.fix(e, 4)).join(', '));
      sim.set('r', err.map((e) => EM.fix(e, 3)).join(', '));
    });
  });

  /* 22.2 Transmisión WKB frente a la exacta */
  EM.defineSim('wkb-tunel', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('forma', { label: 'Forma de la barrera', options: [['par', 'Parabólica V₀(1 − x²/a²)'], ['tri', 'Triangular V₀(1 − x/a), x ∈ (0, a)'], ['gau', 'Gaussiana V₀ exp(−x²/a²)']], value: 'par' });
    sim.slider('V0', { label: 'Altura V₀ (ħ = m = 1, a = 1)', min: 2, max: 60, step: 0.5, value: 20, fmt: (v) => EM.fix(v, 1) });
    sim.slider('E', { label: 'Energía E / V₀', min: 0.02, max: 0.98, step: 0.01, value: 0.4, fmt: (v) => EM.fix(v, 2) });
    sim.out('t', 'Transmisión exacta (capas) · WKB exp(−2∫κ dx) · fórmula de Kemble 1/(1 + e^{2S})', { hl: true });
    sim.out('s', 'Integral de acción S = ∫κ dx entre los puntos de retorno · cociente WKB/exacta');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, V0 = sim.p.V0, forma = sim.p.forma, a = 1;
      const V = forma === 'par' ? (x) => (Math.abs(x) < a ? V0 * (1 - x * x / (a * a)) : 0) : forma === 'tri' ? (x) => (x > 0 && x < a ? V0 * (1 - x / a) : 0) : (x) => V0 * Math.exp(-x * x / (a * a));
      const xl = forma === 'tri' ? -0.5 : -3, xr = forma === 'tri' ? 1.5 : 3, NS = 600;
      const bounds = Array.from({ length: NS + 1 }, (_, i) => xl + ((xr - xl) * i) / NS), Vs = [0].concat(Array.from({ length: NS }, (_, i) => V(0.5 * (bounds[i] + bounds[i + 1])))).concat([0]);
      const exact = (E) => SC.solve(E, bounds, Vs).T;
      const wkbT = (E) => { const tp = turn(E); return tp ? WK.tunnel(V, E, tp[0], tp[1]) : 1; };
      const turn = (E) => {
        if (forma === 'par') { const x = a * Math.sqrt(1 - E / V0); return [-x, x]; }
        if (forma === 'tri') return [0, a * (1 - E / V0)];
        const x = a * Math.sqrt(Math.log(V0 / E)); return V0 > E ? [-x, x] : null;
      };
      const kem = (E) => { const tp = turn(E); if (!tp) return 1; const S = WK.action(V, E, tp[0], tp[1]); return 1 / (1 + Math.exp(2 * S)); };
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.52, h: H, xmin: xl, xmax: xr, ymin: 0, ymax: V0 * 1.15, xlabel: 'x', ylabel: 'V', ml: 50, mr: 8, title: 'Barrera y energía' });
      pl.frame(); pl.fn(V, { color: '--ink-2', width: 2.2 }); const Ec = sim.p.E * V0; pl.hline(Ec, { color: '--accent', width: 2 });
      const tp = turn(Ec); if (tp) { pl.vline(tp[0], { color: '--c2', dash: [3, 3] }); pl.vline(tp[1], { color: '--c2', dash: [3, 3] }); }
      const q = new EM.Plot(ctx, { x: W * 0.54, y: 0, w: W * 0.46, h: H, xmin: 0, xmax: 1, ymin: -12, ymax: 0.2, xlabel: 'E / V₀', ylabel: 'log₁₀ T', ml: 50, mr: 8, title: 'Transmisión frente a la energía' });
      q.frame(); const lg = (t) => Math.max(-12, Math.log10(Math.max(t, 1e-30)));
      const es = Array.from({ length: 60 }, (_, i) => 0.02 + (0.96 * i) / 59);
      q.xy(es, es.map((e) => lg(exact(e * V0))), { color: '--accent', width: 2.4 }); q.xy(es, es.map((e) => lg(wkbT(e * V0))), { color: '--c2', width: 1.6, dash: [5, 3] }); q.xy(es, es.map((e) => lg(kem(e * V0))), { color: '--c3', width: 1.4, dash: [2, 3] });
      q.vline(sim.p.E, { color: '--ink-3', dash: [3, 3] }); q.legend([{ label: 'exacta', color: '--accent' }, { label: 'WKB', color: '--c2', dash: [5, 3] }, { label: 'Kemble', color: '--c3', dash: [2, 3] }], 'bl');
      const Te = exact(Ec), Tw = wkbT(Ec), Tk = kem(Ec), S = tp ? WK.action(V, Ec, tp[0], tp[1]) : 0;
      sim.set('t', `${EM.sci(Te, 4)} · ${EM.sci(Tw, 4)} · ${EM.sci(Tk, 4)}`);
      sim.set('s', `${EM.fix(S, 4)} · ${EM.fix(Tw / Te, 4)}`);
    });
  });

  /* 22.3 Desintegración alfa: factor de Gamow y ley de Geiger–Nuttall */
  const HC = 197.3269804, ALPHA_EM = 1.43996454, AMU = 931.494102;
  const NUCL = [
    { n: 'Po-212', Z: 84, A: 212, Q: 8.954, t: 2.99e-7 }, { n: 'Po-214', Z: 84, A: 214, Q: 7.833, t: 1.643e-4 }, { n: 'Po-210', Z: 84, A: 210, Q: 5.407, t: 1.196e7 },
    { n: 'Rn-222', Z: 86, A: 222, Q: 5.590, t: 3.30e5 }, { n: 'Ra-226', Z: 88, A: 226, Q: 4.871, t: 5.05e10 }, { n: 'Th-230', Z: 90, A: 230, Q: 4.770, t: 2.38e12 },
    { n: 'U-238', Z: 92, A: 238, Q: 4.270, t: 1.41e17 }, { n: 'Th-232', Z: 90, A: 232, Q: 4.082, t: 4.43e17 }
  ];
  const alphaT = (nu, r0, V0) => {
    const Zd = nu.Z - 2, Ad = nu.A - 4, k = 2 * Zd * ALPHA_EM, mA = 4.001506 * AMU, mD = Ad * AMU, mu = (mA * mD) / (mA + mD), R = r0 * (Math.cbrt(Ad) + Math.cbrt(4));
    const g2 = WK.gamow(k, mu, nu.Q, R, HC), vin = Math.sqrt((2 * (nu.Q + V0)) / mu) * 299792458 * 1e15 /* fm/s */, f = vin / (2 * R);
    return { g2, t: Math.LN2 / (f * Math.exp(-g2)), R, f };
  };
  EM.defineSim('alfa-gamow', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('r0', { label: 'Radio nuclear r₀ en R = r₀(A_d^{1/3} + 4^{1/3}) (fm)', min: 1.0, max: 1.6, step: 0.01, value: 1.2, fmt: (v) => EM.fix(v, 2) });
    sim.slider('V0', { label: 'Profundidad del pozo nuclear V₀ (MeV) para la frecuencia de asalto', min: 20, max: 60, step: 1, value: 35, fmt: (v) => v.toFixed(0) });
    sim.select('nu', { label: 'Núcleo resaltado', options: NUCL.map((q, i) => [i, q.n]), value: 6 });
    sim.out('g', 'Exponente de Gamow 2G = 2∫κ dr (de R al punto de retorno <i>b</i> = 2(<i>Z</i>−2)<i>e</i>²/<i>Q</i>) · transmisión <i>e</i><sup>−2G</sup> · frecuencia de asalto <i>f</i> = <i>v</i>/2<i>R</i> (s⁻¹)', { hl: true });
    sim.out('t', 'Vida media calculada <i>t</i>½ = ln 2/(<i>f</i> e<sup>−2G</sup>) y medida (s) · cociente teoría/medida');
    sim.out('d', 'Dispersión sobre los 8 núcleos: desviación típica de log₁₀(teoría/medida) · intervalo de vidas medias que cubre (órdenes de magnitud)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, r0 = sim.p.r0, V0 = sim.p.V0, sel = Math.round(sim.p.nu), res = NUCL.map((q) => alphaT(q, r0, V0));
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.44, xmax: 0.52, ymin: -8, ymax: 20, xlabel: 'Q^{−1/2} (MeV^{−1/2})', ylabel: 'log₁₀ t½ (s)', ml: 54, mr: 12, title: 'Ley de Geiger–Nuttall: 24 órdenes de magnitud con una energía que varía un factor 2' });
      pl.frame();
      NUCL.forEach((q, i) => { const x = 1 / Math.sqrt(q.Q); pl.dot(x, Math.log10(q.t), { color: '--accent', r: i === sel ? 7 : 4.5 }); pl.dot(x, Math.log10(res[i].t), { color: '--c2', r: i === sel ? 6 : 3.5 }); pl.label(x, Math.log10(q.t), q.n, { size: 10.5, dx: 8, dy: -6, color: '--ink-2' }); });
      pl.legend([{ label: 'medida', color: '--accent' }, { label: 'teoría de Gamow', color: '--c2' }], 'tr');
      const ds = NUCL.map((q, i) => Math.log10(res[i].t / q.t)), mean = ds.reduce((s, v) => s + v, 0) / ds.length, sd = Math.sqrt(ds.reduce((s, v) => s + (v - mean) ** 2, 0) / ds.length);
      const q = NUCL[sel], r = res[sel];
      sim.set('g', `${EM.fix(r.g2, 3)} · ${EM.sci(Math.exp(-r.g2), 3)} · ${EM.sci(r.f, 3)}`);
      sim.set('t', `${EM.sci(r.t, 3)} s y ${EM.sci(q.t, 3)} s · ${EM.sci(r.t / q.t, 3)}`);
      sim.set('d', `${EM.fix(sd, 3)} (media ${EM.fix(mean, 3)}) · ${EM.fix(Math.log10(Math.max(...NUCL.map((x) => x.t)) / Math.min(...NUCL.map((x) => x.t))), 3)}`);
    });
  });
})();
