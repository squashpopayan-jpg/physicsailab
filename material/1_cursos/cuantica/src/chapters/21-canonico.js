/* Capítulo 21 — El ensamble canónico */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, SM = P.sm;
  const KB = P.K.kB_eV;
  const f4 = (v) => CQ.fix(v, 4);

  /* ======================================================================
     21.1 Sistema de niveles: poblaciones y termodinámica
     ====================================================================== */
  CQ.defineSim('boltzmann-niveles', function (sim) {
    sim.cols2();
    const cp = sim.canvas({ aspect: 0.95 });
    const ct = sim.canvas({ aspect: 0.95 });
    const PRE = {
      tres: { n: 'Tres niveles (0, 0.05, 0.12 eV; g = 1, 2, 1)', E: [0, 0.05, 0.12], g: [1, 2, 1], Tmax: 3000 },
      bn: { n: 'hBN-MC: estado base y un intercambio B↔N (6.24 eV)', E: [0, 6.2408], g: [1, 1], Tmax: 30000 },
      osc: { n: 'Oscilador truncado (ħω = 0.169 eV, 8 niveles)', E: Array.from({ length: 8 }, (_, n) => 0.1694 * n), g: new Array(8).fill(1), Tmax: 6000 }
    };
    sim.group('Sistema');
    sim.select('pre', { options: Object.keys(PRE).map((k) => [k, PRE[k].n]), value: 'tres', onInput: () => { const p = PRE[sim.p.pre]; sim.ctl.T.range(10, p.Tmax); sim.ctl.T.set(Math.min(sim.p.T, p.Tmax), true); } });
    sim.slider('T', { label: 'Temperatura <i>T</i>', min: 10, max: 3000, value: 600, step: 1, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
    sim.out('Z', '<i>Z</i>');
    sim.out('U', '<i>U</i> = ⟨<i>E</i>⟩', { hl: true });
    sim.out('F', '<i>F</i> = −<i>k</i><sub>B</sub><i>T</i> ln <i>Z</i>');
    sim.out('S', '<i>S</i>/<i>k</i><sub>B</sub>');
    sim.out('C', '<i>C</i>/<i>k</i><sub>B</sub>: fluctuaciones / d<i>U</i>/d<i>T</i>', { hl: true });
    sim.out('p1', 'Población del primer excitado');
    sim.onDraw(() => {
      const pr = PRE[sim.p.pre], T = sim.p.T, kT = KB * T;
      const r = SM.levels(pr.E, pr.g, kT);
      const h = 1e-3 * T;
      const dU = (SM.levels(pr.E, pr.g, KB * (T + h)).U - SM.levels(pr.E, pr.g, KB * (T - h)).U) / (2 * h) / KB;
      CQ.draw.clear(cp);
      const Emax = Math.max(...pr.E) * 1.15 || 1;
      const pl = new CQ.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 0, xmax: 1.05, ymin: -0.05 * Emax, ymax: Emax, xlabel: 'población por estado (barras)', ylabel: 'energía (eV)', title: `poblaciones a ${CQ.fix(T, 0)} K` });
      pl.frame();
      pr.E.forEach((E, i) => {
        const p = r.p[i];
        pl.clip((ctx) => { ctx.fillStyle = CQ.alpha('--c1', 0.55); ctx.fillRect(pl.X(0), pl.Y(E) - 7, pl.X(p) - pl.X(0), 14); });
        CQ.drawLevels(pl, [{ E, color: '--ink', width: 1.5 }]);
        pl.label(Math.min(p, 0.8) + 0.02, E, `${CQ.fix(100 * p, p < 0.001 ? 4 : 1)} %${pr.g[i] > 1 ? ' (g=' + pr.g[i] + ')' : ''}`, { size: 11, baseline: 'middle', color: '--ink-2' });
      });
      /* C(T) */
      CQ.draw.clear(ct);
      const Ts = P.util.linspace(5, pr.Tmax, 300);
      const Cs = Array.from(Ts, (t) => SM.levels(pr.E, pr.g, KB * t).C);
      const pc = new CQ.Plot(ct.ctx, { x: 0, y: 0, w: ct.w, h: ct.h, xmin: 0, xmax: pr.Tmax, ymin: 0, ymax: Math.max(...Cs) * 1.2 || 1, xlabel: 'T (K)', ylabel: 'C / k_B', title: 'capacidad calorífica' });
      pc.frame();
      pc.xy(Array.from(Ts), Cs, { color: '--c2', width: 2.2 });
      pc.dot(T, r.C, { color: '--accent' });
      sim.set('Z', CQ.sci(r.Z, 4));
      sim.set('U', CQ.fix(r.U, 5) + ' eV');
      sim.set('F', CQ.fix(r.F, 5) + ' eV');
      sim.set('S', f4(r.S));
      sim.set('C', `${f4(r.C)} / ${f4(dU)}`);
      sim.set('p1', CQ.sci(r.p[1] / pr.g[1], 3) + ' por estado');
    });
  });

  /* ======================================================================
     21.2 Schottky
     ====================================================================== */
  CQ.defineSim('schottky', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.group('Dos niveles');
    sim.slider('D', { label: 'Separación Δ', min: 0.01, max: 1, value: 0.1, step: 0.005, unit: 'eV', fmt: (v) => CQ.fix(v, 3) });
    sim.slider('M', { label: 'Muestras Monte Carlo por temperatura', min: 50, max: 20000, value: 1000, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.button('Nuevas muestras', () => { seed++; }, { primary: true });
    sim.out('Tp', 'Temperatura del máximo', { hl: true });
    sim.out('ratio', '<i>k</i><sub>B</sub><i>T</i><sub>máx</sub>/Δ');
    sim.out('Cm', '<i>C</i><sub>máx</sub>/<i>k</i><sub>B</sub>');
    let seed = 3;
    sim.onDraw(() => {
      const D = sim.p.D;
      const Tmax = (3 * D) / KB;
      CQ.draw.clear(cv);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: Tmax, ymin: 0, ymax: 0.6, xlabel: 'T (K)', ylabel: 'C / k_B' });
      pl.frame();
      pl.fn((T) => SM.schottky(D / (KB * Math.max(T, 1e-6))), { color: '--c2', width: 2.4 });
      const rng = P.rng(seed);
      for (let q = 1; q <= 30; q++) {
        const T = (Tmax * q) / 30, x = D / (KB * T), p1 = 1 / (1 + Math.exp(x));
        let s = 0, s2 = 0;
        for (let k = 0; k < sim.p.M; k++) { const e = rng() < p1 ? D : 0; s += e; s2 += e * e; }
        const m = s / sim.p.M, v = s2 / sim.p.M - m * m;
        pl.dot(T, v / (KB * T) ** 2, { color: '--c1', r: 3 });
      }
      const xp = P.util.golden((t) => -SM.schottky(1 / t), 0.1, 2).x;
      pl.vline((xp * D) / KB, { color: '--accent', label: 'máximo' });
      pl.legend([{ label: 'exacta', color: '--c2' }, { label: 'Var(E)/k_BT² con muestras', color: '--c1', kind: 'dot' }]);
      sim.set('Tp', CQ.fix((xp * D) / KB, 1) + ' K');
      sim.set('ratio', CQ.fix(xp, 5));
      sim.set('Cm', CQ.fix(SM.schottky(1 / xp), 4));
    });
  });

  /* ======================================================================
     21.3 Einstein y Debye
     ====================================================================== */
  CQ.defineSim('einstein-debye', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.group('Temperaturas características');
    sim.slider('tE', { label: 'θ<sub>E</sub> (Einstein)', min: 50, max: 2500, value: 1000, step: 10, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
    sim.slider('tD', { label: 'θ<sub>D</sub> (Debye)', min: 50, max: 2500, value: 1300, step: 10, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
    sim.slider('T', { label: 'Temperatura señalada', min: 5, max: 3000, value: 300, step: 5, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
    sim.check('lg', { label: 'Escala logarítmica', value: false });
    sim.out('cE', 'Einstein <i>C</i>/3<i>Nk</i><sub>B</sub>', { hl: true });
    sim.out('cD', 'Debye <i>C</i>/3<i>Nk</i><sub>B</sub>', { hl: true });
    sim.out('t3', 'Ley T³: (4π⁴/5)(T/θ<sub>D</sub>)³');
    sim.onDraw(() => {
      const { tE, tD, T } = sim.p, lg = sim.p.lg;
      CQ.draw.clear(cv);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: lg ? 5 : 0, xmax: 3000, xlog: lg, ymin: lg ? 1e-5 : 0, ymax: lg ? 2 : 1.15, ylog: lg, xlabel: 'T (K)', ylabel: 'C / 3Nk_B' });
      pl.frame();
      pl.hline(1, { color: '--ink-3', label: 'Dulong–Petit' });
      pl.fn((t) => SM.einsteinC(tE / Math.max(t, 1e-6)), { color: '--c1', width: 2.2, from: 1, n: 400 });
      pl.fn((t) => SM.debyeC(t / tD), { color: '--c2', width: 2.2, from: 1, n: 300 });
      pl.fn((t) => ((4 * Math.PI ** 4) / 5) * (t / tD) ** 3, { color: '--c2', width: 1.2, dash: [4, 3], to: tD * 0.25 });
      pl.vline(T, { color: '--accent' });
      pl.legend([{ label: 'Einstein', color: '--c1' }, { label: 'Debye', color: '--c2' }, { label: 'T³', color: '--c2', dash: [4, 3] }], 'br');
      sim.set('cE', f4(SM.einsteinC(tE / T)));
      sim.set('cD', f4(SM.debyeC(T / tD)));
      sim.set('t3', f4(((4 * Math.PI ** 4) / 5) * (T / tD) ** 3));
    });
  });

  /* ======================================================================
     21.4 Arrhenius
     ====================================================================== */
  CQ.defineSim('arrhenius', function (sim) {
    sim.cols2();
    const cp = sim.canvas({ aspect: 0.95 });
    const ca = sim.canvas({ aspect: 0.95 });
    sim.group('Barrera o costo energético');
    sim.slider('E', { label: 'Δ<i>E</i>', min: 0.05, max: 25, value: 6.2408, log: true, step: 0.01, unit: 'eV', fmt: (v) => CQ.fix(v, 2) });
    sim.button('B↔N (6.24 eV)', () => sim.ctl.E.set(6.2408));
    sim.button('Borde (18 eV)', () => sim.ctl.E.set(18));
    sim.slider('T', { label: 'Temperatura', min: 100, max: 20000, value: 5000, log: true, step: 1, unit: 'K', fmt: (v) => CQ.fix(v, 0) });
    sim.out('kT', '<i>k</i><sub>B</sub><i>T</i>');
    sim.out('p', 'e<sup>−Δ<i>E</i>/<i>k</i><sub>B</sub><i>T</i></sup>', { hl: true });
    sim.out('n', 'Intentos para una aceptación');
    sim.out('T1', '<i>T</i> para aceptación del 1 %');
    sim.onDraw(() => {
      const E = sim.p.E, T = sim.p.T;
      const lp = (t) => -E / (KB * t) / Math.LN10;
      CQ.draw.clear(cp);
      const pl = new CQ.Plot(cp.ctx, { x: 0, y: 0, w: cp.w, h: cp.h, xmin: 100, xmax: 20000, xlog: true, ymin: -40, ymax: 0.5, xlabel: 'T (K)', ylabel: 'log₁₀ p', title: 'probabilidad p = e^{−ΔE/kT} frente a T' });
      pl.frame();
      [[0.5, '--c3'], [6.2408, '--c1'], [18, '--c2']].forEach(([e, c]) => pl.fn((t) => -e / (KB * t) / Math.LN10, { color: c, width: 1.2, dash: [4, 3], n: 300 }));
      pl.fn(lp, { color: '--accent', width: 2.6, n: 300 });
      pl.band(5000, 20000, { color: '--accent', alpha: 0.07 });
      pl.label(5200, -38, 'rango de hBN-MC', { color: '--accent' });
      pl.dot(T, lp(T), { color: '--accent' });
      CQ.draw.clear(ca);
      const pa = new CQ.Plot(ca.ctx, { x: 0, y: 0, w: ca.w, h: ca.h, xmin: 0, xmax: 1e4 / 300, ymin: -60, ymax: 0.5, xlabel: '10⁴/T (K⁻¹)', ylabel: 'log₁₀ p', title: 'gráfica de Arrhenius: rectas' });
      pa.frame();
      pa.fn((u) => -E * u / (1e4 * KB) / Math.LN10, { color: '--accent', width: 2.4 });
      pa.dot(1e4 / T, lp(T), { color: '--accent' });
      const p = Math.exp(-E / (KB * T));
      sim.set('kT', CQ.fix(KB * T, 4) + ' eV');
      sim.set('p', CQ.sci(p, 3));
      sim.set('n', p > 0 ? CQ.sci(1 / p, 2) : '∞');
      sim.set('T1', CQ.fix(E / (KB * Math.log(100)), 0) + ' K');
    });
  });
})();
