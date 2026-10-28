/* Capítulo 25 — Hartree–Fock desde cero */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, H = FQ.scf, EV = FQ.qm.HARTREE_EV, BOHR = H.BOHR;
  const E_EXACT_H2 = -1.17447;

  /* 25.1 H₂: RHF y UHF, disociación */
  const cacheH2 = {};
  EM.defineSim('h2-hf', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('b', { label: 'Base', options: [['sto-3g', 'STO-3G'], ['6-31g', '6-31G']], value: 'sto-3g' });
    sim.slider('R', { label: 'Distancia internuclear R', min: 0.5, max: 8, step: 0.05, value: 1.4, unit: 'bohr', fmt: (v) => v.toFixed(2) });
    sim.out('E', 'Energía RHF · UHF a este <i>R</i> (hartree)', { hl: true });
    sim.out('s2', '⟨<i>S</i>²⟩ del UHF (0 = singlete puro; 1 = mezcla singlete–triplete) · orbitales ε (RHF)');
    sim.out('min', 'Mínimo RHF: <i>R</i><sub>e</sub> (bohr, Å) · <i>E</i> · energía de disociación respecto del mínimo UHF a <i>R</i> grande');
    sim.out('lim', 'Límite <i>R</i> = 10 bohr: RHF · UHF · 2<i>E</i>(H) (la suma de átomos separados)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, b = p.b;
      if (!cacheH2[b]) { const Rs = [], rh = [], uh = []; for (let R = 0.5; R <= 8.001; R += 0.1) { Rs.push(R); rh.push(H.scf(H.h2(R), b).E); uh.push(H.uhf(H.h2(R), b).E); } const i = rh.indexOf(Math.min(...rh)); let Re = Rs[i]; { let lo = Rs[Math.max(0, i - 1)], hi = Rs[Math.min(Rs.length - 1, i + 1)]; const g = 0.618034; let c = hi - g * (hi - lo), d = lo + g * (hi - lo); for (let k = 0; k < 40; k++) { if (H.scf(H.h2(c), b).E < H.scf(H.h2(d), b).E) hi = d; else lo = c; c = hi - g * (hi - lo); d = lo + g * (hi - lo); } Re = 0.5 * (lo + hi); } const Em = H.scf(H.h2(Re), b).E, E10 = [H.scf(H.h2(10), b).E, H.uhf(H.h2(10), b).E, 2 * H.uhf([{ Z: 1, xyz: [0, 0, 0] }], b, { nbeta: 0 }).E]; cacheH2[b] = { Rs, rh, uh, Re, Em, E10 }; }
      const c = cacheH2[b];
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.64, h: cv.h, xmin: 0.5, xmax: 8, ymin: -1.22, ymax: -0.5, xlabel: 'R (bohr)', ylabel: 'energía total (hartree)', ml: 58, title: 'Curva de energía potencial del H₂' });
      pl.frame(); pl.xy(c.Rs, c.rh, { color: '--c2', width: 2.8 }); pl.xy(c.Rs, c.uh, { color: '--c1', width: 2.8, dash: [6, 4] }); pl.hline(-1, { color: '--ink-3', dash: [3, 3], label: 'exacto en R → ∞' }); pl.dot(1.4011, E_EXACT_H2, { color: '--accent', r: 5 });
      pl.legend([{ label: 'RHF', color: '--c2' }, { label: 'UHF', color: '--c1', dash: [6, 4] }, { label: 'exacto (James–Coolidge)', color: '--accent', kind: 'dot' }], 'tr'); pl.vline(p.R, { color: '--ink-3', dash: [3, 3] });
      const r = H.scf(H.h2(p.R), b), u = H.uhf(H.h2(p.R), b);
      /* niveles ε */
      const pl2 = new EM.Plot(ctx, { x: cv.w * 0.68, y: 0, w: cv.w * 0.32, h: cv.h, xmin: 0, xmax: 1, ymin: -1.2, ymax: 1.6, xlabel: '', ylabel: 'ε (hartree)', ml: 44, mr: 8, title: 'Orbitales RHF' });
      pl2.frame(); r.eps.forEach((e, k) => { pl2.path([[0.2, e], [0.8, e]], { color: k < r.nocc ? '--c2' : '--ink-3', width: 3 }); if (k < r.nocc) EM.text(ctx, '↑↓', pl2.X(0.5), pl2.Y(e) - 6, { size: 12, align: 'center', color: '--ink' }); });
      sim.set('E', EM.fix(r.E, 5) + ' · ' + EM.fix(u.E, 5));
      sim.set('s2', EM.fix(u.S2, 3) + ' · ' + r.eps.slice(0, 2).map((e) => EM.fix(e, 3)).join(', '));
      sim.set('min', EM.fix(c.Re, 3) + ' bohr (' + EM.fix(c.Re * BOHR, 3) + ' Å) · ' + EM.fix(c.Em, 5) + ' Eh · ' + EM.fix((c.E10[1] - c.Em) * EV, 2) + ' eV (RHF a R = 10 daría ' + EM.fix((c.E10[0] - c.Em) * EV, 2) + ' eV)');
      sim.set('lim', c.E10.map((e) => EM.fix(e, 4)).join(' · '));
    });
  });

  /* 25.2 Agua: Hartree–Fock con STO-3G o 6-31G */
  const OPT = { 'sto-3g': [1.8697, 100.03, -74.96590], '6-31g': [1.7946, 111.54, -75.98536] };
  const cacheW = {};
  EM.defineSim('agua-hf', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('b', { label: 'Base', options: [['sto-3g', 'STO-3G (7 funciones)'], ['6-31g', '6-31G (13 funciones)']], value: 'sto-3g' });
    const sr = sim.slider('r', { label: 'Distancia O–H', min: 1.4, max: 2.6, step: 0.01, value: 1.809, unit: 'bohr', fmt: (v) => v.toFixed(3) });
    const sa = sim.slider('a', { label: 'Ángulo H–O–H', min: 70, max: 180, step: 0.5, value: 104.52, unit: '°', fmt: (v) => v.toFixed(1) });
    sim.button('Ir a la geometría optimizada de esta base', () => { const o = OPT[sim.p.b]; sr.set(o[0], true); sa.set(o[1], true); }, { newRow: true });
    sim.button('Calcular las curvas de energía (unos segundos)', () => { const b = sim.p.b, o = OPT[b]; if (cacheW[b] && cacheW[b].done) return; const c = (cacheW[b] = { as: [], ea: [], rs: [], er: [], done: false }); let k = 0; const angs = [80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180], rr = [1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5]; const step = () => { if (k < angs.length) { c.as.push(angs[k]); c.ea.push(H.scf(H.water(o[0], angs[k]), b).E); } else if (k < angs.length + rr.length) { const x = rr[k - angs.length]; c.rs.push(x); c.er.push(H.scf(H.water(x, o[1]), b).E); } else { c.done = true; sim.redraw(); return; } k++; sim.redraw(); setTimeout(step, 5); }; setTimeout(step, 20); }, { newRow: true });
    sim.out('E', 'Energía total HF (hartree) · energía electrónica · repulsión nuclear', { hl: true });
    sim.out('mu', 'Momento dipolar (D; exp. 1.85) · cargas de Mulliken O, H');
    sim.out('ip', 'ε<sub>HOMO</sub> (Koopmans: primera ionización ≈ −ε<sub>HOMO</sub>; exp. 12.62 eV) · iteraciones SCF');
    sim.out('opt', 'Geometría optimizada de la base · energía mínima · literatura');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H_ = cv.h, r = H.scf(H.water(p.r, p.a), p.b), o = OPT[p.b];
      EM.draw.clear(cv);
      const c = cacheW[p.b] || { as: [], ea: [], rs: [], er: [] }, ea0 = c.ea.length ? c.ea : [r.E], er0 = c.er.length ? c.er : [r.E];
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.34, h: H_, xmin: 75, xmax: 185, ymin: Math.min(...ea0, r.E) - 0.003, ymax: Math.max(...ea0, r.E) + 0.003, xlabel: 'ángulo H–O–H (°)', ylabel: 'E (Eh)', ml: 62, title: 'Flexión (r óptimo)' }); pl.frame(); if (c.as.length) pl.xy(c.as, c.ea, { color: '--c1', width: 2.6 }); pl.vline(p.a, { color: '--accent', dash: [3, 3] });
      const pl3 = new EM.Plot(ctx, { x: W * 0.37, y: 0, w: W * 0.33, h: H_, xmin: 1.45, xmax: 2.55, ymin: Math.min(...er0, r.E) - 0.003, ymax: Math.max(...er0, r.E) + 0.003, xlabel: 'r(O–H) (bohr)', ylabel: '', ml: 56, mr: 6, title: 'Tensión (ángulo óptimo)' }); pl3.frame(); if (c.rs.length) pl3.xy(c.rs, c.er, { color: '--c2', width: 2.6 }); pl3.vline(p.r, { color: '--accent', dash: [3, 3] });
      if (!c.as.length) EM.text(ctx, 'Pulse «Calcular las curvas»', W * 0.35, H_ / 2, { size: 12, align: 'center', color: '--ink-3' });
      const pl2 = new EM.Plot(ctx, { x: W * 0.73, y: 0, w: W * 0.27, h: H_, xmin: 0, xmax: 1, ymin: -1.6, ymax: 1.2, xlabel: '', ylabel: 'ε (hartree)', ml: 44, mr: 8, title: 'Orbitales' }); pl2.frame();
      const lab = ['1a₁', '2a₁', '1b₂', '3a₁', '1b₁', '4a₁', '2b₂'];
      r.eps.forEach((e, k) => { if (e < -1.6 || e > 1.2) return; pl2.path([[0.2, e], [0.8, e]], { color: k < r.nocc ? '--c3' : '--ink-3', width: 3 }); if (k < r.nocc) EM.text(ctx, '↑↓', pl2.X(0.5), pl2.Y(e) - 5, { size: 11, align: 'center' }); if (k < 7) EM.text(ctx, lab[k], pl2.X(0.85), pl2.Y(e) + 4, { size: 10, color: '--ink-3' }); });
      sim.set('E', EM.fix(r.E, 6) + ' · ' + EM.fix(r.Eel, 4) + ' · ' + EM.fix(r.Enuc, 4));
      sim.set('mu', EM.fix(r.muD, 3) + ' · ' + EM.fix(r.charge[0], 3) + ', ' + EM.fix(r.charge[1], 3));
      sim.set('ip', EM.fix(r.eps[r.nocc - 1], 4) + ' Eh = ' + EM.fix(-r.eps[r.nocc - 1] * EV, 2) + ' eV · ' + r.iters);
      sim.set('opt', EM.fix(o[0] * BOHR, 4) + ' Å, ' + EM.fix(o[1], 2) + '° · ' + EM.fix(o[2], 5) + ' Eh · ' + (p.b === 'sto-3g' ? '0.9894 Å, 100.0°, −74.9659 (Hehre–Pople)' : '0.9496 Å, 111.5°, −75.9854'));
    });
  });
})();
