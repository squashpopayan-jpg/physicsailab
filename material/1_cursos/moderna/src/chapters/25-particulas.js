/* Capítulo 25 — Partículas elementales y Modelo Estándar */
(function () {
  'use strict';
  const EM = window.EM, P = EM.fm.pa;

  /* 25.1 Comprobador de leyes de conservación */
  const NM = ['n', 'p', 'e-', 'e+', 'mu-', 'mu+', 'nu_e', '~nu_e', 'nu_mu', '~nu_mu', 'gamma', 'pi+', 'pi-', 'pi0', 'K+', 'K-', 'K0', 'Lambda', 'Sigma+', 'Sigma0', 'Sigma-', 'Xi-', 'Omega-', 'None'];
  const LBL = { n: 'n', p: 'p', 'e-': 'e⁻', 'e+': 'e⁺', 'mu-': 'μ⁻', 'mu+': 'μ⁺', nu_e: 'νₑ', '~nu_e': 'ν̄ₑ', nu_mu: 'ν_μ', '~nu_mu': 'ν̄_μ', gamma: 'γ', 'pi+': 'π⁺', 'pi-': 'π⁻', pi0: 'π⁰', 'K+': 'K⁺', 'K-': 'K⁻', K0: 'K⁰', Lambda: 'Λ', 'Sigma+': 'Σ⁺', Sigma0: 'Σ⁰', 'Sigma-': 'Σ⁻', 'Xi-': 'Ξ⁻', 'Omega-': 'Ω⁻', None: '(ninguna)' };
  const opts = NM.map((k) => [k, LBL[k]]);
  EM.defineSim('conservacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.6 });
    sim.select('a1', { label: 'Partícula inicial 1', options: opts.filter((o) => o[0] !== 'None'), value: 'pi-' });
    sim.select('a2', { label: 'Partícula inicial 2 (opcional)', options: opts, value: 'p' });
    sim.select('b1', { label: 'Final 1', options: opts.filter((o) => o[0] !== 'None'), value: 'K0' });
    sim.select('b2', { label: 'Final 2', options: opts, value: 'Lambda' });
    sim.select('b3', { label: 'Final 3 (opcional)', options: opts, value: 'None' });
    sim.select('mode', { label: 'Interacción', options: [['strong', 'Fuerte / electromagnética (conserva la extrañeza)'], ['weak', 'Débil (la extrañeza puede cambiar)']], value: 'strong' });
    sim.out('r', 'Veredicto', { hl: true });
    sim.out('v', 'Magnitudes que no se conservan');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, ini = [p.a1, p.a2].filter((x) => x !== 'None'), fin = [p.b1, p.b2, p.b3].filter((x) => x !== 'None'), r = P.check(ini, fin);
      EM.draw.clear(cv);
      const names = ['carga (e/3)', 'B (×3)', 'L_e', 'L_μ', 'L_τ', 'extrañeza S'], sum = (l) => l.reduce((s, n) => { const q = P.qn(n); return s.map((x, i) => x + q[i]); }, [0, 0, 0, 0, 0, 0]), a = sum(ini), b = sum(fin), x0 = W * 0.06, cw = (W - 2 * x0) / 7;
      EM.text(ctx, ini.map((n) => LBL[n]).join(' + ') + '  →  ' + fin.map((n) => LBL[n]).join(' + '), W / 2, 26, { size: 18, align: 'center', color: '--ink', weight: 600 });
      const y0 = 58, rh = 30;
      ['', ...names].forEach((t, i) => EM.text(ctx, t, x0 + i * cw + cw / 2, y0, { size: 11.5, align: 'center', color: '--ink-3' }));
      [['antes', a], ['después', b]].forEach(([t, v], k) => { EM.text(ctx, t, x0 + cw / 2, y0 + rh * (k + 1), { size: 12, align: 'center', color: '--ink-2' }); v.forEach((x, i) => EM.text(ctx, String(x), x0 + (i + 1) * cw + cw / 2, y0 + rh * (k + 1), { size: 13, align: 'center', color: '--ink' })); });
      EM.text(ctx, 'estado', x0 + cw / 2, y0 + rh * 3, { size: 12, align: 'center', color: '--ink-2' });
      r.ok.forEach((o, i) => { const bad = !o && !(i === 5 && p.mode === 'weak'); EM.text(ctx, o ? '✓ se conserva' : (i === 5 && p.mode === 'weak' ? '≠ (permitido)' : '✗ violada'), x0 + (i + 1) * cw + cw / 2, y0 + rh * 3, { size: 11.5, align: 'center', color: bad ? '#c92a2a' : o ? '#2b8a3e' : '#e8590c' }); });
      const allowed = p.mode === 'strong' ? r.strongAllowed : r.weakAllowed;
      sim.set('r', allowed ? 'permitida por las leyes de conservación (otra cosa es que la energía alcance)' : 'PROHIBIDA');
      sim.set('v', r.violated.length ? r.violated.join(', ') + (p.mode === 'weak' && r.violated.length === 1 && r.violated[0] === 'extrañeza' ? ' (la interacción débil no la conserva)' : '') : 'ninguna');
    });
  });

  /* 25.2 Hadrones: octete bariónico y decuplete */
  EM.defineSim('decuplete', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.check('pred', { label: 'Mostrar la predicción de Gell-Mann del Ω⁻ por espaciado igual', value: true });
    sim.out('g', 'Gell-Mann–Okubo: (m_N + m_Ξ)/2 · (3m_Λ + m_Σ)/4 (MeV)', { hl: true });
    sim.out('s', 'Espaciados del decuplete Δ → Σ* → Ξ* → Ω⁻ (MeV)');
    sim.out('o', 'Ω⁻: predicción de espaciado igual · masa medida (PDG)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, m = P.decupletMasses(), oct = [[0, P.avg([2212, 2112]), 'N'], [-1, P.get(3122).m, 'Λ'], [-1, P.avg([3222, 3212, 3112]), 'Σ'], [-2, P.avg([3322, 3312]), 'Ξ']], g = P.gmo();
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.7, h: H, xmin: -3.6, xmax: 0.6, ymin: 800, ymax: 1900, xlabel: 'extrañeza S', ylabel: 'masa (MeV/c²)', ml: 62, mr: 8, title: 'Octete (J = ½) y decuplete (J = 3/2) bariónicos con masas del PDG' });
      pl.frame(); const dm = [[0, m[0], 'Δ'], [-1, m[1], 'Σ*'], [-2, m[2], 'Ξ*'], [-3, m[3], 'Ω⁻']];
      pl.xy(dm.map((q) => q[0]), dm.map((q) => q[1]), { color: '--c2', width: 2 }); dm.forEach((q) => { pl.dot(q[0], q[1], { color: '--c2', r: 6 }); pl.label(q[0] + 0.06, q[1] + 22, q[2], { color: '--c2' }); });
      pl.xy(oct.map((q) => q[0]), oct.map((q) => q[1]), { color: '--c1', width: 0 }); oct.forEach((q) => { pl.dot(q[0], q[1], { color: '--c1', r: 6 }); pl.label(q[0] + 0.06, q[1] - 28, q[2], { color: '--c1' }); });
      if (p.pred) { pl.dot(-3, m[2] + (m[2] - m[1]), { color: '--c3', r: 7 }); pl.label(-2.95, m[2] + (m[2] - m[1]) + 28, 'predicción 1682', { color: '--c3' }); }
      pl.legend([{ label: 'octete', color: '--c1' }, { label: 'decuplete', color: '--c2' }], 'br');
      // cuadro de contenido de quarks
      const bx = W * 0.72, by = H * 0.1; const lines = ['Δ⁺⁺ uuu · Δ⁻ ddd', 'Σ* uus, uds, dds', 'Ξ* uss, dss', 'Ω⁻ sss (1964)', 'p uud · n udd · Λ uds', 'Σ uus, uds, dds · Ξ uss, dss'];
      lines.forEach((t, i) => EM.text(ctx, t, bx, by + i * 22, { size: 12, color: '--ink-2' }));
      sim.set('g', `${EM.fix(g.left, 2)} · ${EM.fix(g.right, 2)} (diferencia ${EM.fix(100 * (g.right - g.left) / g.left, 2)} %)`);
      sim.set('s', `${EM.fix(m[1] - m[0], 1)} · ${EM.fix(m[2] - m[1], 1)} · ${EM.fix(m[3] - m[2], 1)}`);
      sim.set('o', `${EM.fix(m[2] + (m[2] - m[1]), 1)} · ${EM.fix(m[3], 2)}`);
    });
  });

  /* 25.3 Oscilaciones de neutrinos */
  EM.defineSim('oscilacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('th', { label: 'Ángulo de mezcla θ', min: 0.05, max: 45, step: 0.05, value: 45, unit: '°', fmt: (v) => EM.fix(v, 2) });
    sim.slider('dm', { label: 'Diferencia de masas al cuadrado Δm²', min: 0.00005, max: 0.01, step: 0.00001, value: 0.0025, log: true, unit: 'eV²', fmt: (v) => v.toExponential(2) });
    sim.slider('E', { label: 'Energía del neutrino E', min: 0.002, max: 20, step: 0.001, value: 0.6, log: true, unit: 'GeV', fmt: (v) => EM.fix(v, 3) });
    sim.out('L', 'Primer máximo L₁ = πE/(2·1.267 Δm²) (km) · amplitud sen²2θ', { hl: true });
    sim.out('P', 'Probabilidad de oscilación a las distancias de T2K (295 km), atmosféricos a 10⁴ km y KamLAND (180 km)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = p.th * Math.PI / 180, L1 = P.oscLength(p.dm, p.E), Lmax = Math.max(3 * L1 * 2, 100);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: Lmax, ymin: 0, ymax: 1.05, xlabel: 'distancia recorrida L (km)', ylabel: 'P(ν_α → ν_β)', ml: 56, mr: 10, title: 'Oscilación de dos sabores: P = sen²2θ sen²(1.267 Δm² L/E)' });
      pl.frame(); pl.fn((L) => P.osc2(th, p.dm, L, p.E), { color: '--accent', width: 3, n: 800, fill: '--accent' }); pl.hline(Math.pow(Math.sin(2 * th), 2), { color: '--ink-3', dash: [4, 3], label: 'sen²2θ' }); pl.hline(Math.pow(Math.sin(2 * th), 2) / 2, { color: '--ink-3', dash: [2, 4] });
      pl.vline(L1, { color: '--c3', dash: [3, 3], label: 'L₁' });
      sim.set('L', `${EM.fix(L1, 1)} km · ${EM.fix(Math.pow(Math.sin(2 * th), 2), 4)}`);
      sim.set('P', `${EM.fix(P.osc2(th, p.dm, 295, p.E), 4)} · ${EM.fix(P.osc2(th, p.dm, 1e4, p.E), 4)} · ${EM.fix(P.osc2(th, p.dm, 180, p.E), 4)}`);
    });
  });

  /* 25.4 La resonancia del Z y el número de neutrinos */
  EM.defineSim('z', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('nu', { label: 'Número de familias de neutrinos ligeros N_ν', min: 2, max: 5, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.out('G', 'Anchura total Γ_Z = Γ_had + 3Γ_ℓℓ + N_νΓ_νν con Γ_νν = 167.2 MeV · anchura invisible', { hl: true });
    sim.out('s', 'Máximo σ⁰_had = 12πΓ_eeΓ_had/(M_Z²Γ_Z²) (nb) · caída por cada familia adicional');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, Nn = Math.round(p.nu), MZ = 91.1876, Gee = 0.083985, Ghad = 1.7444, Gnn = 0.1672, GZ = Ghad + 3 * Gee + Nn * Gnn;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 88, xmax: 95, ymin: 0, ymax: 50, xlabel: '√s (GeV)', ylabel: 'σ(e⁺e⁻ → hadrones) (nb)', ml: 56, mr: 10, title: 'Línea de forma del Z: la anchura cuenta los neutrinos' });
      pl.frame(); [2, 3, 4].forEach((n, i) => { const G = Ghad + 3 * Gee + n * Gnn; pl.fn((x) => P.sigmaZ(x, MZ, G, Gee, Ghad), { color: ['--c1', '--accent', '--c3'][i], width: Nn === n ? 3.4 : 1.6, n: 500 }); });
      pl.fn((x) => P.sigmaZ(x, MZ, GZ, Gee, Ghad), { color: '--ink', width: 1, dash: [3, 3], n: 300 });
      pl.legend([{ label: 'N_ν = 2', color: '--c1' }, { label: 'N_ν = 3 (el valor medido)', color: '--accent' }, { label: 'N_ν = 4', color: '--c3' }], 'tr');
      sim.set('G', `${EM.fix(GZ * 1000, 1)} MeV (medida: 2495.2 MeV) · ${EM.fix(Nn * Gnn * 1000, 1)} MeV`);
      sim.set('s', `${EM.fix(P.sigmaPeak(MZ, GZ, Gee, Ghad), 2)} nb (medida: 41.48 nb) · ${EM.fix(100 * (1 - P.sigmaPeak(MZ, GZ + Gnn, Gee, Ghad) / P.sigmaPeak(MZ, GZ, Gee, Ghad)), 1)} %`);
    });
  });
})();
