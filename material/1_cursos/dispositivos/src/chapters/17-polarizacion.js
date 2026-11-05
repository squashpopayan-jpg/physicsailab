/* Capítulo 17 — Polarización y conmutación con BJT */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD, CX = EM.cx;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* 17.1 Polarización fija frente a divisor con R_E */
  EM.defineSim('c17-polar', function (sim) {
    let kind = 'fija';
    const mk = () => CX.bias(kind, { q: '2N3904', rb: 2.2e6 });
    const T = EM.Taller.mount(sim, {
      aspect: 1.35, edit: 'values', panels: ['table'], hint: 'Compare cómo reaccionan los dos circuitos al cambiar el transistor y la temperatura.',
      spec: mk(),
      controls: [
        { type: 'seg', id: 'k', label: 'Polarización', options: [['fija', 'Fija (R_B desde V_CC)'], ['div', 'Divisor + R_E']], value: 'fija', init: false, apply: (T, v) => { kind = v === 'fija' ? 'fija' : 'div'; T.loadSpec(CX.bias(kind, {})); T.set('Q1', 'model', T.sim.p.m); } },
        { type: 'select', id: 'm', label: 'Transistor (β distinta)', options: [['BC547', 'BC547 (β ≈ 300)'], ['2N3904', '2N3904 (β ≈ 416)'], ['2N2222', '2N2222A (β ≈ 200)']], value: '2N3904', init: false, apply: (T, v) => T.set('Q1', 'model', v) },
        { type: 'slider', id: 'T', label: 'Temperatura ambiente', min: -20, max: 100, step: 5, value: 25, unit: '°C', init: false, apply: (T, v) => { T.net.cfg.Ta = v; } }
      ],
      outs: [
        { id: 'ic', label: 'Corriente de colector I_C', hl: true, fn: (T) => fmt(T.m('Q1').ic, 'A') },
        { id: 'vce', label: 'V_CE', fn: (T) => fmt(T.m('Q1').vce, 'V') },
        { id: 'ib', label: 'I_B', fn: (T) => fmt(T.m('Q1').ib, 'A') },
        { id: 'r', label: 'Región', fn: (T) => { const q = T.m('Q1'); return q.vce < 0.3 ? 'saturación' : q.vbe < 0.45 ? 'corte' : 'activa'; } }
      ]
    });
  });

  /* 17.2 Interruptor con transistor */
  EM.defineSim('c17-switch', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.35, edit: 'values', panels: ['scope'], tdiv: 2e-4, hint: 'El generador (0–5 V, 1 kHz) excita la base del 2N3904 a través de R_B; la carga es un resistor de 1 kΩ a 5 V.',
      probes: [{ label: 'base', at: 'bas', color: '#ffd84a' }, { label: 'colector', at: 'col', color: '#4ae3ff' }],
      spec: CX.swb({ q: '2N3904', vcc: 5, rb: 4700, rc: 1000, f: 1000, load: 'R' }),
      controls: [
        { type: 'slider', id: 'rb', label: 'Resistor de base R_B', min: 330, max: 1e6, value: 4700, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('RB', 'r', v) },
        { type: 'slider', id: 'rc', label: 'Resistor de carga R_C', min: 50, max: 10000, value: 1000, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 0), apply: (T, v) => T.set('RC', 'r', v) },
        { type: 'slider', id: 'f', label: 'Frecuencia', min: 100, max: 20000, value: 1000, unit: 'Hz', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('FG1', 'f', v); const want = 0.5 / v / 5 * 2, L = [1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3]; T.setTdiv(L.reduce((m, x) => (Math.abs(Math.log(x / want)) < Math.abs(Math.log(m / want)) ? x : m), L[0])); } }
      ],
      outs: [
        { id: 'vs', label: 'V_CE en saturación (mínimo)', hl: true, fn: (T) => { const s = T.stat('colector'); return s ? fmt(s.mn, 'V') : '—'; } },
        { id: 'ics', label: 'I_C de saturación', fn: (T) => { const s = T.stat('colector'); return s ? fmt((5 - s.mn) / T.net.part('RC').p.r, 'A') : '—'; } },
        { id: 'ib', label: 'I_B con la base en alto', fn: (T) => { const s = T.stat('base'); return s ? fmt((s.mx - 0.74) / (T.net.part('RB').p.r + 1), 'A') : '—'; } },
        { id: 'bf', label: 'β forzada I_C / I_B', fn: (T) => { const s = T.stat('colector'), b = T.stat('base'); if (!s || !b) return '—'; const ic = (5 - s.mn) / T.net.part('RC').p.r, ib = (b.mx - 0.74) / (T.net.part('RB').p.r + 1); return ib > 1e-9 ? EM.fix(ic / ib, 1) : '—'; } }
      ]
    });
  });

  /* 17.3 Motor con transistor Darlington y diodo de rueda libre */
  EM.defineSim('c17-motor', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.35, edit: 'values', panels: ['scope'], tdiv: 5e-3, startZero: true, watch: ['M1'], hint: 'PWM de 50 Hz sobre un motor de 6 V; el TIP120 es un Darlington (dos transistores).',
      probes: [{ label: 'base', at: 'bas', color: '#ffd84a' }, { label: 'colector', at: 'col', color: '#4ae3ff' }],
      spec: CX.swb({ darl: true, vcc: 6, rb: 1000, f: 50, load: 'MOT' }),
      controls: [
        { type: 'slider', id: 'd', label: 'Ciclo de trabajo del PWM', min: 0.05, max: 0.95, step: 0.05, value: 0.5, unit: '', apply: (T, v) => T.set('FG1', 'duty', v) },
        { type: 'seg', id: 'dio', label: 'Diodo de rueda libre', options: [['con', 'Con diodo'], ['sin', 'Sin diodo']], value: 'con', apply: (T, v) => { T.net.part('D1').fault = v === 'sin' ? { kind: 'open' } : null; T.net.invalidate(); } }
      ],
      outs: [
        { id: 'rpm', label: 'Velocidad del motor', hl: true, fn: (T) => { const r = T.net.rt.M1; return r && r.motor ? Math.round(Math.abs(r.motor.w) * 60 / (2 * Math.PI)) + ' rpm' : '—'; } },
        { id: 'pk', label: 'V_CE máxima (colector)', fn: (T) => { const s = T.stat('colector'); return s ? fmt(s.mx, 'V') : '—'; } },
        { id: 'st', label: 'Estado del transistor', fn: (T) => (T.net.part('Q1').dead ? '<b style="color:var(--warn-ink)">destruido</b>' : 'correcto') }
      ]
    });
  });

  /* 17.4 Fuga térmica */
  EM.defineSim('c17-fuga', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.35, edit: 'values', panels: ['table'], hint: 'TIP31C polarizado con una tensión de base fija (0.62 V), sin disipador. La temperatura sube con la potencia disipada.',
      spec: CX.ce({ q: 'TIP31', vcc: 12, rc: 4, rcw: 10, rb: 10, vb: 0.62, re: 0.001, hs: 0 }),
      controls: [
        { type: 'seg', id: 're', label: 'Resistor de emisor R_E', options: [[0.001, 'Sin R_E'], [1, 'R_E = 1 Ω']], value: 0.001, apply: (T, v) => T.set('RE', 'r', +v) },
        { type: 'select', id: 'hs', label: 'Disipador', options: [[0, 'Sin disipador (62 K/W)'], [20, 'Pequeño (20 K/W)'], [3, 'Grande (3 K/W)']], value: 0, apply: (T, v) => T.set('Q1', 'hs', +v) },
        { type: 'slider', id: 'vb', label: 'Tensión de base V_B', min: 0.55, max: 0.8, step: 0.005, value: 0.62, unit: 'V', apply: (T, v) => T.set('VB', 'v', v) }
      ],
      outs: [
        { id: 'ic', label: 'Corriente de colector', hl: true, fn: (T) => fmt(T.m('Q1').ic, 'A') },
        { id: 'p', label: 'Potencia en el transistor', fn: (T) => fmt(T.m('Q1').p || 0, 'W') },
        { id: 'tj', label: 'Temperatura de la unión', fn: (T) => { const r = T.net.rt.Q1; return r && r.T ? Math.round(r.T) + ' °C' : '—'; } },
        { id: 's', label: 'Estado', fn: (T) => (T.net.part('Q1').dead ? '<b style="color:var(--warn-ink)">destruido por fuga térmica</b>' : 'correcto') }
      ]
    });
  });
})();
