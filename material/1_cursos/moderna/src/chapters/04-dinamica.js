/* Capítulo 4 — Momento, energía y E = mc² */
(function () {
  'use strict';
  const EM = window.EM, R = EM.fm.rel, K = EM.qm.K, c = K.c, M = R.MASS;
  const PART = { e: ['Electrón', M.e], mu: ['Muón', M.mu], p: ['Protón', M.p] };

  /* 4.1 Energía cinética, momento y energía total */
  EM.defineSim('energia', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('part', { label: 'Partícula', options: Object.entries(PART).map(([k, v]) => [k, `${v[0]} (${EM.fix(v[1], 4)} MeV/c²)`]), value: 'e' });
    sim.slider('x', { label: 'Energía cinética K en unidades de mc²', min: 0.001, max: 1000, step: 0.001, value: 1.957, log: true, fmt: (v) => EM.sci(v, 3) });
    sim.out('g', 'γ = 1 + K/mc² · β', { hl: true });
    sim.out('E', 'Energía total E = γmc² · energía en reposo mc²');
    sim.out('p', 'Momento pc = √(K(K + 2mc²)) · clásico √(2mK)');
    sim.out('vc', 'Velocidad que daría la fórmula clásica ½mv² = K: v/c');
    sim.out('err', 'Error de la fórmula clásica ½mv² respecto de K, con la velocidad verdadera');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, m = PART[p.part][1], Kk = p.x * m, g = 1 + p.x, b = R.betaFromK(Kk, m);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 1e-3, xmax: 1e3, xlog: true, ymin: 0, ymax: 3, xlabel: 'energía cinética K/mc²', ylabel: 'velocidad v/c', ml: 50, mr: 8, title: 'Velocidad frente a energía cinética' });
      pl.frame();
      pl.hline(1, { color: '--c3', label: 'c', width: 1.6, dash: [] });
      pl.fn((x) => R.betaFromK(x, 1), { color: '--accent', width: 3, n: 300 });
      pl.fn((x) => Math.sqrt(2 * x), { color: '--c2', width: 2.2, dash: [6, 4], n: 300 });
      pl.dot(p.x, b, { color: '--accent', r: 5.5 });
      pl.legend([{ label: 'relativista', color: '--accent' }, { label: 'clásica √(2K/m)', color: '--c2', dash: [6, 4] }], 'tl');
      /* Triángulo E² = (pc)² + (mc²)² */
      const pr = new EM.Plot(ctx, { x: W * 0.53, y: 0, w: W * 0.47, h: H, xmin: 0, xmax: Math.max(1.2, Math.min(40, g * 1.25)), ymin: 0, ymax: Math.max(1.2, Math.min(40, g * 1.25)), xlabel: 'mc²  (unidades de mc²)', ylabel: 'pc (unidades de mc²)', ml: 50, mr: 8, title: 'Triángulo energía–momento' });
      pr.frame();
      const pc = Math.sqrt(g * g - 1);
      pr.path([[0, 0], [1, 0], [1, pc], [0, 0]], { color: '--accent', width: 2.8 });
      pr.path([[0, 0], [1, pc]], { color: '--c3', width: 2.8 });
      pr.label(0.5, 0, 'mc² = 1', { dy: 14, align: 'center', color: '--ink-2' }); pr.label(1, pc / 2, `pc = ${EM.sci(pc, 3)}`, { dx: 8, align: 'left', color: '--ink-2' }); pr.label(0.45, pc / 2, `E = ${EM.sci(g, 3)}`, { dx: -4, dy: -6, align: 'right', color: '--c3' });
      const clsP = Math.sqrt(2 * Kk * m), vc = R.classicalV(Kk, m);
      sim.set('g', `${EM.sci(g, 5)} · ${EM.fix(b, b > 0.999 ? 8 : 6)}`);
      sim.set('E', `${EM.sci(g * m, 5)} MeV · ${EM.fix(m, 4)} MeV`);
      sim.set('p', `${EM.sci(R.momentumFromK(Kk, m), 5)} MeV/c · ${EM.sci(clsP, 5)} MeV/c`);
      sim.set('vc', `${EM.sci(vc, 4)} c${vc > 1 ? ' (¡superaría a la luz!)' : ''}`);
      sim.set('err', `${EM.fix((R.classicalK(m, b) / Kk - 1) * 100, 2)} %`);
    });
  });

  /* 4.2 Energía de umbral: blanco fijo frente a colisionador */
  const RX = {
    pbar: ['p + p → p + p + p + p̄ (antiprotón)', M.p, M.p, 4 * M.p], pi0: ['p + p → p + p + π⁰', M.p, M.p, 2 * M.p + M.pi0],
    mumu: ['e⁻ + e⁺ → μ⁻ + μ⁺', M.e, M.e, 2 * M.mu], tau: ['e⁻ + e⁺ → τ⁻ + τ⁺', M.e, M.e, 2 * M.tau], Z: ['e⁻ + e⁺ → Z⁰', M.e, M.e, M.Z]
  };
  EM.defineSim('umbral', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('rx', { label: 'Reacción', options: Object.entries(RX).map(([k, v]) => [k, v[0]]), value: 'pbar' });
    sim.slider('f', { label: 'Energía cinética del haz en unidades de la de umbral K/K_u (blanco fijo)', min: 0.1, max: 1e4, step: 0.01, value: 1.5, log: true, fmt: (v) => EM.sci(v, 3) });
    sim.out('Ku', 'Umbral en blanco fijo: energía cinética K_u (el proyectil)', { hl: true });
    sim.out('Kc', 'Colisionador simétrico: energía de cada haz en el umbral (E = Mf c²/2) · cociente');
    sim.out('s', 'Con la energía elegida: √s disponible · ¿se puede producir?');
    sim.out('x', 'Energía del haz de blanco fijo equivalente a un colisionador de haces E = Mf: cociente');
    const fmtE = (MeV) => (MeV >= 1e6 ? EM.sci(MeV / 1e6, 4) + ' TeV' : MeV >= 1e3 ? EM.sci(MeV / 1e3, 4) + ' GeV' : EM.sci(MeV, 4) + ' MeV');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, m1, m2, Mf] = RX[p.rx], Ku = R.thresholdFixedK(m1, m2, Mf), Kb = p.f * Ku;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0.1, xmax: 1e4, xlog: true, ymin: 0.1, ymax: 1e3, ylog: true, xlabel: 'K / K_umbral (blanco fijo)', ylabel: '√s / Mf (energía disponible)', ml: 54, mr: 8, title: 'Energía disponible en el centro de masas' });
      pl.frame();
      const ss = (f) => R.sqrtsFixed(m1, m1 + f * Ku, m2) / Mf;
      pl.hline(1, { color: '--c3', label: 'umbral √s = Mf', width: 1.6, dash: [] });
      pl.fn(ss, { color: '--accent', width: 3, n: 300 });
      pl.fn((f) => Math.sqrt(2 * m2 * f * Ku) / Mf, { color: '--c2', width: 1.8, dash: [5, 4], n: 300 });
      pl.dot(p.f, ss(p.f), { color: '--accent', r: 5.5 });
      pl.legend([{ label: 'exacto', color: '--accent' }, { label: 'ultrarrelativista √(2m₂E)', color: '--c2', dash: [5, 4] }], 'tl');
      /* Derecha: energía del haz necesaria para alcanzar √s = M */
      const pr = new EM.Plot(ctx, { x: W * 0.53, y: 0, w: W * 0.47, h: H, xmin: 1, xmax: 2e5, xlog: true, ymin: 1, ymax: 1e11, ylog: true, xlabel: 'masa a producir M (MeV/c²)', ylabel: 'energía total del haz (MeV)', ml: 54, mr: 8, title: 'Blanco fijo frente a colisionador' });
      pr.frame();
      pr.fn((Mm) => (Mm * Mm - 2 * m2 * m2) / (2 * m2), { color: '--c2', width: 2.4, from: 2 * m2, n: 200 });
      pr.fn((Mm) => Mm / 2, { color: '--accent', width: 2.4, n: 200 });
      pr.dot(Mf, (Mf * Mf - 2 * m2 * m2) / (2 * m2), { color: '--c2', r: 4.5 }); pr.dot(Mf, Mf / 2, { color: '--accent', r: 4.5 });
      pr.legend([{ label: 'blanco fijo ∝ M²', color: '--c2' }, { label: 'colisionador ∝ M', color: '--accent' }], 'tl');
      const sv = R.sqrtsFixed(m1, m1 + Kb, m2), E1c = Mf / 2;
      sim.set('Ku', fmtE(Ku));
      sim.set('Kc', `${fmtE(E1c)} · ${EM.sci((Ku + m1) / E1c, 3)}× menos energía`);
      sim.set('s', `${fmtE(sv)} · ${sv >= Mf * (1 - 1e-12) ? 'sí (√s ≥ Mf)' : 'no: bajo el umbral'}`);
      sim.set('x', `${fmtE((Mf * Mf - 2 * m2 * m2) / (2 * m2))} frente a ${fmtE(E1c)}: ${EM.sci((Mf * Mf - 2 * m2 * m2) / (2 * m2) / E1c, 3)}×`);
    });
  });

  /* 4.3 π⁰ → γγ: espectro plano y ángulo de apertura */
  EM.defineSim('pi0', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('E', { label: 'Energía total del π⁰', min: 135, max: 1e4, step: 1, value: 1000, log: true, unit: 'MeV', fmt: (v) => EM.sci(v, 3) });
    sim.slider('x', { label: 'Dirección del fotón en el reposo del π⁰: cos θ*', min: -1, max: 1, step: 0.01, value: 0.6, fmt: (v) => EM.fix(v, 2) });
    sim.out('g', 'γ del π⁰ · β', { hl: true });
    sim.out('r', 'Energías posibles de los fotones: E_mín … E_máx (distribución plana)');
    sim.out('ph', 'Fotón elegido: E₁ · E₂ · ángulo de apertura θ');
    sim.out('m', 'Masa invariante reconstruida m² = 2E₁E₂(1 − cos θ) · ángulo mínimo 2 arcsen(1/γ)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, m = M.pi0, r = R.pi0Photons(m, p.E);
      EM.draw.clear(cv);
      const E1 = (p.E / 2) * (1 + r.beta * p.x), E2 = p.E - E1, th = 2 * Math.asin(Math.min(1, m / (2 * Math.sqrt(E1 * E2))));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: p.E, ymin: 0, ymax: (1 / (r.Emax - r.Emin)) * 1.8, xlabel: 'energía del fotón (MeV)', ylabel: 'dN/dE (normalizada)', ml: 66, mr: 8, title: 'Espectro de los fotones: plano' });
      pl.frame();
      pl.xy([r.Emin, r.Emin, r.Emax, r.Emax], [0, 1 / (r.Emax - r.Emin), 1 / (r.Emax - r.Emin), 0], { color: '--accent', width: 3, fill: '--accent', fillAlpha: 0.18 });
      pl.vline(p.E / 2, { color: '--c2', label: 'E/2', dash: [4, 3] });
      pl.dot(E1, 1 / (r.Emax - r.Emin), { color: '--c3' }); pl.dot(E2, 1 / (r.Emax - r.Emin), { color: '--c3' });
      const pr = new EM.Plot(ctx, { x: W * 0.53, y: 0, w: W * 0.47, h: H, xmin: r.Emin * 1.0001, xmax: r.Emax, xlog: true, ymin: 0, ymax: 180, xlabel: 'energía de un fotón E₁ (MeV)', ylabel: 'ángulo de apertura θ (°)', ml: 52, mr: 8, title: 'Ángulo entre los dos fotones' });
      pr.frame();
      pr.fn((e1) => { const s = m / (2 * Math.sqrt(e1 * (p.E - e1))); return s >= 1 ? 180 : (2 * Math.asin(s) * 180) / Math.PI; }, { color: '--accent', width: 3, n: 300 });
      pr.hline((r.thetaMin * 180) / Math.PI, { color: '--c2', label: 'θ mínimo', labelRight: true, dash: [4, 3] });
      pr.dot(E1, (th * 180) / Math.PI, { color: '--c3' });
      sim.set('g', `${EM.fix(r.gamma, 4)} · ${EM.fix(r.beta, 6)}`);
      sim.set('r', `${EM.fix(r.Emin, 3)} … ${EM.fix(r.Emax, 3)} MeV`);
      sim.set('ph', `${EM.fix(E1, 2)} MeV · ${EM.fix(E2, 2)} MeV · ${EM.fix((th * 180) / Math.PI, 3)}°`);
      sim.set('m', `${EM.fix(R.twoPhotonMass(E1, E2, th), 4)} MeV/c² · ${EM.fix((r.thetaMin * 180) / Math.PI, 3)}°`);
    });
  });
})();
