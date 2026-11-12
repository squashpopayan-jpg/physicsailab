/* Capítulo 3 — El generador de funciones y el osciloscopio */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* El generador alimenta una carga de 1 kΩ entre la columna 5 (señal) y el riel − */
  const loadSpec = (extra) => Object.assign({
    parts: [['R1', 'R', { r: 1000 }, 'h5', 'h9']],
    wires: [['@fgo', 'j5', 'yellow'], ['@fgg', 'T-1', 'black'], ['T-3', 'j9', 'gray']],
    probes: { s1: 'i5', s1g: 'T-6' },
    fg: { wave: 'sin', f: 1000, amp: 1, off: 0, duty: 0.5, on: true },
    osc: { tdiv: 5e-4, ch: [{ vdiv: 0.5, on: true }, { vdiv: 0.5, on: false }] }
  }, extra || {});

  /* 3.1 Primeras señales */
  EM.defineSim('c3-scope', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['fg', 'scope'], tray: false, tdiv: 5e-4, showInst: 'scope',
      hint: 'El generador alimenta una carga de 1 kΩ. La punta del canal 1 ya está en la señal; use «Autoajuste» o los mandos del osciloscopio.',
      spec: loadSpec(),
      controls: [
        { type: 'seg', id: 'w', label: 'Forma de onda', options: [['sin', 'Seno'], ['square', 'Cuadrada'], ['tri', 'Triángulo'], ['saw', 'Sierra']], value: 'sin', apply: (L, v) => L.fg({ wave: v }) },
        { type: 'slider', id: 'f', label: 'Frecuencia', min: 10, max: 100000, value: 1000, unit: 'Hz', log: true, fmt: (v) => EM.si(v, '', 3), apply: (L, v) => { L.fg({ f: v }); } },
        { type: 'slider', id: 'a', label: 'Amplitud (pico a pico)', min: 0.1, max: 10, step: 0.1, value: 2, unit: 'Vpp', apply: (L, v) => L.fg({ amp: v / 2 }) },
        { type: 'slider', id: 'o', label: 'Desplazamiento DC', min: -5, max: 5, step: 0.1, value: 0, unit: 'V', apply: (L, v) => L.fg({ off: v }) }
      ],
      goals: [
        { label: 'Vea entre 2 y 6 periodos en pantalla (ajuste la base de tiempo)', test: (L) => { const n = L.bench.inst.osc.tdiv * 10 * L.bench.inst.fg.f; return n >= 2 && n <= 6; } },
        { label: 'La señal ocupa al menos 4 divisiones (ajuste la escala vertical)', test: (L) => { const c = L.bench.inst.osc.ch[0], s = L.stat('c1'); return !!s && s.pp / c.vdiv >= 4 && s.pp / c.vdiv <= 8; } }
      ],
      outs: [
        { id: 'f', label: 'Frecuencia medida (CH1)', hl: true, fn: (L) => { const s = L.stat('c1'); return s && isFinite(s.f) ? fmt(s.f, 'Hz', 4) : '—'; } },
        { id: 'pp', label: 'Pico a pico (CH1)', fn: (L) => { const s = L.stat('c1'); return s ? fmt(s.pp, 'V') : '—'; } },
        { id: 'rms', label: 'Valor eficaz (CH1)', fn: (L) => { const s = L.stat('c1'); return s ? fmt(s.rms, 'V') : '—'; } }
      ]
    });
  });

  /* 3.2 Acoplamiento y disparo */
  EM.defineSim('c3-acople', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['fg', 'scope'], tray: false, tdiv: 5e-4, showInst: 'scope',
      hint: 'Una señal de 2 Vpp montada sobre 3 V de continua. Cambie el acoplamiento del canal 1 (DC / AC / GND).',
      spec: loadSpec({ fg: { wave: 'sin', f: 1000, amp: 1, off: 3, on: true }, osc: { tdiv: 5e-4, ch: [{ vdiv: 1, pos: -2, on: true }, { on: false }] } }),
      controls: [
        { type: 'seg', id: 'c', label: 'Acoplamiento del canal 1', options: [['dc', 'DC'], ['ac', 'AC'], ['gnd', 'GND']], value: 'dc', apply: (L, v) => { L.bench.inst.osc.ch[0].cpl = v; if (L.inst) L.inst.refresh(); } },
        { type: 'slider', id: 'o', label: 'Nivel de continua de la señal', min: -5, max: 5, step: 0.1, value: 3, unit: 'V', apply: (L, v) => L.fg({ off: v }) }
      ],
      outs: [
        { id: 'm', label: 'Valor medio de la señal (verdadero)', hl: true, fn: (L) => { const s = L.stat('c1'); return s ? fmt(s.mean, 'V') : '—'; } },
        { id: 'pp', label: 'Pico a pico', fn: (L) => { const s = L.stat('c1'); return s ? fmt(s.pp, 'V') : '—'; } }
      ]
    });
  });

  /* 3.3 Filtro RC con dos canales */
  const rcSpec = (f) => ({
    parts: [['R1', 'R', { r: 1000 }, 'h5', 'h9'], ['C1', 'C', { c: 1e-7 }, 'g9', 'g12']],
    wires: [['@fgo', 'j5', 'yellow'], ['@fgg', 'T-1', 'black'], ['T-3', 'j12', 'gray']],
    probes: { s1: 'i5', s1g: 'T-6', s2: 'i9', s2g: 'T-8' },
    fg: { wave: 'sin', f, amp: 1, off: 0, on: true },
    osc: { tdiv: 5e-4, ch: [{ vdiv: 0.5, on: true }, { vdiv: 0.5, on: true }] }
  });
  EM.defineSim('c3-rc', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['fg', 'scope'], tray: false, tdiv: 5e-4, showInst: 'scope', startZero: false,
      hint: 'Filtro RC pasabajos (1 kΩ y 100 nF): canal 1 = entrada, canal 2 = salida. Cambie la frecuencia y compare amplitudes.',
      spec: rcSpec(1000),
      controls: [{ type: 'slider', id: 'f', label: 'Frecuencia', min: 20, max: 20000, value: 1000, unit: 'Hz', log: true, fmt: (v) => EM.si(v, '', 3), apply: (L, v) => { L.fg({ f: v }); L.autoTdiv(v, 3); } }],
      outs: [
        { id: 'g', label: 'Ganancia medida (CH2/CH1)', hl: true, fn: (L) => { const a = L.stat('c1'), b = L.stat('c2'); return a && b && a.pp > 1e-6 ? (b.pp / a.pp).toFixed(3) : '—'; } },
        { id: 'gt', label: 'Ganancia teórica 1/√(1+(f/fc)²)', fn: (L) => { const f = L.bench.inst.fg.f, R = 1000, C = 1e-7, fc = 1 / (2 * Math.PI * R * C); return (1 / Math.hypot(1, f / fc)).toFixed(3); } },
        { id: 'fc', label: 'Frecuencia de corte', fn: () => fmt(1 / (2 * Math.PI * 1000 * 1e-7), 'Hz', 3) }
      ]
    });
  });

  /* 3.4 La punta ×1 / ×10 y el error de configuración */
  EM.defineSim('c3-puntas', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['fg', 'scope'], tray: false, tdiv: 5e-4, showInst: 'scope',
      hint: 'Dos ajustes deben coincidir: el interruptor físico de la punta y el menú del osciloscopio. Si no, las lecturas se equivocan por un factor 10.',
      spec: loadSpec({ fg: { wave: 'square', f: 1000, amp: 1, off: 0, on: true }, osc: { tdiv: 5e-4, ch: [{ vdiv: 0.5, on: true, sw: 10, set: 10 }, { on: false }] } }),
      controls: [
        { type: 'seg', id: 'sw', label: 'Interruptor de la punta', options: [[1, '×1'], [10, '×10']], value: 10, apply: (L, v) => { L.bench.inst.osc.ch[0].sw = +v; if (L.inst) L.inst.refresh(); } },
        { type: 'seg', id: 'set', label: 'Menú del osciloscopio', options: [[1, '×1'], [10, '×10']], value: 10, apply: (L, v) => { L.bench.inst.osc.ch[0].set = +v; if (L.inst) L.inst.refresh(); } }
      ],
      outs: [
        { id: 'real', label: 'Pico a pico real', fn: () => '2.000 V' },
        { id: 'leido', label: 'Pico a pico que muestra el osciloscopio', hl: true, fn: (L) => { const s = L.stat('c1'); const c = L.bench.inst.osc.ch[0]; return s ? fmt(s.pp * c.set / c.sw, 'V') : '—'; } }
      ]
    });
  });
})();
