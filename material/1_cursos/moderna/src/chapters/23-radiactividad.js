/* Capítulo 23 — Radiactividad */
(function () {
  'use strict';
  const EM = window.EM, D = EM.fm.dec, N = EM.fm.nuc, YR = D.YEAR;

  /* 23.1 Ley exponencial y fluctuaciones de Poisson */
  EM.defineSim('desintegracion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('N0', { label: 'Número inicial de núcleos N₀', min: 1, max: 6, step: 0.05, value: 2, fmt: (v) => '10^' + EM.fix(v, 2) });
    sim.slider('runs', { label: 'Número de experimentos superpuestos', min: 1, max: 8, step: 1, value: 4, fmt: (v) => v.toFixed(0) });
    sim.out('r', 'Ley: N(t) = N₀e^{−λt} · en t = T½: N₀/2 · en t = τ = T½/ln 2: N₀/e', { hl: true });
    sim.out('s', 'Fluctuación en t = T½: desviación típica √(N₀p(1 − p)) = √(N₀)/2 · relativa 1/√N');
    sim.out('a', 'Ejemplo: 1 g de ²²⁶Ra (T½ = 1600 a): actividad 3.66×10¹⁰ Bq ≈ 1 Ci');
    let seedBase = 1;
    sim.button('Repetir el experimento', () => { seedBase += 17; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, N0 = Math.round(Math.pow(10, p.N0)), steps = 60, dt = 4 / steps; // tiempo en T½
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 0, xmax: 4, ymin: 0, ymax: N0 * 1.05, xlabel: 't/T½', ylabel: 'núcleos sin desintegrar N', ml: 62, mr: 8, title: 'Desintegración de N₀ núcleos (Monte Carlo)' });
      pl.frame(); const ts = [...Array(steps + 1).keys()].map((i) => i * dt);
      for (let r = 0; r < p.runs; r++) { const tr = D.mcDecay(N0, Math.LN2, dt, steps, seedBase + r * 101); pl.xy(ts, tr, { color: '--c1', width: 1.4 }); }
      pl.fn((t) => N0 * Math.exp(-Math.LN2 * t), { color: '--accent', width: 3, n: 200 });
      const pr = new EM.Plot(ctx, { x: W * 0.62, y: 0, w: W * 0.38, h: H, xmin: 0, xmax: 4, ymin: 0, ymax: 0.3, xlabel: 't/T½', ylabel: 'fluctuación relativa σ/N', ml: 54, mr: 8, title: 'Ruido de la cuenta' });
      pr.frame(); pr.fn((t) => { const q = Math.exp(-Math.LN2 * t); return Math.min(0.3, Math.sqrt((1 - q) / (N0 * q))); }, { color: '--c3', width: 2.6, n: 200 });
      sim.set('r', `${EM.sci(N0, 3)} → ${EM.sci(N0 / 2, 3)} → ${EM.sci(N0 / Math.E, 3)} (en τ = ${EM.fix(1 / Math.LN2, 4)} T½)`);
      sim.set('s', `${EM.fix(Math.sqrt(N0) / 2, 2)} núcleos · ${EM.fix(100 / Math.sqrt(N0 / 2), 2)} %`);
      sim.set('a', `${EM.sci(D.activity(D.atoms(1, 226.0254), D.lambda(1600 * YR)), 3)} Bq`);
    });
  });

  /* 23.2 Cadenas de Bateman */
  const CH = {
    mo: ['⁹⁹Mo → ⁹⁹ᵐTc (generador médico)', [['⁹⁹Mo', 65.94 * 3600], ['⁹⁹ᵐTc', 6.0067 * 3600]], 3600, 'h'],
    ra: ['²²⁶Ra → ²²²Rn (equilibrio secular)', [['²²⁶Ra', 1600 * YR], ['²²²Rn', 3.8235 * 86400]], 86400, 'd'],
    rn: ['²²²Rn → ²¹⁸Po → ²¹⁴Pb → ²¹⁴Bi (4 miembros)', [['²²²Rn', 3.8235 * 86400], ['²¹⁸Po', 3.098 * 60], ['²¹⁴Pb', 26.8 * 60], ['²¹⁴Bi', 19.9 * 60]], 3600, 'h'],
  };
  EM.defineSim('cadena', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('c', { label: 'Cadena radiactiva', options: Object.entries(CH).map(([k, v]) => [k, v[0]]), value: 'mo' });
    sim.slider('T', { label: 'Tiempo total mostrado', min: 1, max: 400, step: 1, value: 120, fmt: (v) => v.toFixed(0) });
    sim.check('log', { label: 'Escala logarítmica de actividad', value: false });
    sim.out('t', 'Instante de máxima población del 2.º miembro t = ln(λ₂/λ₁)/(λ₂ − λ₁) · razón de actividades A₂/A₁ en equilibrio', { hl: true });
    sim.out('e', 'Tipo de equilibrio');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, mem, unit, un] = CH[p.c], lams = mem.map((q) => Math.LN2 / q[1]), n = mem.length, Tmax = p.T * unit, lg = p.log;
      EM.draw.clear(cv);
      const ts = [...Array(301).keys()].map((i) => (Tmax * i) / 300), cols = ['--c1', '--c2', '--c3', '--c4'];
      const act = (k, t) => lams[k] * D.bateman(lams.slice(0, k + 1), 1, t, k + 1) / lams[0];
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: p.T, ymin: lg ? 1e-4 : 0, ymax: lg ? 3 : 1.15, ylog: !!lg, xlabel: `tiempo (${un})`, ylabel: 'actividad relativa A_i/A₁(0)', ml: 62, mr: 10, title: 'Actividades de los miembros de la cadena (ecuaciones de Bateman)' });
      pl.frame();
      for (let k = 0; k < n; k++) pl.xy(ts.map((t) => t / unit), ts.map((t) => Math.max(act(k, t), lg ? 1e-9 : 0)), { color: cols[k], width: 2.8 });
      pl.legend(mem.map((q, k) => ({ label: q[0], color: cols[k] })), 'tr');
      const l1 = lams[0], l2 = lams[1];
      sim.set('t', l2 > l1 ? `${EM.fix(D.batemanTmax(l1, l2) / unit, 3)} ${un} · ${EM.fix(D.transientRatio(l1, l2), 4)}` : '—');
      sim.set('e', l2 / l1 > 1000 ? 'equilibrio secular (T½ del padre ≫ T½ del hijo): A₂ → A₁' : l2 > l1 ? 'equilibrio transitorio (T½ del padre > T½ del hijo): A₂ → [λ₂/(λ₂ − λ₁)]A₁' : 'sin equilibrio (padre de vida más corta)');
    });
  });

  /* 23.3 Desintegración alfa */
  const ALF = { Po212: ['²¹²Po', 84, 212, 0.299e-6], Po210: ['²¹⁰Po', 84, 210, 138.376 * 86400], Ra226: ['²²⁶Ra', 88, 226, 1600 * YR], U234: ['²³⁴U', 92, 234, 2.455e5 * YR], U238: ['²³⁸U', 92, 238, 4.468e9 * YR], Th232: ['²³²Th', 90, 232, 1.405e10 * YR] };
  const fmtT = (t) => { if (t < 1e-3) return EM.sci(t, 2) + ' s'; if (t < 3600 * 48) return EM.sci(t, 2) + ' s'; if (t < 86400 * 365) return EM.fix(t / 86400, 1) + ' d'; return EM.sci(t / YR, 2) + ' años'; };
  EM.defineSim('alfa', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('n', { label: 'Núcleo emisor α', options: Object.entries(ALF).map(([k, v]) => [k, v[0]]), value: 'U238' });
    sim.out('Q', 'Energía de la desintegración Q = [M(Z,A) − M(Z − 2,A − 4) − M(⁴He)]c² (MeV) · altura de la barrera de Coulomb en r = R', { hl: true });
    sim.out('g', 'Puntos de retorno R y b = 2(Z − 2)e²/4πε₀Q (fm) · exponente de Gamow 2G');
    sim.out('t', 'Semivida de Gamow (con ν₀ = v/2R) · semivida medida · razón');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, Z, A, T] = ALF[p.n], Q = D.Qalpha(Z, A), r = D.alphaHalfLife(Z, A, Q);
      EM.draw.clear(cv);
      const rmax = r.b * 1.5, pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.68, h: H, xmin: 0, xmax: rmax, ymin: -40, ymax: r.barrier * 1.25, xlabel: 'distancia entre el α y el núcleo hijo r (fm)', ylabel: 'energía potencial (MeV)', ml: 56, mr: 8, title: 'Barrera de Coulomb y efecto túnel' });
      pl.frame(); pl.xy([0, r.R], [-35, -35], { color: '--c2', width: 3 }); pl.xy([r.R, r.R], [-35, r.barrier], { color: '--c2', width: 2 });
      pl.fn((x) => (x >= r.R ? D.coulombBarrier(2, Z - 2, x) : NaN), { color: '--c2', width: 3, n: 300 });
      pl.hline(Q, { color: '--c3', dash: [], label: `Q = ${EM.fix(Q, 3)} MeV` }); pl.band ? pl.band(r.R, r.b, { color: '--c3', alpha: 0.12 }) : 0; pl.vline(r.R, { color: '--ink-3', dash: [3, 3], label: 'R' }); pl.vline(r.b, { color: '--ink-3', dash: [3, 3], label: 'b' });
      // barra de comparación de semividades (escala logarítmica de 10⁻⁷ s a 10¹⁸ s)
      const bx = W * 0.72, bw = W * 0.26, by = H * 0.14, bh = H * 0.7, lo = -8, hi = 18, ypos = (lg) => by + bh * (1 - (lg - lo) / (hi - lo));
      ctx.save(); ctx.strokeStyle = EM.alpha('--ink', 0.45); ctx.strokeRect(bx, by, bw, bh); ctx.restore();
      for (let e = -6; e <= 18; e += 4) EM.text(ctx, '10^' + e + ' s', bx - 4, ypos(e) + 4, { size: 10, align: 'right', color: '--ink-3' });
      const lm = Math.log10(T), lg = Math.log10(r.T12);
      ctx.save(); ctx.fillStyle = EM.alpha('--c1', 0.9); ctx.fillRect(bx + bw * 0.12, ypos(lm) - 4, bw * 0.3, 8); ctx.fillStyle = EM.alpha('--c3', 0.9); ctx.fillRect(bx + bw * 0.58, ypos(lg) - 4, bw * 0.3, 8); ctx.restore();
      EM.text(ctx, 'medida', bx + bw * 0.27, by - 8, { size: 10.5, align: 'center', color: '--c1' }); EM.text(ctx, 'Gamow', bx + bw * 0.73, by - 8, { size: 10.5, align: 'center', color: '--c3' });
      sim.set('Q', `${EM.fix(Q, 3)} MeV · ${EM.fix(r.barrier, 2)} MeV`);
      sim.set('g', `${EM.fix(r.R, 2)} fm y ${EM.fix(r.b, 2)} fm · ${EM.fix(r.G2, 2)}`);
      sim.set('t', `${fmtT(r.T12)} · ${fmtT(T)} · ${EM.sci(r.T12 / T, 2)}`);
    });
  });

  /* 23.4 Espectro beta */
  const BET = { H3: ['³H → ³He (β⁻)', 2, 0.01859, -1, 5.69], C14: ['¹⁴C → ¹⁴N (β⁻)', 7, 0.1565, -1, 49.5], S35: ['³⁵S → ³⁵Cl (β⁻)', 17, 0.1673, -1, 48.8], P32: ['³²P → ³²S (β⁻)', 16, 1.7107, -1, 695], Na22: ['²²Na → ²²Ne* (β⁺, 90 %, nivel de 1.2745 MeV)', 10, 0.5468, 1, 215] };
  EM.defineSim('beta', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('n', { label: 'Núcleo emisor β', options: Object.entries(BET).map(([k, v]) => [k, v[0]]), value: 'C14' });
    sim.check('F', { label: 'Incluir la función de Fermi (atracción o repulsión de Coulomb)', value: true });
    sim.out('Q', 'Energía máxima Q (calculada con masas atómicas, MeV) · energía media ⟨T⟩ · ⟨T⟩/Q', { hl: true });
    sim.out('m', 'El neutrino se lleva el resto (Q − T): el espectro continuo exigió su existencia (Pauli, 1930)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, Zd, Q0, sg, lit] = BET[p.n], Q = p.n === 'H3' ? D.Qbeta(1, 3) : p.n === 'C14' ? D.Qbeta(6, 14) : p.n === 'S35' ? D.Qbeta(16, 35) : p.n === 'P32' ? D.Qbeta(15, 32) : D.Qbeta_plus(11, 22) - 1.2745;
      EM.draw.clear(cv);
      const withF = D.betaSpectrum(p.F ? Zd : 0, Q, sg, 300), mx = Math.max(...withF.map((q) => q.S)), nof = D.betaSpectrum(0, Q, sg, 300), mx0 = Math.max(...nof.map((q) => q.S));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: Q * 1000, ymin: 0, ymax: 1.1, xlabel: 'energía cinética de la partícula β (keV)', ylabel: 'intensidad relativa', ml: 56, mr: 10, title: 'Espectro β continuo' });
      pl.frame(); pl.xy(withF.map((q) => q.T * 1000), withF.map((q) => q.S / mx), { color: '--accent', width: 3, fill: '--accent', fillAlpha: 0.14 });
      if (p.F) pl.xy(nof.map((q) => q.T * 1000), nof.map((q) => q.S / mx), { color: '--ink-3', width: 1.6, dash: [4, 3] });
      const mean = D.betaMean(p.F ? Zd : 0, Q, sg); pl.vline(mean * 1000, { color: '--c3', dash: [4, 3], label: '⟨T⟩' });
      pl.legend([{ label: p.F ? 'con función de Fermi' : 'sin función de Fermi', color: '--accent' }].concat(p.F ? [{ label: 'sin función de Fermi (forma pura)', color: '--ink-3' }] : []), 'tr');
      sim.set('Q', `${EM.fix(Q, 4)} MeV · ${EM.fix(mean * 1000, 2)} keV · ${EM.fix(mean / Q, 3)}`);
      sim.set('m', `valor de la literatura para ⟨T⟩: ${lit} keV${sg > 0 ? ' · β⁺: la repulsión de Coulomb empuja el espectro hacia energías mayores' : ''}`);
    });
  });
})();
