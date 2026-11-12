/* Capítulo 9 — Diodos y LED */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* 9.1 Curva del diodo: medir la caída directa */
  const TIPOS = { '1N4148': ['D', { model: '1N4148' }], '1N4007': ['D', { model: '1N4007' }], '1N5819': ['D', { model: '1N5819' }], rojo: ['LED', { color: 'rojo' }], azul: ['LED', { color: 'azul' }] };
  const curva = (tipo, inv, v) => {
    const [k, p] = TIPOS[tipo];
    return {
      parts: [['R1', 'R', { r: 1000 }, 'h8', 'h12'], ['D1', k, p, inv ? 'g16' : 'g12', inv ? 'g12' : 'g16']],
      wires: EM.RAILS_PS1([['T+3', 'j8', 'orange'], ['T-3', 'j16', 'gray']]), psu: { 1: { v, ilim: 0.1, on: true } },
      probes: { dmmR: 'i12', dmmB: 'i16' }, dmm: { mode: 'V=', jack: 'v' }
    };
  };
  EM.defineSim('c9-curva', function (sim) {
    const st = { tipo: '1N4148', inv: false, v: 5 };
    const rebuild = (L) => L.load(curva(st.tipo, st.inv, st.v));
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'dmm'], tray: false, showInst: 'dmm',
      hint: 'Un diodo con un resistor de 1 kΩ. Suba la tensión de la fuente y mida la caída en el diodo con el multímetro.',
      spec: curva('1N4148', false, 5),
      controls: [
        { type: 'select', id: 'tipo', label: 'Dispositivo', options: [['1N4148', 'Diodo de señal 1N4148'], ['1N4007', 'Rectificador 1N4007'], ['1N5819', 'Schottky 1N5819'], ['rojo', 'LED rojo'], ['azul', 'LED azul']], value: '1N4148', init: false, apply: (L, v) => { st.tipo = v; rebuild(L); } },
        { type: 'check', id: 'inv', label: 'Polarización inversa (invertir el diodo)', value: false, init: false, apply: (L, v) => { st.inv = !!v; rebuild(L); } },
        { type: 'slider', id: 'v', label: 'Tensión de la fuente', min: 0, max: 12, step: 0.1, value: 5, unit: 'V', init: false, apply: (L, v) => { st.v = v; L.psu(1, { v }); } }
      ],
      outs: [
        { id: 'vd', label: 'Caída en el diodo (multímetro)', hl: true, fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } },
        { id: 'i', label: 'Corriente', fn: (L) => fmt(L.i('D1'), 'A') },
        { id: 'p', label: 'Potencia en el diodo', fn: (L) => fmt(Math.max(0, L.i('D1') * L.vp('D1')), 'W') }
      ]
    });
  });

  /* 9.2 LED en serie y en paralelo */
  const LEDS = {
    uno: { parts: [['R1', 'R', { r: 330 }, 'h8', 'h12'], ['D1', 'LED', { color: 'rojo' }, 'g12', 'g16']], gnd: 'j16' },
    serie: { parts: [['R1', 'R', { r: 330 }, 'h8', 'h12'], ['D1', 'LED', { color: 'rojo' }, 'g12', 'g16'], ['D2', 'LED', { color: 'rojo' }, 'f16', 'f20']], gnd: 'j20' },
    pares: { parts: [['R1', 'R', { r: 330 }, 'h8', 'h12'], ['D1', 'LED', { color: 'rojo' }, 'g12', 'g16'], ['D2', 'LED', { color: 'rojo' }, 'f12', 'f16']], gnd: 'j16' },
    desigual: { parts: [['R1', 'R', { r: 330 }, 'h8', 'h12'], ['D1', 'LED', { color: 'rojo' }, 'g12', 'g16'], ['D2', 'LED', { color: 'azul' }, 'f12', 'f16']], gnd: 'j16' }
  };
  const ledSpec = (k) => ({ parts: LEDS[k].parts, wires: EM.RAILS_PS1([['T+3', 'j8', 'orange'], ['T-3', LEDS[k].gnd, 'gray']]), psu: { 1: { v: 5, ilim: 0.3, on: true } } });
  EM.defineSim('c9-leds', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu'], tray: false, showInst: 'psu', thermal: 4,
      hint: 'Un resistor de 330 Ω y 5 V alimentan uno o dos LED. Compare las corrientes.',
      spec: ledSpec('uno'),
      controls: [{ type: 'select', id: 'k', label: 'Montaje', options: [['uno', 'Un LED'], ['serie', 'Dos LED en serie'], ['pares', 'Dos LED rojos en paralelo, un solo resistor'], ['desigual', 'LED rojo y azul en paralelo, un solo resistor']], value: 'uno', init: false, apply: (L, v) => { L.load(ledSpec(v)); } }],
      outs: [
        { id: 'i', label: 'Corriente total', hl: true, fn: (L) => fmt(Math.abs(L.i('R1')), 'A') },
        { id: 'i1', label: 'Corriente del LED 1', fn: (L) => fmt(Math.max(0, L.i('D1')), 'A') },
        { id: 'i2', label: 'Corriente del LED 2', fn: (L) => (L.part('D2') ? fmt(Math.max(0, L.i('D2')), 'A') : '—') }
      ]
    });
  });

  /* 9.3 Regulador Zener */
  const zSpec = (rl) => ({
    parts: [['R1', 'R', { r: 330, watt: 2 }, 'h8', 'h12'], ['DZ1', 'ZD', { vz: 5.1 }, 'g16', 'g12'], ['R2', 'R', { r: rl }, 'i12', 'T-8']],
    wires: EM.RAILS_PS1([['T+3', 'j8', 'orange'], ['T-3', 'j16', 'gray']]), psu: { 1: { v: 9, ilim: 0.3, on: true } },
    probes: { dmmR: 'f12', dmmB: 'T-6' }, dmm: { mode: 'V=', jack: 'v' }
  });
  EM.defineSim('c9-zener', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'dmm'], tray: false, showInst: 'dmm', thermal: 20,
      hint: 'Un Zener de 5,1 V en paralelo con la carga, alimentado con un resistor de 330 Ω. Varíe la tensión de entrada y la carga.',
      spec: zSpec(1e5),
      controls: [
        { type: 'slider', id: 'v', label: 'Tensión de entrada', min: 4, max: 30, step: 0.1, value: 9, unit: 'V', apply: (L, v) => L.psu(1, { v }) },
        { type: 'select', id: 'rs', label: 'Resistor en serie', options: [[100, '100 Ω'], [330, '330 Ω'], [1000, '1 kΩ']], value: 330, apply: (L, v) => L.set('R1', 'r', +v) },
        { type: 'select', id: 'rl', label: 'Carga', options: [[1e5, '100 kΩ (casi sin carga)'], [1000, '1 kΩ → 5 mA'], [330, '330 Ω → 15 mA'], [100, '100 Ω → 50 mA']], value: 1e5, apply: (L, v) => L.set('R2', 'r', +v) }
      ],
      outs: [
        { id: 'vo', label: 'Tensión de salida', hl: true, fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } },
        { id: 'iz', label: 'Corriente del Zener', fn: (L) => fmt(Math.max(0, -L.i('DZ1')), 'A') },
        { id: 'pz', label: 'Potencia del Zener (límite 0,5 W)', fn: (L) => fmt(Math.max(0, L.i('DZ1') * L.vp('DZ1')), 'W') },
        { id: 'st', label: 'Estado del Zener', fn: (L) => (L.dead('DZ1') ? 'QUEMADO' : L.T('DZ1') > 100 ? 'muy caliente (' + Math.round(L.T('DZ1')) + ' °C)' : 'normal') }
      ]
    });
  });
})();
