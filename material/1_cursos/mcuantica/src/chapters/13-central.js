/* Capítulo 13 — Potenciales centrales (ħ = m = 1 en las simulaciones, salvo indicación) */
(function () {
  'use strict';
  const EM = window.EM, CN = EM.qm.cen, PI = Math.PI;
  const LET = 'spdfghik';

  /* 13.1 Ecuación radial: potencial efectivo y estados */
  const POTS = {
    ho: ['Oscilador isótropo  V = r²/2', (r) => 0.5 * r * r, 9, 3.2],
    caja: ['Pozo esférico infinito  (radio a = 1)', () => 0, 1, 1],
    pozo: ['Pozo esférico finito  V₀ = 30, a = 1', (r) => (r < 1 ? -30 : 0), 8, 1],
    cou: ['Coulomb  V = −1/r', (r) => -1 / r, 50, 8]
  };
  EM.defineSim('radial', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('v', { label: 'Potencial central V(r)', options: Object.entries(POTS).map(([k, v]) => [k, v[0]]), value: 'ho' });
    sim.slider('l', { label: 'Número cuántico orbital l', min: 0, max: 5, step: 1, value: 1, fmt: (v) => v.toFixed(0) + ' (' + LET[Math.round(v)] + ')' });
    sim.slider('k', { label: 'Estado radial: n_r (número de nodos radiales)', min: 0, max: 3, step: 1, value: 0, fmt: (v) => v.toFixed(0) });
    sim.out('E', 'Energías de los 4 primeros estados con este <i>l</i> (numéricas, diferencias finitas)', { hl: true });
    sim.out('X', 'Valores exactos (HO: 2<i>n</i><sub>r</sub> + <i>l</i> + 3/2; caja: ξ²/2 con ceros de <i>j</i><sub>l</sub>; Coulomb: −1/2<i>n</i>²) · error');
    sim.out('d', 'Radio más probable de este estado · nodos de <i>u</i>(<i>r</i>) · barrera centrífuga <i>l</i>(<i>l</i> + 1)/2<i>r</i>² en <i>r</i> = 1');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [nm, V, R, xr] = POTS[p.v], l = Math.round(p.l), kk = Math.min(Math.round(p.k), 3), N = p.v === 'cou' ? 2500 : 1500;
      EM.draw.clear(cv);
      const res = CN.radial(V, l, R, N, 4), E = Array.from(res.E), u = res.psi[kk], x = res.x;
      const Veff = (r) => V(r) + (l * (l + 1)) / (2 * r * r), emin = Math.min(...E, p.v === 'cou' ? -0.6 : -1), emax = p.v === 'pozo' ? 4 : p.v === 'caja' ? 120 : p.v === 'cou' ? 0.15 : 14;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.58, h: cv.h, xmin: 0, xmax: xr, ymin: p.v === 'ho' ? 0 : p.v === 'pozo' ? -31 : emin * 1.15, ymax: emax, xlabel: 'r', ylabel: 'energía y V_eff(r)', ml: 52, mr: 8, title: 'Potencial efectivo y niveles' });
      pl.frame();
      if (p.v !== 'caja') pl.fn((r) => Math.min(Veff(Math.max(r, 0.03)), emax * 3), { color: '--ink-2', width: 2, n: 500 }); else pl.xy([0, 0, 1, 1], [emax, 0, 0, emax], { color: '--ink-2', width: 2 });
      E.forEach((e, i) => { if (e < emax) pl.path([[0, e], [xr, e]], { color: i === kk ? '--accent' : '--ink-3', width: i === kk ? 1.8 : 0.9, dash: i === kk ? [] : [3, 4] }); });
      const amp = Math.min(emax, Math.abs(emax - (p.v === 'caja' ? 0 : emin))) * 0.14, um = Math.max(...Array.from(u, Math.abs));
      pl.xy(Array.from(x), Array.from(u, (v) => E[kk] + (amp * v) / um), { color: '--accent', width: 2.4 });
      const pr = new EM.Plot(ctx, { x: cv.w * 0.61, y: 0, w: cv.w * 0.39, h: cv.h, xmin: 0, xmax: xr, ymin: 0, ymax: Math.max(...Array.from(u, (v) => v * v)) * 1.15, xlabel: 'r', ylabel: 'P(r) = |u(r)|²', ml: 40, mr: 8, title: 'Densidad radial' });
      pr.frame(); pr.xy(Array.from(x), Array.from(u, (v) => v * v), { color: '--c1', width: 2.4, fill: '--c1', fillAlpha: 0.15 });
      const ex = (n_) => (p.v === 'ho' ? 2 * n_ + l + 1.5 : p.v === 'caja' ? CN.zero(l, n_ + 1) ** 2 / 2 : p.v === 'cou' ? -1 / (2 * (n_ + l + 1) ** 2) : NaN);
      const exv = p.v === 'pozo' && l === 0 ? CN.well0(30, 1).states.map((s) => s.E - 30 + 30).map((v, i) => v) : null;
      let rm = 0, mu = 0; for (let i = 0; i < x.length; i++) if (u[i] * u[i] > mu) { mu = u[i] * u[i]; rm = x[i]; } let nod = 0; for (let i = 1; i < u.length; i++) if (u[i - 1] * u[i] < 0) nod++;
      sim.set('E', E.map((e) => EM.fix(e, 4)).join(' · '));
      sim.set('X', p.v === 'pozo' ? (l === 0 ? CN.well0(30, 1).states.map((s) => EM.fix(s.E, 4)).join(' · ') + ' (de la ecuación trascendente)' : 'sin fórmula simple: solo numérico') : [0, 1, 2, 3].map((n_) => EM.fix(ex(n_), 4)).join(' · ') + ' · ' + EM.sci(Math.abs(E[kk] - ex(kk)), 2));
      sim.set('d', `${EM.fix(rm, 3)} · ${nod} · ${EM.fix((l * (l + 1)) / 2, 3)}`);
    });
  });

  /* 13.2 Ondas parciales: e^{ikz} = Σ i^l (2l+1) j_l(kr) P_l(cos θ) */
  EM.defineSim('parciales', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('kr', { label: 'Distancia kr (en la dirección θ = 0)', min: 0.2, max: 30, step: 0.1, value: 10, fmt: (v) => EM.fix(v, 1) });
    sim.slider('L', { label: 'Ondas parciales incluidas: l = 0 … L', min: 0, max: 40, step: 1, value: 10, fmt: (v) => v.toFixed(0) });
    sim.out('e', '|Σ<sub>l≤L</sub> (2<i>l</i> + 1) i<sup>l</sup> <i>j</i><sub>l</sub>(<i>kr</i>) − <i>e</i><sup>i<i>kr</i></sup>|: error de truncar a <i>L</i> términos', { hl: true });
    sim.out('c', 'Momento angular clásico a distancia de impacto <i>b</i>: <i>l</i> ≈ <i>kb</i> (las ondas con <i>l</i> &gt; <i>kr</i> casi no llegan a <i>r</i>)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, kr = p.kr, L = Math.round(p.L);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.55, h: cv.h, xmin: 0, xmax: 30, ymin: -1.1, ymax: 1.1, xlabel: 'x = kr', ylabel: 'j_l(x)', ml: 46, mr: 8, title: 'Funciones de Bessel esféricas' });
      pl.frame(); pl.hline(0, { color: '--ink-3', dash: [] }); const cols = ['--c1', '--c2', '--c3', '--c4', '--c5'];
      for (let l = 0; l <= 4; l++) pl.fn((x) => CN.jl(l, Math.max(x, 1e-6)), { color: cols[l], width: 1.8, n: 600 });
      pl.legend(Array.from({ length: 5 }, (_, l) => ({ label: `j_${l}`, color: cols[l] })), 'tr'); pl.vline(kr, { color: '--ink-2', dash: [3, 3] });
      /* suma parcial en función de L */
      const sums = []; let sr = 0, si = 0; const ipow = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      for (let l = 0; l <= 40; l++) { const t = (2 * l + 1) * CN.jl(l, kr), q = ipow[l % 4]; sr += t * q[0]; si += t * q[1]; sums.push([sr, si]); }
      const err = (n) => Math.hypot(sums[n][0] - Math.cos(kr), sums[n][1] - Math.sin(kr));
      const pe = new EM.Plot(ctx, { x: cv.w * 0.58, y: 0, w: cv.w * 0.42, h: cv.h, xmin: 0, xmax: 40, ymin: 1e-12, ymax: 30, ylog: true, xlabel: 'L (ondas parciales incluidas)', ylabel: 'error de la suma', ml: 48, mr: 8, title: 'Convergencia de la expansión' });
      pe.frame(); pe.xy(Array.from({ length: 41 }, (_, n) => n), Array.from({ length: 41 }, (_, n) => Math.max(err(n), 1e-13)), { color: '--accent', width: 2.4 }); pe.dot(L, Math.max(err(L), 1e-13), { color: '--c2' }); pe.vline(kr, { color: '--ink-3', dash: [3, 3], label: 'L = kr' });
      sim.set('e', EM.sci(err(L), 3));
      sim.set('c', `L necesario para error < 10⁻⁶: ${(() => { for (let n = 0; n <= 40; n++) if (err(n) < 1e-6 && n >= 0) { let ok = true; for (let m = n; m <= 40; m++) if (err(m) > 1e-6) ok = false; if (ok) return n; } return '> 40'; })()} (kr = ${EM.fix(kr, 1)})`);
    });
  });

  /* 13.3 Capas: caja esférica, oscilador y modelo nuclear con espín–órbita */
  const MODEL = { caja: 'Caja esférica infinita (ceros de Bessel)', ho: 'Oscilador isótropo 3D', nuc: 'Oscilador + términos l² y espín–órbita (modelo de capas nuclear)' };
  EM.defineSim('capas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('mod', { label: 'Modelo de potencial', options: Object.entries(MODEL), value: 'nuc' });
    sim.slider('ka', { label: 'κ (intensidad del acoplamiento espín–órbita −2κ l·s) en ħω', min: 0, max: 0.12, step: 0.005, value: 0.05, fmt: (v) => EM.fix(v, 3) });
    sim.slider('mu', { label: 'μ (término −κμ l², aplana el potencial)', min: 0, max: 1, step: 0.05, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.slider('gap', { label: 'Umbral para marcar una capa cerrada: brecha mayor que', min: 0.1, max: 0.8, step: 0.05, value: 0.4, fmt: (v) => EM.fix(v, 2) + ' ħω' });
    sim.out('m', 'Números mágicos (capas cerradas) que resultan con este umbral', { hl: true });
    sim.out('n', 'Estados mostrados: nivel · degeneración · ocupación acumulada (los primeros 15)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx; let lv = [];
      if (p.mod === 'caja') { for (let l = 0; l <= 7; l++) for (let n = 1; n <= 5; n++) lv.push({ E: CN.zero(l, n) ** 2 / 2, name: `${n}${LET[l]}`, g: 2 * (2 * l + 1) }); }
      else if (p.mod === 'ho') { for (let N = 0; N <= 7; N++) for (let l = N; l >= 0; l -= 2) lv.push({ E: N + 1.5, name: `${(N - l) / 2 + 1}${LET[l]}`, g: 2 * (2 * l + 1), N }); }
      else { for (let N = 0; N <= 7; N++) { const m2 = (N * (N + 3)) / 2; for (let l = N; l >= 0; l -= 2) for (const j2 of l > 0 ? [2 * l + 1, 2 * l - 1] : [1]) { const ls = j2 === 2 * l + 1 ? l / 2 : -(l + 1) / 2; lv.push({ E: N + 1.5 - 2 * p.ka * ls - p.ka * p.mu * (l * (l + 1) - m2), name: `${(N - l) / 2 + 1}${LET[l]}${j2}/2`, g: j2 + 1, N }); } } }
      lv.sort((a, b) => a.E - b.E); lv = lv.slice(0, 44);
      EM.draw.clear(cv);
      const E0 = lv[0].E, E1 = lv[lv.length - 1].E; let cum = 0; const mags = [];
      lv.forEach((q, i) => { cum += q.g; q.cum = cum; q.gap = i + 1 < lv.length ? lv[i + 1].E - q.E : 0; });
      const unit = p.mod === 'caja' ? (lv[lv.length - 1].E - lv[0].E) / 40 : 1; const thr = p.gap * unit; lv.forEach((q) => { if (q.gap > thr && q.cum >= 2) mags.push(q.cum); });
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.66, h: cv.h, xmin: 0, xmax: 1, ymin: E0 - 0.4 * unit, ymax: E1 + 0.4 * unit, xlabel: '', ylabel: p.mod === 'caja' ? 'energía (ħ²/2ma² × ½...)' : 'energía (en ħω)', ml: 52, mr: 6, title: 'Niveles (rótulo: nivel, ocupación acumulada)' });
      pl.frame();
      lv.forEach((q, i) => { const x0 = 0.05 + 0.22 * (i % 4), isMag = mags.includes(q.cum); pl.path([[x0, q.E], [x0 + 0.17, q.E]], { color: isMag ? '--accent' : '--ink-2', width: isMag ? 3 : 1.6 }); if (i < 44) pl.label(x0 + 0.17, q.E, `${q.name} (${q.cum})`, { size: 9.5, dx: 2, dy: 3, color: isMag ? '--accent' : '--ink-3', halo: true }); });
      const pp = new EM.Plot(ctx, { x: cv.w * 0.69, y: 0, w: cv.w * 0.31, h: cv.h, xmin: 0, xmax: 130, ymin: 0, ymax: Math.max(...lv.map((q) => q.gap)) * 1.2 + 0.01, xlabel: 'ocupación acumulada', ylabel: 'brecha al nivel siguiente', ml: 40, mr: 8, title: 'Brechas' });
      pp.frame(); lv.forEach((q) => pp.path([[q.cum, 0], [q.cum, q.gap]], { color: q.gap > thr && q.cum >= 2 ? '--accent' : '--ink-3', width: 4 })); pp.hline(thr, { color: '--c2', dash: [4, 3] });
      sim.set('m', mags.length ? mags.join(', ') : '— (ninguna brecha supera el umbral)');
      sim.set('n', lv.slice(0, 15).map((q) => `${q.name}·${q.g}·${q.cum}`).join('  '));
    });
  });
})();
