/* Capítulo 25 — Corrosión y degradación */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;
  const NOM = { 'Au³⁺/Au': 3, 'Ag⁺/Ag': 1, 'Cu²⁺/Cu': 2, 'Pb²⁺/Pb': 2, 'Sn²⁺/Sn': 2, 'Ni²⁺/Ni': 2, 'Co²⁺/Co': 2, 'Cd²⁺/Cd': 2, 'Fe²⁺/Fe': 2, 'Cr³⁺/Cr': 3, 'Zn²⁺/Zn': 2, 'Al³⁺/Al': 3, 'Mg²⁺/Mg': 2 };

  /* ======================================================================
     25.1 Pila galvánica
     ====================================================================== */
  EM.defineSim('galvanic-cell', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    const opts = Object.keys(NOM).map((k) => [k, k + ' (' + EM.fix(MAT.E0[k], 3) + ' V)']);
    sim.select('a', { label: 'Electrodo 1', options: opts, value: 'Zn²⁺/Zn' });
    sim.select('b', { label: 'Electrodo 2', options: opts, value: 'Cu²⁺/Cu' });
    sim.slider('ca', { label: 'Concentración de iones 1', min: 1e-6, max: 2, step: 1e-6, value: 1, unit: 'M', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.slider('cb', { label: 'Concentración de iones 2', min: 1e-6, max: 2, step: 1e-6, value: 1, unit: 'M', log: true, fmt: (v) => EM.sci(v, 2) });
    sim.out('V', 'Voltaje de la pila', { hl: true });
    sim.out('an', 'Ánodo (se corroe)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const na = NOM[p.a], nb = NOM[p.b];
      const Ea = MAT.E0[p.a] + ((MAT.R * 298.15) / (na * MAT.F)) * Math.log(p.ca);
      const Eb = MAT.E0[p.b] + ((MAT.R * 298.15) / (nb * MAT.F)) * Math.log(p.cb);
      const V = Eb - Ea, anode = V >= 0 ? p.a : p.b;
      /* dibujo: dos vasos y puente salino */
      const draw = (x, lab, E, isA) => {
        ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(x, H * 0.35, W * 0.2, H * 0.5);
        ctx.fillStyle = EM.alpha(isA ? '--c2' : '--c1', 0.15); ctx.fillRect(x + 2, H * 0.45, W * 0.2 - 4, H * 0.4 - 2);
        ctx.fillStyle = EM.col(isA ? '--c2' : '--c1'); ctx.fillRect(x + W * 0.08, H * 0.2, W * 0.04, H * 0.55);
        EM.text(ctx, lab, x + W * 0.1, H * 0.94, { size: 12, align: 'center' });
        EM.text(ctx, (isA ? 'ánodo' : 'cátodo') + ' · E = ' + EM.fix(E, 3) + ' V', x + W * 0.1, H * 0.14, { size: 11, align: 'center', color: isA ? '--c2' : '--c1' });
      };
      draw(W * 0.06, p.a, Ea, anode === p.a);
      draw(W * 0.42, p.b, Eb, anode === p.b);
      ctx.strokeStyle = EM.col('--c6'); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(W * 0.22, H * 0.5); ctx.lineTo(W * 0.22, H * 0.28); ctx.lineTo(W * 0.46, H * 0.28); ctx.lineTo(W * 0.46, H * 0.5); ctx.stroke();
      EM.text(ctx, 'puente salino', W * 0.34, H * 0.25, { size: 11, align: 'center', color: '--ink-3' });
      /* serie de potenciales */
      const pl = new EM.Plot(ctx, { x: W * 0.68, y: 0, w: W * 0.32, h: H, xmin: 0, xmax: 1, ymin: -2.5, ymax: 1.7, xticks: [], ylabel: 'E⁰ (V)', ml: 44 });
      pl.frame();
      for (const k of Object.keys(NOM)) { const e = MAT.E0[k], sel = k === p.a || k === p.b; pl.hline(e, { color: sel ? '--accent' : '--grid-2', dash: [], width: sel ? 2 : 1 }); pl.label(0.05, e, k, { size: 9.5, color: sel ? '--accent' : '--ink-3', dy: -2 }); }
      sim.set('V', EM.fix(Math.abs(V), 4) + ' V');
      sim.set('an', anode);
    });
  });

  /* ======================================================================
     25.2 Diagrama de Evans
     ====================================================================== */
  EM.defineSim('evans', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('Ea', { label: 'Potencial de equilibrio del metal', min: -1.2, max: 0, step: 0.005, value: -0.763, unit: 'V', fmt: (v) => EM.fix(v, 3) });
    sim.slider('ia', { label: 'log₁₀ i₀ del metal (A/cm²)', min: -10, max: -4, step: 0.1, value: -7, fmt: (v) => EM.fix(v, 1) });
    sim.slider('ba', { label: 'Pendiente anódica β<sub>a</sub>', min: 0.03, max: 0.2, step: 0.005, value: 0.09, unit: 'V/déc', fmt: (v) => EM.fix(v, 3) });
    sim.slider('ic', { label: 'log₁₀ i₀ del hidrógeno (A/cm²)', min: -13, max: -4, step: 0.1, value: -10, fmt: (v) => EM.fix(v, 1) });
    sim.slider('bc', { label: 'Pendiente catódica β<sub>c</sub>', min: 0.03, max: 0.2, step: 0.005, value: 0.08, unit: 'V/déc', fmt: (v) => EM.fix(v, 3) });
    sim.check('pass', { label: 'Metal pasivable (E_pp = −0.6 V)', value: false });
    sim.out('E', '<i>E</i><sub>corr</sub>', { hl: true });
    sim.out('i', '<i>i</i><sub>corr</sub>');
    sim.out('r', 'Velocidad de penetración');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const i0a = Math.pow(10, p.ia), i0c = Math.pow(10, p.ic);
      const anod = (E) => { let i = i0a * Math.pow(10, (E - p.Ea) / p.ba); if (p.pass && E > -0.6) i = Math.min(i, 1e-7 * 1); return i; };
      const cath = (E) => i0c * Math.pow(10, -(E - 0) / p.bc);
      let r = MAT.mixedPotential(p.Ea, i0a, p.ba, 0, i0c, p.bc);
      if (p.pass && r.Ecorr > -0.6) { const E = MAT.bisect((e) => Math.log10(anod(e)) - Math.log10(cath(e)), -0.6, 0.2); r = { Ecorr: E, icorr: anod(E) }; }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1e-12, xmax: 1, ymin: -1.2, ymax: 0.3, xlog: true, xlabel: 'densidad de corriente (A/cm²)', ylabel: 'potencial (V vs EEH)', ml: 52 });
      pl.frame();
      const Es = M.linspace(-1.2, 0.3, 400);
      pl.xy(Es.map(anod), Es, { color: '--c2', width: 2.2 });
      pl.xy(Es.map(cath), Es, { color: '--c1', width: 2.2 });
      pl.dot(i0a, p.Ea, { color: '--c2', label: 'M/Mⁿ⁺' }); pl.dot(i0c, 0, { color: '--c1', label: 'H⁺/H₂' });
      pl.dot(r.icorr, r.Ecorr, { color: '--accent', r: 7, label: 'corrosión' });
      pl.legend([{ label: 'oxidación del metal', color: '--c2' }, { label: 'reducción de H⁺', color: '--c1' }], 'tr');
      sim.set('E', EM.fix(r.Ecorr, 3) + ' V');
      sim.set('i', EM.sci(r.icorr, 3) + ' A/cm²');
      sim.set('r', EM.fix(MAT.corrRate(r.icorr * 1e4, 65.38, 2, 7140), 3) + ' mm/año (zinc)');
    });
  });

  /* ======================================================================
     25.3 Oxidación
     ====================================================================== */
  const OX = { Mg: ['Mg → MgO', 40.30, 3580, 24.305, 1740, 1], Al: ['Al → Al₂O₃', 101.96, 3950, 26.98, 2700, 2], Ni: ['Ni → NiO', 74.69, 6670, 58.69, 8900, 1], Cu: ['Cu → Cu₂O', 143.09, 6000, 63.55, 8960, 2], Fe: ['Fe → FeO', 71.85, 5700, 55.85, 7870, 1], Cr: ['Cr → Cr₂O₃', 152.0, 5220, 52.0, 7190, 2] };
  EM.defineSim('oxidation', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Metal', options: Object.entries(OX).map(([k, v]) => [k, v[0]]), value: 'Al' });
    sim.slider('kp', { label: 'Constante parabólica k<sub>p</sub>', min: 0.01, max: 10, step: 0.01, value: 1, unit: 'µm²/h', log: true, fmt: (v) => EM.fix(v, 2) });
    sim.slider('t', { label: 'Tiempo', min: 1, max: 1000, step: 1, value: 100, unit: 'h', log: true, fmt: (v) => v.toFixed(0) });
    sim.out('pb', 'Cociente de Pilling–Bedworth', { hl: true });
    sim.out('kind', 'Tipo de capa');
    sim.out('w', 'Espesor a ese tiempo');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const [, Mo, ro, Mm, rm, a] = OX[p.m];
      const pb = MAT.pillingBedworth(Mo, ro, Mm, rm, a);
      const prot = pb >= 1 && pb <= 2.05;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.58, h: H, xmin: 0, xmax: 1000, ymin: 0, ymax: Math.sqrt(10 * 1000) * 1.1, xlabel: 't (h)', ylabel: 'espesor (µm)', ml: 46 });
      pl.frame();
      pl.fn((t) => Math.sqrt(p.kp * t), { color: '--c3', width: 2.2 });
      pl.fn((t) => (p.kp / 3) * t * 0.1, { color: '--c2', width: 1.6, dash: [5, 4] });
      pl.dot(p.t, prot ? Math.sqrt(p.kp * p.t) : (p.kp / 3) * p.t * 0.1, { color: '--accent' });
      pl.legend([{ label: 'parabólica (capa protectora)', color: '--c3' }, { label: 'lineal (capa no protectora)', color: '--c2', dash: [5, 4] }], 'tl');
      /* barras P–B */
      const pr = new EM.Plot(ctx, { x: W * 0.62, y: 0, w: W * 0.38, h: H, xmin: 0, xmax: 2.6, ymin: 0, ymax: 6, xlabel: 'P–B', yticks: [], ml: 34 });
      pr.frame();
      pr.band(1, 2, { color: '--c3', alpha: 0.12 });
      Object.keys(OX).forEach((k, i) => { const [, A, B, C, D, E] = OX[k], v = MAT.pillingBedworth(A, B, C, D, E); ctx.fillStyle = EM.alpha(k === p.m ? '--accent' : '--c1', k === p.m ? 0.9 : 0.4); ctx.fillRect(pr.X(0), pr.Y(5.7 - i + 0.3), pr.X(v) - pr.X(0), 14); EM.text(ctx, k + ' ' + EM.fix(v, 2), pr.X(v) + 4, pr.Y(5.7 - i) + 2, { size: 10.5 }); });
      sim.set('pb', EM.fix(pb, 3));
      sim.set('kind', pb < 1 ? 'porosa, no cubre (crecimiento lineal)' : pb <= 2.05 ? 'continua y protectora (parabólica)' : 'muy voluminosa: se agrieta y descascara');
      sim.set('w', EM.fix(prot ? Math.sqrt(p.kp * p.t) : (p.kp / 3) * p.t * 0.1, 2) + ' µm');
    });
  });

  /* ======================================================================
     25.4 Protección catódica
     ====================================================================== */
  const AN = { Mg: ['Magnesio', 24.305, 2, 0.5], Zn: ['Zinc', 65.38, 2, 0.95], Al: ['Aluminio (aleado)', 26.98, 3, 0.85] };
  EM.defineSim('cathodic', function (sim) {
    const cv = sim.canvas({ aspect: 2.4 });
    sim.select('m', { label: 'Ánodo', options: Object.entries(AN).map(([k, v]) => [k, v[0]]), value: 'Mg' });
    sim.slider('I', { label: 'Corriente de protección', min: 0.05, max: 10, step: 0.05, value: 1, unit: 'A', log: true, fmt: (v) => EM.fix(v, 2) });
    sim.slider('y', { label: 'Vida de diseño', min: 1, max: 30, step: 1, value: 1, unit: 'años', fmt: (v) => v.toFixed(0) });
    sim.out('m', 'Masa de ánodo necesaria', { hl: true });
    sim.out('cap', 'Capacidad (A·h/kg) con eficiencia');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const masses = Object.entries(AN).map(([k, [n, A, z, eff]]) => [k, (p.I * p.y * 3.156e7 * A) / (z * MAT.F * eff) / 1000]);
      const mx = Math.max(...masses.map((q) => q[1]));
      masses.forEach(([k, m], i) => { const y = 20 + i * ((H - 40) / 3); ctx.fillStyle = EM.alpha(k === p.m ? '--accent' : '--c1', k === p.m ? 0.85 : 0.4); ctx.fillRect(140, y, ((W - 220) * m) / mx, (H - 40) / 3 - 12); EM.text(ctx, AN[k][0], 130, y + 20, { size: 12, align: 'right' }); EM.text(ctx, EM.fix(m, 1) + ' kg', 146 + ((W - 220) * m) / mx, y + 20, { size: 11, mono: true }); });
      const [, A, z, eff] = AN[p.m];
      sim.set('m', EM.fix(masses.find((q) => q[0] === p.m)[1], 2) + ' kg');
      sim.set('cap', EM.fix(((z * MAT.F) / (A * 1e-3) / 3600) * eff, 0) + ' A·h/kg (eficiencia ' + eff * 100 + ' %)');
    });
  });
})();
