/* Capítulo 14 — El amplificador operacional */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  /* LM741 en e10: 2 IN− (e11), 3 IN+ (e12), 4 V− (e13), 6 OUT (f12), 7 V+ (f11).
     Alimentación ±12 V: canal 1 → +12 (T+) con su negativo como común (T−); canal 2 → −12 (B−) con su positivo como común (B+). */
  const alim = () => EM.RAILS_PS1([['@ps2+', 'B+1', 'red'], ['@ps2-', 'B-1', 'black'], ['T-25', 'B+25', 'black'], ['j11', 'T+5', 'red'], ['a13', 'B-5', 'black']]);
  const CFG = {
    inv: (rf, rin) => ({ parts: [['U1', 'OA', { model: 'LM741' }, 'e10'], ['R1', 'R', { r: rf }, 'h12', 'c11'], ['R2', 'R', { r: rin }, 'd11', 'd16']], wires: alim().concat([['a12', 'B+3', 'black'], ['@fgo', 'a16', 'yellow'], ['@fgg', 'B+6', 'black']]) }),
    noinv: (rf, rin) => ({ parts: [['U1', 'OA', { model: 'LM741' }, 'e10'], ['R1', 'R', { r: rf }, 'h12', 'c11'], ['R2', 'R', { r: rin }, 'd11', 'B+4']], wires: alim().concat([['a12', 'b16', 'orange'], ['@fgo', 'a16', 'yellow'], ['@fgg', 'B+6', 'black']]) }),
    seguidor: () => ({ parts: [['U1', 'OA', { model: 'LM741' }, 'e10'], ['R1', 'R', { r: 1 }, 'h12', 'c11']], wires: alim().concat([['a12', 'b16', 'orange'], ['@fgo', 'a16', 'yellow'], ['@fgg', 'B+6', 'black']]) })
  };
  const mk = (k, rf, rin, a) => Object.assign(CFG[k](rf, rin), { psu: { 1: { v: 12, ilim: 0.1, on: true }, 2: { v: 12, ilim: 0.1, on: true } }, fg: { wave: 'sin', f: 1000, amp: a, off: 0, on: true }, probes: { s1: 'e16', s1g: 'B+8', s2: 'g12', s2g: 'B+10' }, osc: { tdiv: 5e-4, ch: [{ vdiv: 0.5, on: true }, { vdiv: 2, on: true }] } });
  const teor = (k, rf, rin) => (k === 'inv' ? -rf / rin : k === 'noinv' ? 1 + rf / rin : 1);
  EM.defineSim('c14-opamp', function (sim) {
    const st = { k: 'inv', rf: 10000, rin: 1000, a: 0.5 };
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'fg', 'scope'], tray: false, tdiv: 5e-4, showInst: 'scope',
      hint: 'LM741 alimentado con ±12 V (canales 1 y 2 de la fuente). Elija la configuración y la ganancia; canal 1 = entrada, canal 2 = salida.',
      spec: mk('inv', 10000, 1000, 0.5),
      controls: [
        { type: 'select', id: 'k', label: 'Configuración', options: [['inv', 'Inversor (−R_f/R_in)'], ['noinv', 'No inversor (1+R_f/R_g)'], ['seguidor', 'Seguidor de tensión']], value: 'inv', init: false, apply: (L, v) => { st.k = v; L.load(mk(st.k, st.rf, st.rin, st.a)); } },
        { type: 'select', id: 'rf', label: 'R_f', options: [[10000, '10 kΩ'], [47000, '47 kΩ'], [100000, '100 kΩ'], [1000000, '1 MΩ']], value: 10000, init: false, apply: (L, v) => { st.rf = +v; L.load(mk(st.k, st.rf, st.rin, st.a)); } },
        { type: 'select', id: 'rin', label: 'R_in (o R_g)', options: [[1000, '1 kΩ'], [10000, '10 kΩ']], value: 1000, init: false, apply: (L, v) => { st.rin = +v; L.load(mk(st.k, st.rf, st.rin, st.a)); } },
        { type: 'slider', id: 'a', label: 'Amplitud de entrada (pico)', min: 0.05, max: 2, step: 0.05, value: 0.5, unit: 'V', init: false, apply: (L, v) => { st.a = v; L.fg({ amp: v }); } }
      ],
      outs: [
        { id: 'g', label: 'Ganancia medida', hl: true, fn: (L) => { const a = L.stat('c1'), b = L.stat('c2'); return a && b && a.pp > 1e-3 ? (b.pp / a.pp).toFixed(2) : '—'; } },
        { id: 't', label: 'Ganancia teórica (con ±12 V)', fn: () => teor(st.k, st.rf, st.rin).toFixed(2) },
        { id: 'o', label: 'Salida (pico a pico)', fn: (L) => { const b = L.stat('c2'); return b ? fmt(b.pp, 'V') : '—'; } },
        { id: 's', label: 'Estado', fn: (L) => { const b = L.stat('c2'); return b && b.pp > 19 ? 'SATURADO (recorta en ±10 V)' : 'lineal'; } }
      ]
    });
  });
})();
