/* Capítulo 5 — Resistores */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const bandsTxt = (r, tol) => { const S = EM.spice; return S.bands(r, 4, tol).map((i) => S.COLORS[i].n).join(' · '); };

  /* 5.1 Leer el código de colores y medir */
  EM.defineSim('c5-colores', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['dmm'], tray: false, tolErr: true, showInst: 'dmm',
      hint: 'Cambie el valor del resistor con la lista; lea sus bandas y mida con el multímetro (función Ω, puntas en cualquier extremo).',
      spec: { parts: [['R1', 'R', { r: 4700, tol: 5 }, 'e8', 'e12']], wires: [], probes: { dmmR: 'c8', dmmB: 'c12' }, dmm: { mode: 'Ω', jack: 'v' } },
      controls: [
        { type: 'select', id: 'r', label: 'Valor nominal', options: [[10, '10 Ω'], [47, '47 Ω'], [220, '220 Ω'], [330, '330 Ω'], [1000, '1 kΩ'], [4700, '4,7 kΩ'], [10000, '10 kΩ'], [100000, '100 kΩ'], [1e6, '1 MΩ']], value: 4700, apply: (L, v) => L.set('R1', 'r', +v) },
        { type: 'seg', id: 't', label: 'Tolerancia', options: [[5, '5 % (dorado)'], [1, '1 % (marrón)'], [10, '10 % (plateado)']], value: 5, apply: (L, v) => L.set('R1', 'tol', +v) }
      ],
      outs: [
        { id: 'b', label: 'Bandas', hl: true, fn: (L) => bandsTxt(L.part('R1').p.r, L.part('R1').p.tol) },
        { id: 'm', label: 'Lectura del multímetro', fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } },
        { id: 'n', label: 'Intervalo de tolerancia', fn: (L) => { const p = L.part('R1').p; return fmt(p.r * (1 - p.tol / 100), 'Ω') + ' – ' + fmt(p.r * (1 + p.tol / 100), 'Ω'); } }
      ]
    });
  });

  /* 5.2 Series y paralelo medidos con el ohmímetro */
  const RED = {
    serie: { parts: [['R1', 'R', { r: 220, tol: 1 }, 'e5', 'e9'], ['R2', 'R', { r: 330, tol: 1 }, 'd9', 'd13'], ['R3', 'R', { r: 470, tol: 1 }, 'c13', 'c17']], probes: { dmmR: 'a5', dmmB: 'a17' }, t: 1020 },
    paralelo: { parts: [['R1', 'R', { r: 220, tol: 1 }, 'e5', 'e9'], ['R2', 'R', { r: 330, tol: 1 }, 'd5', 'd9'], ['R3', 'R', { r: 470, tol: 1 }, 'c5', 'c9']], probes: { dmmR: 'a5', dmmB: 'a9' }, t: 103.1 },
    mixta: { parts: [['R1', 'R', { r: 220, tol: 1 }, 'e5', 'e9'], ['R2', 'R', { r: 330, tol: 1 }, 'd9', 'd13'], ['R3', 'R', { r: 470, tol: 1 }, 'c9', 'c13']], probes: { dmmR: 'a5', dmmB: 'a13' }, t: 413.9 }
  };
  EM.defineSim('c5-redes', function (sim) {
    const mk = (k) => ({ parts: RED[k].parts, wires: [], probes: RED[k].probes, dmm: { mode: 'Ω', jack: 'v' } });
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['dmm'], tray: false, tolErr: true, showInst: 'dmm',
      hint: 'Tres resistores de 220, 330 y 470 Ω. Elija la conexión y mida entre los extremos marcados (las puntas ya están puestas).',
      spec: mk('serie'),
      controls: [{ type: 'seg', id: 'k', label: 'Conexión', options: [['serie', 'Serie'], ['paralelo', 'Paralelo'], ['mixta', 'R₁ + (R₂ ‖ R₃)']], value: 'serie', init: false, apply: (L, v) => { L.load(mk(v)); L.__k = v; } }],
      outs: [
        { id: 'm', label: 'Lectura del multímetro', hl: true, fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } },
        { id: 't', label: 'Resistencia teórica', fn: (L) => fmt(RED[L.__k || 'serie'].t, 'Ω', 4) }
      ]
    });
  });

  /* 5.3 Potencia: ¿se quema? */
  EM.defineSim('c5-potencia', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu'], tray: false, thermal: 20, showInst: 'psu',
      hint: 'Tres resistores de 1/4 W en serie con 100 Ω cada uno. Con la misma corriente, ¿cuál se calienta más?',
      spec: { parts: [['R1', 'R', { r: 100, watt: 0.25 }, 'h6', 'h10'], ['R2', 'R', { r: 330, watt: 0.25 }, 'g10', 'g14'], ['R3', 'R', { r: 1000, watt: 0.25 }, 'h14', 'h18']], wires: EM.RAILS_PS1([['T+3', 'i6', 'orange'], ['T-3', 'i18', 'gray']]), psu: { 1: { v: 5, ilim: 1, on: true } } },
      controls: [{ type: 'slider', id: 'v', label: 'Tensión de la fuente', min: 0, max: 30, step: 0.5, value: 5, unit: 'V', apply: (L, v) => L.psu(1, { v }) }],
      outs: [
        { id: 'i', label: 'Corriente (la misma en las tres)', hl: true, fn: (L) => fmt(Math.abs(L.i('R1')), 'A') },
        { id: 'p1', label: 'P en R₁ = I²R (100 Ω)', fn: (L) => fmt(L.i('R1') ** 2 * 100, 'W') },
        { id: 'p2', label: 'P en R₂ (330 Ω)', fn: (L) => fmt(L.i('R2') ** 2 * 330, 'W') },
        { id: 'p3', label: 'P en R₃ (1 kΩ)', fn: (L) => fmt(L.i('R3') ** 2 * 1000, 'W') },
        { id: 'st', label: 'Quemados', fn: (L) => ['R1', 'R2', 'R3'].filter((id) => L.dead(id)).join(', ') || 'ninguno' }
      ]
    });
  });
})();
