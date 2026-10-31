/* Capítulo 11 — Potenciales periódicos y bandas de Bloch (ħ = m = a = 1) */
(function () {
  'use strict';
  const EM = window.EM, B = EM.qm.band, PI = Math.PI;

  /* 11.1 Peine de deltas (Kronig–Penney con barreras delgadas) */
  EM.defineSim('kp', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('P', { label: 'Intensidad P = mαa/ħ² (positivo: barreras; negativo: pozos atractivos)', min: -8, max: 10, step: 0.1, value: 3, fmt: (v) => EM.fix(v, 1) });
    sim.seg('z', { label: 'Esquema de zonas', options: [['red', 'Reducida'], ['ext', 'Extendida']], value: 'red' });
    sim.out('b', 'Bandas permitidas (energías en ħ²/<i>ma</i>²): [inferior, superior] de las tres primeras', { hl: true });
    sim.out('g', 'Primera brecha prohibida: de E<sub>1</sub> a E<sub>2</sub> · anchura · primera banda: ancho');
    sim.out('m', 'Masa efectiva en el fondo de la primera banda <i>m</i>* = ħ²/(∂²E/∂<i>k</i>²) (en unidades de <i>m</i>) · en el borde superior');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, P = p.P, Emax = 55, bands = B.kpBands(P, Emax);
      EM.draw.clear(cv);
      const Elo = P < 0 ? bands[0][0] - 1 : -1, ymax = Emax;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.6, h: cv.h, xmin: p.z === 'ext' ? -3 * PI : -PI, xmax: p.z === 'ext' ? 3 * PI : PI, ymin: P < 0 ? Math.max(Elo, -ymax) : -1, ymax: P < 0 ? Math.min(60, 60) : 60, xlabel: 'k a', ylabel: 'energía E (ħ²/ma²)', ml: 52, mr: 8, title: p.z === 'ext' ? 'Zona extendida' : 'Zona reducida' });
      pl.o.xfmt = null; pl.frame();
      /* parábola libre de referencia */
      pl.fn((k) => 0.5 * k * k, { color: '--ink-3', width: 1, dash: [3, 4], n: 300 });
      const ks = Array.from({ length: 121 }, (_, i) => (PI * i) / 120);
      bands.slice(0, 7).forEach((b, nb) => {
        const E = ks.map((k) => B.kpE(k, P, nb));
        if (p.z === 'red') { pl.xy(ks, E, { color: '--accent', width: 2.4 }); pl.xy(ks.map((k) => -k), E, { color: '--accent', width: 2.4 }); }
        else { /* extendida: banda nb ocupa |k| ∈ [nb π, (nb+1) π]: k_ext = ±(k + nb π) si nb par; ±((nb+1)π − k) si impar */ const kx = ks.map((k) => (nb % 2 === 0 ? nb * PI + k : (nb + 1) * PI - k)); pl.xy(kx, E, { color: '--accent', width: 2.4 }); pl.xy(kx.map((v) => -v), E, { color: '--accent', width: 2.4 }); }
        pl.band(-4 * PI, 4 * PI, { color: '--accent', alpha: 0 });
      });
      for (let nb = 1; nb < Math.min(bands.length, 7); nb++) { const g0 = bands[nb - 1][1], g1 = bands[nb][0]; if (g1 - g0 > 1e-6) { ctx.save(); } }
      /* función f(E) a la derecha */
      const pf = new EM.Plot(ctx, { x: cv.w * 0.63, y: 0, w: cv.w * 0.37, h: cv.h, xmin: -3, xmax: 3, ymin: -1, ymax: Math.min(60, 60), xlabel: 'f(E) = cos q + (P/q) sen q', ylabel: 'energía E', ml: 40, mr: 8, title: 'Condición |f| ≤ 1' });
      pf.frame(); pf.band(-1, 1, { color: '--accent', alpha: 0.12 }); pf.vline(1, { color: '--ink-3', dash: [3, 3] }); pf.vline(-1, { color: '--ink-3', dash: [3, 3] });
      const Es = Array.from({ length: 800 }, (_, i) => (P < 0 ? Math.max(Elo, -ymax) : 0.001) + ((60 - (P < 0 ? Math.max(Elo, -ymax) : 0.001)) * i) / 799);
      pf.xy(Es.map((E) => B.kpF(E, P)), Es, { color: '--c1', width: 2 });
      const m = (nb, k0) => { const h = 0.02, e0 = B.kpE(k0, P, nb), e1 = B.kpE(k0 + h, P, nb), e2 = B.kpE(k0 - h, P, nb); return (h * h) / (e1 + e2 - 2 * e0); };
      const g = bands.length > 1 ? [bands[0][1], bands[1][0]] : [NaN, NaN];
      sim.set('b', bands.slice(0, 3).map((b) => `[${EM.fix(b[0], 3)}, ${EM.fix(b[1], 3)}]`).join(' · '));
      sim.set('g', `${EM.fix(g[0], 4)} a ${EM.fix(g[1], 4)} · ${EM.fix(g[1] - g[0], 4)} · ${EM.fix(bands[0][1] - bands[0][0], 4)}`);
      sim.set('m', `${EM.fix(m(0, 0.04), 3)} · ${EM.fix(m(0, PI - 0.05), 3)}`);
    });
  });

  /* 11.2 Electrones casi libres: la brecha en el borde de la zona */
  EM.defineSim('pw', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('V1', { label: 'Amplitud V₁ del potencial V(x) = 2V₁ cos(2πx/a)', min: 0, max: 3, step: 0.02, value: 0.8, fmt: (v) => EM.fix(v, 2) });
    sim.out('g', 'Brecha en <i>k</i> = π/<i>a</i> (numérica, ondas planas) · primer orden 2<i>V</i><sub>1</sub>', { hl: true });
    sim.out('e', 'Energías de los bordes de la brecha · energía de la partícula libre π²/2 en el borde de zona');
    sim.out('p', 'Estado inferior: concentración en los mínimos del potencial · superior: en los máximos (ver |ψ|²)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, V1 = p.V1;
      EM.draw.clear(cv);
      const ks = Array.from({ length: 161 }, (_, i) => -PI + (2 * PI * i) / 160), bn = ks.map((k) => B.nfe(k, V1).values);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.52, h: cv.h, xmin: -PI, xmax: PI, ymin: 0, ymax: 28, xlabel: 'k a', ylabel: 'E (ħ²/ma²)', ml: 46, mr: 8, title: 'Bandas' });
      pl.frame(); pl.fn((k) => 0.5 * k * k, { color: '--ink-3', width: 1, dash: [3, 4] }); for (let nb = 0; nb < 4; nb++) pl.xy(ks, bn.map((e) => e[nb]), { color: '--accent', width: 2.4 });
      const e2 = B.nfe(PI, V1), x = Array.from({ length: 301 }, (_, i) => i / 300);
      const psi = (nb) => { const v = e2.vectors; const M = 8; return x.map((xx) => { let re = 0, im = 0; for (let i = 0; i < v.length; i++) { const kk = PI + 2 * PI * (i - M), c = v[i][nb]; re += c * Math.cos(kk * xx); im += c * Math.sin(kk * xx); } return re * re + im * im; }); };
      const pp = new EM.Plot(ctx, { x: cv.w * 0.55, y: 0, w: cv.w * 0.45, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: 3.2, xlabel: 'x/a (borde de zona k = π/a)', ylabel: '|ψ|² y V(x)', ml: 40, mr: 8, title: 'Estados en el borde de la zona' });
      pp.frame(); pp.fn((xx) => 1.6 + (2 * V1 * Math.cos(2 * PI * xx)) / 1.2 / Math.max(V1, 0.4), { color: '--ink-3', width: 1.6, dash: [4, 3] });
      pp.xy(x, psi(0), { color: '--c2', width: 2.4 }); pp.xy(x, psi(1), { color: '--c1', width: 2.4 });
      pp.legend([{ label: 'borde inferior', color: '--c2' }, { label: 'borde superior', color: '--c1' }, { label: 'potencial (esquema)', color: '--ink-3', dash: [4, 3] }], 'tr');
      sim.set('g', `${EM.fix(e2.values[1] - e2.values[0], 5)} · ${EM.fix(2 * V1, 5)}`);
      sim.set('e', `${EM.fix(e2.values[0], 4)} y ${EM.fix(e2.values[1], 4)} · ${EM.fix(PI * PI / 2, 4)}`);
      sim.set('p', 'ψ₋ ∝ sen(πx/a) (|ψ|² máximo en x = a/2, mínimo de V) · ψ₊ ∝ cos(πx/a) (máximo en x = 0, máximo de V)');
    });
  });

  /* 11.3 Enlace fuerte: banda cosenoidal, masa efectiva y oscilaciones de Bloch */
  EM.defineSim('tb', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('t', { label: 'Integral de salto t (energía de acoplamiento entre sitios vecinos)', min: 0.05, max: 1, step: 0.01, value: 0.4, fmt: (v) => EM.fix(v, 2) });
    sim.slider('N', { label: 'Sitios del anillo N', min: 4, max: 24, step: 1, value: 12, fmt: (v) => v.toFixed(0) });
    sim.slider('F', { label: 'Fuerza constante aplicada F (para Bloch)', min: 0.02, max: 0.5, step: 0.01, value: 0.1, fmt: (v) => EM.fix(v, 2) });
    sim.out('B', 'Ancho de banda 4<i>t</i> · masa efectiva en el fondo <i>m</i>* = ħ²/(2<i>ta</i>²) · velocidad máxima 2<i>ta</i>/ħ', { hl: true });
    sim.out('o', 'Oscilación de Bloch: periodo <i>T</i><sub>B</sub> = 2πħ/(<i>Fa</i>) · amplitud espacial 4<i>t</i>/<i>F</i> (en <i>a</i>)');
    sim.out('d', 'Niveles del anillo <i>E</i><sub>j</sub> = −2<i>t</i> cos(2π<i>j</i>/<i>N</i>): autovalores numéricos de la matriz N×N · error máximo');
    let tt = 0; sim.resetButton(() => { tt = 0; }); sim.animate((dt) => { tt += dt * 1.0; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, t = p.t, N = Math.round(p.N), F = p.F, TB = (2 * PI) / F;
      EM.draw.clear(cv);
      const A = EM.P.la.zeros(N); for (let i = 0; i < N; i++) { A[i][(i + 1) % N] += -t; A[(i + 1) % N][i] += -t; } const ev = Array.from(EM.P.la.eigh(A, { vectors: false }).values);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.5, h: cv.h, xmin: -PI, xmax: PI, ymin: -1.05, ymax: 1.05, xlabel: 'k a', ylabel: 'E / (energía del sitio)', ml: 46, mr: 8, title: 'Banda y niveles del anillo' });
      pl.frame(); pl.fn((k) => -2 * t * Math.cos(k), { color: '--accent', width: 2.6 });
      for (let j = 0; j < N; j++) { const k = (2 * PI * (j - Math.floor(N / 2))) / N; pl.dot(k, -2 * t * Math.cos(k), { color: '--c2', r: 3.6 }); }
      pl.fn((k) => -2 * t + t * k * k, { color: '--c3', width: 1.4, dash: [4, 3] });
      pl.legend([{ label: 'E = −2t cos ka', color: '--accent' }, { label: 'parábola m* (fondo)', color: '--c3', dash: [4, 3] }, { label: 'k = 2πj/N', color: '--c2', kind: 'dot' }], 'br');
      /* oscilación de Bloch semiclásica: x(t) = (2t/F)[cos(k₀) − cos(k₀ + Ft)], k₀ = 0 */
      const ts = Array.from({ length: 401 }, (_, i) => (3 * TB * i) / 400), xt = (u) => (2 * t / F) * (1 - Math.cos(F * u));
      const pb = new EM.Plot(ctx, { x: cv.w * 0.53, y: 0, w: cv.w * 0.47, h: cv.h, xmin: 0, xmax: 3 * TB, ymin: -0.2, ymax: (4 * t) / F * 1.1, xlabel: 'tiempo (ħ = 1)', ylabel: 'posición media x/a', ml: 44, mr: 8, title: 'Oscilación de Bloch (semiclásica)' });
      pb.frame(); pb.xy(ts, ts.map(xt), { color: '--c1', width: 2.4 }); pb.dot((tt * 3 * TB / 6) % (3 * TB), xt((tt * 3 * TB / 6) % (3 * TB)), { color: '--c2' }); pb.vline(TB, { color: '--ink-3', dash: [3, 3], label: 'T_B' });
      const err = Math.max(...ev.map((e, j) => 0)) || 0; const ex = Array.from({ length: N }, (_, j) => -2 * t * Math.cos((2 * PI * j) / N)).sort((a, b) => a - b); const e2 = Math.max(...ev.map((e, i) => Math.abs(e - ex[i])));
      sim.set('B', `${EM.fix(4 * t, 3)} · ${EM.fix(1 / (2 * t), 3)} · ${EM.fix(2 * t, 3)}`);
      sim.set('o', `${EM.fix(TB, 2)} · ${EM.fix((4 * t) / F, 2)}`);
      sim.set('d', `${EM.sci(e2, 2)}`);
    });
  });
})();
