/* Capítulo 23 — Aplicaciones del A.O. y filtros activos */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const TAU = 2 * Math.PI;
  const mag = (re, im) => 20 * Math.log10(Math.hypot(re, im));
  const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const deg = (z) => Math.atan2(z[1], z[0]) * 180 / Math.PI;
  const ref = (z) => [mag(z[0], z[1]), deg(z)];
  const vOut = (T) => T.net.v(T.net.netInfo.labelNet.out);

  /* ---------- 23.1 Sumador inversor ---------- */
  EM.defineSim('c23-suma', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.5, edit: 'values', panels: ['table'], net: { damage: false },
      hint: 'Sumador inversor: cada entrada aporta una corriente V_k/R_k al nodo de tierra virtual y R_f la convierte en tensión.',
      spec: {
        parts: [['V1', 'VDC', -2, 8, 0, { v: 1 }], ['V2', 'VDC', -2, 17, 0, { v: 0.5 }], ['R1', 'R', 4, 8, 0, { r: 10000 }], ['R2', 'R', 4, 14, 0, { r: 20000 }], ['U1', 'OA', 14, 12, 0, { model: 'TL081', flip: true }], ['Rf', 'R', 14, 6, 0, { r: 20000 }], ['No', 'LBL', 21, 12, 0, { name: 'out' }]],
        wires: [[[-2, 6], [2, 6], [2, 8]], [[-2, 10], [-2, 11]], ['gndat', -2, 11], [[-2, 15], [2, 15], [2, 14]], [[-2, 19], [-2, 20]], ['gndat', -2, 20], ['R1.1', [8, 8], [8, 11], 'U1.1'], ['R2.1', [8, 14], [8, 11]], [[8, 8], [8, 6], 'Rf.0'], ['Rf.1', [19, 6], [19, 12]], ['U1.2', [19, 12]], [[19, 12], [21, 12]], [[11, 13], [11, 14]], ['gndat', 11, 14]]
      },
      controls: [
        { type: 'slider', id: 'v1', label: 'Entrada V₁', min: -5, max: 5, step: 0.05, value: 1, unit: 'V', apply: (T, v) => T.set('V1', 'v', v) },
        { type: 'slider', id: 'v2', label: 'Entrada V₂', min: -5, max: 5, step: 0.05, value: 0.5, unit: 'V', apply: (T, v) => T.set('V2', 'v', v) },
        { type: 'slider', id: 'r1', label: 'Resistor R₁', min: 1000, max: 100000, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('R1', 'r', v) },
        { type: 'slider', id: 'r2', label: 'Resistor R₂', min: 1000, max: 100000, value: 20000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('R2', 'r', v) },
        { type: 'slider', id: 'rf', label: 'Resistor de realimentación R_f', min: 1000, max: 100000, value: 20000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('Rf', 'r', v) }
      ],
      outs: [
        { id: 'vo', label: 'Salida medida', hl: true, fn: (T) => fmt(vOut(T), 'V') },
        { id: 'vt', label: 'Salida teórica −(R_f/R₁·V₁ + R_f/R₂·V₂)', fn: (T) => { const p = (id) => T.net.part(id).p; return fmt(-(p('Rf').r / p('R1').r * p('V1').v + p('Rf').r / p('R2').r * p('V2').v), 'V'); } },
        { id: 'g', label: 'Ganancias de cada entrada', fn: (T) => { const p = (id) => T.net.part(id).p; return EM.fix(-p('Rf').r / p('R1').r, 2) + ' y ' + EM.fix(-p('Rf').r / p('R2').r, 2); } },
        { id: 'sat', label: 'Estado', fn: (T) => (Math.abs(vOut(T)) > 12.9 ? '<b style="color:var(--warn-ink)">saturado</b>' : 'lineal') }
      ]
    });
  });

  /* ---------- 23.2 Integrador y derivador ---------- */
  const inSpec = (o) => {
    const parts = [['FG1', 'FG', -4, 12, 0, { wave: o.wave, amp: o.amp, f: o.f, duty: 0.5, rs: 1 }], ['U1', 'OA', 14, 12, 0, { model: 'TL081', flip: true }], ['No', 'LBL', 21, 12, 0, { name: 'out' }], ['Ni', 'LBL', 1, 9, 2, { name: 'in' }]];
    const wires = [[[-1, 13], [-1, 14]], ['gndat', -1, 14], [[19, 12], [21, 12]], ['U1.2', [19, 12]], [[11, 13], [11, 14]], ['gndat', 11, 14], [[1, 11], [1, 9]]];
    if (o.mode === 'int') {
      parts.push(['Rin', 'R', 5, 11, 0, { r: o.r }], ['Cf', 'C', 14, 2, 0, { c: o.c, kind: 'film' }], ['Rp', 'R', 14, 7, 0, { r: 1e6 }]);
      wires.push(['FG1.OUT', 'Rin.0'], ['Rin.1', 'U1.1'], [[9, 11], [9, 2], 'Cf.0'], [[9, 7], 'Rp.0'], ['Cf.1', [19, 2], [19, 12]], ['Rp.1', [19, 7]]);
    } else {
      parts.push(['Cd', 'C', 3, 11, 0, { c: o.c, kind: 'film' }], ['Rs', 'R', 7, 11, 0, { r: 1000 }], ['Rf', 'R', 14, 7, 0, { r: o.r }], ['Cf', 'C', 14, 2, 0, { c: 1e-9, kind: 'film' }]);
      wires.push(['FG1.OUT', 'Cd.0'], ['Cd.1', 'Rs.0'], ['Rs.1', 'U1.1'], [[10, 11], [10, 2], 'Cf.0'], [[10, 7], 'Rf.0'], ['Cf.1', [19, 2], [19, 12]], ['Rf.1', [19, 7]]);
    }
    return { parts, wires };
  };
  EM.defineSim('c23-int', function (sim) {
    const cur = () => ({ mode: sim.p.m || 'int', wave: sim.p.w || 'square', amp: sim.p.a || 0.5, f: sim.p.f || 1000, r: sim.p.r || 10000, c: sim.p.c || 1e-8 });
    const apply = (T) => { const o = cur(); T.loadSpec(inSpec(o)); };
    const TDV = [5e-5, 1e-4, 2e-4, 5e-4, 1e-3, 2e-3];
    EM.Taller.mount(sim, {
      aspect: 1.1, edit: 'values', panels: ['scope'], tdiv: 5e-4, startZero: true, net: { damage: false },
      hint: 'Integrador (C en la realimentación) y derivador (C en la entrada). La resistencia de 1 MΩ en paralelo con el condensador del integrador limita la ganancia en continua; la de 1 kΩ y el condensador de 1 nF estabilizan el derivador.',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: inSpec({ mode: 'int', wave: 'square', amp: 0.5, f: 1000, r: 10000, c: 1e-8 }),
      controls: [
        { type: 'seg', id: 'm', label: 'Circuito', options: [['int', 'Integrador'], ['der', 'Derivador']], value: 'int', init: false, apply: (T, v) => { T.loadSpec(inSpec(cur())); } },
        { type: 'select', id: 'w', label: 'Forma de onda de entrada', options: [['square', 'Cuadrada'], ['tri', 'Triangular'], ['sin', 'Senoidal']], value: 'square', init: false, apply: (T, v) => T.set('FG1', 'wave', v) },
        { type: 'slider', id: 'a', label: 'Amplitud de entrada', min: 0.05, max: 3, value: 0.5, unit: 'V', log: true, fmt: (v) => EM.fix(v, 2), init: false, apply: (T, v) => T.set('FG1', 'amp', v) },
        { type: 'slider', id: 'f', label: 'Frecuencia', min: 100, max: 20000, value: 1000, unit: 'Hz', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => { T.set('FG1', 'f', v); const want = 5 / v / 10; T.setTdiv(TDV.reduce((m, x) => (Math.abs(Math.log(x / want)) < Math.abs(Math.log(m / want)) ? x : m), TDV[0])); } },
        { type: 'slider', id: 'r', label: 'Resistor R', min: 1000, max: 100000, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => T.set(T.net.part('Rin') ? 'Rin' : 'Rf', 'r', v) },
        { type: 'slider', id: 'c', label: 'Condensador C', min: 1e-9, max: 1e-6, value: 1e-8, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => T.set(T.net.part('Cf') && T.net.part('Rin') ? 'Cf' : 'Cd', 'c', v) }
      ],
      outs: [
        { id: 'rc', label: 'Constante de tiempo RC', hl: true, fn: (T) => fmt(sim.p.r * sim.p.c, 's') },
        { id: 'sl', label: 'Integrador: pendiente de la rampa (V_pk/RC), derivador: no aplica', fn: (T) => (T.net.part('Rin') ? fmt(T.net.part('FG1').p.amp / (sim.p.r * sim.p.c), 'V/s') : '—') },
        { id: 'pp', label: 'Salida pico a pico', fn: (T) => { const o = T.stat('salida'); return o ? fmt(o.pp, 'V') : '—'; } },
        { id: 'pt', label: 'Teórica de la salida pico a pico (cuadrada)', fn: (T) => { const p = T.net.part('FG1').p; if (p.wave !== 'square') return '—'; return T.net.part('Rin') ? fmt(p.amp * (1 / p.f / 2) / (sim.p.r * sim.p.c) * 2, 'V') : '—'; } }
      ]
    });
  });

  /* ---------- 23.3 Filtro Sallen–Key de segundo orden ---------- */
  const skSpec = (o) => {
    const lp = o.kind === 'lp';
    const Zs = lp ? ['R', { r: o.r }] : ['C', { c: o.c, kind: 'film' }], Zp = lp ? ['C', { c: o.c, kind: 'film' }] : ['R', { r: o.r }];
    return {
      parts: [['FG1', 'FG', -4, 12, 0, { wave: 'sin', amp: 1, f: 1000, rs: 1 }], ['Z1', Zs[0], 5, 11, 0, Zs[1]], ['Z2', Zs[0], 11, 11, 0, Zs[1]], ['Z3', Zp[0], 15, 14, 1, Zp[1]], ['Z4', Zp[0], 13, 6, 0, Zp[1]],
        ['U1', 'OA', 22, 12, 0, { model: 'TL081' }], ['Ra', 'R', 17, 17, 1, { r: 10000 }], ['Rb', 'R', 23, 18, 0, { r: Math.max(0.001, (o.k - 1) * 10000) }], ['No', 'LBL', 30, 12, 0, { name: 'out' }], ['Ni', 'LBL', 2, 9, 2, { name: 'in' }]],
      wires: [['FG1.OUT', 'Z1.0'], [[2, 11], [2, 9]], [[-1, 13], [-1, 14]], ['gndat', -1, 14], ['Z1.1', 'Z2.0'], ['Z2.1', 'U1.0'], [[15, 11], [15, 12]], ['Z3.1', [15, 17]], ['gndat', 15, 17], [[8, 11], [8, 6], 'Z4.0'], ['Z4.1', [28, 6], [28, 12]], ['U1.2', [28, 12]], [[28, 12], [30, 12]],
        [[19, 13], [19, 18], 'Rb.0'], ['Rb.1', [27, 18], [27, 12]], [[19, 15], 'Ra.0'], ['Ra.1', [17, 20]], ['gndat', 17, 20]]
    };
  };
  EM.defineSim('c23-sallen', function (sim) {
    const cur = () => ({ kind: sim.p.k || 'lp', r: sim.p.r || 10000, c: sim.p.c || 16e-9, k: sim.p.g || 1 });
    const setRC = (T) => { const p = sim.p, lp = (p.k || 'lp') === 'lp'; if (lp) { T.set('Z1', 'r', p.r); T.set('Z2', 'r', p.r); T.set('Z3', 'c', p.c); T.set('Z4', 'c', p.c); } else { T.set('Z1', 'c', p.c); T.set('Z2', 'c', p.c); T.set('Z3', 'r', p.r); T.set('Z4', 'r', p.r); } T.set('Rb', 'r', Math.max(0.001, ((p.g || 1) - 1) * 10000)); };
    const T = EM.Taller.mount(sim, {
      aspect: 1.1, edit: 'values', panels: ['bode'], autoBode: true, net: { damage: false },
      hint: 'Filtro Sallen–Key con R₁ = R₂ = R y C₁ = C₂ = C; la ganancia K = 1 + R_b/R_a del A.O. fija el factor de calidad Q = 1/(3 − K).',
      spec: skSpec({ kind: 'lp', r: 10000, c: 16e-9, k: 1 }),
      controls: [
        { type: 'seg', id: 'k', label: 'Tipo de filtro', options: [['lp', 'Pasabajos'], ['hp', 'Pasaaltos']], value: 'lp', init: false, apply: (T, v) => { T.loadSpec(skSpec(cur())); } },
        { type: 'slider', id: 'r', label: 'Resistencia R', min: 1000, max: 100000, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => setRC(T) },
        { type: 'slider', id: 'c', label: 'Capacitancia C', min: 1e-9, max: 1e-6, value: 16e-9, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => setRC(T) },
        { type: 'slider', id: 'g', label: 'Ganancia K = 1 + R_b/R_a', min: 1, max: 2.9, step: 0.01, value: 1, unit: '', init: false, apply: (T, v) => setRC(T) }
      ],
      outs: [
        { id: 'fc', label: 'Frecuencia característica f₀ = 1/(2πRC)', hl: true, fn: (T) => fmt(1 / (TAU * sim.p.r * sim.p.c), 'Hz') },
        { id: 'q', label: 'Factor de calidad Q = 1/(3 − K)', hl: true, fn: (T) => EM.fix(1 / (3 - sim.p.g), 2) },
        { id: 'pk', label: 'Sobreimpulso en f₀ (≈ K·Q)', fn: (T) => EM.fix(20 * Math.log10((sim.p.g * (1 / (3 - sim.p.g)))), 1) + ' dB' }
      ]
    });
    T.setBode(10, 1e5);
    T.cfg.bodeRef = { label: 'teoría (2.º orden)', fn: (f) => { const x = f * TAU * sim.p.r * sim.p.c, K = sim.p.g || 1, den = [1 - x * x, (3 - K) * x]; const lp = (sim.p.k || 'lp') === 'lp'; const num = lp ? [K, 0] : [-K * x * x, 0]; return ref(cdiv(num, den)); } };
  });

  /* ---------- 23.4 Rectificador de precisión ---------- */
  const rectSpec = (o) => {
    const parts = [['FG1', 'FG', -4, 14, 0, { wave: 'sin', amp: o.amp, f: o.f, rs: 1 }]];
    if (o.mode === 'super') {
      parts.push(['U1', 'OA', 14, 12, 0, { model: o.q, flip: true }], ['D1', 'D', 20, 12, 0, { model: '1N4148' }], ['RL', 'R', 24, 16, 1, { r: 10000 }], ['Ni', 'LBL', 2, 11, 2, { name: 'in' }], ['No', 'LBL', 26, 12, 0, { name: 'out' }]);
      return { parts, wires: [['FG1.OUT', [-1, 13], 'U1.0'], [[2, 13], [2, 11]], [[-1, 15], [-1, 16]], ['gndat', -1, 16], ['U1.2', 'D1.0'], ['D1.1', [24, 12], 'RL.0'], [[24, 12], [26, 12]], [[11, 11], [9, 11], [9, 8], [24, 8], [24, 12]], ['RL.1', [24, 19]], ['gndat', 24, 19]] };
    }
    parts.push(['D1', 'D', 3, 13, 0, { model: '1N4148' }], ['RL', 'R', 10, 17, 1, { r: 10000 }], ['Ni', 'LBL', 0, 11, 2, { name: 'in' }], ['No', 'LBL', 8, 11, 0, { name: 'out' }]);
    return { parts, wires: [['FG1.OUT', 'D1.0'], [[0, 13], [0, 11]], [[-1, 15], [-1, 16]], ['gndat', -1, 16], ['D1.1', [10, 13], 'RL.0'], [[8, 13], [8, 11]], ['RL.1', [10, 21]], ['gndat', 10, 21]] };
  };
  EM.defineSim('c23-rect', function (sim) {
    const cur = () => ({ mode: sim.p.m || 'super', amp: sim.p.a || 0.3, f: sim.p.f || 1000, q: sim.p.q || 'TL081' });
    const TDV = [1e-6, 2e-6, 5e-6, 1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3];
    EM.Taller.mount(sim, {
      aspect: 1.2, edit: 'values', panels: ['scope'], tdiv: 5e-4, net: { damage: false },
      hint: 'Rectificador de media onda: con un diodo solo, la señal de menos de 0.6 V desaparece; con el diodo dentro del lazo de realimentación del A.O. (superdiodo), la caída del diodo queda dividida por la ganancia en lazo abierto.',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: rectSpec({ mode: 'super', amp: 0.3, f: 1000, q: 'TL081' }),
      controls: [
        { type: 'seg', id: 'm', label: 'Circuito', options: [['super', 'Superdiodo (A.O. + diodo)'], ['simple', 'Diodo solo']], value: 'super', init: false, apply: (T, v) => { T.loadSpec(rectSpec(cur())); } },
        { type: 'select', id: 'q', label: 'Amplificador operacional', options: [['TL081', 'TL081 (13 V/µs)'], ['LM741', 'LM741 (0.5 V/µs)']], value: 'TL081', init: false, apply: (T, v) => { if (sim.p.m !== 'simple') T.set('U1', 'model', v); } },
        { type: 'slider', id: 'a', label: 'Amplitud de la señal', min: 0.02, max: 5, value: 0.3, unit: 'V', log: true, fmt: (v) => EM.fix(v, 2), init: false, apply: (T, v) => T.set('FG1', 'amp', v) },
        { type: 'slider', id: 'f', label: 'Frecuencia', min: 100, max: 200000, value: 1000, unit: 'Hz', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => { T.set('FG1', 'f', v); const want = 5 / v / 10; T.setTdiv(TDV.reduce((m, x) => (Math.abs(Math.log(x / want)) < Math.abs(Math.log(m / want)) ? x : m), TDV[0])); } }
      ],
      outs: [
        { id: 'pk', label: 'Pico de la salida', hl: true, fn: (T) => { const o = T.stat('salida'); return o ? fmt(o.mx, 'V') : '—'; } },
        { id: 'pi', label: 'Pico de la entrada', fn: (T) => { const o = T.stat('entrada'); return o ? fmt(o.mx, 'V') : '—'; } },
        { id: 'er', label: 'Pérdida (entrada − salida)', hl: true, fn: (T) => { const o = T.stat('salida'), i = T.stat('entrada'); return o && i ? fmt(i.mx - o.mx, 'V') : '—'; } },
        { id: 'av', label: 'Valor medio de la salida', fn: (T) => { const o = T.stat('salida'); return o ? fmt(o.mean, 'V') : '—'; } }
      ]
    });
  });

  /* ---------- 23.5 Amplificador diferencial (restador) y CMRR ---------- */
  const difSpec = (o) => ({
    parts: [['FG1', 'FG', -4, 12, 0, { wave: 'sin', amp: o.amp, f: 1000, rs: 1 }], ['R1', 'R', 5, 11, 0, { r: 10000 }], ['R3', 'R', 5, 15, 0, { r: 10000 }], ['R4', 'R', 9, 17, 1, { r: 100000 * (1 + o.d) }], ['Rf', 'R', 14, 7, 0, { r: 100000 }], ['U1', 'OA', 14, 12, 0, { model: 'TL081', flip: true }], ['No', 'LBL', 21, 12, 0, { name: 'out' }], ['Ni', 'LBL', 1, 9, 2, { name: 'in' }]],
    wires: [['FG1.OUT', 'R1.0'], [[1, 11], [1, 9]], [[-1, 13], [-1, 14]], ['gndat', -1, 14], ['R1.1', 'U1.1'], [[9, 11], [9, 7], 'Rf.0'], ['Rf.1', [19, 7], [19, 12]], ['U1.2', [19, 12]], [[19, 12], [21, 12]], ['R3.1', [9, 15], [9, 13], 'U1.0'], ['R4.1', [9, 21]], ['gndat', 9, 21],
      o.cm ? [[1, 11], [1, 15], 'R3.0'] : [[3, 15], [3, 16]], o.cm ? [[1, 15], [1, 15]] : ['gndat', 3, 16]]
  });
  EM.defineSim('c23-dif', function (sim) {
    const cur = () => ({ cm: (sim.p.m || 'dif') === 'com', d: (sim.p.d === undefined ? 0.01 : sim.p.d), amp: sim.p.a || 0.1 });
    const T = EM.Taller.mount(sim, {
      aspect: 1.1, edit: 'values', panels: ['scope'], tdiv: 5e-4, net: { damage: false },
      hint: 'Restador con R₁ = R₃ = 10 kΩ y R_f = R₄ = 100 kΩ (ganancia diferencial 10). La razón de rechazo en modo común depende del apareamiento de los resistores: aquí R₄ se desvía δ % de su valor.',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: difSpec({ cm: false, d: 0.01, amp: 0.1 }),
      controls: [
        { type: 'seg', id: 'm', label: 'Aplicación de la señal', options: [['dif', 'Diferencial (a V₁; V₂ a masa)'], ['com', 'Modo común (a V₁ y V₂)']], value: 'dif', init: false, apply: (T, v) => { T.loadSpec(difSpec(cur())); } },
        { type: 'slider', id: 'd', label: 'Desapareamiento de R₄ (δ)', min: -0.05, max: 0.05, step: 0.001, value: 0.01, unit: '', fmt: (v) => EM.fix(v * 100, 1) + ' %', init: false, apply: (T, v) => T.set('R4', 'r', 100000 * (1 + v)) },
        { type: 'slider', id: 'a', label: 'Amplitud de la señal', min: 0.01, max: 1, value: 0.1, unit: 'V', log: true, fmt: (v) => EM.fix(v, 2), init: false, apply: (T, v) => T.set('FG1', 'amp', v) }
      ],
      outs: [
        { id: 'g', label: 'Ganancia medida V_sal/V_ent', hl: true, fn: (T) => { const o = T.stat('salida'), i = T.stat('entrada'); return o && i && i.pp > 1e-4 ? EM.fix(o.pp / i.pp, 4) : '—'; } },
        { id: 'ad', label: 'Ganancia diferencial teórica R_f/R₁', fn: (T) => EM.fix(T.net.part('Rf').p.r / T.net.part('R1').p.r, 2) },
        { id: 'acm', label: 'Ganancia de modo común teórica', hl: true, fn: (T) => { const p = (id) => T.net.part(id).p, A = 1 + p('Rf').r / p('R1').r; return EM.fix(Math.abs(A * p('R4').r / (p('R3').r + p('R4').r) - p('Rf').r / p('R1').r), 5); } },
        { id: 'cmrr', label: 'CMRR teórica', fn: (T) => { const p = (id) => T.net.part(id).p, A = 1 + p('Rf').r / p('R1').r, acm = Math.abs(A * p('R4').r / (p('R3').r + p('R4').r) - p('Rf').r / p('R1').r), ad = (p('Rf').r / p('R1').r + A * p('R4').r / (p('R3').r + p('R4').r)) / 2; return acm < 1e-9 ? '∞' : EM.fix(20 * Math.log10(ad / acm), 1) + ' dB'; } }
      ]
    });
  });
})();
