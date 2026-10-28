/* Capítulo 8 — Disoluciones ideales: Raoult, Henry y destilación */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, DAT = EM.dat, R = FQ.R;
  const LN = (k) => k.charAt(0).toUpperCase() + k.slice(1);

  /* 8.1 Equilibrio líquido–vapor ideal */
  const PAIRS = { 'benceno|tolueno': 'Benceno – tolueno', 'hexano|heptano': 'Hexano – heptano', 'etanol|1-propanol': 'Etanol – 1-propanol', 'metanol|etanol': 'Metanol – etanol' };
  EM.defineSim('vle-ideal', function (sim) {
    const cv = sim.canvas({ aspect: 1.55 });
    sim.select('pair', { label: 'Mezcla binaria (ideal: ley de Raoult)', options: Object.entries(PAIRS), value: 'benceno|tolueno' });
    sim.seg('mode', { label: 'Diagrama', options: [['P', 'P – x – y (T fija)'], ['T', 'T – x – y (P fija)']], value: 'T' });
    sim.slider('T', { label: 'Temperatura', min: 300, max: 400, step: 0.5, value: 360, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.slider('P', { label: 'Presión', min: 20, max: 300, step: 1, value: 101.325, unit: 'kPa', fmt: (v) => v.toFixed(1) });
    sim.slider('z', { label: 'Composición global del componente más volátil', min: 0.02, max: 0.98, step: 0.01, value: 0.4, fmt: (v) => v.toFixed(2) });
    sim.out('ph', 'Fases presentes', { hl: true });
    sim.out('x', 'Líquido <i>x</i> · vapor <i>y</i> del más volátil');
    sim.out('v', 'Fracción molar de vapor (regla de la palanca)');
    sim.out('a', 'Volatilidad relativa α = <i>P</i>₁*/<i>P</i>₂*');
    const names = (k) => k.split('|');
    sim.onChange = (id) => { if (id === 'pair') { const [a, b] = names(sim.p.pair), Tm = (FQ.Ti(a, 101325) + FQ.Ti(b, 101325)) / 2; sim.ctl.T.range(Math.round(Math.min(FQ.Ti(a, 101325), FQ.Ti(b, 101325)) - 30), Math.round(Math.max(FQ.Ti(a, 101325), FQ.Ti(b, 101325)) + 30), 0.5); sim.ctl.T.set(Math.round(Tm), true); } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [a0, b0] = names(p.pair);
      EM.draw.clear(cv);
      /* a = más volátil (mayor P* a la T media) */
      const Tm = (FQ.Ti(a0, 101325) + FQ.Ti(b0, 101325)) / 2, swap = FQ.Pi(a0, Tm) < FQ.Pi(b0, Tm), a = swap ? b0 : a0, b = swap ? a0 : b0;
      const isP = p.mode === 'P', Pk = p.P * 1e3, xs = [], yb = [], yd = [], T = p.T;
      for (let i = 0; i <= 100; i++) {
        const x = i / 100; xs.push(x);
        if (isP) { const r = FQ.bubbleP(a, b, x, T, 'ideal'); yb.push(r.P / 1e3); yd.push(r.P / 1e3); } else { const r = FQ.bubbleT(a, b, x, Pk, 'ideal'); yb.push(r.T); yd.push(r.T); }
      }
      const ys = []; for (let i = 0; i <= 100; i++) { const x = i / 100, r = isP ? FQ.bubbleP(a, b, x, T, 'ideal') : FQ.bubbleT(a, b, x, Pk, 'ideal'); ys.push(r.y1); }
      const lo = Math.min(...yb) * 0.97, hi = Math.max(...yb) * 1.03;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: lo, ymax: hi, xlabel: 'fracción molar de ' + a + ' (x en el líquido, y en el vapor)', ylabel: isP ? 'P (kPa)' : 'T (K)', ml: 56 });
      pl.frame();
      pl.xy(xs, yb, { color: '--c2', width: 2.6 }); pl.xy(ys, yb, { color: '--c1', width: 2.6 });
      const z = p.z; let phase, xl, yv, frac, level;
      if (isP) {
        const Pb = FQ.bubbleP(a, b, z, T, 'ideal').P;
        /* presión de rocío: 1/P = y1/P1* + y2/P2* */
        const Pd = 1 / (z / FQ.Pi(a, T) + (1 - z) / FQ.Pi(b, T));
        level = p.P * 1e3;
        if (level >= Pb) { phase = 'líquido (por encima de la presión de burbuja)'; xl = z; yv = null; frac = 0; }
        else if (level <= Pd) { phase = 'vapor (por debajo de la presión de rocío)'; xl = null; yv = z; frac = 1; }
        else { phase = 'líquido + vapor'; xl = FQ.bisect((x) => FQ.bubbleP(a, b, x, T, 'ideal').P - level, 1e-9, 1 - 1e-9); yv = FQ.bubbleP(a, b, xl, T, 'ideal').y1; frac = (z - xl) / (yv - xl); }
        pl.hline(level / 1e3, { color: '--accent' });
        if (xl !== null) pl.dot(xl, level / 1e3, { color: '--c2' }); if (yv !== null) pl.dot(yv, level / 1e3, { color: '--c1' });
        pl.dot(z, level / 1e3, { color: '--accent', r: 5.5 });
      } else {
        const Tb = FQ.bubbleT(a, b, z, Pk, 'ideal').T, Td = FQ.bisect((t) => 1 / (z / FQ.Pi(a, t) + (1 - z) / FQ.Pi(b, t)) - Pk, Tb - 60, Tb + 60, 1e-12) ;
        level = T;
        const Tt = p.T;
        if (Tt <= Tb) { phase = 'líquido (por debajo de la temperatura de burbuja)'; xl = z; yv = null; frac = 0; }
        else if (Tt >= Td) { phase = 'vapor (por encima de la temperatura de rocío)'; xl = null; yv = z; frac = 1; }
        else { phase = 'líquido + vapor'; xl = FQ.bisect((x) => FQ.bubbleT(a, b, x, Pk, 'ideal').T - Tt, 1e-9, 1 - 1e-9); yv = FQ.bubbleT(a, b, xl, Pk, 'ideal').y1; frac = (z - xl) / (yv - xl); }
        pl.hline(Tt, { color: '--accent' });
        if (xl !== null) pl.dot(xl, Tt, { color: '--c2' }); if (yv !== null) pl.dot(yv, Tt, { color: '--c1' });
        pl.dot(z, Tt, { color: '--accent', r: 5.5 });
      }
      pl.legend([{ label: 'curva de burbuja (líquido)', color: '--c2' }, { label: 'curva de rocío (vapor)', color: '--c1' }], isP ? 'tr' : 'bl');
      sim.set('ph', phase);
      sim.set('x', (xl === null ? '—' : EM.fix(xl, 3)) + ' · ' + (yv === null ? '—' : EM.fix(yv, 3)));
      sim.set('v', frac === null ? '—' : EM.fix(frac, 3) + ' mol de vapor/mol');
      sim.set('a', EM.fix(FQ.Pi(a, isP ? T : Tm) / FQ.Pi(b, isP ? T : Tm), 3) + (isP ? '' : ' (a la temperatura media de ebullición)'));
    });
  });

  /* 8.2 McCabe–Thiele */
  const AL = { 'benceno|tolueno': 'Benceno – tolueno', 'hexano|heptano': 'Hexano – heptano', 'etanol|1-propanol': 'Etanol – 1-propanol' };
  EM.defineSim('mccabe', function (sim) {
    const cv = sim.canvas({ aspect: 1.3 });
    sim.select('pair', { label: 'Mezcla (α a la temperatura media de ebullición)', options: [['custom', 'α manual']].concat(Object.entries(AL)), value: 'benceno|tolueno' });
    sim.slider('al', { label: 'Volatilidad relativa α', min: 1.1, max: 6, step: 0.01, value: 2.4, fmt: (v) => v.toFixed(2) });
    sim.slider('zF', { label: 'Composición de la alimentación', min: 0.1, max: 0.9, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.slider('q', { label: 'Calidad de la alimentación q (1 = líquido saturado, 0 = vapor saturado)', min: 0, max: 1.5, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) });
    sim.slider('Rr', { label: 'Relación de reflujo R', min: 0.3, max: 8, step: 0.05, value: 2, fmt: (v) => v.toFixed(2) });
    sim.slider('xD', { label: 'Pureza del destilado', min: 0.8, max: 0.999, step: 0.001, value: 0.95, fmt: (v) => v.toFixed(3) });
    sim.slider('xB', { label: 'Composición del fondo', min: 0.001, max: 0.2, step: 0.001, value: 0.05, fmt: (v) => v.toFixed(3) });
    sim.out('N', 'Etapas teóricas (incluye el calderín) · etapa de alimentación', { hl: true });
    sim.out('Rm', 'Reflujo mínimo <i>R</i><sub>min</sub> · <i>R</i>/<i>R</i><sub>min</sub>');
    sim.out('Nm', 'Etapas mínimas (reflujo total, ecuación de Fenske)');
    sim.onChange = (id) => { if (id === 'pair' && sim.p.pair !== 'custom') { const [a, b] = sim.p.pair.split('|'), Tm = (FQ.Ti(a, 101325) + FQ.Ti(b, 101325)) / 2, ps = FQ.Pi(a, Tm) / FQ.Pi(b, Tm); sim.ctl.al.set(+Math.max(ps, 1 / ps).toFixed(2), true); } };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, m = FQ.mccabe(p.al, p.zF, p.q, p.Rr, p.xD, p.xB);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: 1, xlabel: 'x (líquido)', ylabel: 'y (vapor)', ml: 46 });
      pl.frame();
      pl.path([[0, 0], [1, 1]], { color: '--ink-3', width: 1.2 }); pl.fn(m.eq, { color: '--c1', width: 2.6 });
      /* rectas de operación y q */
      const sR = p.Rr / (p.Rr + 1), bR = p.xD / (p.Rr + 1), sS = (m.yi - p.xB) / (m.xi - p.xB);
      pl.path([[m.xi, m.yi], [p.xD, p.xD]], { color: '--c2', width: 1.8 }); pl.path([[p.xB, p.xB], [m.xi, m.yi]], { color: '--c4', width: 1.8 });
      if (Math.abs(p.q - 1) < 1e-9) pl.path([[p.zF, p.zF], [m.xi, m.yi]], { color: '--c3', width: 1.5, dash: [5, 4] }); else pl.path([[p.zF, p.zF], [m.xi, m.yi]], { color: '--c3', width: 1.5, dash: [5, 4] });
      let prev = [p.xD, p.xD];
      m.stages.forEach((s) => { pl.path([prev, [s[0], s[1]].map((v, i) => v)], { color: '--ink', width: 1.2 }); prev = [s[0], s[1]]; });
      pl.dot(p.xD, p.xD, { color: '--c2', label: 'xD', dx: -6, dy: 14, align: 'right' }); pl.dot(p.xB, p.xB, { color: '--c4', label: 'xB', dx: 6, dy: -8 }); pl.dot(p.zF, p.zF, { color: '--c3', label: 'zF', dx: 6, dy: 14 });
      pl.legend([{ label: 'equilibrio', color: '--c1' }, { label: 'recta de rectificación', color: '--c2' }, { label: 'recta de agotamiento', color: '--c4' }, { label: 'recta q', color: '--c3', dash: [5, 4] }], 'br');
      sim.set('N', (m.n >= 100 ? '≥ 100 (no converge: R ≤ R_min)' : m.n) + (m.n < 100 ? ' · etapa ' + m.feed : ''));
      sim.set('Rm', EM.fix(m.Rmin, 2) + ' · ' + EM.fix(p.Rr / m.Rmin, 2));
      sim.set('Nm', EM.fix(m.Nmin, 2));
    });
  });

  /* 8.3 Ley de Henry */
  const GN = { O2: 'Oxígeno', N2: 'Nitrógeno', CO2: 'Dióxido de carbono', CH4: 'Metano', H2: 'Hidrógeno', Ar: 'Argón', He: 'Helio', CO: 'Monóxido de carbono', N2O: 'Óxido nitroso', H2S: 'Sulfuro de hidrógeno' };
  const PAIRG = { O2: 0.2095, N2: 0.7808, CO2: 0.00042, Ar: 0.0093 };
  EM.defineSim('henry', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('g', { label: 'Gas disuelto en agua', options: Object.entries(GN), value: 'O2' });
    sim.slider('T', { label: 'Temperatura del agua', min: 273.15, max: 373, step: 0.5, value: 298.15, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.slider('p', { label: 'Presión parcial del gas', min: 0.001, max: 10, step: 0.001, value: 0.2095, unit: 'atm', log: true, fmt: (v) => (v < 1 ? v.toFixed(3) : v.toFixed(2)) });
    sim.out('c', 'Solubilidad molar <i>c</i> = <i>p</i>/<i>H</i>', { hl: true });
    sim.out('mg', 'Concentración en masa');
    sim.out('H', 'Constante de Henry <i>H</i> = <i>p</i>/<i>x</i> · <i>k</i><sub>H</sub> = <i>c</i>/<i>p</i>');
    sim.out('d', 'Δ<sub>sol</sub><i>H</i> = <i>R</i> d ln<i>H</i>/d(1/<i>T</i>)');
    const cOf = (g, p, T) => (p * 101325) / FQ.henryH(g, T) * (997 / 18.015); /* mol/L (aprox. diluida: 55.3 mol de agua por litro) */
    sim.onDraw(() => {
      const P = sim.p, ctx = cv.ctx, g = P.g;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 273, xmax: 373, ymin: 0, ymax: cOf(g, P.p, 273.15) * 1.1, xlabel: 'T (K)', ylabel: 'solubilidad (mol/L) a ' + EM.fix(P.p, 3) + ' atm', ml: 62, yfmt: (v) => EM.sci(v, 1) });
      pl.frame();
      pl.fn((T) => cOf(g, P.p, T), { color: '--c1', width: 2.6 });
      pl.vline(P.T, { color: '--accent' }); pl.dot(P.T, cOf(g, P.p, P.T), { color: '--accent' });
      const c = cOf(g, P.p, P.T), M = DAT.henry[g].M;
      sim.set('c', EM.sci(c, 3) + ' mol/L');
      sim.set('mg', EM.fix(c * M * 1e3, c * M * 1e3 < 10 ? 2 : 0) + ' mg/L' + (g === 'O2' ? ' (saturación de oxígeno disuelto)' : ''));
      sim.set('H', EM.sci(FQ.henryH(g, P.T) / 1e5, 3) + ' bar · ' + EM.sci(cOf(g, 1, P.T), 3) + ' mol/L·atm');
      sim.set('d', EM.fix((R * DAT.henry[g].B) / 1e3, 1) + ' kJ/mol');
    });
  });
})();
