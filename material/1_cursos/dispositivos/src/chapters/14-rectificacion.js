/* Capítulo 14 — Rectificación y aplicaciones de los diodos */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, CX = EM.cx;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const IN = { parts: [['Nin', 'LBL', 4, 4, 0, { name: 'in' }]], wires: [[[4, 6], [4, 4]]] };
  const rip = (T, lab) => { const s = T.stat(lab); return s ? s : null; };

  /* 14.1 Media onda con filtro */
  EM.defineSim('c14-media', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.6, edit: 'values', panels: ['scope'], tdiv: 5e-3, watch: ['D1'],
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: CX.ladder({ src: { id: 'V1', t: 'VAC', p: { amp: 12, f: 60, rs: 0.1 } }, items: [{ id: 'D1', t: 'D', p: { model: '1N4007' }, mode: 'series', tap: 'out' }, { id: 'C1', t: 'C', p: { c: 1e-3, kind: 'elec', vmax: 25 }, mode: 'shunt' }, { id: 'RL', t: 'R', p: { r: 100, watt: 5 }, mode: 'shunt' }], extra: IN }),
      controls: [
        { type: 'slider', id: 'c', label: 'Condensador de filtro', min: 1e-5, max: 1e-2, value: 1e-3, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('C1', 'c', v) },
        { type: 'slider', id: 'r', label: 'Resistencia de carga', min: 10, max: 2000, value: 100, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 0), apply: (T, v) => T.set('RL', 'r', v) }
      ],
      outs: [
        { id: 'dc', label: 'Tensión media de salida', hl: true, fn: (T) => { const s = T.stat('salida'); return s ? fmt(s.mean, 'V') : '—'; } },
        { id: 'pp', label: 'Rizado pico a pico', fn: (T) => { const s = T.stat('salida'); return s ? fmt(s.pp, 'V') : '—'; } },
        { id: 'te', label: 'Rizado teórico I/(f·C)', fn: (T) => { const s = T.stat('salida'); return s ? fmt((s.mean / T.net.part('RL').p.r) / (60 * T.net.part('C1').p.c), 'V') : '—'; } },
        { id: 'ip', label: 'Corriente de pico del diodo', fn: (T) => fmt(T.ipk('D1'), 'A') }
      ]
    });
  });

  /* 14.2 Puente rectificador */
  EM.defineSim('c14-puente', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.9, edit: 'values', panels: ['scope'], tdiv: 5e-3, watch: ['BR1'],
      probes: [{ label: 'entrada', at: 'in', ref: 'in2', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: {
        parts: [['V1', 'VAC', 4, 8, 0, { amp: 12, f: 60, rs: 0.1 }], ['N2', 'LBL', 8, 15, 0, { name: 'in2' }], ['BR1', 'BR', 14, 8, 0, { model: '1N4007' }], ['C1', 'C', 24, 6, 1, { c: 1e-3, kind: 'elec', vmax: 25 }], ['RL', 'R', 30, 6, 1, { r: 100, watt: 5 }], ['Nin', 'LBL', 4, 4, 0, { name: 'in' }], ['No', 'LBL', 20, 1, 0, { name: 'out' }]],
        wires: [[[4, 6], [4, 4]], ['V1.0', [11, 6], 'BR1.~'], ['V1.1', [4, 13], [20, 13], [20, 8], [17, 8]], [[8, 13], [8, 15]], ['BR1.2', [14, 3], [30, 3]], [[24, 3], [24, 4]], [[30, 3], [30, 4]], [[20, 3], [20, 1]], ['BR1.3', [14, 15], [30, 15]], [[24, 8], [24, 15]], [[30, 8], [30, 15]], [[14, 15], [14, 16]], ['gndat', 14, 16]]
      },
      controls: [
        { type: 'slider', id: 'c', label: 'Condensador de filtro', min: 1e-5, max: 1e-2, value: 1e-3, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('C1', 'c', v) },
        { type: 'slider', id: 'r', label: 'Resistencia de carga', min: 10, max: 2000, value: 100, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 0), apply: (T, v) => T.set('RL', 'r', v) }
      ],
      outs: [
        { id: 'dc', label: 'Tensión media de salida', hl: true, fn: (T) => { const s = T.stat('salida'); return s ? fmt(s.mean, 'V') : '—'; } },
        { id: 'pp', label: 'Rizado pico a pico', fn: (T) => { const s = T.stat('salida'); return s ? fmt(s.pp, 'V') : '—'; } },
        { id: 'te', label: 'Rizado teórico I/(2f·C)', fn: (T) => { const s = T.stat('salida'); return s ? fmt((s.mean / T.net.part('RL').p.r) / (120 * T.net.part('C1').p.c), 'V') : '—'; } },
        { id: 'f', label: 'Frecuencia del rizado', fn: (T) => { const s = T.stat('salida'); return s && isFinite(s.f) ? fmt(s.f, 'Hz') : '—'; } }
      ]
    });
  });

  /* 14.3 Doblador de tensión */
  EM.defineSim('c14-doblador', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.4, edit: 'values', panels: ['scope'], tdiv: 5e-3, startZero: true,
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'nodo A', at: 'a', color: '#7dff82' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: CX.ladder({ src: { id: 'V1', t: 'VAC', p: { amp: 10, f: 60, rs: 0.1 } }, items: [{ id: 'C1', t: 'C', p: { c: 1e-4, kind: 'elec', vmax: 25 }, mode: 'series', tap: 'a' }, { id: 'D1', t: 'D', p: { model: '1N4148' }, mode: 'shunt', rot: 3 }, { id: 'D2', t: 'D', p: { model: '1N4148' }, mode: 'series', tap: 'out' }, { id: 'C2', t: 'C', p: { c: 1e-4, kind: 'elec', vmax: 35 }, mode: 'shunt' }, { id: 'RL', t: 'R', p: { r: 10000, watt: 1 }, mode: 'shunt' }], extra: IN }),
      controls: [{ type: 'slider', id: 'r', label: 'Resistencia de carga', min: 500, max: 1e5, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('RL', 'r', v) }],
      outs: [
        { id: 'vo', label: 'Salida media', hl: true, fn: (T) => { const s = T.stat('salida'); return s ? fmt(s.mean, 'V') : '—'; } },
        { id: 'te', label: 'Teórico 2(V_p − V_D) sin carga', fn: () => fmt(2 * (10 - 0.65), 'V') },
        { id: 'a', label: 'Nodo A: pico a pico', fn: (T) => { const s = T.stat('nodo A'); return s ? fmt(s.pp, 'V') : '—'; } }
      ]
    });
  });

  /* 14.4 Recortador */
  EM.defineSim('c14-recortador', function (sim) {
    const dos = () => CX.ladder({ src: { id: 'V1', t: 'FG', p: { wave: 'sin', amp: 5, f: 1000, rs: 0.01 } }, items: [{ id: 'R1', t: 'R', p: { r: 1000 }, mode: 'series', tap: 'out' }, { id: 'D1', t: 'D', p: { model: '1N4148' }, mode: 'shunt', rot: 1 }, { id: 'D2', t: 'D', p: { model: '1N4148' }, mode: 'shunt', rot: 3 }], extra: IN });
    const uno = () => CX.ladder({ src: { id: 'V1', t: 'FG', p: { wave: 'sin', amp: 5, f: 1000, rs: 0.01 } }, items: [{ id: 'R1', t: 'R', p: { r: 1000 }, mode: 'series', tap: 'out' }, { id: 'D1', t: 'D', p: { model: '1N4148' }, mode: 'shunt', rot: 1 }], extra: IN });
    let kind = 'dos';
    const T = EM.Taller.mount(sim, {
      aspect: 2.5, edit: 'values', panels: ['scope'], tdiv: 2e-4,
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: dos(),
      controls: [
        { type: 'seg', id: 'k', label: 'Recortador', options: [['dos', 'Dos diodos (± 0.6 V)'], ['uno', 'Un diodo (positivo)']], value: 'dos', init: false, apply: (T, v) => { kind = v; T.loadSpec(v === 'dos' ? dos() : uno()); } },
        { type: 'slider', id: 'a', label: 'Amplitud de entrada', min: 0.2, max: 10, step: 0.1, value: 5, unit: 'V', init: false, apply: (T, v) => T.set('V1', 'amp', v) }
      ],
      outs: [{ id: 'mx', label: 'Salida: máximo y mínimo', hl: true, fn: (T) => { const s = T.stat('salida'); return s ? `${EM.fix(s.mx, 2)} V / ${EM.fix(s.mn, 2)} V` : '—'; } }]
    });
  });

  /* 14.5 Sujetador (restaurador de continua) */
  EM.defineSim('c14-sujetador', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.5, edit: 'values', panels: ['scope'], tdiv: 5e-4, startZero: true,
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: CX.ladder({ src: { id: 'V1', t: 'FG', p: { wave: 'square', amp: 2.5, f: 1000, rs: 0.01 } }, items: [{ id: 'C1', t: 'C', p: { c: 1e-6, kind: 'film' }, mode: 'series', tap: 'out' }, { id: 'D1', t: 'D', p: { model: '1N4148' }, mode: 'shunt', rot: 3 }, { id: 'RL', t: 'R', p: { r: 100000, watt: 0.25 }, mode: 'shunt' }], extra: IN }),
      controls: [{ type: 'slider', id: 'a', label: 'Amplitud de entrada', min: 0.5, max: 8, step: 0.1, value: 2.5, unit: 'V', apply: (T, v) => T.set('V1', 'amp', v) }],
      outs: [{ id: 'mm', label: 'Salida: mínimo y máximo', hl: true, fn: (T) => { const s = T.stat('salida'); return s ? `${EM.fix(s.mn, 2)} V / ${EM.fix(s.mx, 2)} V` : '—'; } }, { id: 'dc', label: 'Valor medio', fn: (T) => { const s = T.stat('salida'); return s ? fmt(s.mean, 'V') : '—'; } }]
    });
  });

  /* 14.6 Detector de envolvente AM */
  EM.defineSim('c14-detector', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.4, edit: 'values', panels: ['scope'], tdiv: 1e-4,
      probes: [{ label: 'señal AM', at: 'in', color: '#ffd84a' }, { label: 'detectada', at: 'out', color: '#4ae3ff' }],
      spec: CX.ladder({ src: { id: 'V1', t: 'FG', p: { wave: 'am', amp: 2, mi: 0.6, f: 50000, fm: 1000, rs: 1 } }, items: [{ id: 'D1', t: 'D', p: { model: '1N5819' }, mode: 'series', tap: 'out' }, { id: 'C1', t: 'C', p: { c: 1e-8, kind: 'ceramic' }, mode: 'shunt' }, { id: 'RL', t: 'R', p: { r: 10000, watt: 0.25 }, mode: 'shunt' }], extra: IN }),
      controls: [
        { type: 'slider', id: 'm', label: 'Índice de modulación', min: 0.1, max: 1, step: 0.05, value: 0.6, unit: '', apply: (T, v) => T.set('V1', 'mi', v) },
        { type: 'slider', id: 'c', label: 'Condensador del detector', min: 1e-9, max: 1e-6, value: 1e-8, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('C1', 'c', v) }
      ],
      outs: [
        { id: 'tau', label: 'τ = RC (debe estar entre 1/f_c y 1/f_m)', hl: true, fn: (T) => fmt(T.net.part('RL').p.r * T.net.part('C1').p.c, 's') },
        { id: 'pp', label: 'Señal detectada (pico a pico)', fn: (T) => { const s = T.stat('detectada'); return s ? fmt(s.pp, 'V') : '—'; } }
      ]
    });
  });
})();
