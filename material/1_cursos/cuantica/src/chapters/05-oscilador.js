/* Capítulo 5 — Oscilador armónico y métodos numéricos */
(function () {
  'use strict';
  const CQ = window.CQ, P = CQ.P, M = CQ.M, S = P.sf;
  const f3 = (v) => CQ.fix(v, 3), f4 = (v) => CQ.fix(v, 4);

  /* ======================================================================
     5.1 Oscilador: niveles, funciones y distribución clásica (ħ = m = ω = 1)
     ====================================================================== */
  CQ.defineSim('oscilador', function (sim) {
    const cv = sim.canvas({ aspect: 1.5 });
    sim.group('Estado');
    sim.slider('n', { label: 'Nivel resaltado <i>n</i>', min: 0, max: 30, value: 2, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.seg('mode', { label: 'Mostrar', options: [['psi', 'ψ'], ['prob', '|ψ|²']], value: 'psi' });
    sim.check('cl', { label: 'Distribución clásica del nivel resaltado', value: true });
    sim.check('all', { label: 'Dibujar también los niveles vecinos', value: true });
    sim.out('E', '<i>E</i><sub>n</sub> = (<i>n</i> + ½)ħω', { hl: true });
    sim.out('A', 'Puntos de retorno ±√(2<i>E</i>/<i>k</i>)');
    sim.out('x2', '⟨<i>x</i>²⟩ numérico / (<i>n</i> + ½)');
    sim.out('out', 'Probabilidad fuera de la zona clásica', { hl: true });
    sim.out('nodes', 'Nodos');
    sim.onDraw(() => {
      const n = sim.p.n;
      const Emax = Math.max(6, n + 3);
      const xm = Math.sqrt(2 * Emax) * 1.12;
      CQ.draw.clear(cv);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -xm, xmax: xm, ymin: 0, ymax: Emax, xlabel: 'x (unidades de √(ħ/mω))', ylabel: 'E (ħω)' });
      pl.frame();
      pl.fn((x) => 0.5 * x * x, { color: '--ink-2', width: 2 });
      const list = sim.p.all ? Array.from({ length: Math.min(Emax, 31) }, (_, k) => k).filter((k) => k + 0.5 < Emax && Math.abs(k - n) <= 3) : [n];
      const amp = 0.45;
      for (const k of list) {
        const E = k + 0.5, on = k === n;
        const A = Math.sqrt(2 * E);
        CQ.drawLevels(pl, [{ E, color: on ? '--accent' : '--ink-3', width: on ? 1.5 : 0.9, dash: [4, 3], x0: -A, x1: A }]);
        const scale = sim.p.mode === 'psi' ? amp / 0.75 : amp * 1.8;
        const f = sim.p.mode === 'psi' ? (x) => S.hoPsi(k, x) : (x) => S.hoPsi(k, x) ** 2;
        pl.fn((x) => E + scale * f(x), { color: on ? '--accent' : '--c1', width: on ? 2.3 : 1.1, alpha: on ? 1 : 0.7, n: 900, fill: sim.p.mode === 'prob' && on ? '--accent' : null, base: E, fillAlpha: 0.15 });
      }
      const E = n + 0.5, A = Math.sqrt(2 * E);
      if (sim.p.cl) pl.fn((x) => (Math.abs(x) < A * 0.999 ? E + amp * 1.8 * (1 / (Math.PI * Math.sqrt(A * A - x * x))) : NaN), { color: '--c2', width: 1.8, dash: [5, 3], n: 900 });
      pl.vline(-A, { color: '--ink-3' }); pl.vline(A, { color: '--ink-3' });
      /* lecturas numéricas */
      const x2 = P.integ.fn((x) => x * x * S.hoPsi(n, x) ** 2, -A - 12, A + 12, 6000);
      const inside = P.integ.fn((x) => S.hoPsi(n, x) ** 2, -A, A, 4000);
      sim.set('E', f3(E) + ' ħω');
      sim.set('A', '± ' + f3(A));
      sim.set('x2', `${f4(x2)} / ${f4(n + 0.5)}`);
      sim.set('out', CQ.fix(100 * (1 - inside), 2) + ' %');
      sim.set('nodes', String(n));
    });
  });

  /* ======================================================================
     5.2 Estado coherente frente a paquete desajustado (ħ = m = ω = 1)
     ====================================================================== */
  CQ.defineSim('coherente', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.group('Paquete inicial');
    sim.slider('x0', { label: 'Desplazamiento inicial <i>x</i><sub>0</sub>', min: 0, max: 5, value: 3, step: 0.05, fmt: (v) => CQ.fix(v, 2) });
    sim.slider('s', { label: 'Anchura inicial σ (fundamental: 1/√2 = 0.707)', min: 0.3, max: 1.6, value: 0.7071, step: 0.01, fmt: (v) => CQ.fix(v, 3) });
    sim.button('Anchura del fundamental', () => sim.ctl.s.set(Math.SQRT1_2));
    sim.out('t', 'Tiempo (periodos)');
    sim.out('xm', '⟨<i>x</i>⟩ numérico / <i>x</i><sub>0</sub> cos ω<i>t</i>', { hl: true });
    sim.out('sx', 'σ<sub>x</sub>(<i>t</i>)');
    sim.out('pn', 'Poblaciones de los niveles (Poisson si es coherente)');
    const NX = 1201, x = P.util.linspace(-12, 12, NX), dt = 0.01;
    let cn, re, im, t = 0;
    const reset = () => {
      cn = new P.q1d.CrankNicolson(x, (xx) => 0.5 * xx * xx, dt);
      [re, im] = P.q1d.gaussPacket(x, sim.p.x0, sim.p.s, 0);
      t = 0;
    };
    reset();
    sim.resetButton(reset);
    sim.onChange = () => reset();
    sim.animate((ft) => { const k = Math.min(6, Math.max(1, Math.round(ft / 0.006))); for (let s = 0; s < k; s++) { [re, im] = cn.step(re, im); t += dt; } });
    sim.onDraw(() => {
      CQ.draw.clear(cv);
      const peak = 1 / Math.sqrt(2 * Math.PI * Math.min(sim.p.s, 1 / (2 * sim.p.s)) ** 2);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -7, xmax: 7, ymin: 0, ymax: 1.2 * peak, xlabel: 'x', ylabel: '|ψ|²' });
      pl.frame();
      pl.fn((xx) => (0.5 * xx * xx) / 25 * 1.2 * peak, { color: '--ink-3', width: 1.4 });
      CQ.drawPhaseCurve(pl, x, re, im, { scale: 1 });
      const xc = sim.p.x0 * Math.cos(t);
      const ctx = cv.ctx;
      ctx.beginPath(); ctx.arc(pl.X(xc), pl.Y(1.1 * peak), 7, 0, 7); ctx.fillStyle = CQ.col('--c2'); ctx.fill();
      CQ.text(ctx, 'partícula clásica', pl.X(xc), pl.Y(1.1 * peak) - 12, { size: 11, align: 'center', color: '--c2', halo: true });
      const m = P.q1d.moments(x, re, im);
      /* poblaciones |⟨n|ψ⟩|² */
      const h = x[1] - x[0];
      const pops = [];
      for (let k = 0; k < 8; k++) {
        let a = 0, b = 0;
        for (let i = 0; i < NX; i++) { const phi = S.hoPsi(k, x[i]); a += phi * re[i]; b += phi * im[i]; }
        pops.push((a * a + b * b) * h * h);
      }
      sim.set('t', CQ.fix(t / (2 * Math.PI), 2));
      sim.set('xm', `${f3(m.mean)} / ${f3(xc)}`);
      sim.set('sx', f4(m.sigma));
      sim.set('pn', pops.slice(0, 6).map((p) => CQ.fix(p, 3)).join(' '));
    });
  });

  /* ======================================================================
     5.3 Morse
     ====================================================================== */
  CQ.defineSim('morse', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 0.95 });
    const cb = sim.canvas({ aspect: 0.95 });
    const K = P.K;
    const MOLS = {
      H2: { n: 'H₂', De: 4.747, we: 4401.2, mu: 0.50391, re: 0.7414 },
      D2: { n: 'D₂ (misma curva, doble masa)', De: 4.747, we: 4401.2 / Math.SQRT2, mu: 1.00705, re: 0.7414, same: 'H2' },
      HCl: { n: 'HCl', De: 4.618, we: 2990.9, mu: 0.97959, re: 1.2746 },
      N2: { n: 'N₂', De: 9.905, we: 2358.6, mu: 7.00154, re: 1.0977 },
      CO: { n: 'CO', De: 11.226, we: 2169.8, mu: 6.85621, re: 1.1283 }
    };
    sim.group('Molécula');
    sim.select('mol', { options: Object.keys(MOLS).map((k) => [k, MOLS[k].n]), value: 'H2' });
    sim.check('harm', { label: 'Comparar con la aproximación armónica', value: true });
    sim.out('hw', 'ħω');
    sim.out('a', 'Parámetro <i>a</i> de Morse');
    sim.out('E0', 'Energía de punto cero <i>E</i><sub>0</sub>');
    sim.out('D0', '<i>D</i><sub>0</sub> = <i>D</i><sub>e</sub> − <i>E</i><sub>0</sub>', { hl: true });
    sim.out('nmax', 'Niveles ligados', { hl: true });
    const params = () => {
      const m = MOLS[sim.p.mol];
      const w = 2 * Math.PI * K.c * m.we * 100; /* rad/s */
      const mu = m.mu * K.u, De = m.De * K.e;
      const a = w * Math.sqrt(mu / (2 * De)); /* 1/m */
      const hw = (K.hbar * w) / K.e; /* eV */
      return { m, hw, a: a * 1e-10 };
    };
    sim.onDraw(() => {
      const { m, hw, a } = params();
      const De = m.De;
      const E = (n) => hw * (n + 0.5) - (hw * (n + 0.5)) ** 2 / (4 * De);
      const nmax = Math.floor((2 * De) / hw - 0.5);
      CQ.draw.clear(cv);
      const rmin = m.re - 0.9 / a, rmax = m.re + 4.5 / a;
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: Math.max(0.2, rmin), xmax: rmax, ymin: 0, ymax: De * 1.25, xlabel: 'r (Å)', ylabel: 'V(r) (eV)' });
      pl.frame();
      const V = (r) => De * (1 - Math.exp(-a * (r - m.re))) ** 2;
      pl.fn(V, { color: '--ink', width: 2.2, n: 600 });
      if (sim.p.harm) pl.fn((r) => De * (a * (r - m.re)) ** 2, { color: '--c2', width: 1.4, dash: [5, 4] });
      for (let n = 0; n <= nmax; n++) {
        const En = E(n);
        const r1 = m.re - Math.log(1 + Math.sqrt(En / De)) / a, r2 = m.re - Math.log(1 - Math.sqrt(Math.min(0.9999, En / De))) / a;
        CQ.drawLevels(pl, [{ E: En, color: n === 0 ? '--accent' : '--c1', width: n === 0 ? 2 : 1.1, x0: r1, x1: r2 }]);
        if (sim.p.harm) { const Eh = hw * (n + 0.5); if (Eh < De * 1.2) pl.clip((ctx) => { ctx.fillStyle = CQ.col('--c2'); ctx.fillRect(pl.X(rmax) - 34, pl.Y(Eh) - 1, 26, 2); }); }
      }
      pl.hline(De, { color: '--ink-3', label: 'D_e (disociación)', labelRight: true });
      /* Birge–Sponer */
      CQ.draw.clear(cb);
      const pb = new CQ.Plot(cb.ctx, { x: 0, y: 0, w: cb.w, h: cb.h, xmin: 0, xmax: nmax + 2, ymin: 0, ymax: hw * 1.15, xlabel: 'n', ylabel: 'E_{n+1} − E_n (eV)' });
      pb.frame();
      for (let n = 0; n < nmax; n++) pb.dot(n + 0.5, E(n + 1) - E(n), { color: '--c1', r: 3.5 });
      pb.fn((x) => hw - (hw * hw * (x + 0.5)) / (2 * De) * 1, { color: '--ink-3', width: 1.2, dash: [4, 3] });
      if (sim.p.harm) pb.hline(hw, { color: '--c2', label: 'armónico: ħω constante' });
      sim.set('hw', `${f4(hw)} eV (${CQ.fix(m.we, 0)} cm⁻¹)`);
      sim.set('a', f3(a) + ' Å⁻¹');
      sim.set('E0', f4(E(0)) + ' eV');
      sim.set('D0', f3(De - E(0)) + ' eV');
      sim.set('nmax', `${nmax + 1} (n = 0 … ${nmax})`);
    });
  });

  /* ======================================================================
     5.4 Resolvedor numérico general
     ====================================================================== */
  CQ.defineSim('resolvedor-1d', function (sim) {
    sim.cols2();
    const cv = sim.canvas({ aspect: 0.95 });
    const cc = sim.canvas({ aspect: 0.95 });
    const POT = P.q1d.potentials;
    sim.group('Problema (ħ = m = 1)');
    sim.select('pot', { options: Object.keys(POT).map((k) => [k, POT[k].name]), value: 'armonico' });
    sim.slider('N', { label: 'Puntos de la malla <i>N</i>', min: 20, max: 3000, value: 300, log: true, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.slider('k', { label: 'Niveles a calcular', min: 1, max: 6, value: 4, step: 1, fmt: (v) => CQ.fix(v, 0) });
    sim.out('h', 'Paso de malla <i>h</i>');
    sim.outSep();
    for (let q = 0; q < 6; q++) sim.out('e' + q, `<i>E</i><sub>${q}</sub> numérica / exacta`);
    sim.onDraw(() => {
      const pr = POT[sim.p.pot];
      const N = Math.round(sim.p.N), k = sim.p.k;
      const r = P.q1d.fdEigen(pr.V, pr.a, pr.b, N, k);
      CQ.draw.clear(cv);
      let vmin = Infinity, vmax = -Infinity;
      for (let q = 0; q <= 400; q++) { const v = pr.V(pr.a + ((pr.b - pr.a) * q) / 400); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); }
      const top = Math.max(r.E[k - 1] + 0.25 * (r.E[k - 1] - vmin + 1), vmin + 1);
      const pl = new CQ.Plot(cv.ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: pr.a, xmax: pr.b, ymin: vmin - 0.05 * (top - vmin), ymax: top, xlabel: 'x', ylabel: 'E' });
      pl.frame();
      pl.fn((x) => Math.min(pr.V(x), top * 2), { color: '--ink-2', width: 2, n: 800 });
      const gap = (top - vmin) / (k + 2);
      r.E.forEach((E, q) => {
        CQ.drawLevels(pl, [{ E, color: '--ink-3', dash: [4, 3], width: 1 }]);
        let mx = 0; for (const v of r.psi[q]) mx = Math.max(mx, Math.abs(v));
        pl.xy(r.x, Array.from(r.psi[q], (v) => E + (0.45 * gap * v) / mx), { color: q % 2 ? '--c2' : '--c1', width: 1.7 });
      });
      /* convergencia */
      CQ.draw.clear(cc);
      const ex = pr.exact ? pr.exact(0) : NaN;
      const Ns = [25, 50, 100, 200, 400, 800, 1600, 3200];
      const pts = [];
      let ref = ex;
      if (!isFinite(ref)) ref = P.q1d.fdEigen(pr.V, pr.a, pr.b, 12000, 1, { vectors: false }).E[0];
      for (const n of Ns) { const e = P.q1d.fdEigen(pr.V, pr.a, pr.b, n, 1, { vectors: false }).E[0]; const hh = (pr.b - pr.a) / (n + 1); pts.push([hh, Math.max(1e-14, Math.abs(e - ref))]); }
      const pc = new CQ.Plot(cc.ctx, { x: 0, y: 0, w: cc.w, h: cc.h, xmin: 1e-3, xmax: 1, ymin: 1e-9, ymax: 10, xlog: true, ylog: true, xlabel: 'paso h', ylabel: '|E₀(h) − E₀|', title: isFinite(ex) ? 'error frente a la solución exacta' : 'error frente a una malla muy fina' });
      pc.frame();
      pc.path(pts, { color: '--c1', width: 2 });
      pts.forEach(([hh, e]) => pc.dot(hh, e, { color: '--c1', r: 3.5 }));
      const c0 = pts[3][1] / pts[3][0] ** 2;
      pc.fn((hh) => c0 * hh * hh, { color: '--ink-3', dash: [5, 4], width: 1.2 });
      pc.label(0.02, c0 * 0.02 * 0.02 * 0.3, 'pendiente 2', { color: '--ink-3' });
      const hh = (pr.b - pr.a) / (N + 1);
      pc.vline(hh, { color: '--accent', label: 'N actual' });
      sim.set('h', CQ.sci(hh, 3));
      for (let q = 0; q < 6; q++) {
        sim._outs['e' + q].show(q < k);
        if (q < k) { const e = pr.exact ? pr.exact(q) : NaN; sim.set('e' + q, `${CQ.fix(r.E[q], 6)} / ${isFinite(e) ? CQ.fix(e, 6) : '—'}`); }
      }
    });
  });
})();
