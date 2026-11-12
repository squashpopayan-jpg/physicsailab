/* Capítulo 15 — Comparadores y sensores: la luz crepuscular */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  /* LM358 en e10 (1 OUT e10, 2 IN− e11, 3 IN+ e12, 4 GND e13, 8 VCC f10). Alimentación de 5 V (canal 1).
     IN− = divisor LDR (arriba) + 10 kΩ (abajo); IN+ = cursor del potenciómetro (umbral). Salida alta = oscuro → el LED enciende. */
  const crep = () => ({
    parts: [['U1', 'LM358', {}, 'e10'], ['LDR1', 'LDR', { lux: 200 }, 'B+6', 'a11'], ['R1', 'R', { r: 10000 }, 'b11', 'B-6'], ['RV1', 'POT', { r: 10000, pos: 0.5 }, 'e16'],
      ['R2', 'R', { r: 330 }, 'd10', 'd14'], ['D1', 'LED', { color: 'rojo' }, 'c14', 'c15']],
    wires: EM.RAILS_PS1(EM.SP.cross().concat([['j10', 'T+3', 'red'], ['a13', 'B-4', 'black'], ['a16', 'B+3', 'red'], ['a18', 'B-3', 'black'], ['a17', 'a12', 'orange'], ['a15', 'B-5', 'black']])),
    psu: { 1: { v: 5, ilim: 0.2, on: true } }, probes: { dmmR: 'c11', dmmB: 'B-8' }, dmm: { mode: 'V=', jack: 'v' }
  });
  EM.defineSim('c15-crepuscular', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'dmm'], tray: false, showInst: 'dmm',
      hint: 'Interruptor crepuscular: el LDR baja la tensión de IN− cuando oscurece; el potenciómetro fija el umbral. El LED se enciende en la oscuridad.',
      spec: crep(),
      controls: [
        { type: 'slider', id: 'lux', label: 'Iluminación', min: 1, max: 10000, value: 200, unit: 'lux', log: true, fmt: (v) => EM.si(v, '', 3), apply: (L, v) => L.set('LDR1', 'lux', v) },
        { type: 'slider', id: 'p', label: 'Potenciómetro de umbral', min: 0.05, max: 0.95, step: 0.01, value: 0.5, apply: (L, v) => L.set('RV1', 'pos', v) }
      ],
      outs: [
        { id: 'vn', label: 'IN− (señal de la LDR)', hl: true, fn: (L) => fmt(L.v('a11', 'B-8'), 'V') },
        { id: 'vp', label: 'IN+ (umbral)', fn: (L) => fmt(L.v('a12', 'B-8'), 'V') },
        { id: 'vo', label: 'Salida del comparador', fn: (L) => fmt(L.v('a10', 'B-8'), 'V') },
        { id: 'led', label: 'LED', fn: (L) => (L.i('D1') > 0.001 ? 'ENCENDIDO (oscuro)' : 'apagado (hay luz)') }
      ]
    });
  });

  /* LM393: salida de colector abierto con resistor de pull-up (4,7 kΩ), entrada variable con un potenciómetro */
  const c393 = () => ({
    parts: [['U1', 'LM393', {}, 'e10'], ['RV1', 'POT', { r: 10000, pos: 0.3 }, 'e16'], ['R1', 'R', { r: 10000 }, 'd11', 'B+4'], ['R2', 'R', { r: 10000 }, 'c11', 'B-4'], ['R3', 'R', { r: 4700 }, 'd10', 'B+8']],
    wires: EM.RAILS_PS1(EM.SP.cross().concat([['j10', 'T+3', 'red'], ['a13', 'B-6', 'black'], ['a16', 'B+3', 'red'], ['a18', 'B-3', 'black'], ['a17', 'a12', 'orange']])),
    psu: { 1: { v: 5, ilim: 0.2, on: true } }, probes: { dmmR: 'b10', dmmB: 'B-10' }, dmm: { mode: 'V=', jack: 'v' }
  });
  EM.defineSim('c15-lm393', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'dmm'], tray: false, showInst: 'dmm',
      hint: 'LM393 (colector abierto) con pull-up de 4,7 kΩ. IN− = 2,5 V fijos (divisor 10k/10k); IN+ la mueve el potenciómetro. Mida la salida.',
      spec: c393(),
      controls: [{ type: 'slider', id: 'p', label: 'Posición del potenciómetro (IN+)', min: 0, max: 1, step: 0.01, value: 0.3, apply: (L, v) => L.set('RV1', 'pos', v) }],
      outs: [
        { id: 'vp', label: 'IN+', fn: (L) => fmt(L.v('a12', 'B-8'), 'V') },
        { id: 'vn', label: 'IN−', fn: (L) => fmt(L.v('a11', 'B-8'), 'V') },
        { id: 'vo', label: 'Salida', hl: true, fn: (L) => fmt(L.v('a10', 'B-8'), 'V') }
      ]
    });
  });
})();
