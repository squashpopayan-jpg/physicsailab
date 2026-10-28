/* Capítulo 2 — Gases reales: virial y fugacidad */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, DAT = EM.dat, R = FQ.R;
  const NAMES = { N2: 'Nitrógeno', CH4: 'Metano', CO2: 'Dióxido de carbono', AR: 'Argón', C2H6: 'Etano', NH3: 'Amoníaco', H2: 'Hidrógeno' };
  const sub = (s) => s.replace(/(\d+)/g, '<sub>$1</sub>');

  /* 2.1 Segundo coeficiente virial */
  EM.defineSim('virial-B', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.select('g', { label: 'Gas', options: Object.keys(DAT.bvir).map((k) => [k, NAMES[k]]), value: 'N2' });
    sim.slider('T', { label: 'Temperatura', min: 100, max: 800, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('P', { label: 'Presión', min: 0.1, max: 20, step: 0.1, value: 5, unit: 'MPa', fmt: (v) => v.toFixed(1) });
    sim.out('B', '<i>B</i>(<i>T</i>): correlación · datos CoolProp', { hl: true });
    sim.out('TB', 'Temperatura de Boyle (correlación)');
    sim.out('Z', '<i>Z</i> = 1 + <i>BP</i>/<i>RT</i>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, g = p.g, c = FQ.crit[g];
      EM.draw.clear(cv);
      const pts = DAT.bvir[g];
      const Tmin = Math.min(...pts.map((q) => q[0])) * 0.95, Tmax = Math.max(...pts.map((q) => q[0])) * 1.05;
      const Bs = pts.map((q) => q[1]).concat([FQ.virialB(g, Tmin), FQ.virialB(g, Tmax)]);
      const ymin = Math.min(...Bs) * 1.08, ymax = Math.max(...Bs, 10) * 1.3;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: Tmin, xmax: Tmax, ymin, ymax, xlabel: 'T (K)', ylabel: 'B (cm³/mol)', ml: 60 });
      pl.frame();
      pl.fn((T) => FQ.virialB(g, T), { color: '--c1', width: 2.2 });
      pts.forEach((q) => pl.dot(q[0], q[1], { color: '--c2', r: 3.6 }));
      const TB = FQ.boyleT(g);
      if (TB < Tmax) pl.vline(TB, { color: '--c3', label: 'T_Boyle = ' + TB.toFixed(0) + ' K' });
      pl.hline(0, { color: '--ink-3' });
      const T = EM.M.clamp(p.T, Tmin, Tmax);
      pl.dot(T, FQ.virialB(g, T), { color: '--accent' });
      pl.legend([{ label: 'Pitzer–Curl (T_c, P_c, ω)', color: '--c1' }, { label: 'ecuación de referencia (CoolProp)', color: '--c2', kind: 'dot' }], 'br');
      const B = FQ.virialB(g, p.T);
      let near = pts.reduce((a, q) => (Math.abs(q[0] - p.T) < Math.abs(a[0] - p.T) ? q : a), pts[0]);
      sim.set('B', EM.fix(B, 1) + ' cm³/mol · (dato más cercano a ' + EM.fix(near[0], 0) + ' K: ' + EM.fix(near[1], 1) + ')');
      sim.set('TB', TB.toFixed(0) + ' K  (' + (TB / c.Tc).toFixed(2) + ' T_c)');
      sim.set('Z', EM.fix(FQ.virialZ(g, p.T, p.P * 1e6), 4) + (Math.abs(p.P * 1e6 * B * 1e-6 / (R * p.T)) > 0.3 ? ' (fuera de la validez del truncamiento)' : ''));
    });
  });

  /* 2.2 Carta de compresibilidad generalizada */
  EM.defineSim('carta-z', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('w', { label: 'Factor acéntrico ω de las curvas (Peng–Robinson)', min: -0.2, max: 0.4, step: 0.005, value: 0.0, fmt: (v) => v.toFixed(3) });
    sim.check('pts', { label: 'Datos de CoolProp: Ar, N₂, CH₄, CO₂', value: true });
    sim.out('w', 'Factores acéntricos (Ar · N₂ · CH₄ · CO₂)', { hl: true });
    sim.out('d', 'Desviación máxima de los datos respecto de las curvas ω = 0');
    const Z = DAT.zcs, gases = ['AR', 'N2', 'CH4', 'CO2'], cols = ['--c1', '--c3', '--c4', '--c2'], Tcols = Z.Tr;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 8, ymin: 0.2, ymax: 1.5, xlabel: 'P_r = P/P_c', ylabel: 'Z = PV/(nRT)', ml: 52 });
      pl.frame();
      pl.hline(1, { color: '--ink-3' });
      Z.Tr.forEach((Tr) => {
        pl.fn((Pr) => FQ.prZred(Tr, Pr, p.w), { color: '--ink', width: 1.6, from: 0.02 });
        pl.label(7.85, FQ.prZred(Tr, 7.85, p.w), 'T_r = ' + Tr, { size: 10.5, align: 'right', dy: -8, color: '--ink-2' });
      });
      if (p.pts) gases.forEach((g, gi) => Z.gas[g].forEach((row, ti) => row.forEach((z, k) => pl.dot(Z.Pr[k], z, { color: cols[gi], r: 3.2 }))));
      pl.legend(gases.map((g, i) => ({ label: NAMES[g], color: cols[i], kind: 'dot' })).concat([{ label: 'Peng–Robinson', color: '--ink' }]), 'tr');
      sim.set('w', gases.map((g) => FQ.crit[g].w.toFixed(3)).join(' · '));
      let m = 0;
      gases.forEach((g) => Z.gas[g].forEach((row, ti) => row.forEach((z, k) => { m = Math.max(m, Math.abs(z - FQ.prZred(Z.Tr[ti], Z.Pr[k], 0)) / z); })));
      sim.set('d', EM.fix(100 * m, 1) + ' % (los gases siguen casi la misma carta)');
    });
  });

  /* 2.3 Fugacidad */
  EM.defineSim('fugacidad', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('g', { label: 'Gas', options: Object.keys(DAT.phi).map((k) => [k, NAMES[k]]), value: 'CO2' });
    sim.select('T', { label: 'Temperatura', options: Object.keys(DAT.phi.CO2).map((k) => [k, k + ' K']), value: '320' });
    sim.slider('P', { label: 'Presión', min: 0.1, max: 50, step: 0.1, value: 5, unit: 'MPa', fmt: (v) => v.toFixed(1), log: true });
    sim.out('phi', 'Coeficiente de fugacidad φ: Peng–Robinson · virial', { hl: true });
    sim.out('f', 'Fugacidad <i>f</i> = φ<i>P</i> (PR)');
    sim.out('dmu', 'μ − μ(gas ideal) = <i>RT</i> ln φ');
    sim.out('ref', 'Dato de referencia más cercano (CoolProp)');
    sim.onChange = (id) => {
      if (id === 'g') {
        const ts = Object.keys(DAT.phi[sim.p.g]); const sel = sim.ctl.T.input; sel.innerHTML = '';
        ts.forEach((t) => { const o = document.createElement('option'); o.value = t; o.textContent = t + ' K'; sel.append(o); });
        sim.p.T = ts[0]; sel.value = ts[0];
      }
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, g = p.g, T = +p.T, pts = DAT.phi[g][p.T];
      EM.draw.clear(cv);
      const pr = (P) => FQ.prPure(g, T, P * 1e6, 'V').phi, vi = (P) => FQ.virialPhi(g, T, P * 1e6);
      let lo = 1, hi = 1;
      for (let i = 0; i <= 60; i++) { const P = 0.1 * Math.pow(500, i / 60); [pr(P), ...pts.map((q) => q[1])].forEach((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); }); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.1, xmax: 50, ymin: Math.max(0.05, lo * 0.85), ymax: Math.min(3, hi * 1.1), xlog: true, xlabel: 'P (MPa)', ylabel: 'φ = f/P', ml: 52 });
      pl.frame();
      pl.hline(1, { color: '--ink-3', label: 'gas ideal' });
      pl.fn(pr, { color: '--c1', width: 2.4, n: 140 });
      pl.fn((P) => Math.min(vi(P), 3), { color: '--c3', width: 1.8, dash: [6, 4], n: 140 });
      pts.forEach((q) => pl.dot(q[0], q[1], { color: '--c2', r: 3.8 }));
      pl.vline(p.P, { color: '--accent' });
      pl.legend([{ label: 'Peng–Robinson', color: '--c1' }, { label: 'virial truncado en B', color: '--c3', dash: [6, 4] }, { label: 'CoolProp (IAPWS/Span–Wagner…)', color: '--c2', kind: 'dot' }], 'bl');
      const a = pr(p.P), b = vi(p.P);
      sim.set('phi', EM.fix(a, 4) + ' · ' + EM.fix(b, 4));
      sim.set('f', EM.fix(a * p.P, 3) + ' MPa (P = ' + EM.fix(p.P, 2) + ' MPa)');
      sim.set('dmu', EM.fix((R * T * Math.log(a)) / 1e3, 3) + ' kJ/mol');
      const nr = pts.reduce((x, q) => (Math.abs(Math.log(q[0] / p.P)) < Math.abs(Math.log(x[0] / p.P)) ? q : x), pts[0]);
      sim.set('ref', 'a ' + nr[0] + ' MPa: φ = ' + EM.fix(nr[1], 4) + ', Z = ' + EM.fix(nr[2], 4));
    });
  });

  /* 2.4 Fugacidad en mezclas binarias */
  const PAIRS = { 'CO2/CH4': ['CO2', 'CH4'], 'N2/H2': ['N2', 'H2'], 'CH4/C2H6': ['CH4', 'C2H6'], 'N2/CO2': ['N2', 'CO2'] };
  EM.defineSim('mezcla-phi', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.select('pair', { label: 'Mezcla binaria', options: Object.keys(PAIRS).map((k) => [k, k.replace('/', ' – ')]), value: 'CO2/CH4' });
    sim.slider('T', { label: 'Temperatura', min: 250, max: 600, step: 1, value: 350, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('P', { label: 'Presión', min: 1, max: 30, step: 0.5, value: 10, unit: 'MPa', fmt: (v) => v.toFixed(1) });
    sim.slider('y', { label: 'Fracción molar del primer gas', min: 0.01, max: 0.99, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.out('phi', 'φ en la mezcla (1ª · 2ª especie)', { hl: true });
    sim.out('lr', 'φ puro a la misma <i>P</i> (Lewis–Randall)');
    sim.out('Z', '<i>Z</i> de la mezcla · promedio lineal de los <i>Z</i> puros');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, sp = PAIRS[p.pair], P = p.P * 1e6, T = p.T;
      EM.draw.clear(cv);
      const phis = [[], []], xs = [];
      for (let i = 1; i < 100; i++) { const y = i / 100, r = FQ.prMix(sp, [y, 1 - y], T, P); xs.push(y); phis[0].push(r.phi[0]); phis[1].push(r.phi[1]); }
      const p1 = FQ.prPure(sp[0], T, P).phi, p2 = FQ.prPure(sp[1], T, P).phi;
      const all = phis[0].concat(phis[1], [p1, p2]);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: Math.min(...all) * 0.95, ymax: Math.max(...all) * 1.05, xlabel: 'fracción molar de ' + sp[0], ylabel: 'coeficiente de fugacidad φ', ml: 54 });
      pl.frame();
      pl.xy(xs, phis[0], { color: '--c1', width: 2.4 }); pl.xy(xs, phis[1], { color: '--c2', width: 2.4 });
      pl.hline(p1, { color: '--c1', dash: [2, 4], width: 1.2 }); pl.hline(p2, { color: '--c2', dash: [2, 4], width: 1.2 });
      const r = FQ.prMix(sp, [p.y, 1 - p.y], T, P);
      pl.vline(p.y, { color: '--accent' }); pl.dot(p.y, r.phi[0], { color: '--c1' }); pl.dot(p.y, r.phi[1], { color: '--c2' });
      pl.legend([{ label: 'φ de ' + sp[0] + ' en la mezcla', color: '--c1' }, { label: 'φ de ' + sp[1] + ' en la mezcla', color: '--c2' }, { label: 'φ de los gases puros (Lewis–Randall)', color: '--ink-3', dash: [2, 4] }], 'tr');
      sim.set('phi', EM.fix(r.phi[0], 4) + ' · ' + EM.fix(r.phi[1], 4));
      sim.set('lr', EM.fix(p1, 4) + ' · ' + EM.fix(p2, 4));
      const z1 = FQ.prPure(sp[0], T, P).Z, z2 = FQ.prPure(sp[1], T, P).Z;
      sim.set('Z', EM.fix(r.Z, 4) + ' · ' + EM.fix(p.y * z1 + (1 - p.y) * z2, 4));
    });
  });
})();
