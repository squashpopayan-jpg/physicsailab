/* Capítulo 13 — MOSFET de potencia y control de motores por PWM */
(function () {
  'use strict';
  const EM = window.EM;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  /* MOSFET TO-220 (G, D, S) en e10–e12. Motor de 6 V entre +6 V y el drenador; diodo de rueda libre; compuerta excitada por el generador. */
  const moto = (duty) => ({
    parts: [['Q1', 'NMOS', { model: 'IRLZ44N' }, 'e10'], ['M1', 'MOT', { vnom: 6, tl: 0.008 }, 'B+6', 'a11'], ['D1', 'D', { model: '1N4007' }, 'b11', 'B+4'],
      ['R1', 'R', { r: 100 }, 'c10', 'c16'], ['R2', 'R', { r: 10000 }, 'd10', 'B-6']],
    wires: EM.RAILS_PS1(EM.SP.cross().concat([['a12', 'B-3', 'black'], ['@fgo', 'a16', 'yellow'], ['@fgg', 'B-2', 'black']])),
    psu: { 1: { v: 6, ilim: 3, on: true } }, fg: { wave: 'pulse', f: 200, amp: 2.5, off: 0, duty, on: true },
    probes: { s1: 'b10', s1g: 'B-8', s2: 'e11', s2g: 'B-10' }, osc: { tdiv: 5e-4, ch: [{ vdiv: 2, on: true, pos: -3 }, { vdiv: 2, on: true, pos: -3 }] }
  });
  EM.defineSim('c13-motor', function (sim) {
    EM.Lab.mount(sim, {
      aspect: 1.7, edit: 'wires', instruments: ['psu', 'fg', 'scope'], tray: false, tdiv: 5e-4, showInst: 'scope', thermal: 4,
      hint: 'Un MOSFET logic-level controla un motor de 6 V con PWM (200 Hz). Cambie el ciclo de trabajo y vea la velocidad.',
      spec: moto(0.5),
      controls: [
        { type: 'slider', id: 'd', label: 'Ciclo de trabajo del PWM', min: 0.02, max: 0.98, step: 0.01, value: 0.5, unit: '', fmt: (v) => Math.round(v * 100) + ' %', apply: (L, v) => L.fg({ duty: v }) },
        { type: 'check', id: 'dd', label: 'Diodo de rueda libre 1N4007 en el motor', value: true, init: false, apply: (L, v) => { if (v) L.addPartAt('D1', 'D', { model: '1N4007' }, ['b11', 'B+4']); else L.removePart('D1'); } },
        { type: 'seg', id: 'm', label: 'MOSFET', options: [['IRLZ44N', 'IRLZ44N (nivel lógico)'], ['IRF540N', 'IRF540N (de 10 V de compuerta)']], value: 'IRLZ44N', init: false, apply: (L, v) => L.set('Q1', 'model', v) }
      ],
      outs: [
        { id: 'w', label: 'Velocidad del motor (% de la máxima)', hl: true, fn: (L) => { const r = L.bench.net.rt.M1; return r && r.motor ? Math.round(100 * r.motor.w / (6 / 0.01)) + ' %' : '—'; } },
        { id: 'v', label: 'Tensión media aplicada', fn: (L) => fmt(L.bench.inst.fg.duty * 6, 'V') },
        { id: 'q', label: 'MOSFET', fn: (L) => (L.dead('Q1') ? 'DAÑADO' : Math.round(L.T('Q1')) + ' °C') },
        { id: 'p', label: 'Potencia en el MOSFET (media)', fn: (L) => { const r = L.bench.net.rt.Q1; return r ? fmt(r.pw || 0, 'W') : '—'; } }
      ]
    });
  });
})();
