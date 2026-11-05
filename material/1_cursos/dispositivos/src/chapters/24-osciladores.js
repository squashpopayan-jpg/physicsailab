/* Capítulo 24 — Comparadores, histéresis y osciladores */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const TAU = 2 * Math.PI;
  const VSAT = 13.4; /* saturación del TL081 con ±15 V (modelo) */
  const tdivFor = (list, per) => list.reduce((m, x) => (Math.abs(Math.log(x / per)) < Math.abs(Math.log(m / per)) ? x : m), list[0]);
  const TD = [1e-6, 2e-6, 5e-6, 1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1, 0.2, 0.5];

  /* ---------- 24.1 Disparador de Schmitt (comparador con histéresis) ---------- */
  const schSpec = (o) => ({
    parts: [['FG1', 'FG', -12, 22, 0, { wave: 'tri', amp: o.amp, f: 1000, rs: 1 }], ['FG2', 'FG', -12, 12, 0, { wave: 'sin', amp: o.noise, f: 37000, rs: 1 }], ['R1', 'R', 5, 11, 0, { r: 10000 }], ['R2', 'R', 14, 6, 0, { r: o.r2 }], ['U1', 'OA', 14, 12, 0, { model: 'TL081' }]],
    wires: [['FG1.OUT', '@s:r'], ['FG1.GND', 'gnd'], ['FG2.GND', '@s:l'], ['FG2.OUT', '@in:r'], ['R1.0', '@in:l'], ['R1.1', 'U1.0'], [[12, 6], [9, 6], [9, 11]], ['R2.1', [19, 6], [19, 12]], ['U1.1', 'gnd'], ['U1.2', '@out:r']]
  });
  EM.defineSim('c24-schmitt', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 1.5, edit: 'values', panels: ['scope'], tdiv: 2e-4, net: { damage: false },
      hint: 'Disparador de Schmitt no inversor con A.O. y realimentación positiva (R₁ = 10 kΩ, R₂). A la señal triangular de 1 kHz se le puede sumar un «ruido» senoidal de 37 kHz.',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: schSpec({ amp: 3, noise: 0, r2: 100000 }),
      controls: [
        { type: 'slider', id: 'r2', label: 'Resistor de realimentación positiva R₂', min: 11000, max: 10000000, value: 100000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('R2', 'r', v) },
        { type: 'slider', id: 'a', label: 'Amplitud de la señal (triangular, pico)', min: 0.2, max: 6, value: 3, unit: 'V', log: true, fmt: (v) => EM.fix(v, 2), apply: (T, v) => T.set('FG1', 'amp', v) },
        { type: 'slider', id: 'n', label: 'Amplitud del ruido de 37 kHz (pico)', min: 0, max: 3, step: 0.05, value: 0, unit: 'V', apply: (T, v) => T.set('FG2', 'amp', v) }
      ],
      outs: [
        { id: 'th', label: 'Umbrales ±(R₁/R₂)·V_sat', hl: true, fn: (T) => '±' + fmt(T.net.part('R1').p.r / T.net.part('R2').p.r * VSAT, 'V') },
        { id: 'h', label: 'Ancho de la histéresis 2·(R₁/R₂)·V_sat', fn: (T) => fmt(2 * T.net.part('R1').p.r / T.net.part('R2').p.r * VSAT, 'V') },
        { id: 'f', label: 'Frecuencia de la salida', fn: (T) => { const o = T.stat('salida'); return o && o.f ? fmt(o.f, 'Hz') : '—'; } },
        { id: 'c', label: '¿Pierde la señal por el ruido?', fn: (T) => { const o = T.stat('salida'), p = T.net.part('FG2').p.amp; return o && o.f && o.f > 3000 ? '<b style="color:var(--warn-ink)">sí: la salida «rebota»</b>' : 'no'; } }
      ]
    });
  });

  /* ---------- 24.2 Oscilador de relajación (multivibrador astable con A.O.) ---------- */
  const relSpec = (o) => ({
    parts: [['U1', 'OA', 14, 12, 0, { model: 'TL081', offs: true }], ['Rt', 'R', 26, 8, 0, { r: o.rt }], ['Ct', 'C', 34, 12, 1, { c: o.ct, kind: 'film' }], ['R1', 'R', 26, 18, 0, { r: 10000 }], ['R2', 'R', 26, 23, 0, { r: o.r2 }]],
    wires: [['U1.0', '@p:l'], ['U1.1', '@n:l'], ['U1.2', '@out:r'], ['Rt.0', '@out:l'], ['Rt.1', '@n:r'], ['Ct.0', '@n:u'], ['Ct.1', 'gnd'], ['R1.0', '@p:l'], ['R1.1', 'gnd'], ['R2.0', '@out:l'], ['R2.1', '@p:r']]
  });
  EM.defineSim('c24-relax', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 1.5, edit: 'values', panels: ['scope'], tdiv: 1e-4, startZero: true, net: { damage: false },
      hint: '(Los nodos con la misma etiqueta —p, n, out— están unidos.) La salida satura en ±13.4 V; el condensador se carga a través de R hacia la salida y cuando su tensión cruza el umbral de la realimentación positiva, la salida conmuta. Se obtiene una onda cuadrada (salida) y una exponencial (condensador).',
      probes: [{ label: 'salida', at: 'out', color: '#ffd84a' }, { label: 'condensador (V₋)', at: 'n', color: '#4ae3ff' }, { label: 'umbral (V₊)', at: 'p', color: '#ff8f5a' }],
      spec: relSpec({ rt: 10000, ct: 1e-8, r2: 10000 }),
      controls: [
        { type: 'slider', id: 'rt', label: 'Resistor de temporización R', min: 1000, max: 1000000, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('Rt', 'r', v); retd(T); } },
        { type: 'slider', id: 'ct', label: 'Condensador C', min: 1e-9, max: 1e-6, value: 1e-8, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('Ct', 'c', v); retd(T); } },
        { type: 'slider', id: 'r2', label: 'Resistor R₂ (R₁ = 10 kΩ): fija β = R₁/(R₁+R₂)', min: 2000, max: 200000, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('R2', 'r', v); retd(T); } }
      ],
      outs: [
        { id: 'b', label: 'Factor de realimentación β = R₁/(R₁+R₂)', fn: (T) => EM.fix(T.net.part('R1').p.r / (T.net.part('R1').p.r + T.net.part('R2').p.r), 3) },
        { id: 'ft', label: 'Frecuencia teórica 1/[2RC·ln((1+β)/(1−β))]', hl: true, fn: (T) => { const b = T.net.part('R1').p.r / (T.net.part('R1').p.r + T.net.part('R2').p.r); return fmt(1 / (2 * T.net.part('Rt').p.r * T.net.part('Ct').p.c * Math.log((1 + b) / (1 - b))), 'Hz'); } },
        { id: 'fm', label: 'Frecuencia medida', fn: (T) => { const o = T.stat('salida'); return o && o.f ? fmt(o.f, 'Hz') : '—'; } },
        { id: 'vp', label: 'Amplitud de la salida / del triángulo ±βV_sat', fn: (T) => { const o = T.stat('salida'), c = T.stat('condensador (V₋)'); return o && c ? fmt(o.pp / 2, 'V') + ' / ' + fmt(c.pp / 2, 'V') : '—'; } }
      ]
    });
    T.fastForward(2e-3);
    function retd(T) { const per = 1 / (1 / (2 * T.net.part('Rt').p.r * T.net.part('Ct').p.c * Math.log((1 + T.net.part('R1').p.r / (T.net.part('R1').p.r + T.net.part('R2').p.r)) / (1 - T.net.part('R1').p.r / (T.net.part('R1').p.r + T.net.part('R2').p.r)))) ); T.setTdiv(tdivFor(TD, 4 * per / 10)); }
  });

  /* ---------- 24.3 Oscilador de puente de Wien ---------- */
  const wienSpec = (o) => ({
    parts: [['U1', 'OA', 14, 12, 0, { model: 'TL081', offs: true }], ['Rs1', 'R', 4, 22, 0, { r: o.r }], ['Cs1', 'C', 10, 22, 0, { c: o.c, kind: 'film' }], ['Rp', 'R', 18, 22, 1, { r: o.r }], ['Cp', 'C', 23, 22, 1, { c: o.c, kind: 'film' }], ['Rg', 'R', 29, 22, 1, { r: 10000 }],
      ['Rf1', 'R', 35, 22, 0, { r: 10000 }], ['Rf2', 'R', 41, 20, 0, { r: o.rf2 }], ['D1', 'D', 41, 24, 0, { model: '1N4148' }], ['D2', 'D', 41, 28, 2, { model: '1N4148' }]],
    wires: [['U1.0', '@p:l'], ['U1.1', '@n:l'], ['U1.2', '@out:r'], ['Rs1.0', '@out:l'], ['Rs1.1', 'Cs1.0'], ['Cs1.1', '@p:r'], ['Rp.0', '@p:u'], ['Rp.1', 'gnd'], ['Cp.0', '@p:u'], ['Cp.1', 'gnd'], ['Rg.0', '@n:u'], ['Rg.1', 'gnd'], ['Rf1.0', '@out:l'],
      [[37, 22], [39, 22], [39, 20]], [[39, 20], [39, 28]], [[43, 20], [43, 28]], ['Rf2.1', '@n:r']]
  });
  EM.defineSim('c24-wien', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.1, edit: 'values', panels: ['scope'], tdiv: 5e-4, startZero: true, net: { damage: false },
      hint: '(Los nodos con la misma etiqueta están unidos.) La red RC serie–paralelo atenúa 3 veces a f₀ = 1/(2πRC) con fase nula: con una ganancia ligeramente superior a 3 se genera una senoide. Los diodos antiparalelo reducen la ganancia cuando la amplitud crece (estabilización). El arranque lo da la V_os del A.O.; espere unos segundos.',
      probes: [{ label: 'salida', at: 'out', color: '#ffd84a' }, { label: 'entrada +', at: 'p', color: '#4ae3ff' }],
      spec: wienSpec({ r: 16000, c: 1e-8, rf2: 10600 }),
      controls: [
        { type: 'slider', id: 'r', label: 'Resistor R de la red RC (R₁ = R₂)', min: 5000, max: 100000, value: 16000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('Rs1', 'r', v); T.set('Rp', 'r', v); } },
        { type: 'slider', id: 'g', label: 'Resistor R_f2 (ganancia a pequeña señal = 1 + (10 k + R_f2)/10 k)', min: 9000, max: 13000, step: 50, value: 10600, unit: 'Ω', fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('Rf2', 'r', v) },
        { type: 'seg', id: 'lim', label: 'Estabilización de amplitud', options: [['con', 'Con diodos'], ['sin', 'Sin diodos (satura)']], value: 'con', apply: (T, v) => { for (const id of ['D1', 'D2']) T.net.part(id).fault = v === 'sin' ? { kind: 'open' } : null; } }
      ],
      outs: [
        { id: 'f0', label: 'Frecuencia teórica f₀ = 1/(2πRC)', hl: true, fn: (T) => fmt(1 / (TAU * T.net.part('Rp').p.r * T.net.part('Cp').p.c), 'Hz') },
        { id: 'fm', label: 'Frecuencia medida', fn: (T) => { const o = T.stat('salida'); return o && o.f ? fmt(o.f, 'Hz') : '—'; } },
        { id: 'k', label: 'Ganancia a pequeña señal K = 1 + (R_f1 + R_f2)/R_g', fn: (T) => EM.fix(1 + (T.net.part('Rf1').p.r + T.net.part('Rf2').p.r) / T.net.part('Rg').p.r, 3) },
        { id: 'a', label: 'Amplitud de la salida (pico)', hl: true, fn: (T) => { const o = T.stat('salida'); return o ? fmt(o.pp / 2, 'V') : '—'; } }
      ]
    });
    T.fastForward(0.1);
  });

  /* ---------- 24.4 Temporizador 555: astable ---------- */
  const t555a = (o) => ({
    parts: [['IC', 'T555', 14, 12, 0, {}], ['VCC', 'VDC', 2, 12, 0, { v: o.vcc }], ['R1', 'R', 26, 8, 1, { r: o.r1 }], ['R2', 'R', 26, 15, 1, { r: o.r2 }], ['Ct', 'C', 31, 15, 1, { c: o.c, kind: 'film' }], ['Cc', 'C', 6, 17, 1, { c: 1e-8, kind: 'ceramic' }], ['Rd', 'R', 24, 4, 0, { r: 470 }], ['Ld', 'LED', 29, 4, 0, { color: 'rojo' }]],
    wires: [['VCC.0', '@vcc:u'], ['VCC.1', 'gnd'], ['IC.VCC', '@vcc:u'], ['IC.GND', 'gnd'], ['IC.RESET', '@vcc:l'], ['IC.TRIG', '@tt:l'], ['IC.THR', '@tt:l'], ['IC.CTRL', '@ctl:l'], ['Cc.0', '@ctl:u'], ['Cc.1', 'gnd'], ['IC.OUT', '@out:r'], ['IC.DIS', '@dis:r'],
      ['R1.0', '@vcc:u'], ['R1.1', '@dis:d'], ['R2.0', '@dis:u'], ['R2.1', '@tt:d'], ['Ct.0', '@tt:u'], ['Ct.1', 'gnd'], ['Rd.0', '@out:l'], ['Rd.1', 'Ld.0'], ['Ld.1', 'gnd']]
  });
  EM.defineSim('c24-555a', function (sim) {
    const per = (T) => { const p = (id) => T.net.part(id).p; return Math.log(2) * (p('R1').r + 2 * p('R2').r) * p('Ct').c; };
    const T = EM.Taller.mount(sim, {
      aspect: 1.5, edit: 'values', panels: ['scope'], tdiv: 1e-3, net: { damage: false },
      hint: '(Los nodos con la misma etiqueta están unidos.) Multivibrador astable con el 555: el condensador oscila entre 1/3 y 2/3 de V_CC; se carga por R₁ + R₂ y se descarga por R₂.',
      probes: [{ label: 'salida', at: 'out', color: '#ffd84a' }, { label: 'condensador', at: 'tt', color: '#4ae3ff' }],
      spec: t555a({ vcc: 5, r1: 1000, r2: 10000, c: 1e-7 }),
      controls: [
        { type: 'slider', id: 'r1', label: 'Resistor R₁', min: 500, max: 100000, value: 1000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('R1', 'r', v); ref(T); } },
        { type: 'slider', id: 'r2', label: 'Resistor R₂', min: 1000, max: 1000000, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('R2', 'r', v); ref(T); } },
        { type: 'slider', id: 'c', label: 'Condensador C', min: 1e-9, max: 1e-5, value: 1e-7, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('Ct', 'c', v); ref(T); } }
      ],
      outs: [
        { id: 'f', label: 'Frecuencia teórica 1.44/[(R₁ + 2R₂)C]', hl: true, fn: (T) => fmt(1 / per(T), 'Hz') },
        { id: 'fm', label: 'Frecuencia medida', fn: (T) => { const o = T.stat('salida'); return o && o.f ? fmt(o.f, 'Hz') : '—'; } },
        { id: 'd', label: 'Ciclo de trabajo teórico (R₁ + R₂)/(R₁ + 2R₂)', hl: true, fn: (T) => { const p = (id) => T.net.part(id).p; return EM.fix(100 * (p('R1').r + p('R2').r) / (p('R1').r + 2 * p('R2').r), 1) + ' %'; } },
        { id: 'dm', label: 'Ciclo de trabajo medido', fn: (T) => { const o = T.stat('salida'); return o && !isNaN(o.duty) ? EM.fix(o.duty * 100, 1) + ' %' : '—'; } }
      ]
    });
    function ref(T) { T.setTdiv(tdivFor(TD, 4 * per(T) / 10)); }
  });

  /* ---------- 24.5 Temporizador 555: monoestable ---------- */
  const t555m = (o) => ({
    parts: [['IC', 'T555', 14, 12, 0, {}], ['VCC', 'VDC', 2, 12, 0, { v: o.vcc }], ['R1', 'R', 26, 8, 1, { r: o.r }], ['Ct', 'C', 31, 15, 1, { c: o.c, kind: 'film' }], ['Cc', 'C', 6, 17, 1, { c: 1e-8, kind: 'ceramic' }], ['FG1', 'FG', -6, 24, 0, { wave: 'pulse', amp: -o.vcc / 2, off: o.vcc, f: o.f, duty: 0.05, rs: 1 }]],
    wires: [['VCC.0', '@vcc:u'], ['VCC.1', 'gnd'], ['IC.VCC', '@vcc:u'], ['IC.GND', 'gnd'], ['IC.RESET', '@vcc:l'], ['IC.TRIG', '@trg:l'], ['IC.THR', '@tt:l'], ['IC.CTRL', '@ctl:l'], ['Cc.0', '@ctl:u'], ['Cc.1', 'gnd'], ['IC.OUT', '@out:r'], ['IC.DIS', '@tt:r'],
      ['R1.0', '@vcc:u'], ['R1.1', '@tt:d'], ['Ct.0', '@tt:u'], ['Ct.1', 'gnd'], ['FG1.OUT', '@trg:r'], ['FG1.GND', 'gnd']]
  });
  EM.defineSim('c24-555m', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 1.5, edit: 'values', panels: ['scope'], tdiv: 5e-2, startZero: true, net: { damage: false },
      hint: '(Los nodos con la misma etiqueta están unidos.) Monoestable con el 555: un pulso de disparo bajo en TRIG (generador que da 5 V y baja a 0 V durante el 5 % del período: pulsos negativos breves) produce un pulso de salida de duración 1.1·R·C.',
      probes: [{ label: 'disparo', at: 'trg', color: '#ffd84a' }, { label: 'condensador', at: 'tt', color: '#4ae3ff' }, { label: 'salida', at: 'out', color: '#ff8f5a' }],
      spec: t555m({ vcc: 5, r: 100000, c: 1e-6, f: 4 }),
      controls: [
        { type: 'slider', id: 'r', label: 'Resistor R', min: 10000, max: 1000000, value: 100000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('R1', 'r', v); ref(T); } },
        { type: 'slider', id: 'c', label: 'Condensador C', min: 1e-7, max: 1e-5, value: 1e-6, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('Ct', 'c', v); ref(T); } },
        { type: 'slider', id: 'f', label: 'Frecuencia de disparo', min: 0.5, max: 10, value: 4, unit: 'Hz', log: true, fmt: (v) => EM.fix(v, 1), apply: (T, v) => T.set('FG1', 'f', v) }
      ],
      outs: [
        { id: 't', label: 'Duración teórica T = 1.1·R·C', hl: true, fn: (T) => fmt(1.1 * T.net.part('R1').p.r * T.net.part('Ct').p.c, 's') },
        { id: 'tm', label: 'Duración medida del pulso de salida', fn: (T) => { const o = T.stat('salida'), f = T.net.part('FG1').p.f; return o && !isNaN(o.duty) ? fmt(o.duty / f, 's') : '—'; } },
        { id: 'm', label: 'Estado', fn: (T) => { const t = 1.1 * T.net.part('R1').p.r * T.net.part('Ct').p.c, f = T.net.part('FG1').p.f; return t > 1 / f ? '<b style="color:var(--warn-ink)">el pulso dura más que el período de disparo: se pierden disparos (el 555 no es redisparable)</b>' : 'un pulso de salida por cada disparo'; } }
      ]
    });
    function ref(T) { /* la ventana muestra ≈ 2 períodos de disparo */ }
  });

  /* ---------- 24.6 Modulación por ancho de pulso (comparador + triangular) ---------- */
  const pwmSpec = (o) => ({
    parts: [['FG1', 'FG', -6, 12, 0, { wave: 'tri', amp: 5, off: 5, f: 1000, rs: 1 }], ['VR', 'VDC', 2, 22, 0, { v: o.vref }], ['U1', 'OA', 14, 12, 0, { model: 'TL081' }], ['Rf', 'R', 26, 12, 0, { r: 10000 }], ['Cf', 'C', 32, 16, 1, { c: 1e-6, kind: 'film' }]],
    wires: [['FG1.OUT', '@tri:r'], ['FG1.GND', 'gnd'], ['U1.0', '@tri:l'], ['U1.1', '@ref:l'], ['VR.0', '@ref:u'], ['VR.1', 'gnd'], ['U1.2', '@pwm:r'], ['Rf.0', '@pwm:l'], ['Rf.1', '@avg:r'], ['Cf.0', '@avg:u'], ['Cf.1', 'gnd']]
  });
  EM.defineSim('c24-pwm', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.5, edit: 'values', panels: ['scope'], tdiv: 5e-4, startZero: true, net: { damage: false },
      hint: '(Los nodos con la misma etiqueta están unidos.) Un comparador compara una triangular de 0 a 10 V (1 kHz) con una tensión de referencia: la salida es un tren de pulsos cuyo ciclo de trabajo depende de la referencia. El filtro RC de la salida recupera el valor medio.',
      probes: [{ label: 'triangular', at: 'tri', color: '#ffd84a' }, { label: 'referencia', at: 'ref', color: '#9fd9a4' }, { label: 'PWM', at: 'pwm', color: '#4ae3ff' }, { label: 'media', at: 'avg', color: '#ff8f5a' }],
      spec: pwmSpec({ vref: 5 }),
      controls: [
        { type: 'slider', id: 'v', label: 'Tensión de referencia', min: 0.5, max: 9.5, step: 0.05, value: 5, unit: 'V', apply: (T, v) => T.set('VR', 'v', v) },
        { type: 'slider', id: 'f', label: 'Frecuencia de la triangular', min: 200, max: 5000, value: 1000, unit: 'Hz', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('FG1', 'f', v); T.setTdiv(tdivFor(TD, 2 / v / 10)); } }
      ],
      outs: [
        { id: 'dt', label: 'Ciclo de trabajo teórico 1 − V_ref/V_pk', hl: true, fn: (T) => EM.fix(100 * (1 - T.net.part('VR').p.v / 10), 1) + ' %' },
        { id: 'dm', label: 'Ciclo de trabajo medido', fn: (T) => { const o = T.stat('PWM'); return o && !isNaN(o.duty) ? EM.fix(o.duty * 100, 1) + ' %' : '—'; } },
        { id: 'vm', label: 'Valor medio de la salida (teórico D·V_sat − (1−D)·V_sat)', fn: (T) => { const d = 1 - T.net.part('VR').p.v / 10; return fmt((2 * d - 1) * VSAT, 'V'); } },
        { id: 'va', label: 'Tensión media a la salida del filtro', fn: (T) => { const o = T.stat('media'); return o ? fmt(o.mean, 'V') : '—'; } }
      ]
    });
  });
})();
