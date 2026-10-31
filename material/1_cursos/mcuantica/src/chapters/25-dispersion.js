/* Capítulo 25 — Teoría de la dispersión: ondas parciales y aproximación de Born */
(function () {
  'use strict';
  const EM = window.EM, S3 = EM.qm.s3, M = EM.M, PI = Math.PI;

  /* 25.1 Esfera dura: ondas parciales y sombra */
  EM.defineSim('esfera-dura', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('ka', { label: 'k·a (número de onda por radio de la esfera)', min: 0.05, max: 12, step: 0.05, value: 1.0, log: true, fmt: (v) => EM.fix(v, 2) });
    sim.out('s', 'Sección eficaz σ/πa² (límite de baja energía 4; límite clásico geométrico πa², límite cuántico 2πa² = reflexión + sombra) · σ para este <i>ka</i>', { hl: true });
    sim.out('l', 'Desplazamientos de fase δ<sub>l</sub> = arctan(j<sub>l</sub>/y<sub>l</sub>) (rad): δ<sub>0</sub> = −<i>ka</i> exacto · ondas parciales relevantes: <i>l</i> ≲ <i>ka</i>');
    sim.out('f', 'Dispersión frontal: |<i>f</i>(0)|² y teorema óptico σ = (4π/<i>k</i>)Im <i>f</i>(0) (verificación numérica) · cociente');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, ka = sim.p.ka, Lmax = Math.ceil(ka + 12);
      EM.draw.clear(cv);
      const sig = (x) => { const d = Array.from({ length: Math.ceil(x + 12) }, (_, l) => S3.hardDelta(l, x, 1)); return S3.sigma(x, d) / PI; };
      const xs = Array.from({ length: 160 }, (_, i) => Math.exp(Math.log(0.05) + (Math.log(12 / 0.05) * i) / 159)), ys = xs.map(sig);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.52, h: H, xmin: 0.05, xmax: 12, ymin: 1.5, ymax: 4.5, xlog: true, xlabel: 'k a', ylabel: 'σ / π a²', ml: 48, mr: 8, title: 'Sección eficaz de la esfera dura' });
      pl.frame(); pl.xy(xs, ys, { color: '--accent', width: 2.4 }); pl.hline(4, { color: '--ink-3', dash: [4, 3], label: '4 (baja energía)', labelRight: true }); pl.hline(2, { color: '--c2', dash: [4, 3], label: '2 (alta energía)', labelRight: true }); pl.dot(ka, sig(ka), { color: '--c3', r: 5 });
      const d = Array.from({ length: Lmax }, (_, l) => S3.hardDelta(l, ka, 1)), th = Array.from({ length: 241 }, (_, i) => (PI * i) / 240), f2 = th.map((t) => { const f = S3.amp(ka, d, t); return f[0] * f[0] + f[1] * f[1]; });
      const q = new EM.Plot(ctx, { x: W * 0.54, y: 0, w: W * 0.46, h: H, xmin: 0, xmax: 180, ymin: Math.max(Math.min(...f2) * 0.7, 1e-6), ymax: Math.max(...f2) * 1.3, ylog: true, xlabel: 'θ (grados)', ylabel: 'dσ/dΩ (en a²)', ml: 50, mr: 8, title: `Distribución angular (ka = ${EM.fix(ka, 2)})` });
      q.frame(); q.xy(th.map((t) => M.deg(t)), f2, { color: '--accent', width: 2.2 });
      const f0 = S3.amp(ka, d, 0), sg = S3.sigma(ka, d);
      sim.set('s', `${EM.fix(sg / PI, 4)} · σ = ${EM.fix(sg, 4)} a²`);
      sim.set('l', d.slice(0, 5).map((x) => EM.fix(x, 4)).join(', ') + ' …');
      sim.set('f', `${EM.sci(f0[0] ** 2 + f0[1] ** 2, 4)} · σ(óptico) = ${EM.fix((4 * PI / ka) * f0[1], 4)} a² · ${EM.fix((4 * PI / ka) * f0[1] / sg, 6)}`);
    });
  });

  /* 25.2 Born frente a la solución exacta de ondas parciales */
  EM.defineSim('born-exacta', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.select('pot', { label: 'Potencial atractivo', options: [['yuk', 'Yukawa V = −V₀ a e^{−r/a}/r'], ['gau', 'Gaussiano V = −V₀ e^{−r²/a²}']], value: 'yuk' });
    sim.slider('V0', { label: 'Intensidad V₀ (ħ = m = a = 1)', min: 0.05, max: 6, step: 0.05, value: 0.5, log: true, fmt: (v) => EM.fix(v, 2) });
    sim.out('b', 'Parámetro de Born para el potencial: 2|V₀|a²/ħ² (Yukawa) · el Born es bueno si es ≪ 1, o si <i>E</i> ≫ |<i>V</i><sub>0</sub>|', { hl: true });
    sim.out('e', 'Resultados a la energía marcada (k = 1): σ exacta · σ Born · cociente');
    sim.slider('kk', { label: 'Número de onda k marcado', min: 0.1, max: 6, step: 0.05, value: 1, log: true, fmt: (v) => EM.fix(v, 2) });
    const cache = {};
    const Vf = (pot, V0) => (pot === 'yuk' ? (r) => -V0 * Math.exp(-r) / r : (r) => -V0 * Math.exp(-r * r));
    const born = (pot, V0, k) => (pot === 'yuk' ? (16 * PI * V0 * V0) / (1 + 4 * k * k) : (PI * PI * V0 * V0 * (1 - Math.exp(-2 * k * k))) / (2 * k * k));
    const exact = (pot, V0, k) => { const key = pot + '|' + V0.toFixed(4) + '|' + k.toFixed(4); if (cache[key] !== undefined) return cache[key]; const L = Math.ceil(k * 2.5 + 6), V = Vf(pot, V0), d = Array.from({ length: L }, (_, l) => S3.delta(l, k, V, pot === 'yuk' ? 25 : 8, 0.004)); return (cache[key] = S3.sigma(k, d)); };
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, pot = sim.p.pot, V0 = sim.p.V0, kk = sim.p.kk;
      EM.draw.clear(cv);
      const ks = Array.from({ length: 36 }, (_, i) => Math.exp(Math.log(0.1) + (Math.log(6 / 0.1) * i) / 35)), ex = ks.map((k) => exact(pot, V0, k)), br = ks.map((k) => born(pot, V0, k));
      const lo = Math.min(...ex, ...br) * 0.7, hi = Math.max(...ex, ...br) * 1.4;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.1, xmax: 6, ymin: lo, ymax: hi, xlog: true, ylog: true, xlabel: 'k (ħ = m = a = 1)', ylabel: 'σ (en a²)', ml: 56, mr: 12, title: 'Sección eficaz: ondas parciales (exacta) frente a la aproximación de Born' });
      pl.frame(); pl.xy(ks, ex, { color: '--accent', width: 2.6 }); pl.xy(ks, br, { color: '--c2', width: 2, dash: [6, 4] }); pl.vline(kk, { color: '--ink-3', dash: [3, 3] });
      pl.legend([{ label: 'exacta (ondas parciales)', color: '--accent' }, { label: 'Born', color: '--c2', dash: [6, 4] }], 'tr');
      const e1 = exact(pot, V0, kk), b1 = born(pot, V0, kk);
      sim.set('b', `${EM.fix(2 * V0, 4)} (Yukawa: 2V₀a²; gaussiano: V₀a²) · E = ${EM.fix(kk * kk / 2, 4)}`);
      sim.set('e', `${EM.sci(e1, 4)} · ${EM.sci(b1, 4)} · ${EM.fix(b1 / e1, 4)}`);
    });
  });

  /* 25.3 Dispersión de Rutherford */
  const KE = 1.43996454; /* e²/4πε₀ en MeV·fm */
  EM.defineSim('rutherford', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('E', { label: 'Energía cinética de la partícula alfa E (MeV)', min: 1, max: 30, step: 0.1, value: 5.3, fmt: (v) => EM.fix(v, 1) + ' MeV' });
    sim.slider('Z', { label: 'Número atómico del blanco Z₂', min: 6, max: 92, step: 1, value: 79, fmt: (v) => v.toFixed(0) });
    sim.slider('th', { label: 'Ángulo de dispersión marcado θ (grados)', min: 5, max: 175, step: 1, value: 90, fmt: (v) => v.toFixed(0) + '°' });
    sim.out('d', 'Distancia de máximo acercamiento frontal <i>d</i> = <i>Z</i>₁<i>Z</i>₂<i>e</i>²/(4πε₀<i>E</i>) (fm) · parámetro de impacto <i>b</i> = (<i>d</i>/2)cot(θ/2) del ángulo marcado', { hl: true });
    sim.out('s', 'dσ/dΩ = (<i>d</i>/4)²/sin⁴(θ/2) (fm²/sr) y en barn/sr · sección eficaz de dispersión a más de θ: π(<i>d</i>/2)²cot²(θ/2)');
    sim.out('f', 'Fracción de las partículas desviadas a más de θ en una lámina de oro de 1 µm (n = 5.9×10²⁸ m⁻³) · radio nuclear de Au ≈ 7 fm: ¿se llega al núcleo?');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, E = sim.p.E, Z = sim.p.Z, th = M.rad(sim.p.th), d = (2 * Z * KE) / E, f = (t) => (d / 4) ** 2 / Math.sin(t / 2) ** 4;
      EM.draw.clear(cv);
      const ths = Array.from({ length: 200 }, (_, i) => 5 + (170 * i) / 199);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 5, xmax: 175, ymin: Math.log10(f(M.rad(175))) - 0.3, ymax: Math.log10(f(M.rad(5))) + 0.3, xlabel: 'θ (grados)', ylabel: 'log₁₀ dσ/dΩ (fm²/sr)', ml: 56, mr: 8, title: 'Rutherford: dσ/dΩ ∝ 1/sin⁴(θ/2)' });
      pl.frame(); pl.xy(ths, ths.map((t) => Math.log10(f(M.rad(t)))), { color: '--accent', width: 2.4 }); pl.dot(sim.p.th, Math.log10(f(th)), { color: '--c3', r: 5.5 });
      /* trayectorias hiperbólicas */
      const q = new EM.Plot(ctx, { x: W * 0.62, y: 0, w: W * 0.38, h: H, xmin: -3 * d, xmax: 2 * d, ymin: -2.2 * d, ymax: 2.2 * d, xlabel: 'x (fm)', ylabel: 'y (fm)', ml: 46, mr: 8, title: 'Trayectorias (parámetros de impacto b)' });
      q.frame(); q.dot(0, 0, { color: '--c2', r: 6 });
      for (const bb of [0.15 * d, 0.3 * d, 0.6 * d, 1.0 * d]) { const e = Math.sqrt(1 + (2 * bb / d) ** 2), a = d / 2, pts = []; for (let i = 0; i <= 160; i++) { const ph = -Math.acos(-1 / e) * 0.999 + (2 * Math.acos(-1 / e) * 0.999 * i) / 160, r = (a * (e * e - 1)) / (1 + e * Math.cos(ph) * 1) * 1; pts.push([r * Math.cos(ph) * -1 + 0, r * Math.sin(ph)]); } q.path(pts.map((p) => [p[0], p[1] * 1]), { color: '--accent', width: 1.4 }); }
      const b = (d / 2) / Math.tan(th / 2), sg = f(th), n = 5.9e28, t = 1e-6, frac = n * t * PI * (d / 2) ** 2 * 1e-30 / Math.tan(th / 2) ** 2;
      sim.set('d', `${EM.fix(d, 4)} fm · b = ${EM.fix(b, 4)} fm`);
      sim.set('s', `${EM.sci(sg, 4)} fm²/sr = ${EM.sci(sg / 100, 4)} b/sr · σ(>θ) = ${EM.sci(PI * (d / 2) ** 2 / Math.tan(th / 2) ** 2, 3)} fm²`);
      sim.set('f', `${EM.sci(frac, 3)} (1 de cada ${EM.fix(1 / frac, 0)}) · ${d < 7 ? 'sí, en choque frontal llega al núcleo (d < 7 fm)' : 'no: ni de frente (d = ' + EM.fix(d, 3) + ' fm > R_nuclear)'}`);
    });
  });
})();
