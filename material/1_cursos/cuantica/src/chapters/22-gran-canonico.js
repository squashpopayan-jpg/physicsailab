/* Capítulo 22 — Potencial químico y ensamble gran canónico */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, SM = P.sm;
  const KB = P.K.kB_eV;
  const f3 = (v) => CQ.fix(v, 3);

  /* ======================================================================
     22.1 Δμ_H(T, p) del hidrógeno
     ====================================================================== */
  CQ.defineSim('mu-h2', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.group('Condiciones');
    sim.slider('T', { label: 'Temperatura', min: 100, max: 2500, value: 1000, step: 10, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
    sim.slider('lp', { label: 'Presión de H₂ (log₁₀ p / bar)', min: -12, max: 2, value: 0, step: 0.1, fmt: (v) => CQ.fix(v, 1) });
    sim.check('zpe', { label: 'Incluir la energía de punto cero (0.27 eV/H₂)', value: true });
    sim.out('p', 'Presión');
    sim.out('dmu', 'Δμ<sub>H</sub>', { hl: true });
    sim.out('parts', 'Traslación · rotación · vibración (por H₂)');
    sim.out('S', 'Entropía molar del H₂');
    sim.onDraw(() => {
      const T = sim.p.T, p = Math.pow(10, sim.p.lp) * 1e5, z = sim.p.zpe;
      CQ.draw.clear(cv);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 100, xmax: 2500, ymin: -3.5, ymax: 0.3, xlabel: 'T (K)', ylabel: 'Δμ_H (eV)' });
      pl.frame();
      [[2, '--c5'], [0, '--c1'], [-4, '--c3'], [-8, '--c4'], [-12, '--c2']].forEach(([lp, c]) => pl.fn((t) => SM.h2Thermo(t, Math.pow(10, lp) * 1e5, { zpe: z }).dmuH, { color: c, width: 1.6, n: 120 }));
      pl.fn((t) => SM.h2Thermo(t, p, { zpe: z }).dmuH, { color: '--accent', width: 2.8, n: 160 });
      pl.hline(-0.224, { color: '--ink-3', label: 'ventana abre (μ_BN = E(BN)): −0.224 eV', labelRight: true });
      pl.hline(-0.596, { color: '--ink-3', dash: [2, 3], label: 'ventana abre (μ_BN = 3ε_NB): −0.596 eV', labelRight: true });
      pl.hline(-1.5, { color: '--c2', dash: [6, 3], label: 'ejemplo de la portada: −1.5 eV', labelRight: true });
      const r = SM.h2Thermo(T, p, { zpe: z });
      pl.dot(T, r.dmuH, { color: '--accent' });
      pl.legend([{ label: '100 bar', color: '--c5' }, { label: '1 bar', color: '--c1' }, { label: '10⁻⁴ bar', color: '--c3' }, { label: '10⁻⁸ bar', color: '--c4' }, { label: '10⁻¹² bar', color: '--c2' }, { label: 'condición elegida', color: '--accent' }], 'bl');
      /* desglose */
      const kT = KB * T, K = P.K;
      const lam3 = Math.pow((2 * Math.PI * SM.H2.m * K.kB * T) / (K.h * K.h), 1.5);
      const mt = -kT * Math.log((K.kB * T / p) * lam3), mr = -kT * Math.log(SM.h2Rot(T).q), mv = -kT * -Math.log(1 - Math.exp(-SM.H2.thetaVib / T)) + (z ? 0.5 * KB * SM.H2.thetaVib : 0);
      sim.set('p', CQ.sci(p / 1e5, 3) + ' bar');
      sim.set('dmu', f3(r.dmuH) + ' eV');
      sim.set('parts', `${f3(mt)} · ${f3(mr)} · ${f3(mv)} eV`);
      sim.set('S', CQ.fix(r.S, 2) + ' J/(mol·K)');
    });
  });

  /* ======================================================================
     22.2 Langmuir
     ====================================================================== */
  CQ.defineSim('langmuir', function (sim) {
    sim.cols2();
    const ce = sim.canvas({ aspect: 0.95 });
    const cs = sim.canvas({ aspect: 0.95 });
    sim.group('Sitios y reservorio');
    sim.slider('eps', { label: 'Energía de un sitio ocupado ε (relativa a ½E(H₂))', min: -3, max: 1, value: -0.8, step: 0.01, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.slider('mu', { label: 'Δμ del reservorio', min: -3, max: 0.5, value: -0.6, step: 0.01, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.slider('T', { label: 'Temperatura', min: 100, max: 3000, value: 800, step: 10, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
    sim.out('th', 'Cobertura θ', { hl: true });
    sim.out('dw', 'Ancho de la transición (≈ 4<i>k</i><sub>B</sub><i>T</i>)');
    const rng = P.rng(44);
    sim.onDraw(() => {
      const { eps, mu, T } = sim.p, kT = KB * T;
      const th = SM.langmuir(eps, mu, kT);
      CQ.draw.clear(ce);
      const pl = new CQ.Plot(ce.ctx, { x: 0, y: 0, w: ce.w, h: ce.h, xmin: -3, xmax: 0.5, ymin: 0, ymax: 1.05, xlabel: 'Δμ (eV)', ylabel: 'θ', title: 'cobertura frente al potencial químico' });
      pl.frame();
      [300, 800, 1500].forEach((t, i) => pl.fn((m) => SM.langmuir(eps, m, KB * t), { color: ['--c1', '--c3', '--c2'][i], width: 1.4, dash: [4, 3] }));
      pl.fn((m) => SM.langmuir(eps, m, kT), { color: '--accent', width: 2.6 });
      pl.vline(eps, { color: '--ink-3', label: 'μ = ε' });
      pl.dot(mu, th, { color: '--accent' });
      pl.legend([{ label: '300 K', color: '--c1', dash: [4, 3] }, { label: '800 K', color: '--c3', dash: [4, 3] }, { label: '1500 K', color: '--c2', dash: [4, 3] }]);
      /* sitios de borde de un poro: ocupados al azar con probabilidad θ */
      CQ.draw.clear(cs);
      const ctx = cs.ctx, W = cs.w, H = cs.h;
      const n = 36, R = Math.min(W, H) * 0.32, cx = W / 2, cy = H / 2;
      CQ.text(ctx, 'enlaces colgantes del borde de un poro', W / 2, 18, { size: 12, align: 'center', color: '--ink-2' });
      const rr = P.rng(Math.round(mu * 100) + Math.round(eps * 1000) + T);
      for (let k = 0; k < n; k++) {
        const a = (2 * Math.PI * k) / n, x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
        CQ.draw.atom(ctx, x, y, 8, k % 2 ? 'N' : 'B', { label: false });
        if (rr() < th) { const xh = cx + (R - 22) * Math.cos(a), yh = cy + (R - 22) * Math.sin(a); ctx.strokeStyle = CQ.col('--ink-3'); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(xh, yh); ctx.stroke(); CQ.draw.atom(ctx, xh, yh, 5, 'H'); }
      }
      void rng;
      sim.set('th', CQ.fix(th, 4));
      sim.set('dw', CQ.fix(4 * kT, 3) + ' eV');
    });
  });

  /* ======================================================================
     22.3 Fermi–Dirac, Bose–Einstein, Boltzmann
     ====================================================================== */
  CQ.defineSim('fermi-dirac', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.group('Reservorio');
    sim.slider('T', { label: 'Temperatura', min: 1, max: 5000, value: 1000, log: true, step: 1, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
    sim.slider('mu', { label: 'Potencial químico μ', min: -1, max: 1, value: 0, step: 0.01, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.check('be', { label: 'Bose–Einstein (solo ε > μ)', value: true });
    sim.check('mb', { label: 'Boltzmann', value: true });
    sim.out('kT', '<i>k</i><sub>B</sub><i>T</i>');
    sim.out('f', '<i>f</i><sub>FD</sub> a μ + 0.1 eV y μ − 0.1 eV');
    sim.out('w', 'Zona de transición (10 % → 90 %)');
    sim.onDraw(() => {
      const T = sim.p.T, mu = sim.p.mu, kT = KB * T;
      CQ.draw.clear(cv);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -1.5, xmax: 1.5, ymin: 0, ymax: 1.6, xlabel: 'ε (eV)', ylabel: 'ocupación media' });
      pl.frame();
      if (sim.p.mb) pl.fn((e) => SM.boltz(e, mu, kT), { color: '--c3', width: 1.6, dash: [5, 3], n: 600 });
      if (sim.p.be) pl.fn((e) => (e > mu ? SM.bose(e, mu, kT) : NaN), { color: '--c2', width: 2, n: 800 });
      pl.fn((e) => SM.fermi(e, mu, kT), { color: '--c1', width: 2.6, n: 600 });
      pl.vline(mu, { color: '--accent', label: 'μ' });
      pl.hline(1, { color: '--ink-3' });
      pl.legend([{ label: 'Fermi–Dirac', color: '--c1' }].concat(sim.p.be ? [{ label: 'Bose–Einstein', color: '--c2' }] : []).concat(sim.p.mb ? [{ label: 'Boltzmann', color: '--c3', dash: [5, 3] }] : []), 'tr');
      sim.set('kT', CQ.fix(kT * 1000, 2) + ' meV');
      sim.set('f', `${CQ.fix(SM.fermi(mu + 0.1, mu, kT), 4)} · ${CQ.fix(SM.fermi(mu - 0.1, mu, kT), 4)}`);
      sim.set('w', CQ.fix(2 * Math.log(9) * kT, 3) + ' eV');
    });
  });
})();
