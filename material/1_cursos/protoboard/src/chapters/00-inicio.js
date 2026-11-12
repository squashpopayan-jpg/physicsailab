(function () {
  'use strict';
  const EM = window.EM;
  /* Intermitente con el 555 en una protoboard media. Pines del 555 (e10 = pata 1): 1 GND, 2 TRIG, 3 OUT, 4 RESET (fila e)
     y 5 CTRL, 6 THR, 7 DIS, 8 VCC (fila f, columnas 13 → 10). */
  EM.FLASH555 = {
    parts: [
      ['B1', 'BATP', { kind: 'alk9' }, 'T+1', 'B-1'],
      ['U1', 'T555', {}, 'e10'],
      ['R1', 'R', { r: 1000 }, 'h10', 'h11'],
      ['R2', 'R', { r: 47000 }, 'g11', 'g12'],
      ['C1', 'CE', { c: 1e-5, vmax: 16 }, 'b11', 'B-11'],
      ['R3', 'R', { r: 330 }, 'c12', 'c16'],
      ['D1', 'LED', { color: 'rojo' }, 'b16', 'b17']
    ],
    wires: [['j10', 'T+10', 'red'], ['a10', 'B-10', 'black'], ['j12', 'a11', 'green'], ['d13', 'i10', 'orange'], ['a17', 'B-17', 'black']],
    probes: {}
  };
  EM.defineSim('home-hero', function (sim) {
    EM.Lab.mount(sim, { aspect: 1.55, edit: 'values', instruments: [], tray: false, tdiv: 0.1, thermal: 4, spec: EM.FLASH555, hint: 'Un 555 hace parpadear el LED: unos 1,5 veces por segundo. Pase el puntero sobre las piezas.' });
  });
})();
