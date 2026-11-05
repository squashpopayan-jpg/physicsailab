/* Capítulo 25 — Reguladores de tensión y fuentes de alimentación */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* ---------- 25.1 Característica de entrada: caída de tensión (dropout) ---------- */
  const regSpec = (model, rl, vin) => ({
    parts: [['VIN', 'VDC', 2, 12, 0, { v: vin }], ['U1', 'REG', 14, 12, 0, { model, hs: 0 }], ['Ci', 'C', 8, 16, 1, { c: 330e-9, kind: 'ceramic' }], ['Co', 'C', 22, 16, 1, { c: 100e-9, kind: 'ceramic' }], ['RL', 'R', 28, 12, 1, { r: rl, watt: 25 }]],
    wires: [['VIN.0', '@in:u'], ['VIN.1', 'gnd'], ['U1.0', '@in:l'], ['U1.1', '@out:r'], ['U1.2', 'gnd'], ['Ci.0', '@in:u'], ['Ci.1', 'gnd'], ['Co.0', '@out:u'], ['Co.1', 'gnd'], ['RL.0', '@out:u'], ['RL.1', 'gnd']]
  });
  EM.defineSim('c25-dropout', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.4, edit: 'values', panels: ['sweep', 'table'], autoSweep: true, net: { damage: false },
      hint: 'Regulador lineal con una carga de 100 Ω. Barra la tensión de entrada de 0 a 15 V y observe la tensión de salida. (Los nodos con la misma etiqueta están unidos.)',
      spec: regSpec('7805', 100, 9),
      controls: [
        { type: 'select', id: 'm', label: 'Regulador', options: [['7805', '7805 (5 V, caída 2 V)'], ['7809', '7809 (9 V)'], ['7812', '7812 (12 V)'], ['AMS1117', 'AMS1117-3.3 (LDO, caída 1.1 V)']], value: '7805', apply: (T, v) => T.set('U1', 'model', v) },
        { type: 'slider', id: 'vin', label: 'Tensión de entrada V_in', min: 0, max: 20, step: 0.1, value: 9, unit: 'V', apply: (T, v) => T.set('VIN', 'v', v) },
        { type: 'slider', id: 'rl', label: 'Resistencia de carga R_L', min: 1, max: 1000, value: 100, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 0), apply: (T, v) => T.set('RL', 'r', v) }
      ],
      outs: [
        { id: 'vo', label: 'Tensión de salida', hl: true, fn: (T) => fmt(T.net.v(T.net.netInfo.labelNet.out), 'V') },
        { id: 'vd', label: 'Diferencia V_in − V_out', fn: (T) => fmt(T.net.v(T.net.netInfo.labelNet.in) - T.net.v(T.net.netInfo.labelNet.out), 'V') },
        { id: 'vdo', label: 'Caída de tensión mínima (dropout) del modelo', fn: (T) => fmt(MOD.REG[T.net.part('U1').p.model].vdo, 'V') },
        { id: 'reg', label: 'Estado', fn: (T) => { const m = MOD.REG[T.net.part('U1').p.model], vi = T.net.v(T.net.netInfo.labelNet.in), vo = T.net.v(T.net.netInfo.labelNet.out); return vo > m.vref - 0.05 ? 'regulando' : vi < m.vref + m.vdo ? '<b style="color:var(--warn-ink)">en caída (V_in insuficiente)</b>' : 'limitado por corriente'; } }
      ]
    });
    T.setSweep({ src: 'VIN', a: 0, b: 20, n: 160, measLabel: 'out' });
  });

  /* ---------- 25.2 Regulador de tres terminales: potencia disipada y protección térmica ---------- */
  EM.defineSim('c25-lineal', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.4, edit: 'values', panels: ['table'], net: { thermalSpeed: 20 },
      hint: 'Regulador 7805 que alimenta una carga. La potencia que disipa es (V_in − V_out)·I; sin disipador se calienta hasta que su protección térmica lo apaga.',
      spec: regSpec('7805', 10, 12),
      controls: [
        { type: 'select', id: 'm', label: 'Regulador', options: [['7805', '7805 (5 V)'], ['7812', '7812 (12 V)'], ['AMS1117', 'AMS1117-3.3 (LDO)'], ['78L05', '78L05 (100 mA)']], value: '7805', apply: (T, v) => T.set('U1', 'model', v) },
        { type: 'slider', id: 'vin', label: 'Tensión de entrada V_in', min: 5, max: 30, step: 0.5, value: 12, unit: 'V', apply: (T, v) => T.set('VIN', 'v', v) },
        { type: 'slider', id: 'rl', label: 'Resistencia de carga R_L', min: 2, max: 500, value: 10, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 1), apply: (T, v) => T.set('RL', 'r', v) },
        { type: 'select', id: 'hs', label: 'Disipador', options: [[0, 'Sin disipador (aire libre)'], [20, 'Pequeño (20 K/W)'], [8, 'Mediano (8 K/W)'], [3, 'Grande (3 K/W)']], value: 0, apply: (T, v) => T.set('U1', 'hs', +v) }
      ],
      outs: [
        { id: 'vo', label: 'Tensión de salida', hl: true, fn: (T) => fmt(T.net.v(T.net.netInfo.labelNet.out), 'V') },
        { id: 'io', label: 'Corriente de carga', fn: (T) => fmt(T.net.v(T.net.netInfo.labelNet.out) / T.net.part('RL').p.r, 'A') },
        { id: 'p', label: 'Potencia disipada por el regulador', hl: true, fn: (T) => fmt((T.net.v(T.net.netInfo.labelNet.in) - T.net.v(T.net.netInfo.labelNet.out)) * T.net.v(T.net.netInfo.labelNet.out) / T.net.part('RL').p.r, 'W') },
        { id: 'eta', label: 'Rendimiento V_out/V_in', fn: (T) => EM.fix(100 * T.net.v(T.net.netInfo.labelNet.out) / Math.max(T.net.v(T.net.netInfo.labelNet.in), 1e-3), 0) + ' %' },
        { id: 'tj', label: 'Temperatura de la unión', fn: (T) => { const r = T.net.rt.U1; return r && r.T ? Math.round(r.T) + ' °C' : '—'; } },
        { id: 'st', label: 'Estado', fn: (T) => { const r = T.net.rt.U1; if (T.net.part('U1').dead) return '<b style="color:var(--warn-ink)">destruido</b>'; if (r && r.regHot) return '<b style="color:var(--warn-ink)">protección térmica activada (salida apagada)</b>'; return 'regulando'; } }
      ]
    });
  });

  /* ---------- 25.3 LM317 ajustable ---------- */
  EM.defineSim('c25-317', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.4, edit: 'values', panels: ['table'], net: { damage: false },
      hint: 'LM317: mantiene 1.25 V entre OUT y ADJ. La corriente por R₁ es constante, 1.25/R₁, y circula también por R₂: V_out = 1.25 V·(1 + R₂/R₁) + I_ADJ·R₂.',
      spec: {
        parts: [['VIN', 'VDC', 2, 12, 0, { v: 15 }], ['U1', 'REG', 14, 12, 0, { model: 'LM317' }], ['R1', 'R', 22, 16, 1, { r: 240 }], ['R2', 'R', 22, 22, 1, { r: 720 }], ['RL', 'R', 30, 12, 1, { r: 100, watt: 25 }]],
        wires: [['VIN.0', '@in:u'], ['VIN.1', 'gnd'], ['U1.0', '@in:l'], ['U1.1', '@out:r'], ['U1.2', '@adj:d'], ['R1.0', '@out:u'], ['R1.1', '@adj:d'], ['R2.0', '@adj:u'], ['R2.1', 'gnd'], ['RL.0', '@out:u'], ['RL.1', 'gnd']]
      },
      controls: [
        { type: 'slider', id: 'r2', label: 'Resistor R₂ (ajuste)', min: 0, max: 3000, step: 10, value: 720, unit: 'Ω', fmt: (v) => EM.fix(v, 0), apply: (T, v) => T.set('R2', 'r', Math.max(v, 0.01)) },
        { type: 'slider', id: 'vin', label: 'Tensión de entrada', min: 5, max: 35, step: 0.5, value: 15, unit: 'V', apply: (T, v) => T.set('VIN', 'v', v) },
        { type: 'slider', id: 'rl', label: 'Resistencia de carga', min: 10, max: 1000, value: 100, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 0), apply: (T, v) => T.set('RL', 'r', v) }
      ],
      outs: [
        { id: 'vo', label: 'Tensión de salida medida', hl: true, fn: (T) => fmt(T.net.v(T.net.netInfo.labelNet.out), 'V') },
        { id: 'vt', label: 'Teórica 1.25·(1 + R₂/R₁)', fn: (T) => fmt(1.25 * (1 + T.net.part('R2').p.r / T.net.part('R1').p.r), 'V') },
        { id: 'i', label: 'Corriente por R₁ (1.25 V / R₁)', fn: (T) => fmt(1.25 / T.net.part('R1').p.r, 'A') },
        { id: 'dr', label: 'Diferencia V_in − V_out', fn: (T) => fmt(T.net.v(T.net.netInfo.labelNet.in) - T.net.v(T.net.netInfo.labelNet.out), 'V') }
      ]
    });
  });

  /* ---------- 25.4 Fuente de alimentación completa ---------- */
  const fuenteSpec = (o) => ({
    parts: [['VAC', 'VAC', 2, 12, 0, { amp: o.amp, f: 60, rs: 0.5 }], ['BR', 'BR', 12, 12, 0, { model: '1N4007' }], ['C1', 'C', 22, 12, 1, { c: o.c, kind: 'elec' }], ['U1', 'REG', 32, 12, 0, { model: '7805', hs: 8 }], ['Co', 'C', 40, 12, 1, { c: 10e-6, kind: 'elec' }], ['RL', 'R', 46, 12, 1, { r: o.rl, watt: 25 }]],
    wires: [['VAC.0', '@a:u'], ['VAC.1', '@b:d'], ['BR.0', '@a:l'], ['BR.1', '@b:r'], ['BR.2', '@rect:u'], ['BR.3', 'gnd'], ['C1.0', '@rect:u'], ['C1.1', 'gnd'], ['U1.0', '@rect:l'], ['U1.1', '@out:r'], ['U1.2', 'gnd'], ['Co.0', '@out:u'], ['Co.1', 'gnd'], ['RL.0', '@out:u'], ['RL.1', 'gnd']]
  });
  EM.defineSim('c25-fuente', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.3, edit: 'values', panels: ['scope'], tdiv: 5e-3, net: { thermalSpeed: 20 },
      hint: 'Fuente completa: secundario de transformador (12 V eficaces, 60 Hz) → puente rectificador → condensador de filtro → regulador 7805 → carga. (Los nodos con la misma etiqueta están unidos.)',
      probes: [{ label: 'después del filtro', at: 'rect', color: '#ffd84a' }, { label: 'salida regulada', at: 'out', color: '#4ae3ff' }],
      spec: fuenteSpec({ amp: 17, c: 2200e-6, rl: 10 }),
      controls: [
        { type: 'slider', id: 'a', label: 'Tensión pico del secundario', min: 8, max: 30, step: 0.5, value: 17, unit: 'V', apply: (T, v) => T.set('VAC', 'amp', v) },
        { type: 'slider', id: 'c', label: 'Condensador de filtro C', min: 100e-6, max: 10000e-6, value: 2200e-6, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('C1', 'c', v) },
        { type: 'slider', id: 'rl', label: 'Resistencia de carga', min: 3, max: 200, value: 10, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 1), apply: (T, v) => T.set('RL', 'r', v) }
      ],
      outs: [
        { id: 'vm', label: 'Tensión media después del filtro', fn: (T) => { const o = T.stat('después del filtro'); return o ? fmt(o.mean, 'V') : '—'; } },
        { id: 'rp', label: 'Rizado pico a pico del filtro (medido)', hl: true, fn: (T) => { const o = T.stat('después del filtro'); return o ? fmt(o.pp, 'V') : '—'; } },
        { id: 'rt', label: 'Rizado teórico I/(2fC)', fn: (T) => { const o = T.stat('salida regulada'); const I = (o ? o.mean : 5) / T.net.part('RL').p.r; return fmt(I / (2 * 60 * T.net.part('C1').p.c), 'V'); } },
        { id: 'vo', label: 'Tensión de salida', hl: true, fn: (T) => { const o = T.stat('salida regulada'); return o ? fmt(o.mean, 'V') : '—'; } },
        { id: 'ro', label: 'Rizado de la salida (pico a pico)', fn: (T) => { const o = T.stat('salida regulada'); return o ? fmt(o.pp, 'V') : '—'; } },
        { id: 'mg', label: 'Margen sobre la caída mínima (V_min − 7 V)', fn: (T) => { const o = T.stat('después del filtro'); return o ? fmt(o.mn - 7, 'V') : '—'; } }
      ]
    });
    T.fastForward(0.3);
  });
})();
