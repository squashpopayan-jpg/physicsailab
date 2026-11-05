/* Capítulo 9 — Filtros pasivos */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, CX = EM.cx;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const TAU = 2 * Math.PI;
  const mag = (re, im) => 20 * Math.log10(Math.hypot(re, im));
  const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const deg = (z) => Math.atan2(z[1], z[0]) * 180 / Math.PI;
  const ref = (z) => [mag(z[0], z[1]), deg(z)];

  /* 9.1 Pasabajos / pasaaltos */
  EM.defineSim('c9-pasaaltos', function (sim) {
    const lp = () => CX.ladder({ src: { id: 'V1', t: 'VAC', p: { amp: 1, f: 1000 } }, items: [{ id: 'R1', t: 'R', p: { r: 10000 }, mode: 'series' }, { id: 'C1', t: 'C', p: { c: 1e-7 }, mode: 'shunt', tap: 'out' }] });
    const hp = () => CX.ladder({ src: { id: 'V1', t: 'VAC', p: { amp: 1, f: 1000 } }, items: [{ id: 'C1', t: 'C', p: { c: 1e-7 }, mode: 'series' }, { id: 'R1', t: 'R', p: { r: 10000 }, mode: 'shunt', tap: 'out' }] });
    let kind = 'lp';
    const T = EM.Taller.mount(sim, {
      aspect: 2.9, edit: 'values', panels: ['bode'], autoBode: true,
      spec: lp(),
      controls: [
        { type: 'seg', id: 'k', label: 'Tipo', options: [['lp', 'Pasabajos (R serie, C a tierra)'], ['hp', 'Pasaaltos (C serie, R a tierra)']], value: 'lp', init: false, apply: (T, v) => { kind = v; T.loadSpec(v === 'lp' ? lp() : hp()); T.set('R1', 'r', T.sim.p.r); T.set('C1', 'c', T.sim.p.c); } },
        { type: 'slider', id: 'r', label: 'Resistencia R', min: 100, max: 1e6, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => T.set('R1', 'r', v) },
        { type: 'slider', id: 'c', label: 'Capacitancia C', min: 1e-10, max: 1e-5, value: 1e-7, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => T.set('C1', 'c', v) }
      ],
      outs: [{ id: 'fc', label: 'f_c = 1/(2πRC)', hl: true, fn: (T) => fmt(1 / (TAU * T.net.part('R1').p.r * T.net.part('C1').p.c), 'Hz') }]
    });
    T.setBode(1, 1e6);
    T.cfg.bodeRef = { label: 'teoría', fn: (f) => { const x = f * TAU * T.net.part('R1').p.r * T.net.part('C1').p.c; const z = kind === 'lp' ? cdiv([1, 0], [1, x]) : cdiv([0, x], [1, x]); return ref(z); } };
  });

  /* 9.2 Filtro LC con carga */
  EM.defineSim('c9-lc', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.8, edit: 'values', panels: ['bode'], autoBode: true,
      spec: CX.ladder({ src: { id: 'V1', t: 'VAC', p: { amp: 1, f: 1000, rs: 0.001 } }, items: [{ id: 'L1', t: 'L', p: { l: 0.01, kind: 'air', imax: 5 }, mode: 'series' }, { id: 'C1', t: 'C', p: { c: 1e-7 }, mode: 'shunt', tap: 'out' }, { id: 'RL', t: 'R', p: { r: 224, watt: 5 }, mode: 'shunt' }] }),
      controls: [{ type: 'slider', id: 'rl', label: 'Resistencia de carga R_L', min: 30, max: 20000, value: 224, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('RL', 'r', v) }],
      outs: [
        { id: 'f0', label: 'f₀ = 1/(2π√LC)', fn: (T) => fmt(1 / (TAU * Math.sqrt(T.net.part('L1').p.l * T.net.part('C1').p.c)), 'Hz') },
        { id: 'q', label: 'Q = R_L √(C/L)', hl: true, fn: (T) => EM.fix(T.net.part('RL').p.r * Math.sqrt(T.net.part('C1').p.c / T.net.part('L1').p.l), 2) },
        { id: 'pk', label: 'Pico de resonancia ≈ 20 log Q', fn: (T) => { const q = T.net.part('RL').p.r * Math.sqrt(T.net.part('C1').p.c / T.net.part('L1').p.l); return q > 0.71 ? EM.fix(20 * Math.log10(q), 1) + ' dB' : 'sin pico'; } }
      ]
    });
    T.setBode(100, 1e5);
    T.cfg.bodeRef = { label: 'teoría (segundo orden)', fn: (f) => { const L = T.net.part('L1').p.l, C = T.net.part('C1').p.c, RL = T.net.part('RL').p.r, w = TAU * f; const z = cdiv([1, 0], [1 - w * w * L * C, w * L / RL]); return ref(z); } };
  });

  /* 9.3 Cascada de dos etapas RC */
  EM.defineSim('c9-cascada', function (sim) {
    const direct = () => CX.ladder({ src: { id: 'V1', t: 'VAC', p: { amp: 1, f: 1000 } }, items: [{ id: 'R1', t: 'R', p: { r: 1000 }, mode: 'series' }, { id: 'C1', t: 'C', p: { c: 1e-7 }, mode: 'shunt', tap: 'a' }, { id: 'R2', t: 'R', p: { r: 1000 }, mode: 'series' }, { id: 'C2', t: 'C', p: { c: 1e-7 }, mode: 'shunt', tap: 'out' }] });
    const buf = () => CX.ladder({ src: { id: 'V1', t: 'VAC', p: { amp: 1, f: 1000 } }, items: [{ id: 'R1', t: 'R', p: { r: 1000 }, mode: 'series' }, { id: 'C1', t: 'C', p: { c: 1e-7 }, mode: 'shunt', tap: 'a' }, { id: 'U1', t: 'OA', mode: 'buf' }, { id: 'R2', t: 'R', p: { r: 1000 }, mode: 'series' }, { id: 'C2', t: 'C', p: { c: 1e-7 }, mode: 'shunt', tap: 'out' }] });
    let kind = 'direct';
    const T = EM.Taller.mount(sim, {
      aspect: 3.1, edit: 'values', panels: ['bode'], autoBode: true, spec: direct(),
      controls: [{ type: 'seg', id: 'k', label: 'Acoplamiento entre etapas', options: [['direct', 'Directo'], ['buf', 'Con seguidor (A.O.)']], value: 'direct', init: false, apply: (T, v) => { kind = v; T.loadSpec(v === 'direct' ? direct() : buf()); } }],
      outs: [{ id: 'fc', label: 'f_c de una etapa', fn: () => fmt(1 / (TAU * 1e3 * 1e-7), 'Hz') }, { id: 'f3', label: 'f de −3 dB (teoría)', hl: true, fn: () => (kind === 'direct' ? '596 Hz' : '1.02 kHz') }]
    });
    T.setBode(10, 1e5);
    T.cfg.bodeRef = { label: 'teoría', fn: (f) => { const s = [0, TAU * f * 1e3 * 1e-7]; const a = [1 - s[1] * s[1] * 0 + 0, 0]; let z; if (kind === 'direct') { const x = s[1]; z = cdiv([1, 0], [1 - x * x, 3 * x]); } else { const h = cdiv([1, 0], [1, s[1]]); z = cmul(h, h); } return ref(z); } };
  });

  /* 9.4 Filtro doble T */
  EM.defineSim('c9-notch', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 1.6, edit: 'values', panels: ['bode'], autoBode: true,
      spec: {
        parts: [['V1', 'VAC', 2, 8, 0, { amp: 1, f: 1590 }], ['R1', 'R', 10, 6, 0, { r: 10000 }], ['R2', 'R', 18, 6, 0, { r: 10000 }], ['C3', 'C', 14, 8, 1, { c: 20e-9 }], ['C1', 'C', 10, 14, 0, { c: 10e-9 }], ['C2', 'C', 18, 14, 0, { c: 10e-9 }], ['R3', 'R', 14, 16, 1, { r: 5000 }], ['No', 'LBL', 24, 4, 0, { name: 'out' }]],
        wires: [['V1.0', 'R1.0'], [[6, 6], [6, 14], [8, 14]], ['R1.1', 'R2.0'], ['C1.1', 'C2.0'], [[20, 6], [26, 6], [26, 14], [20, 14]], [[24, 6], [24, 4]], [[14, 10], [30, 10], [30, 20]], [[14, 18], [30, 18]], [[2, 10], [2, 20], [30, 20]], [[30, 20], [30, 21]], ['gndat', 30, 21]]
      },
      controls: [
        { type: 'slider', id: 'r', label: 'Resistencia R', min: 1000, max: 100000, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => { T.set('R1', 'r', v); T.set('R2', 'r', v); T.set('R3', 'r', v / 2 * T.sim.p.mis); } },
        { type: 'slider', id: 'c', label: 'Capacitancia C', min: 1e-9, max: 1e-6, value: 1e-8, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => { T.set('C1', 'c', v); T.set('C2', 'c', v); T.set('C3', 'c', 2 * v); } },
        { type: 'slider', id: 'mis', label: 'Desajuste de R₃ (1 = perfecto)', min: 0.8, max: 1.2, step: 0.01, value: 1, unit: '', init: false, apply: (T, v) => T.set('R3', 'r', T.net.part('R1').p.r / 2 * v) }
      ],
      outs: [{ id: 'f0', label: 'f₀ = 1/(2πRC)', hl: true, fn: (T) => fmt(1 / (TAU * T.net.part('R1').p.r * T.net.part('C1').p.c), 'Hz') }]
    });
    T.setBode(100, 5e4);
  });
})();
