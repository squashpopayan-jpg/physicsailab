/* Capítulo 5 — Condensadores */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD, CX = EM.cx, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const TAU = 2 * Math.PI;
  const E0 = 8.8541878128e-12;
  const pickTdiv = (t) => EM.Panels.TDIVS.reduce((b, x) => (Math.abs(Math.log(x / t)) < Math.abs(Math.log(b / t)) ? x : b), 1e-3);

  /* 5.1 Placas paralelas */
  EM.defineSim('c5-placas', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Condensador de placas paralelas' });
    sim.group('Geometría y tensión');
    sim.slider('a', { label: 'Área de las placas', min: 1, max: 1000, value: 100, unit: 'cm²', log: true, fmt: (v) => EM.fix(v, v < 10 ? 1 : 0) });
    sim.slider('d', { label: 'Separación', min: 0.01, max: 10, value: 1, unit: 'mm', log: true, fmt: (v) => EM.fix(v, v < 1 ? 2 : 1) });
    sim.slider('e', { label: 'Permitividad relativa ε_r', min: 1, max: 100, value: 1, unit: '', log: true, fmt: (v) => EM.fix(v, v < 10 ? 1 : 0) });
    sim.slider('v', { label: 'Tensión', min: 1, max: 50, step: 1, value: 12, unit: 'V' });
    sim.out('c', 'Capacidad C = ε₀ε_r A/d', { hl: true }); sim.out('q', 'Carga Q = CV'); sim.out('f', 'Campo E = V/d'); sim.out('w', 'Energía ½CV²'); sim.out('m', 'Campo / rigidez del aire (3 MV/m)');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const C = E0 * p.e * p.a * 1e-4 / (p.d * 1e-3), Q = C * p.v, Eff = p.v / (p.d * 1e-3), W = 0.5 * C * p.v * p.v;
      const gap = 40 + 80 * (Math.log10(p.d) + 2) / 3, pw = 40 + 230 * (Math.log10(p.a) / 3) , x0 = w * 0.5 - pw / 2, yc = h * 0.5;
      /* dieléctrico */
      if (p.e > 1.01) { c.fillStyle = EM.alpha('--c3', 0.12 + 0.12 * Math.min(1, Math.log10(p.e) / 2)); c.fillRect(x0, yc - gap / 2, pw, gap); }
      /* placas */
      c.fillStyle = EM.col('--ink-2'); c.fillRect(x0 - 6, yc - gap / 2 - 10, pw + 12, 10); c.fillRect(x0 - 6, yc + gap / 2, pw + 12, 10);
      /* cargas */
      const nq = Math.max(2, Math.min(14, Math.round(2 + 3 * Math.log10(Math.max(Q * 1e9, 1)))));
      c.font = '700 16px ' + EM.FONT_UI; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let k = 0; k < nq; k++) { const x = x0 + (k + 0.5) / nq * pw; c.fillStyle = EM.col('--pos'); c.fillText('+', x, yc - gap / 2 - 18); c.fillStyle = EM.col('--neg'); c.fillText('−', x, yc + gap / 2 + 18); }
      /* líneas de campo */
      const nf = Math.max(3, Math.min(16, Math.round(pw / 22)));
      c.strokeStyle = EM.col('--efield'); c.fillStyle = EM.col('--efield'); c.lineWidth = Math.max(1, Math.min(3, 0.8 + Math.log10(Math.max(Eff, 1)) * 0.3));
      for (let k = 0; k < nf; k++) { const x = x0 + (k + 0.5) / nf * pw; c.beginPath(); c.moveTo(x, yc - gap / 2 + 2); c.lineTo(x, yc + gap / 2 - 8); c.stroke(); c.beginPath(); c.moveTo(x, yc + gap / 2 - 2); c.lineTo(x - 4, yc + gap / 2 - 10); c.lineTo(x + 4, yc + gap / 2 - 10); c.fill(); }
      EM.text(c, 'V = ' + p.v + ' V', x0 + pw + 30, yc, { size: 14, color: '--ink', weight: 700, baseline: 'middle' });
      EM.text(c, 'd = ' + EM.fix(p.d, p.d < 1 ? 2 : 1) + ' mm', x0 - 18, yc, { size: 13, color: '--ink-2', align: 'right', baseline: 'middle' });
      sim.set('c', fmt(C, 'F')); sim.set('q', fmt(Q, 'C')); sim.set('f', fmt(Eff, 'V/m')); sim.set('w', fmt(W, 'J'));
      sim.set('m', EM.fix(100 * Eff / 3e6, 2) + ' %' + (Eff > 3e6 && p.e === 1 ? ' ⚠ ruptura' : ''));
    });
  });

  /* 5.2 Carga y descarga */
  EM.defineSim('c5-carga', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 1.9, edit: 'values', panels: ['scope'], startZero: true, tdiv: 1e-3,
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'condensador', at: 'out', color: '#4ae3ff' }],
      spec: CX.ladder({ src: { id: 'FG1', t: 'FG', p: { wave: 'square', amp: 2.5, off: 2.5, f: 100 } }, items: [{ id: 'R1', t: 'R', p: { r: 950 }, mode: 'series' }, { id: 'C1', t: 'C', p: { c: 1e-6 }, mode: 'shunt', tap: 'out' }], extra: { parts: [['Nin', 'LBL', 4, 4, 0, { name: 'in' }]], wires: [[[4, 6], [4, 4]]] } }),
      controls: [
        { type: 'slider', id: 'r', label: 'Resistencia total R (incluye 50 Ω del generador)', min: 100, max: 100000, value: 1000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('R1', 'r', Math.max(v - 50, 1)); T.autoRC && T.autoRC(); } },
        { type: 'slider', id: 'c', label: 'Capacitancia C', min: 1e-8, max: 1e-4, value: 1e-6, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('C1', 'c', v); T.autoRC && T.autoRC(); } }
      ],
      outs: [
        { id: 'tau', label: 'Constante de tiempo τ = RC', hl: true, fn: (T) => fmt((T.net.part('R1').p.r + 50) * T.net.part('C1').p.c, 's') },
        { id: 'i', label: 'Corriente por el condensador', fn: (T) => fmt(T.i('C1'), 'A') },
        { id: 'e', label: 'Energía en el condensador', fn: (T) => fmt(0.5 * T.net.part('C1').p.c * Math.pow(T.v('out'), 2), 'J') }
      ]
    });
    /* periodo del generador = 10 τ y base de tiempo = τ por división */
    T.autoRC = () => {
      const tau = (T.net.part('R1').p.r + 50) * T.net.part('C1').p.c;
      T.set('FG1', 'f', 1 / (10 * tau)); T.setTdiv(pickTdiv(tau));
    };
    T.autoRC();
  });

  /* 5.3 Impedancia del condensador real */
  EM.defineSim('c5-impedancia', function (sim) {
    const cv = sim.canvas({ aspect: 2, label: 'Impedancia del condensador real' });
    const CAP = {
      x7r: ['Cerámico X7R de 100 nF', 100e-9, 'ceramic'], film: ['Película de 1 µF', 1e-6, 'film'], e100: ['Electrolítico de 100 µF', 100e-6, 'elec'],
      e1000: ['Electrolítico de 1000 µF', 1000e-6, 'elec'], ta: ['Tántalo de 10 µF', 10e-6, 'tant']
    };
    sim.group('Condensador');
    sim.select('k', { label: 'Tipo', options: Object.entries(CAP).map(([k, v]) => [k, v[0]]), value: 'e100' });
    sim.out('esr', 'ESR', { hl: true }); sim.out('esl', 'ESL'); sim.out('f0', 'Resonancia propia f₀'); sim.out('zm', '|Z| mínimo'); sim.out('z', '|Z| a 100 kHz');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, [nm, Cc, kind] = CAP[sim.p.k], m = MOD.CAP[kind];
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const esr = m.esr(Cc), esl = m.esl;
      const Z = (f) => { const wv = TAU * f; return Math.hypot(esr, wv * esl - 1 / (wv * Cc)); };
      const fs = M.linspace(2, 9, 320).map((e) => Math.pow(10, e)), mags = fs.map(Z);
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 1e2, xmax: 1e9, xlog: true, ymin: 1e-3, ymax: 1e4, ylog: true, ml: 62, mr: 14, mt: 14, mb: 40, xlabel: 'frecuencia (Hz)', ylabel: '|Z| (Ω)' });
      pl.frame();
      pl.xy(fs, fs.map((f) => 1 / (TAU * f * Cc)), { color: '--ink-3', width: 1.6, dash: [5, 4] });
      pl.xy(fs, mags, { color: '--c1', width: 2.8 });
      const f0 = 1 / (TAU * Math.sqrt(esl * Cc));
      pl.vline(f0, { color: '--c2', dash: [3, 4] }); pl.dot(f0, esr, { color: '--c2', r: 5 });
      pl.legend([{ label: nm, color: '--c1' }, { label: 'condensador ideal 1/ωC', color: '--ink-3', kind: 'dash' }], 'tr');
      sim.set('esr', fmt(esr, 'Ω', 3)); sim.set('esl', fmt(esl, 'H', 3)); sim.set('f0', fmt(f0, 'Hz')); sim.set('zm', fmt(esr, 'Ω')); sim.set('z', fmt(Z(1e5), 'Ω'));
    });
  });

  /* 5.4 Desacople */
  EM.defineSim('c5-desacople', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.3, edit: 'values', panels: ['scope'], tdiv: 2e-7, hint: 'La carga consume una corriente senoidal de 0.2 A pico a pico a 2 MHz a través de un cable de 1 µH.',
      probes: [{ label: 'Vdd en la carga', at: 'vdd', color: '#7dff82', ac: true }],
      spec: CX.ladder({ src: { id: 'V1', t: 'VDC', p: { v: 5 } }, items: [{ id: 'L1', t: 'L', p: { l: 1e-6, kind: 'air', imax: 5 }, mode: 'series' }, { id: 'C1', t: 'C', p: { c: 1e-7, kind: 'ceramic' }, mode: 'shunt', tap: 'vdd' }, { id: 'I1', t: 'IDC', p: { i: 0.2, mode: 'sin', f: 2e6 }, mode: 'shunt', rot: 0 }] }),
      controls: [{ type: 'seg', id: 'c', label: 'Condensador de desacople', options: [[1e-12, 'ninguno'], [1e-8, '10 nF'], [1e-7, '100 nF'], [1e-6, '1 µF'], [1e-5, '10 µF']], value: 1e-7, apply: (T, v) => T.set('C1', 'c', +v) }],
      outs: [{ id: 'pp', label: 'Rizado en la alimentación (pico a pico)', hl: true, fn: (T) => { const s = T.stat('Vdd en la carga'); return s ? fmt(s.pp, 'V') : '—'; } }]
    });
  });

  /* 5.5 Electrolítico: sobretensión y polaridad */
  EM.defineSim('c5-polarizada', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.1, edit: 'values', panels: ['scope'], startZero: true, tdiv: 5e-2, hint: 'Electrolítico de 100 µF / 25 V cargado a través de 100 Ω.',
      probes: [{ label: 'condensador', at: 'out', color: '#4ae3ff' }],
      spec: CX.ladder({ src: { id: 'V1', t: 'VDC', p: { v: 12 } }, items: [{ id: 'R1', t: 'R', p: { r: 100, watt: 5 }, mode: 'series' }, { id: 'C1', t: 'C', p: { c: 100e-6, kind: 'elec', vmax: 25 }, mode: 'shunt', tap: 'out' }] }),
      controls: [{ type: 'slider', id: 'v', label: 'Tensión de la fuente', min: -20, max: 45, step: 1, value: 12, unit: 'V', apply: (T, v) => T.set('V1', 'v', v) }],
      outs: [
        { id: 'vc', label: 'Tensión del condensador', hl: true, fn: (T) => fmt(T.v('out'), 'V') },
        { id: 'i', label: 'Corriente', fn: (T) => fmt(T.i('C1'), 'A') },
        { id: 'e', label: 'Estado', fn: (T) => (T.net.part('C1').dead ? '<b style="color:var(--warn-ink)">reventó</b>' : 'correcto') }
      ]
    });
  });
})();
