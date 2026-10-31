/* Capítulo 26 — Baja energía, resonancias y teorema de Levinson */
(function () {
  'use strict';
  const EM = window.EM, S3 = EM.qm.s3, M = EM.M, PI = Math.PI;

  /* 26.1 Longitud de dispersión del pozo esférico: del cero de energía al enlace */
  EM.defineSim('long-dispersion', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('K', { label: 'Profundidad K₀a = a√(2mV₀)/ħ (el primer estado ligado aparece en π/2 = 1.5708)', min: 0.1, max: 8, step: 0.01, value: 1.2, fmt: (v) => EM.fix(v, 3) });
    sim.out('a', 'Longitud de dispersión <i>a</i><sub>s</sub> = <i>a</i>[1 − tan(<i>K</i>₀<i>a</i>)/(<i>K</i>₀<i>a</i>)] (en unidades de <i>a</i>) · sección eficaz a energía cero σ = 4π<i>a</i><sub>s</sub>²', { hl: true });
    sim.out('n', 'Número de estados ligados (s) N = ⌊K₀a/π + ½⌋ · signo de <i>a</i><sub>s</sub>: positivo con un estado ligado débil (|a<sub>s</sub>| grande), negativo si no hay estado ligado');
    sim.out('r', 'Efecto Ramsauer–Townsend: ¿hay una energía baja con σ₀ ≈ 0? (ocurre cuando <i>a</i><sub>s</sub> ≈ 0 o δ₀ = π en <i>k</i> &gt; 0)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, K0a = sim.p.K, V0 = (K0a * K0a) / 2, as = S3.wellScatLength(V0, 1);
      EM.draw.clear(cv);
      const ks = Array.from({ length: 300 }, (_, i) => 0.01 + (5 * i) / 299), sg = ks.map((k) => (4 * PI / (k * k)) * Math.sin(S3.wellDelta(0, k, V0, 1)) ** 2);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.54, h: H, xmin: 0, xmax: 5, ymin: 0, ymax: Math.min(Math.max(...sg) * 1.1, 4 * PI * 9 + 10), xlabel: 'k a', ylabel: 'σ₀ / a²', ml: 52, mr: 8, title: 'Sección eficaz de la onda s en un pozo esférico' });
      pl.frame(); pl.xy(ks, sg.map((v) => Math.min(v, 4 * PI * 9 + 10)), { color: '--accent', width: 2.4 }); pl.hline(4 * PI * as * as, { color: '--c2', dash: [5, 4], label: '4πa_s²', labelRight: true });
      /* a_s frente a K0a */
      const Ks = Array.from({ length: 400 }, (_, i) => 0.05 + (7.9 * i) / 399), as_ = Ks.map((K) => { const v = S3.wellScatLength((K * K) / 2, 1); return Math.max(-10, Math.min(10, v)); });
      const q = new EM.Plot(ctx, { x: W * 0.56, y: 0, w: W * 0.44, h: H, xmin: 0, xmax: 8, ymin: -10, ymax: 10, xlabel: 'K₀a', ylabel: 'a_s / a', ml: 46, mr: 8, title: 'Longitud de dispersión: polos en K₀a = (n + ½)π' });
      q.frame(); q.hline(0, { color: '--axis' }); for (let n = 0; n < 3; n++) q.vline((n + 0.5) * PI, { color: '--ink-3', dash: [3, 4] });
      for (let i = 1; i < Ks.length; i++) if (Math.abs(as_[i] - as_[i - 1]) < 4) q.path([[Ks[i - 1], as_[i - 1]], [Ks[i], as_[i]]], { color: '--accent', width: 2.2 }); q.dot(K0a, Math.max(-10, Math.min(10, as)), { color: '--c3', r: 6 });
      let rt = null, smin = 1e9; for (let i = 0; i < 100; i++) { if (sg[i] < smin) { smin = sg[i]; rt = ks[i]; } }
      const N = Math.floor(K0a / PI + 0.5);
      sim.set('a', `${EM.fix(as, 4)} · σ(0) = ${EM.fix(4 * PI * as * as, 4)} a²`);
      sim.set('n', `${N} · ${as > 0 ? 'a_s > 0' : 'a_s < 0'} ${Math.abs(K0a - PI / 2) < 0.08 ? '(¡cerca del umbral de enlace: a_s → ±∞!)' : ''}`);
      sim.set('r', smin < 0.2 && K0a > 2 && rt < 1.5 ? `sí: σ₀ = ${EM.fix(smin, 4)} a² en k ≈ ${EM.fix(rt, 3)} (a_s ≈ 0 cuando tan K₀a = K₀a: K₀a = 4.4934, 7.7253…)` : `no (σ₀ mínima = ${EM.fix(smin, 3)} a² en k a = ${EM.fix(rt, 2)})`);
    });
  });

  /* 26.2 Resonancia de forma: un pozo con barrera centrífuga (l = 3) */
  EM.defineSim('resonancia-bw', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('V0', { label: 'Profundidad V₀ del pozo de Woods–Saxon (R = 1, difusividad 0.05; ħ = m = 1)', min: 12, max: 22, step: 0.05, value: 15, fmt: (v) => EM.fix(v, 2) });
    sim.select('l', { label: 'Momento angular l', options: [[3, 'l = 3'], [4, 'l = 4']], value: 3 });
    sim.out('r', 'Resonancia: energía <i>E</i><sub>r</sub> (δ<sub>l</sub> = π/2) · anchura Γ = 2/(dδ/d<i>E</i>) en <i>E</i><sub>r</sub> · vida media τ = ħ/Γ', { hl: true });
    sim.out('s', 'Sección eficaz de la onda parcial en el pico σ<sub>l</sub> = 4π(2<i>l</i> + 1)/<i>k</i>² (límite unitario) · altura de la barrera centrífuga l(l + 1)/2R²');
    sim.out('t', 'Retardo de Wigner máximo τ<sub>W</sub> = 2 dδ/d<i>E</i> (tiempo extra que la partícula pasa dentro del potencial)');
    const cache = {};
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, l = Math.round(sim.p.l), V0 = sim.p.V0, key = l + '|' + V0.toFixed(3), Rr = 1, Vf = (r) => -V0 / (1 + Math.exp((r - Rr) / 0.05));
      if (!cache[key]) { const ks = Array.from({ length: 450 }, (_, i) => 0.01 + 0.0069 * i), ds = ks.map((k) => S3.delta(l, k, Vf, 6, 0.004)); cache[key] = { ks, ds }; }
      const { ks, ds } = cache[key]; EM.draw.clear(cv);
      const Es = ks.map((k) => (k * k) / 2), sg = ks.map((k, i) => ((4 * PI * (2 * l + 1)) / (k * k)) * Math.sin(ds[i]) ** 2);
      /* δ continuo creciente (sin saltos de π hacia atrás) */
      const dc = [ds[0]]; for (let i = 1; i < ds.length; i++) { let d = ds[i]; d += PI * Math.round((dc[i - 1] - d) / PI); dc.push(d); }
      /* resonancia: máxima pendiente dδ/dE */
      let imax = 1, smax = -1e9; for (let i = 1; i < dc.length - 1; i++) { const s = (dc[i + 1] - dc[i - 1]) / (Es[i + 1] - Es[i - 1]); if (s > smax) { smax = s; imax = i; } }
      /* refinamiento en torno al máximo de la pendiente (malla fina de k) */
      { const kc = ks[imax], kf = Array.from({ length: 201 }, (_, i) => kc - 0.04 + 0.0004 * i), df = kf.map((k) => S3.delta(l, k, Vf, 6, 0.004)); for (let i = 1; i < df.length; i++) df[i] += PI * Math.round((df[i - 1] - df[i]) / PI); let jm = 1, sm = -1e9; for (let i = 1; i < df.length - 1; i++) { const sl = (df[i + 1] - df[i - 1]) / ((kf[i + 1] ** 2 - kf[i - 1] ** 2) / 2); if (sl > sm) { sm = sl; jm = i; } } smax = sm; Es[imax] = (kf[jm] ** 2) / 2; }
      const Er = Es[imax], Gam = 2 / smax, sPeak = (4 * PI * (2 * l + 1)) / (2 * Er), bw = (E) => sPeak * ((Gam / 2) ** 2) / ((E - Er) ** 2 + (Gam / 2) ** 2);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: Es[Es.length - 1], ymin: Math.min(0, ...dc) - 0.1, ymax: Math.max(...dc) + 0.3, xlabel: 'E', ylabel: 'δ_l (rad)', ml: 50, mr: 8, title: 'Desplazamiento de fase: sube π en la resonancia' });
      pl.frame(); pl.hline(PI / 2, { color: '--ink-3', dash: [3, 4] }); pl.hline(PI, { color: '--ink-3', dash: [3, 4] }); pl.xy(Es, dc, { color: '--accent', width: 2.4 }); pl.dot(Er, dc[imax], { color: '--c3', r: 6 });
      const q = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0, xmax: Es[Es.length - 1], ymin: 0, ymax: Math.max(...sg) * 1.1 + 1e-9, xlabel: 'E', ylabel: 'σ_l', ml: 50, mr: 8, title: 'Pico de Breit–Wigner (σ_l frente a E)' });
      q.frame(); q.xy(Es, sg, { color: '--accent', width: 2.2 }); q.xy(Es, Es.map(bw), { color: '--c2', width: 1.5, dash: [5, 3] }); q.legend([{ label: 'exacta (Numerov)', color: '--accent' }, { label: 'Breit–Wigner', color: '--c2', dash: [5, 3] }], 'tr');
      sim.set('r', `${EM.fix(Er, 4)} · Γ = ${EM.fix(Gam, 4)} · τ = ${EM.fix(1 / Gam, 3)}`);
      sim.set('s', `${EM.fix(sPeak, 3)} (máx. calculada ${EM.fix(Math.max(...sg), 3)}) · ${EM.fix((l * (l + 1)) / (2 * Rr * Rr), 3)}`);
      sim.set('t', `${EM.fix(2 * smax, 3)}`);
    });
  });

  /* 26.3 Teorema de Levinson */
  EM.defineSim('levinson', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('K', { label: 'Profundidad K₀a del pozo esférico (l = 0)', min: 0.2, max: 14, step: 0.01, value: 5, fmt: (v) => EM.fix(v, 3) });
    sim.out('n', 'Estados ligados N = ⌊K₀a/π + ½⌋ · δ₀(0) / π (teorema de Levinson: δ₀(0) − δ₀(∞) = Nπ)', { hl: true });
    sim.out('t', 'Retardo de Wigner τ<sub>W</sub> = 2 dδ₀/d<i>E</i> en <i>k</i>a ≈ 0.5 (negativo = la partícula sale antes de lo esperado, como en un pozo sin resonancia) y el <i>k</i> usado');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, K0a = sim.p.K, V0 = (K0a * K0a) / 2, ks = Array.from({ length: 3600 }, (_, i) => 1000 * Math.pow(0.004 / 1000, i / 3599));
      EM.draw.clear(cv);
      const ds = S3.unwrap(ks.map((k) => S3.wellDelta(0, k, V0, 1))), kk = ks.slice().reverse(), dd = ds.slice().reverse();
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.54, h: H, xmin: 0, xmax: 12, ymin: -0.3, ymax: Math.max(PI * 4.7, Math.max(...dd) + 0.3), xlabel: 'k a', ylabel: 'δ₀ (rad)', ml: 50, mr: 8, title: 'δ₀(k) continuo: empieza en Nπ y baja a 0' });
      pl.frame(); for (let n = 1; n <= 4; n++) pl.hline(n * PI, { color: '--ink-3', dash: [3, 4], label: n + 'π', labelRight: true }); pl.xy(kk, dd, { color: '--accent', width: 2.4 });
      const q = new EM.Plot(ctx, { x: W * 0.56, y: 0, w: W * 0.44, h: H, xmin: 0, xmax: 12, ymin: -2, ymax: 6, xlabel: 'k a', ylabel: 'τ_W = 2 dδ/dE', ml: 44, mr: 8, title: 'Retardo de Wigner' });
      q.frame(); q.hline(0, { color: '--axis' }); const tw = kk.map((k, i) => (i === 0 || i === kk.length - 1 ? 0 : ((dd[i + 1] - dd[i - 1]) / (kk[i + 1] - kk[i - 1])) * 2 / k)); q.xy(kk, tw.map((v) => Math.max(-2, Math.min(6, v))), { color: '--c2', width: 2 });
      let imx = kk.reduce((b, k, n) => (Math.abs(k - 0.5) < Math.abs(kk[b] - 0.5) ? n : b), 0);
      sim.set('n', `${Math.floor(K0a / PI + 0.5)} · ${EM.fix(dd[0] / PI, 3)} (δ₀(k = 0.004)/π)`);
      sim.set('t', `${EM.fix(tw[imx], 3)} · k = ${EM.fix(kk[imx], 3)}`);
    });
  });
})();
