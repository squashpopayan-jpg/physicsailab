/* Capítulo 12 — Disoluciones de electrolitos */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, R = FQ.R;

  /* 12.0 Energía de solvatación de Born */
  const IONS = { 'Li+': [0.60, 1, -475], 'Na+': [0.95, 1, -365], 'K+': [1.33, 1, -295], 'Cs+': [1.69, 1, -250], 'F-': [1.36, -1, -465], 'Cl-': [1.81, -1, -340], 'Br-': [1.95, -1, -315], 'I-': [2.16, -1, -275] };
  EM.defineSim('born-solv', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('dc', { label: 'Corrección de Latimer del radio (cationes; aniones +0.10 Å)', min: 0, max: 1.2, step: 0.01, value: 0.85, unit: 'Å', fmt: (v) => v.toFixed(2) });
    sim.slider('er', { label: 'Permitividad relativa del disolvente ε_r', min: 2, max: 100, step: 0.1, value: 78.3, fmt: (v) => v.toFixed(1) });
    sim.out('e', 'Error medio de la energía de solvatación de Born respecto del experimento', { hl: true });
    sim.out('na', 'Na⁺: Born (radio cristalino) · Born (radio corregido) · experimento');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, names = Object.keys(IONS);
      EM.draw.clear(cv);
      const born = (r, z) => (-FQ.NA * z * z * FQ.e * FQ.e) / (8 * Math.PI * FQ.eps0 * r * 1e-10) * (1 - 1 / p.er) / 1e3;
      const bare = names.map((n) => born(IONS[n][0], IONS[n][1])), cor = names.map((n) => born(IONS[n][0] + (IONS[n][1] > 0 ? p.dc : 0.1), IONS[n][1])), exp = names.map((n) => IONS[n][2]);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -0.5, xmax: names.length - 0.5, ymin: -700, ymax: 0, xlabel: '', ylabel: 'Δ_solv G (kJ/mol)', ml: 56, xticks: names.map((_, i) => i), xfmt: (v) => names[Math.round(v)] || '' });
      pl.frame();
      names.forEach((n, i) => { pl.dot(i - 0.12, Math.max(bare[i], -690), { color: '--ink-3', r: 5 }); pl.dot(i, cor[i], { color: '--c1', r: 5 }); pl.dot(i + 0.12, exp[i], { color: '--c2', r: 5 }); });
      pl.legend([{ label: 'Born con radio cristalino', color: '--ink-3', kind: 'dot' }, { label: 'Born con radio corregido', color: '--c1', kind: 'dot' }, { label: 'experimento (Marcus 1991)', color: '--c2', kind: 'dot' }], 'br');
      const err = cor.reduce((s_, v, i) => s_ + Math.abs(v / exp[i] - 1), 0) / names.length;
      sim.set('e', EM.fix(100 * err, 1) + ' % (radio corregido); ' + EM.fix(100 * bare.reduce((s_, v, i) => s_ + Math.abs(v / exp[i] - 1), 0) / names.length, 0) + ' % con el radio cristalino');
      sim.set('na', EM.fix(bare[1], 0) + ' · ' + EM.fix(cor[1], 0) + ' · ' + exp[1] + ' kJ/mol');
    });
  });

  /* 12.1 Coeficiente de actividad medio: de Debye–Hückel a Pitzer */
  EM.defineSim('debye-huckel', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.select('e', { label: 'Electrolito', options: Object.entries(FQ.ELEC).map(([k, v]) => [k, v.n]), value: 'NaCl' });
    sim.slider('m', { label: 'Molalidad', min: 0.0001, max: 3, step: 0.0001, value: 0.1, unit: 'mol/kg', log: true, fmt: (v) => (v < 0.01 ? v.toExponential(1) : v.toFixed(3)) });
    sim.slider('a', { label: 'Parámetro de tamaño iónico a (ley extendida)', min: 2, max: 8, step: 0.1, value: 4, unit: 'Å', fmt: (v) => v.toFixed(1) });
    sim.out('I', 'Fuerza iónica <i>I</i> = ½ Σ <i>m</i><sub>i</sub><i>z</i><sub>i</sub>²', { hl: true });
    sim.out('g', 'γ±: ley límite · extendida · Davies · Pitzer');
    sim.out('A', 'Constante <i>A</i> de Debye–Hückel (25 °C)');
    sim.out('ld', 'Longitud de Debye 1/κ');
    const E = () => FQ.ELEC[sim.p.e];
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, e = E(), zz = e.zM * e.zX, Imul = 0.5 * (e.nM * e.zM * e.zM + e.nX * e.zX * e.zX), A = FQ.Adh(298.15);
      EM.draw.clear(cv);
      const mmax = 3, Imax = Imul * mmax;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1.7, ymin: 0, ymax: 1.1, xlabel: '√m (mol/kg)^½', ylabel: 'γ±', ml: 46 });
      pl.frame();
      const f = (fn) => (sm) => fn(sm * sm);
      pl.fn(f((m) => FQ.dh.limit(zz, m * Imul, A)), { color: '--ink-3', width: 1.6, dash: [6, 4] });
      pl.fn(f((m) => FQ.dh.ext(zz, m * Imul, 0.3291, p.a, A)), { color: '--c4', width: 1.8 });
      pl.fn(f((m) => FQ.dh.davies(zz, m * Imul, A)), { color: '--c1', width: 2 });
      pl.fn(f((m) => FQ.pitzer(p.e, Math.max(m, 1e-9)).gamma), { color: '--c2', width: 2.8, n: 200 });
      pl.vline(Math.sqrt(p.m), { color: '--accent' }); pl.dot(Math.sqrt(p.m), FQ.pitzer(p.e, p.m).gamma, { color: '--accent' });
      pl.legend([{ label: 'ley límite (Debye–Hückel)', color: '--ink-3', dash: [6, 4] }, { label: 'ley extendida', color: '--c4' }, { label: 'Davies', color: '--c1' }, { label: 'Pitzer (ajustado a datos)', color: '--c2' }], 'bl');
      const I = p.m * Imul;
      sim.set('I', EM.sci(I, 3) + ' mol/kg');
      sim.set('g', [FQ.dh.limit(zz, I, A), FQ.dh.ext(zz, I, 0.3291, p.a, A), FQ.dh.davies(zz, I, A), FQ.pitzer(p.e, p.m).gamma].map((v) => EM.fix(v, 3)).join(' · '));
      sim.set('A', EM.fix(A, 4) + ' (mol/kg)^−½ (con ε_r = ' + EM.fix(FQ.epsW(298.15), 2) + ')');
      sim.set('ld', EM.fix(FQ.debyeLength(Math.max(I, 1e-9)) * 1e9, 2) + ' nm');
    });
  });

  /* 12.2 Atmósfera iónica y apantallamiento */
  EM.defineSim('atmosfera', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('I', { label: 'Fuerza iónica', min: 1e-5, max: 1, step: 1e-5, value: 0.01, unit: 'mol/L', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('a', { label: 'Radio del ion central', min: 0.1, max: 0.5, step: 0.01, value: 0.2, unit: 'nm', fmt: (v) => v.toFixed(2) });
    sim.out('ld', 'Longitud de Debye 1/κ', { hl: true });
    sim.out('r', 'Potencial a 1 nm: apantallado frente a desnudo');
    sim.out('Z', 'Dónde se concentra la carga de la atmósfera');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, ld = FQ.debyeLength(p.I) * 1e9;
      EM.draw.clear(cv);
      const rmax = Math.max(1.5, ld * 5), a = p.a;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: a, xmax: rmax, ymin: 1e-4, ymax: 2, ylog: true, xlog: true, xlabel: 'distancia r al ion central (nm)', ylabel: 'ψ(r) relativo al potencial desnudo a r = a', ml: 56 });
      pl.frame();
      const bare = (r) => a / r, scr = (r) => (a / r) * Math.exp(-(r - a) / ld) / (1 + a / ld);
      pl.fn(bare, { color: '--ink-3', width: 1.6, dash: [6, 4], n: 120 }); pl.fn(scr, { color: '--c2', width: 2.8, n: 120 });
      pl.vline(ld, { color: '--accent', label: '1/κ = ' + EM.sci(ld, 2) + ' nm' });
      pl.legend([{ label: 'ion aislado: q/(4πε₀ε_r r)', color: '--ink-3', dash: [6, 4] }, { label: 'con atmósfera iónica (Debye–Hückel)', color: '--c2' }], 'bl');
      sim.set('ld', EM.sci(ld, 3) + ' nm' + (p.I < 1e-6 ? ' (agua pura: 960 nm)' : ''));
      sim.set('r', EM.sci(scr(1), 2) + ' frente a ' + EM.sci(bare(1), 2) + ' (' + EM.fix((100 * scr(1)) / bare(1), 1) + ' %)');
      sim.set('Z', 'la carga de la atmósfera es más probable a r = 1/κ (máximo de 4πr²ρ(r) ∝ r e^(−κr))');
    });
  });

  /* 12.3 Conductividad */
  const EL = {
    KCl: ['KCl', 73.5, 76.3, 1, 'K+', 'Cl-', [[0.001, 146.95], [0.01, 141.27], [0.1, 128.96]]],
    NaCl: ['NaCl', 50.1, 76.3, 1, 'Na+', 'Cl-', [[0.001, 123.74], [0.01, 118.51], [0.1, 106.74]]],
    HCl: ['HCl', 349.8, 76.3, 1, 'H+', 'Cl-', [[0.001, 421.36], [0.01, 412.0], [0.1, 391.32]]],
    KNO3: ['KNO₃', 73.5, 71.4, 1, 'K+', 'NO3-', [[0.001, 141.8], [0.01, 132.8], [0.1, 120.4]]],
    HAc: ['Ácido acético (débil, pKa 4.76)', 349.8, 40.9, 0, 'H+', 'CH3COO-', [[0.01, 16.2], [0.1, 5.2]]]
  };
  EM.defineSim('conductividad', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.select('e', { label: 'Electrolito', options: Object.entries(EL).map(([k, v]) => [k, v[0]]), value: 'KCl' });
    sim.slider('c', { label: 'Concentración', min: 1e-4, max: 1, step: 1e-4, value: 0.01, unit: 'mol/L', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.check('exp', { label: 'Datos experimentales (Robinson y Stokes, 25 °C)', value: true });
    sim.out('L', 'Conductividad molar Λ<sub>m</sub> · Λ<sub>m</sub>°', { hl: true });
    sim.out('k', 'Conductividad κ de la disolución');
    sim.out('t', 'Números de transporte límite <i>t</i>₊ · <i>t</i>₋');
    sim.out('a', 'Grado de ionización α = Λ<sub>m</sub>/Λ<sub>m</sub>° (ácido débil)');
    const L0 = (d) => d[1] + d[2];
    const lam = (key, c) => {
      const d = EL[key], l0 = L0(d);
      if (d[3] === 0) { /* Ostwald: α² c/(1−α) = Ka, con Ka = 1.75e-5 mol/L */ const Ka = 1.75e-5, al = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / (2 * c); return l0 * al; }
      return l0 - (60.2 + 0.229 * l0) * Math.sqrt(c);
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, d = EL[p.e], weak = d[3] === 0, l0 = L0(d);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 1, ymin: 0, ymax: l0 * 1.05, xlabel: '√c (mol/L)^½', ylabel: 'Λm (S·cm²/mol)', ml: 52 });
      pl.frame();
      pl.fn((sc) => lam(p.e, Math.max(sc * sc, 1e-8)), { color: '--c1', width: 2.6, n: 160, from: 0.003 });
      pl.hline(l0, { color: '--ink-3', label: 'Λ° = ' + EM.fix(l0, 1), dash: [5, 4] });
      if (p.exp) d[6].forEach(([c, v]) => pl.dot(Math.sqrt(c), v, { color: '--c2', r: 4 }));
      pl.vline(Math.sqrt(p.c), { color: '--accent' }); pl.dot(Math.sqrt(p.c), lam(p.e, p.c), { color: '--accent' });
      pl.legend([{ label: weak ? 'Ostwald (ionización parcial)' : 'Onsager: Λ° − (A + BΛ°)√c', color: '--c1' }, { label: 'experimento', color: '--c2', kind: 'dot' }], weak ? 'tr' : 'bl');
      const l = lam(p.e, p.c);
      sim.set('L', EM.fix(l, 2) + ' · ' + EM.fix(l0, 1) + ' S·cm²/mol');
      sim.set('k', EM.fix((l * p.c) / 10, 4) + ' S/m (' + EM.fix(l * p.c, 3) + ' mS/cm)');
      sim.set('t', EM.fix(d[1] / l0, 3) + ' · ' + EM.fix(d[2] / l0, 3));
      sim.set('a', weak ? EM.fix(l / l0, 4) + ' (' + EM.fix((100 * l) / l0, 2) + ' %)' : '≈ 1 (electrolito fuerte)');
    });
  });
})();
