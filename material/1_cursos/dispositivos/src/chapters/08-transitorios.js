/* Capítulo 8 — Transitorios y resonancia */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, CX = EM.cx;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const TAU = 2 * Math.PI;
  const pickTdiv = (t) => EM.Panels.TDIVS.reduce((b, x) => (Math.abs(Math.log(x / t)) < Math.abs(Math.log(b / t)) ? x : b), 1e-3);
  const IN = { parts: [['Nin', 'LBL', 4, 4, 0, { name: 'in' }]], wires: [[[4, 6], [4, 4]]] };

  /* 8.1 Integrador / derivador */
  EM.defineSim('c8-difint', function (sim) {
    const specInt = () => CX.ladder({ src: { id: 'FG1', t: 'FG', p: { wave: 'square', amp: 1, off: 0, f: 1000 } }, items: [{ id: 'R1', t: 'R', p: { r: 9950 }, mode: 'series' }, { id: 'C1', t: 'C', p: { c: 1e-6 }, mode: 'shunt', tap: 'out' }], extra: IN });
    const specDer = () => CX.ladder({ src: { id: 'FG1', t: 'FG', p: { wave: 'square', amp: 1, off: 0, f: 100 } }, items: [{ id: 'C1', t: 'C', p: { c: 1e-6 }, mode: 'series' }, { id: 'R1', t: 'R', p: { r: 50 }, mode: 'shunt', tap: 'out' }], extra: IN });
    const T = EM.Taller.mount(sim, {
      aspect: 2.3, edit: 'values', panels: ['scope'], tdiv: 5e-4, startZero: false,
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: specInt(),
      controls: [
        { type: 'seg', id: 'm', label: 'Montaje', options: [['int', 'Integrador (R serie, C a tierra)'], ['der', 'Derivador (C serie, R a tierra)']], value: 'int', init: false, apply: (T, v) => { T.loadSpec(v === 'int' ? specInt() : specDer()); const f = v === 'int' ? 1000 : 100; T.sim.ctl.f.set(f, true); T.set('FG1', 'f', f); T.setTdiv(pickTdiv(5 / f / 10)); } },
        { type: 'slider', id: 'f', label: 'Frecuencia de la cuadrada', min: 10, max: 10000, value: 1000, unit: 'Hz', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => { T.set('FG1', 'f', v); T.setTdiv(pickTdiv(5 / v / 10)); } },
        { type: 'slider', id: 'tau', label: 'Constante de tiempo τ (R fija el valor)', min: 1e-5, max: 1e-1, value: 1e-2, unit: 's', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => { const r = Math.max(v / 1e-6 - 50, 1); T.set('R1', 'r', r); } }
      ],
      outs: [
        { id: 'tau', label: 'τ = R·C (incluye 50 Ω del generador)', hl: true, fn: (T) => fmt((T.net.part('R1').p.r + 50) * T.net.part('C1').p.c, 's') },
        { id: 'pp', label: 'Salida pico a pico', fn: (T) => { const s = T.stat('salida'); return s ? fmt(s.pp, 'V') : '—'; } },
        { id: 'teo', label: 'Integrador: A·T/(2τ) (si τ ≫ T)', fn: (T) => fmt(1 * (1 / T.net.part('FG1').p.f) / (2 * (T.net.part('R1').p.r + 50) * T.net.part('C1').p.c), 'V') }
      ]
    });
    T.setTdiv(5e-4);
  });

  /* 8.2 RLC serie */
  EM.defineSim('c8-rlc', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.1, edit: 'values', panels: ['scope'], startZero: true, tdiv: 2e-4,
      probes: [{ label: 'generador', at: 'in', color: '#ffd84a' }, { label: 'condensador', at: 'out', color: '#4ae3ff' }],
      spec: CX.ladder({ src: { id: 'FG1', t: 'FG', p: { wave: 'square', amp: 1, off: 1, f: 200, rs: 0.1 } }, items: [{ id: 'R1', t: 'R', p: { r: 100 }, mode: 'series' }, { id: 'L1', t: 'L', p: { l: 0.01, kind: 'air', imax: 5 }, mode: 'series' }, { id: 'C1', t: 'C', p: { c: 1e-6 }, mode: 'shunt', tap: 'out' }], extra: IN }),
      controls: [
        { type: 'slider', id: 'r', label: 'Resistencia R', min: 5, max: 2000, value: 100, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, v < 10 ? 1 : 0), apply: (T, v) => { T.set('R1', 'r', v); T.auto && T.auto(); } },
        { type: 'slider', id: 'l', label: 'Inductancia L', min: 1e-3, max: 0.1, value: 0.01, unit: 'H', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('L1', 'l', v); T.auto && T.auto(); } },
        { type: 'slider', id: 'c', label: 'Capacitancia C', min: 1e-8, max: 1e-5, value: 1e-6, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('C1', 'c', v); T.auto && T.auto(); } }
      ],
      outs: [
        { id: 'f0', label: 'f₀ = 1/(2π√LC)', fn: (T) => fmt(T.par().w0 / TAU, 'Hz') },
        { id: 'z', label: 'Amortiguamiento ζ', hl: true, fn: (T) => EM.fix(T.par().z, 3) },
        { id: 'q', label: 'Q = 1/(2ζ)', fn: (T) => EM.fix(1 / (2 * T.par().z), 2) },
        { id: 'os', label: 'Sobreimpulso teórico', fn: (T) => { const z = T.par().z; return z < 1 ? EM.fix(100 * Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)), 1) + ' %' : 'ninguno'; } },
        { id: 'om', label: 'Sobreimpulso medido', fn: (T) => { const s = T.stat('condensador'); return s ? EM.fix(100 * (s.mx - 2) / 2, 1) + ' %' : '—'; } }
      ]
    });
    T.par = () => { const R = T.net.part('R1').p.r + T.net.part('FG1').p.rs + S.MOD.IND.air.rdc(T.net.part('L1').p.l), L = T.net.part('L1').p.l, C = T.net.part('C1').p.c; return { w0: 1 / Math.sqrt(L * C), z: R / 2 * Math.sqrt(C / L) }; };
    T.auto = () => { const p = T.par(); const th = Math.min(Math.max(4 / (p.z * p.w0), 8 * TAU / p.w0 / 2), 1e3 / p.w0); T.set('FG1', 'f', 1 / (2 * th)); T.setTdiv(pickTdiv(2.2 * th / 10)); };
    T.auto();
  });

  /* 8.3 Resonancia: Bode */
  EM.defineSim('c8-resonancia', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.9, edit: 'values', panels: ['bode'], autoBode: true,
      spec: CX.ladder({ src: { id: 'V1', t: 'VAC', p: { amp: 1, f: 5000 } }, items: [{ id: 'L1', t: 'L', p: { l: 0.01, kind: 'air', imax: 5 }, mode: 'series' }, { id: 'C1', t: 'C', p: { c: 1e-7 }, mode: 'series' }, { id: 'R1', t: 'R', p: { r: 10 }, mode: 'shunt', tap: 'out' }] }),
      controls: [
        { type: 'slider', id: 'r', label: 'Resistencia R', min: 1, max: 1000, value: 10, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, v < 10 ? 1 : 0), apply: (T, v) => T.set('R1', 'r', v) },
        { type: 'slider', id: 'l', label: 'Inductancia L', min: 1e-3, max: 0.1, value: 0.01, unit: 'H', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('L1', 'l', v) },
        { type: 'slider', id: 'c', label: 'Capacitancia C', min: 1e-8, max: 1e-6, value: 1e-7, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('C1', 'c', v) }
      ],
      outs: [
        { id: 'f0', label: 'f₀ teórica', hl: true, fn: (T) => fmt(1 / (TAU * Math.sqrt(T.net.part('L1').p.l * T.net.part('C1').p.c)), 'Hz') },
        { id: 'q', label: 'Q = (1/R)√(L/C)', fn: (T) => EM.fix(Math.sqrt(T.net.part('L1').p.l / T.net.part('C1').p.c) / (T.net.part('R1').p.r + S.MOD.IND.air.rdc(T.net.part('L1').p.l) + 0.001), 1) },
        { id: 'bw', label: 'Ancho de banda f₀/Q', fn: (T) => { const q = Math.sqrt(T.net.part('L1').p.l / T.net.part('C1').p.c) / (T.net.part('R1').p.r + S.MOD.IND.air.rdc(T.net.part('L1').p.l) + 0.001); return fmt(1 / (TAU * Math.sqrt(T.net.part('L1').p.l * T.net.part('C1').p.c)) / q, 'Hz'); } }
      ]
    });
    T.setBode(200, 1e5);
  });
})();
