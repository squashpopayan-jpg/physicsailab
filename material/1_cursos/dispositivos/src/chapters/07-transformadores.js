/* Capítulo 7 — Transformadores */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const TAU = 2 * Math.PI, MU0 = 4e-7 * Math.PI;

  /* 7.1 Transformador ideal con la red */
  EM.defineSim('c7-ideal', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.2, edit: 'values', panels: ['scope'], tdiv: 5e-3, watch: ['AC1', 'RL'],
      probes: [{ label: 'primario', at: 'p', color: '#ffd84a' }, { label: 'secundario', at: 's', color: '#4ae3ff' }],
      spec: {
        parts: [['AC1', 'MAINS', 4, 8, 0, { vrms: 120, f: 60 }], ['T1', 'TR', 14, 8, 0, { n: 10, lp: 5, k: 0.995, rp: 8, rsx: 0.1, va: 40 }], ['RL', 'R', 22, 8, 1, { r: 12, watt: 25 }], ['Np', 'LBL', 7, 4, 0, { name: 'p' }], ['Ns', 'LBL', 19, 4, 0, { name: 's' }]],
        wires: [['AC1.0', 'T1.P1'], ['AC1.1', 'T1.P2'], ['T1.S1', 'RL.0'], ['T1.S2', 'RL.1'], ['AC1.1', 'gnd'], [[7, 6], [7, 4]], [[19, 6], [19, 4]], [[17, 10], [17, 11]], ['gndat', 17, 11]]
      },
      controls: [
        { type: 'seg', id: 'n', label: 'Relación de espiras N_p : N_s', options: [[2, '2 : 1'], [5, '5 : 1'], [10, '10 : 1'], [20, '20 : 1']], value: 10, apply: (T, v) => T.set('T1', 'n', +v) },
        { type: 'slider', id: 'r', label: 'Resistencia de carga', min: 1, max: 500, value: 12, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, v < 10 ? 1 : 0), apply: (T, v) => T.set('RL', 'r', v) }
      ],
      outs: [
        { id: 'vp', label: 'Tensión del primario (eficaz)', fn: (T) => { const s = T.stat('primario'); return s ? fmt(s.rms, 'V') : '—'; } },
        { id: 'vs', label: 'Tensión del secundario (eficaz)', hl: true, fn: (T) => { const s = T.stat('secundario'); return s ? fmt(s.rms, 'V') : '—'; } },
        { id: 'rel', label: 'Relación V_p / V_s', fn: (T) => { const a = T.stat('primario'), b = T.stat('secundario'); return a && b ? EM.fix(a.rms / b.rms, 2) : '—'; } },
        { id: 'pin', label: 'Potencia de entrada', fn: (T) => fmt(-T.pw('AC1'), 'W') },
        { id: 'pout', label: 'Potencia en la carga', fn: (T) => fmt(T.pw('RL'), 'W') },
        { id: 'eta', label: 'Rendimiento', fn: (T) => { const a = -T.pw('AC1'), b = T.pw('RL'); return a > 0 ? EM.fix(100 * b / a, 1) + ' %' : '—'; } }
      ]
    });
  });

  /* 7.2 Flujo y saturación */
  EM.defineSim('c7-flujo', function (sim) {
    const cv = sim.canvas({ aspect: 1.6, label: 'Flujo y corriente magnetizante' });
    sim.group('Transformador y red');
    sim.slider('v', { label: 'Tensión eficaz', min: 60, max: 240, step: 5, value: 120, unit: 'V' });
    sim.slider('f', { label: 'Frecuencia', min: 30, max: 100, step: 1, value: 60, unit: 'Hz' });
    sim.slider('n', { label: 'Vueltas del primario', min: 200, max: 1500, step: 10, value: 600 });
    sim.slider('a', { label: 'Área del núcleo', min: 2, max: 20, step: 0.5, value: 6, unit: 'cm²' });
    sim.slider('bs', { label: 'Inducción de saturación del acero', min: 1, max: 2, step: 0.05, value: 1.6, unit: 'T' });
    sim.out('bm', 'Inducción máxima B_m', { hl: true }); sim.out('r', 'B_m / B_sat'); sim.out('im', 'Corriente magnetizante de pico'); sim.out('ims', 'Relación con la de B_m = 1 T');
    const LE = 0.25; /* longitud magnética (m) */
    /* B(H) = Bsat·tanh(H/H0) + μ0 H con μr inicial 5000; se invierte por bisección */
    const Hof = (B, bs, H0) => { let lo = -1e6, hi = 1e6; for (let k = 0; k < 80; k++) { const m = 0.5 * (lo + hi), b = bs * Math.tanh(m / H0) + MU0 * m; if (b < B) lo = m; else hi = m; } return 0.5 * (lo + hi); };
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const Bm = p.v * Math.SQRT2 / (TAU * p.f * p.n * p.a * 1e-4);
      const H0 = p.bs / (MU0 * 5000);
      const ts = M.linspace(0, 2, 400);
      const B = ts.map((t) => -Bm * Math.cos(TAU * t));
      const Im = B.map((b) => Hof(b, p.bs, H0) * LE / p.n);
      const imp = Math.max(...Im.map(Math.abs)), ref = Hof(1.0, p.bs, H0) * LE / p.n;
      const h1 = Math.round(h * 0.48);
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h: h1, xmin: 0, xmax: 2, ymin: -Math.max(Bm * 1.15, p.bs * 1.2), ymax: Math.max(Bm * 1.15, p.bs * 1.2), ml: 54, mr: 14, mt: 12, mb: 24, ylabel: 'B (T)', xticks: [0, 0.5, 1, 1.5, 2], xfmt: () => '' });
      pl.frame(); pl.xy(ts, B, { color: '--c1', width: 2.4 }); pl.hline(p.bs, { color: '--c2', dash: [5, 4] }); pl.hline(-p.bs, { color: '--c2', dash: [5, 4] });
      pl.legend([{ label: 'inducción B(t)', color: '--c1' }, { label: '± B de saturación', color: '--c2', kind: 'dash' }], 'tr');
      const lim = Math.max(imp * 1.1, 1e-4);
      const p2 = new EM.Plot(c, { x: 0, y: h1, w, h: h - h1, xmin: 0, xmax: 2, ymin: -lim * 1000, ymax: lim * 1000, ml: 54, mr: 14, mt: 8, mb: 34, xlabel: 't / T', ylabel: 'i_m (mA)' });
      p2.frame(); p2.xy(ts, Im.map((x) => x * 1000), { color: '--c3', width: 2.4 });
      sim.set('bm', fmt(Bm, 'T')); sim.set('r', EM.fix(Bm / p.bs, 2) + (Bm > p.bs ? ' ⚠ saturado' : '')); sim.set('im', fmt(imp, 'A')); sim.set('ims', EM.fix(imp / ref, 1) + ' ×');
    });
  });

  /* 7.3 Regulación */
  EM.defineSim('c7-regulacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Regulación del transformador' });
    sim.group('Circuito equivalente (referido al secundario)');
    sim.slider('v0', { label: 'Tensión en vacío V₂₀', min: 5, max: 30, step: 0.5, value: 13, unit: 'V' });
    sim.slider('r', { label: 'Resistencia equivalente R_eq', min: 0.1, max: 5, step: 0.1, value: 1, unit: 'Ω' });
    sim.slider('x', { label: 'Reactancia de dispersión X_eq', min: 0, max: 3, step: 0.1, value: 0.5, unit: 'Ω' });
    sim.slider('ir', { label: 'Corriente nominal', min: 0.2, max: 5, step: 0.1, value: 1, unit: 'A' });
    sim.out('a', 'Regulación con carga resistiva', { hl: true }); sim.out('b', 'Con fp 0.8 inductivo'); sim.out('c', 'Con fp 0.8 capacitivo'); sim.out('vr', 'V₂ a la corriente nominal (resistiva)');
    const V2 = (V0, I, R, X, pf, lead) => { const phi = Math.acos(pf) * (lead ? -1 : 1), a = I * (R * Math.cos(phi) + X * Math.sin(phi)), b = I * (X * Math.cos(phi) - R * Math.sin(phi)); const d = V0 * V0 - b * b; return d > 0 ? -a + Math.sqrt(d) : NaN; };
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const Imax = 2 * p.ir;
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 0, xmax: Imax, ymin: Math.max(0, p.v0 * 0.55), ymax: p.v0 * 1.04, ml: 54, mr: 14, mt: 14, mb: 40, xlabel: 'corriente de carga (A)', ylabel: 'tensión del secundario (V)' });
      pl.frame();
      const Is = M.linspace(0, Imax, 100);
      const defs = [['resistiva (fp = 1)', '--c1', 1, 0], ['inductiva (fp = 0.8)', '--c2', 0.8, 0], ['capacitiva (fp = 0.8)', '--c3', 0.8, 1]];
      for (const [nm, col, pf, ld] of defs) { const ys = Is.map((I) => V2(p.v0, I, p.r, p.x, pf, ld)); pl.xy(Is.filter((_, i) => isFinite(ys[i])), ys.filter(isFinite), { color: col, width: 2.4 }); }
      pl.vline(p.ir, { color: '--ink-3', dash: [4, 4] });
      pl.legend(defs.map(([nm, col]) => ({ label: nm, color: col })), 'bl');
      const reg = (pf, ld) => { const v = V2(p.v0, p.ir, p.r, p.x, pf, ld); return EM.fix(100 * (p.v0 - v) / v, 1) + ' %'; };
      sim.set('a', reg(1, 0)); sim.set('b', reg(0.8, 0)); sim.set('c', reg(0.8, 1)); sim.set('vr', fmt(V2(p.v0, p.ir, p.r, p.x, 1, 0), 'V'));
    });
  });

  /* 7.4 Toma central */
  EM.defineSim('c7-toma', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.7, edit: 'values', panels: ['scope'], tdiv: 5e-3,
      probes: [{ label: 'S1 – CT', at: 'a', color: '#ffd84a' }, { label: 'S2 – CT', at: 'b', color: '#4ae3ff' }],
      spec: {
        parts: [['AC1', 'MAINS', 4, 10, 0, { vrms: 120, f: 60 }], ['T1', 'TRCT', 14, 10, 0, { n: 5, lp: 5, k: 0.995, rp: 8, rsx: 0.1, va: 40 }], ['R1', 'R', 21, 7, 0, { r: 24, watt: 10 }], ['R2', 'R', 21, 13, 0, { r: 24, watt: 10 }], ['Na', 'LBL', 18, 5, 0, { name: 'a' }], ['Nb', 'LBL', 18, 15, 0, { name: 'b' }]],
        wires: [['AC1.0', 'T1.P1'], ['AC1.1', 'T1.P2'], ['AC1.1', 'gnd'], ['T1.S1', 'R1.0'], ['T1.S2', 'R2.0'], ['R1.1', [23, 7], [23, 10]], ['R2.1', [23, 13], [23, 10]], ['T1.CT', [23, 10]], [[23, 10], [23, 11]], ['gndat', 23, 11], [[18, 7], [18, 5]], [[18, 13], [18, 15]]]
      },
      controls: [{ type: 'seg', id: 'n', label: 'Relación total N_p : N_s', options: [[5, '5 : 1'], [10, '10 : 1'], [20, '20 : 1']], value: 5, apply: (T, v) => T.set('T1', 'n', +v) }],
      outs: [
        { id: 'a', label: 'S1 – CT (eficaz)', fn: (T) => { const s = T.stat('S1 – CT'); return s ? fmt(s.rms, 'V') : '—'; } },
        { id: 'b', label: 'S2 – CT (eficaz)', fn: (T) => { const s = T.stat('S2 – CT'); return s ? fmt(s.rms, 'V') : '—'; } },
        { id: 'ab', label: 'Entre extremos S1 – S2', hl: true, fn: (T) => { const a = T.stat('S1 – CT'); return a ? fmt(2 * a.rms, 'V') : '—'; } }
      ]
    });
  });
})();
