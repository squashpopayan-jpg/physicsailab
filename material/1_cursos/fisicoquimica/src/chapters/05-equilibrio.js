/* Capítulo 5 — Equilibrio químico */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, R = FQ.R;

  /* 5.1 La energía de Gibbs en función del avance: N2O4 ⇌ 2 NO2 */
  EM.defineSim('g-xi', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('T', { label: 'Temperatura', min: 250, max: 500, step: 1, value: 298, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('P', { label: 'Presión total', min: 0.05, max: 20, step: 0.01, value: 1, unit: 'bar', log: true, fmt: (v) => (v < 1 ? v.toFixed(2) : v.toFixed(1)) });
    sim.slider('x', { label: 'Avance ξ de la fotografía', min: 0.001, max: 0.999, step: 0.001, value: 0.1, fmt: (v) => v.toFixed(3) });
    sim.check('parts', { label: 'Separar la parte química y la de mezcla', value: false });
    sim.out('K', 'Constante de equilibrio <i>K</i>', { hl: true });
    sim.out('al', 'Avance de equilibrio ξ<sub>eq</sub> (grado de disociación α)');
    sim.out('Q', 'Cociente de reacción <i>Q</i> en la fotografía');
    sim.out('dG', 'Δ<sub>r</sub><i>G</i> = <i>RT</i> ln(<i>Q</i>/<i>K</i>) (pendiente de la curva)');
    sim.out('y', 'Composición en equilibrio');
    const t = FQ.tt, nu = { 'N2O4(g)': -1, 'NO2(g)': 2 };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, T = p.T, Pp = p.P;
      EM.draw.clear(cv);
      const H = 2 * t['NO2(g)'].H - t['N2O4(g)'].H, S = 2 * t['NO2(g)'].S - t['N2O4(g)'].S;
      const dG0 = H * 1e3 - T * S, lnK = -dG0 / (R * T), K = Math.exp(lnK);
      const chem = (x) => (x * dG0) / (R * T), mix = (x) => (1 - x) * Math.log((1 - x) / (1 + x)) + 2 * x * Math.log((2 * x) / (1 + x)) + x * Math.log(Pp);
      const g = (x) => chem(x) + mix(x);
      const eq = FQ.bisect((x) => dG0 / (R * T) + Math.log((4 * x * x * Pp) / ((1 - x) * (1 + x))), 1e-12, 1 - 1e-12, 1e-14);
      const xs = [], ys = [], cs = [], ms = [];
      for (let i = 1; i < 400; i++) { const x = i / 400; xs.push(x); ys.push(g(x)); cs.push(chem(x)); ms.push(mix(x)); }
      const all = ys.concat(p.parts ? cs.concat(ms) : []); const lo = Math.min(...all), hi = Math.max(...all);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: lo - (hi - lo) * 0.1 - 0.1, ymax: hi + (hi - lo) * 0.1 + 0.1, xlabel: 'avance ξ (mol de N₂O₄ disociado por mol inicial)', ylabel: 'ΔG/RT respecto de N₂O₄ puro', ml: 56 });
      pl.frame();
      if (p.parts) { pl.xy(xs, cs, { color: '--c4', width: 1.6, dash: [6, 4] }); pl.xy(xs, ms, { color: '--c1', width: 1.6, dash: [2, 4] }); }
      pl.xy(xs, ys, { color: '--ink', width: 2.6 });
      pl.dot(eq, g(eq), { color: '--c3', r: 6, label: 'equilibrio: ξ = ' + EM.fix(eq, 3), dy: 18, align: 'center', dx: 0 });
      const x0 = p.x, Q = (4 * x0 * x0 * Pp) / ((1 - x0) * (1 + x0)), slope = Math.log(Q / K);
      pl.dot(x0, g(x0), { color: '--accent' });
      const dx = 0.12; pl.path([[x0 - dx, g(x0) - slope * dx], [x0 + dx, g(x0) + slope * dx]], { color: '--accent', width: 2 });
      const items = [{ label: 'G total', color: '--ink', width: 2.6 }];
      if (p.parts) items.push({ label: 'parte química: ξ·ΔG°/RT', color: '--c4', dash: [6, 4] }, { label: 'mezcla: −TΔS_mez', color: '--c1', dash: [2, 4] });
      items.push({ label: 'pendiente = Δ_rG/RT', color: '--accent' });
      pl.legend(items, 'tr');
      sim.set('K', EM.fix(K, K < 1 ? 4 : 3) + ' (Δ<sub>r</sub>G° = ' + EM.fix(dG0 / 1e3, 2) + ' kJ/mol)');
      sim.set('al', EM.fix(eq, 4) + ' · α = ' + EM.fix(eq, 3));
      sim.set('Q', EM.fix(Q, 4) + (Q < K ? ' < K: avanza hacia productos' : ' > K: retrocede'));
      sim.set('dG', EM.fix((R * T * slope) / 1e3, 2) + ' kJ/mol');
      sim.set('y', 'N₂O₄ ' + EM.fix(((1 - eq) / (1 + eq)) * 100, 1) + ' % · NO₂ ' + EM.fix(((2 * eq) / (1 + eq)) * 100, 1) + ' %');
    });
  });

  /* 5.2 Ecuación de van't Hoff */
  const VR = {
    wgs: ['CO + H₂O ⇌ CO₂ + H₂', { CO: -1, H2O: -1, CO2: 1, H2: 1 }],
    haber: ['½ N₂ + 3/2 H₂ ⇌ NH₃', { N2: -0.5, H2: -1.5, NH3: 1 }],
    smr: ['CH₄ + H₂O ⇌ CO + 3 H₂', { CH4: -1, H2O: -1, CO: 1, H2: 3 }],
    meoh: ['CO + 2 H₂ ⇌ CH₃OH', { CO: -1, H2: -2, CH3OH: 1 }],
    no: ['½ N₂ + ½ O₂ ⇌ NO', { N2: -0.5, O2: -0.5, NO: 1 }],
    h2o: ['H₂ + ½ O₂ ⇌ H₂O', { H2: -1, O2: -0.5, H2O: 1 }],
    hyd: ['C₂H₄ + H₂ ⇌ C₂H₆', { C2H4: -1, H2: -1, C2H6: 1 }]
  };
  EM.defineSim('vant-hoff', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('r', { label: 'Reacción en fase gaseosa', options: Object.entries(VR).map(([k, v]) => [k, v[0]]), value: 'wgs' });
    sim.slider('T', { label: 'Temperatura', min: 400, max: 2500, step: 5, value: 900, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.check('lin', { label: 'Recta con Δ<sub>r</sub>H° constante (la de 298 K)', value: true });
    sim.out('K', 'ln <i>K</i> · <i>K</i>', { hl: true });
    sim.out('H', 'Δ<sub>r</sub><i>H</i>°(<i>T</i>) por la pendiente de ln <i>K</i> frente a 1/<i>T</i>');
    sim.out('H2', 'Δ<sub>r</sub><i>H</i>°(<i>T</i>) directo (polinomios NASA)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, nu = VR[p.r][1], T = p.T;
      EM.draw.clear(cv);
      const f = (t) => FQ.lnK(nu, t), xs = [], ys = [], yl = [];
      const H298 = FQ.dH(nu, 298.15), S298 = FQ.dS(nu, 298.15);
      for (let t = 400; t <= 2500; t += 20) { xs.push(1000 / t); ys.push(f(t) / Math.LN10); yl.push((-(H298 - t * S298) / (R * t)) / Math.LN10); }
      const all = ys.concat(p.lin ? yl : []), lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.08;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.4, xmax: 2.5, ymin: lo - pad, ymax: hi + pad, xlabel: '1000/T (K⁻¹)', ylabel: 'log₁₀ K', ml: 54 });
      pl.frame();
      if (p.lin) pl.xy(xs, yl, { color: '--c4', width: 1.4, dash: [6, 4] });
      pl.xy(xs, ys, { color: '--c1', width: 2.5 });
      pl.hline(0, { color: '--ink-3', label: 'K = 1' });
      const T1 = T * 0.99, T2 = T * 1.01, sl = (f(T2) - f(T1)) / (1 / T2 - 1 / T1), Hs = -R * sl; /* d ln K / d(1/T) = −ΔH°/R */
      pl.dot(1000 / T, f(T) / Math.LN10, { color: '--accent' });
      const x0 = 1000 / T, y0 = f(T) / Math.LN10, ds = 0.25, m = sl / (Math.LN10 * 1000);
      pl.path([[x0 - ds, y0 - m * ds], [x0 + ds, y0 + m * ds]], { color: '--accent', width: 2 });
      pl.legend([{ label: 'log K exacto (NASA)', color: '--c1' }, { label: 'ΔH° constante', color: '--c4', dash: [6, 4] }, { label: 'tangente: pendiente = −ΔH°/(R ln 10)', color: '--accent' }], 'tr');
      sim.set('K', EM.fix(f(T), 3) + ' · ' + EM.sci(Math.exp(f(T)), 3));
      sim.set('H', EM.fix(Hs / 1e3, 2) + ' kJ/mol');
      sim.set('H2', EM.fix(FQ.dH(nu, T) / 1e3, 2) + ' kJ/mol');
    });
  });

  /* 5.3 Síntesis de amoníaco: rendimiento frente a T y P */
  const LD = { 673.15: { 10: 3.85, 100: 25.12, 300: 47.0 }, 723.15: { 10: 2.04, 100: 16.35, 300: 35.5 }, 773.15: { 10: 1.2, 100: 10.6, 300: 26.4 } };
  EM.defineSim('haber', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('P', { label: 'Presión', min: 1, max: 1000, step: 1, value: 200, unit: 'bar', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura de la lectura', min: 450, max: 900, step: 5, value: 700, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.check('real', { label: 'Gas real (Peng–Robinson) en lugar de ideal', value: true });
    sim.check('ld', { label: 'Datos experimentales de Larson y Dodge (1923)', value: true });
    sim.out('y', 'Fracción molar de NH₃ en el equilibrio: ideal · real', { hl: true });
    sim.out('xi', 'Conversión del N₂ (ξ)');
    sim.out('K', 'Constante de equilibrio <i>K</i><sub>p</sub> de ½N₂ + 3/2H₂ ⇌ NH₃');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, P = p.P * 1e5;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 450, xmax: 900, ymin: 0, ymax: 100, xlabel: 'T (K)', ylabel: '% molar de NH₃ en el equilibrio', ml: 52 });
      pl.frame();
      const Ts = [], ya = [], yb = [];
      for (let T = 450; T <= 900; T += 10) { Ts.push(T); ya.push(100 * FQ.haber(T, P, false).y[2]); yb.push(100 * FQ.haber(T, P, true).y[2]); }
      pl.xy(Ts, ya, { color: '--c1', width: 2.2, dash: p.real ? [6, 4] : [] });
      if (p.real) pl.xy(Ts, yb, { color: '--c2', width: 2.6 });
      if (p.ld) for (const T of Object.keys(LD)) { const ent = Object.entries(LD[T]).find(([pp]) => Math.abs(Math.log(pp / p.P)) < 0.35); if (ent) pl.dot(+T, ent[1], { color: '--c3', r: 5, label: 'exp. ' + ent[0] + ' atm', dy: -10 }); }
      pl.vline(p.T, { color: '--accent' });
      pl.legend([{ label: 'gas ideal', color: '--c1', dash: p.real ? [6, 4] : [] }, { label: 'Peng–Robinson', color: '--c2' }, { label: 'experimento', color: '--c3', kind: 'dot' }], 'tr');
      const a = FQ.haber(p.T, P, false), b = FQ.haber(p.T, P, true);
      sim.set('y', EM.fix(100 * a.y[2], 2) + ' % · ' + EM.fix(100 * b.y[2], 2) + ' %');
      sim.set('xi', EM.fix((p.real ? b : a).xi * 100, 1) + ' % del N₂ (ξ = ' + EM.fix((p.real ? b : a).xi, 3) + ')');
      sim.set('K', EM.sci(a.K, 3));
    });
  });

  /* 5.4 Reformado de metano: equilibrios simultáneos por minimización de G */
  EM.defineSim('reformado', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('P', { label: 'Presión', min: 1, max: 50, step: 0.5, value: 20, unit: 'bar', fmt: (v) => v.toFixed(1) });
    sim.slider('sc', { label: 'Relación vapor/carbono (H₂O/CH₄)', min: 1, max: 6, step: 0.1, value: 3, fmt: (v) => v.toFixed(1) });
    sim.slider('T', { label: 'Temperatura de la lectura', min: 500, max: 1500, step: 5, value: 1100, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('conv', 'Conversión del CH₄ · rendimiento de H₂ (mol H₂ por mol CH₄)', { hl: true });
    sim.out('x', 'Fracciones molares: CH₄ · H₂O · CO · CO₂ · H₂');
    sim.out('r', 'Relación H₂/CO del gas de síntesis');
    const SP = ['CH4', 'H2O', 'CO', 'CO2', 'H2'], COL = ['--c4', '--c1', '--c2', '--c5', '--c3'], NM = ['CH₄', 'H₂O', 'CO', 'CO₂', 'H₂'];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, P = p.P * 1e5;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 500, xmax: 1500, ymin: 0, ymax: 1, xlabel: 'T (K)', ylabel: 'fracción molar en el equilibrio', ml: 52 });
      pl.frame();
      const Ts = [], ys = SP.map(() => []);
      for (let T = 500; T <= 1500; T += 20) { const r = FQ.equil(SP, { CH4: 1, H2O: p.sc }, T, P); Ts.push(T); SP.forEach((s, i) => ys[i].push(r.x[s])); }
      SP.forEach((s, i) => pl.xy(Ts, ys[i], { color: COL[i], width: 2.3 }));
      pl.vline(p.T, { color: '--accent' });
      pl.legend(SP.map((s, i) => ({ label: NM[i], color: COL[i] })), 'tr');
      const r = FQ.equil(SP, { CH4: 1, H2O: p.sc }, p.T, P), nch4 = r.n.CH4 / 1, tot = r.ntot;
      const nH2 = r.n.H2;
      sim.set('conv', EM.fix(100 * (1 - nch4), 1) + ' % · ' + EM.fix(nH2, 2) + ' mol/mol');
      sim.set('x', SP.map((s) => EM.fix(100 * r.x[s], 1) + ' %').join(' · '));
      sim.set('r', r.n.CO > 1e-6 ? EM.fix(r.n.H2 / r.n.CO, 2) : '—');
    });
  });
})();
