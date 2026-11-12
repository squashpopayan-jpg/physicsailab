/* Capítulo 17 — Reguladores de tensión y disipación de calor */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  /* 7805 TO-220 en e10 (IN e10, GND e11, OUT e12). Entrada desde la fuente (canal 1 → rieles inferiores). */
  const r78 = (rl) => ({
    parts: [['U1', 'REG', { model: '7805', hs: 0 }, 'e10'], ['C1', 'C', { c: 3.3e-7 }, 'c10', 'c11'], ['C2', 'C', { c: 1e-7 }, 'c12', 'b11'], ['R1', 'R', { r: rl, watt: 5 }, 'a12', 'B-8']],
    wires: [['@ps1+', 'B+1', 'red'], ['@ps1-', 'B-1', 'black'], ['a10', 'B+4', 'red'], ['a11', 'B-4', 'black']],
    psu: { 1: { v: 12, ilim: 2, on: true } }, probes: { dmmR: 'd12', dmmB: 'B-10' }, dmm: { mode: 'V=', jack: 'v' }
  });
  EM.defineSim('c17-7805', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'dmm'], tray: false, showInst: 'dmm', thermal: 20,
      hint: 'Regulador 7805 alimentado por la fuente. Cambie la tensión de entrada, la carga y el disipador; vea la tensión de salida y la temperatura.',
      spec: r78(47),
      controls: [
        { type: 'slider', id: 'v', label: 'Tensión de entrada', min: 3, max: 30, step: 0.5, value: 12, unit: 'V', apply: (L, v) => L.psu(1, { v }) },
        { type: 'select', id: 'rl', label: 'Carga', options: [[1000, '1 kΩ (5 mA)'], [100, '100 Ω (50 mA)'], [47, '47 Ω (106 mA)'], [10, '10 Ω (0,5 A)'], [5, '5 Ω (1 A)']], value: 47, apply: (L, v) => L.set('R1', 'r', +v) },
        { type: 'select', id: 'hs', label: 'Disipador', options: [[0, 'ninguno (65 K/W)'], [20, 'pequeño (20 K/W)'], [8, 'mediano (8 K/W)'], [3, 'grande (3 K/W)']], value: 0, apply: (L, v) => L.set('U1', 'hs', +v) }
      ],
      outs: [
        { id: 'vo', label: 'Tensión de salida', hl: true, fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } },
        { id: 'p', label: 'Potencia disipada (V_in − V_out)·I', fn: (L) => { const vin = L.v('a10', 'a11'), vo = L.v('a12', 'a11'); return fmt(Math.max(0, (vin - vo) * Math.abs(vo / L.part('R1').p.r)), 'W'); } },
        { id: 't', label: 'Temperatura de la unión', fn: (L) => (L.dead('U1') ? 'dañado' : Math.round(L.T('U1')) + ' °C' + (L.bench.net.rt.U1 && L.bench.net.rt.U1.regHot ? ' · APAGADO POR PROTECCIÓN' : '')) }
      ]
    });
  });

  /* LM317 TO-220 en e10 (ADJ e10, OUT e11, IN e12). R1 = 240 Ω de OUT a ADJ; R2 de ADJ a tierra. */
  const r317 = (r2) => ({
    parts: [['U1', 'REG', { model: 'LM317', hs: 3 }, 'e10'], ['R1', 'R', { r: 240 }, 'c11', 'c10'], ['R2', 'R', { r: r2 }, 'b10', 'B-6'], ['R3', 'R', { r: 470, watt: 2 }, 'd11', 'B-8']],
    wires: [['@ps1+', 'B+1', 'red'], ['@ps1-', 'B-1', 'black'], ['a12', 'B+4', 'red']],
    psu: { 1: { v: 15, ilim: 1, on: true } }, probes: { dmmR: 'a11', dmmB: 'B-10' }, dmm: { mode: 'V=', jack: 'v' }
  });
  EM.defineSim('c17-lm317', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'dmm'], tray: false, showInst: 'dmm', thermal: 20,
      hint: 'LM317 ajustable: R₁ = 240 Ω entre OUT y ADJ; R₂ entre ADJ y tierra fija la salida. Entrada de 15 V.',
      spec: r317(720),
      controls: [{ type: 'select', id: 'r2', label: 'R₂', options: [[0.001, '0 Ω (1,25 V)'], [240, '240 Ω'], [720, '720 Ω'], [1200, '1,2 kΩ'], [1800, '1,8 kΩ'], [2400, '2,4 kΩ']], value: 720, apply: (L, v) => L.set('R2', 'r', +v) }],
      outs: [
        { id: 'vo', label: 'Tensión de salida', hl: true, fn: (L) => { const d = L.dmm(); return d.text + ' ' + d.unit; } },
        { id: 'vt', label: 'Teórica 1,25·(1 + R₂/R₁)', fn: (L) => fmt(1.25 * (1 + L.part('R2').p.r / 240), 'V') },
        { id: 't', label: 'Temperatura', fn: (L) => Math.round(L.T('U1')) + ' °C' }
      ]
    });
  });
})();
