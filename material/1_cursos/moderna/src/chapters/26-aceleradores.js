/* Capítulo 26 — Aceleradores, interacciones y detectores */
(function () {
  'use strict';
  const EM = window.EM, A = EM.fm.acc;

  /* 26.1 Máquinas */
  const MQ = {
    cic: ['Ciclotrón de protones (B = 1.5 T, r = 0.5 m)', 1, 0.93827208816, 1.5, 0.5, 2 * Math.PI * 0.5, 0.0, 'p'],
    lep: ['LEP-II (e⁺e⁻, 104.5 GeV por haz)', 104.5, 0.00051099895, 0.1, 3026, 26658.883, 104.5, 'e'],
    lhc: ['LHC (pp, 6.8 TeV por haz)', 6800, 0.93827208816, 8.33, 2803.95, 26658.883, 6800, 'p'],
  };
  EM.defineSim('maquinas', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('m', { label: 'Máquina', options: Object.entries(MQ).map(([k, v]) => [k, v[0]]), value: 'lhc' });
    sim.slider('E', { label: 'Energía por haz', min: 0.01, max: 7000, step: 0.01, value: 6800, log: true, unit: 'GeV', fmt: (v) => (v < 10 ? EM.fix(v, 2) : v.toFixed(0)) });
    sim.out('p', 'Rigidez magnética p = 0.2998 B ρ (GeV/c) con el campo y el radio de la máquina · campo necesario para esa energía', { hl: true });
    sim.out('r', 'Radiación de sincrotrón por vuelta ΔE = (e²/3ε₀)β³γ⁴/ρ · como fracción de la energía');
    sim.out('s', 'Colisionador: √s = 2E (haces iguales) · blanco fijo con la misma energía: √s = √(2mE + 2m²)');
    sim.out('t', 'Energía de un protón contra blanco fijo para igualar el √s del colisionador');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, E0, m, B, rho, Lr, , kind] = MQ[p.m], E = p.E, g = E / m;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.55, h: H, xmin: 0.1, xmax: 7000, xlog: true, ymin: 1e-12, ymax: 1e2, ylog: true, xlabel: 'energía E (GeV)', ylabel: 'ΔE por vuelta (GeV) con ρ de la máquina', ml: 62, mr: 8, title: 'Radiación de sincrotrón: ∝ E⁴/m⁴' });
      pl.frame(); pl.fn((x) => Math.max(A.syncLoss(Math.max(x, 0.0011), 0.00051099895, rho), 1e-12), { color: '--c2', width: 2.8, n: 200 }); pl.fn((x) => Math.max(A.syncLoss(Math.max(x, 0.94), 0.93827208816, rho), 1e-12), { color: '--c1', width: 2.8, n: 200 });
      pl.vline(E, { color: '--accent', dash: [] }); pl.legend([{ label: 'electrones', color: '--c2' }, { label: 'protones', color: '--c1' }], 'tl');
      const mm = kind === 'e' ? 0.00051099895 : m, loss = A.syncLoss(E, m, rho), rs = A.sqrtsCollider(E, E), fix = A.sqrtsFixed(E, m, 0.93827208816), Eneed = A.fixedEnergyForSqrts(rs, mm, 0.93827208816);
      const bx = W * 0.58; EM.text(ctx, nm, bx + W * 0.2, 24, { size: 13, align: 'center', color: '--ink', weight: 600 });
      EM.text(ctx, `γ = ${EM.sci(g, 3)}`, bx + W * 0.2, 60, { size: 12.5, align: 'center', color: '--ink-2' });
      EM.text(ctx, `√s (colisionador) = ${EM.fix(rs, 2)} GeV`, bx + W * 0.2, 90, { size: 12.5, align: 'center', color: '--accent' });
      EM.text(ctx, `√s (blanco fijo) = ${EM.fix(fix, 2)} GeV`, bx + W * 0.2, 118, { size: 12.5, align: 'center', color: '--c3' });
      sim.set('p', `${EM.fix(A.pFromB(B, rho), 2)} GeV/c (máquina) · B = ${EM.fix(E / (0.2998 * rho), 3)} T`);
      sim.set('r', `${EM.sci(loss, 3)} GeV · ${EM.sci(loss / E, 3)}`);
      sim.set('s', `${EM.fix(rs, 3)} GeV · ${EM.fix(fix, 3)} GeV`);
      sim.set('t', `${EM.sci(Eneed, 3)} GeV (${EM.sci(Eneed / 1e6, 3)} PeV)`);
    });
  });

  /* 26.2 Curva de Bragg */
  EM.defineSim('bragg', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('T', { label: 'Energía del protón', min: 20, max: 250, step: 1, value: 100, unit: 'MeV', fmt: (v) => v.toFixed(0) });
    sim.out('R', 'Rango CSDA en agua (g/cm²) · profundidad del pico de Bragg', { hl: true });
    sim.out('S', 'Poder de frenado al entrar (MeV cm²/g) · en el pico (≈ 0.5–2 MeV)');
    sim.out('f', 'Fracción de energía depositada en el último centímetro');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, M = 938.272, ZA = 0.5551, I = 75, R0 = A.range(p.T, M, ZA, I), xs = [], ys = [], T0 = p.T;
      EM.draw.clear(cv);
      for (let T = T0; T > 1; T -= Math.max(0.1, T0 / 600)) { xs.push(R0 - A.range(T, M, ZA, I)); ys.push(A.bethe(T, M, ZA, I)); }
      xs.push(R0); ys.push(A.bethe(1, M, ZA, I) * 1.1);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: R0 * 1.08, ymin: 0, ymax: Math.max(...ys) * 1.1, xlabel: 'profundidad en agua (cm)', ylabel: 'dE/dx (MeV cm²/g, ∝ dosis)', ml: 56, mr: 10, title: 'Curva de Bragg de un protón en agua' });
      pl.frame(); pl.xy(xs, ys, { color: '--accent', width: 3, fill: '--accent', fillAlpha: 0.14 }); pl.fn((x) => ys[0] * Math.exp(-0.0495 * x), { color: '--ink-3', width: 1.8, dash: [4, 3], n: 100 });
      pl.legend([{ label: 'protones: pico de Bragg', color: '--accent' }, { label: 'fotones de megavoltaje: caída exponencial (ilustrativa, ≈ 0.05 cm⁻¹)', color: '--ink-3' }], 'tl');
      let lo = 0.5, hi = T0; for (let i = 0; i < 50; i++) { const m = 0.5 * (lo + hi); if (A.range(m, M, ZA, I) < 1) lo = m; else hi = m; } const last = lo;
      sim.set('R', `${EM.fix(R0, 3)} g/cm² · ${EM.fix(R0, 2)} cm`);
      sim.set('S', `${EM.fix(A.bethe(T0, M, ZA, I), 3)} · ${EM.fix(Math.max(...ys), 1)}`);
      sim.set('f', `${EM.fix(100 * last / T0, 1)} %`);
    });
  });

  /* 26.3 e⁺e⁻: sección eficaz y R; α(Q) */
  EM.defineSim('electrones', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('rs', { label: 'Energía en el centro de masas √s', min: 1, max: 200, step: 0.1, value: 10, log: true, unit: 'GeV', fmt: (v) => EM.fix(v, 1) });
    sim.out('m', 'σ(e⁺e⁻ → μ⁺μ⁻) = 4πα²/3s (nb) · razón R = σ(hadrones)/σ(μμ)', { hl: true });
    sim.out('a', 'Constante de estructura fina α(√s): 1/α · 1/α(0) = 137.036');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 1, xmax: 200, xlog: true, ymin: 0, ymax: 4.5, xlabel: '√s (GeV)', ylabel: 'R = 3 Σ q_f²', ml: 50, mr: 8, title: 'Cociente R: cuenta los quarks y los colores' });
      pl.frame(); pl.fn((x) => A.Rratio(x), { color: '--accent', width: 3, n: 600 }); pl.dot(p.rs, A.Rratio(p.rs), { color: '--c3', r: 6 });
      [[2, 'u, d, s: 2'], [4, 'c: 10/3'], [30, 'b: 11/3']].forEach(([x, t]) => pl.label(x, A.Rratio(x) + 0.25, t, { size: 10.5, color: '--ink-2' }));
      const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0.001, xmax: 1000, xlog: true, ymin: 126, ymax: 138, xlabel: 'escala Q (GeV)', ylabel: '1/α(Q)', ml: 50, mr: 8, title: 'La carga eléctrica «corre» con la energía' });
      pr.frame(); pr.fn((q) => 1 / A.alphaRun(q), { color: '--c2', width: 2.8, n: 300 }); pr.vline(91.1876, { color: '--ink-3', dash: [3, 3], label: 'M_Z' }); pr.vline(p.rs, { color: '--accent', dash: [] });
      sim.set('m', `${EM.fix(A.sigmaMuMu(p.rs), 4)} nb · ${EM.fix(A.Rratio(p.rs), 3)}`);
      sim.set('a', `${EM.fix(1 / A.alphaRun(p.rs), 3)} (a 91.19 GeV: ${EM.fix(1 / A.alphaRun(91.1876), 2)}; PDG: 127.95)`);
    });
  });
})();
