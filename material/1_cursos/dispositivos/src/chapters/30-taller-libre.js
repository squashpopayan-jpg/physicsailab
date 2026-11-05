/* Capítulo 30 — Taller libre y retos */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, CX = EM.cx;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* ganancia de pequeña señal |V(nodo del pin)| con las fuentes de CA a 1 V (punto de operación calculado sin señal) */
  const acGain = (T, f, id, pin) => {
    try {
      const n = EM.Panels.tempNet(T), c = n.cir; if (!c.x) return NaN;
      const r = c.ac(f); if (!r) return NaN;
      const z = r.at(n.netInfo.pinNet[id][pin]); return Math.hypot(z[0], z[1]);
    } catch (e) { return NaN; }
  };
  const db = (g) => 20 * Math.log10(Math.max(g, 1e-12));
  const sano = (T) => !T.net.doc.parts.some((p) => p.dead);
  /* tensión entre los dos terminales de un componente */
  const across = (T, id) => { const pn = T.net.netInfo && T.net.netInfo.pinNet[id]; if (!pn || !T.net.cir || !T.net.cir.x) return NaN; return T.net.v(pn[0]) - T.net.v(pn[1]); };

  /* ---------- Taller libre ---------- */
  EM.defineSim('c30-libre', function (sim) {
    EM.Taller.mount(sim, { aspect: 1.5, edit: 'full', panels: ['scope', 'bode', 'sweep', 'table'], autosave: true, showHelp: true, spec: { parts: [['V1', 'VDC', 4, 8, 0, { v: 9 }]], wires: [['V1.1', 'gnd']] } });
  });

  /* ---------- Reto 1: excitador de LED con transistor ---------- */
  EM.defineSim('c30-reto1', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.6, edit: 'full', panels: ['table'], goalTitle: 'Objetivos del reto 1',
      hint: 'Una salida lógica de 3.3 V (V_IN) no puede dar más de 1 mA. Con el transistor y los resistores que agregue, encienda el LED con 8 a 15 mA desde la fuente de 5 V, con el transistor saturado.',
      spec: { parts: [['VCC', 'VDC', 4, 8, 0, { v: 5 }], ['VIN', 'VDC', 4, 22, 0, { v: 3.3 }], ['Q1', 'NPN', 24, 14, 0, { model: '2N3904' }], ['D1', 'LED', 24, 6, 1, { color: 'rojo' }]], wires: [['VCC.1', 'gnd'], ['VIN.1', 'gnd']] },
      goals: [
        { label: 'El LED conduce entre 8 y 15 mA', test: (T) => { const D = T.net.part('D1'); if (!D) return false; const i = T.i('D1'); return i > 0.008 && i < 0.015 && !D.dead; } },
        { label: 'El transistor está saturado (V_CE < 0.4 V)', test: (T) => { const q = T.m('Q1'); return !!q && q.ic > 0.005 && q.vce < 0.4; } },
        { label: 'La corriente de base es menor que 2 mA (no carga a la fuente lógica)', test: (T) => { const q = T.m('Q1'); return !!q && q.ib > 0.0001 && q.ib < 0.002; } },
        { label: 'Ningún componente se ha dañado', test: (T) => sano(T) }
      ]
    });
  });

  /* ---------- Reto 2: regulador de 9 V ---------- */
  EM.defineSim('c30-reto2', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.6, edit: 'full', panels: ['table'], goalTitle: 'Objetivos del reto 2',
      hint: 'Con el LM317 y dos resistores fije la tensión de la carga en 9 V (±0.3 V) desde la fuente de 15 V.',
      spec: { parts: [['VIN', 'VDC', 4, 12, 0, { v: 15 }], ['U1', 'REG', 20, 12, 0, { model: 'LM317' }], ['RL', 'R', 40, 14, 1, { r: 100, watt: 25 }]], wires: [['VIN.1', 'gnd'], ['RL.1', 'gnd']] },
      goals: [
        { label: 'La tensión en la carga está entre 8.7 y 9.3 V', test: (T) => { const v = across(T, 'RL'); return v > 8.7 && v < 9.3; } },
        { label: 'La corriente por R₁ (OUT–ADJ) es de al menos 5 mA (regulación estable)', test: (T) => { const rs = T.net.doc.parts.filter((p) => p.t === 'R' && p.id !== 'RL'); return rs.some((p) => Math.abs(across(T, p.id)) > 1.2 && Math.abs(across(T, p.id)) < 1.3 && Math.abs(T.i(p.id)) >= 0.005); } },
        { label: 'El regulador disipa menos de 1 W', test: (T) => { const v = across(T, 'RL'); return v > 0 && (15 - v) * v / 100 < 1; } },
        { label: 'Ningún componente se ha dañado', test: (T) => sano(T) }
      ]
    });
  });

  /* ---------- Reto 3: amplificador de ganancia 10 ---------- */
  EM.defineSim('c30-reto3', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.6, edit: 'full', panels: ['scope', 'bode', 'table'], tdiv: 5e-4, goalTitle: 'Objetivos del reto 3',
      hint: 'Con el A.O. y los resistores que agregue, haga un amplificador de ganancia de tensión 10 (±5 %), con ancho de banda de al menos 30 kHz, que alimente la carga RL.',
      probes: [],
      spec: { parts: [['FG1', 'FG', 4, 12, 0, { wave: 'sin', amp: 0.1, f: 1000, rs: 50 }], ['U1', 'OA', 24, 12, 0, { model: 'TL081' }], ['RL', 'R', 44, 14, 1, { r: 10000 }]], wires: [['FG1.1', 'gnd'], ['RL.1', 'gnd']] },
      goals: [
        { label: 'La ganancia a 1 kHz es 10 ± 5 % (en valor absoluto)', test: (T) => { const g = acGain(T, 1000, 'RL', 0); return g > 9.5 && g < 10.5; } },
        { label: 'A 30 kHz la ganancia sigue por encima de 0.7·10 (ancho de banda ≥ 30 kHz)', test: (T) => { const g = acGain(T, 30000, 'RL', 0); return g > 7.0; } },
        { label: 'La resistencia de entrada es mayor que 5 kΩ (no carga a la fuente de 50 Ω)', test: (T) => acGain(T, 1000, 'FG1', 0) > 0.99 },
        { label: 'Ningún componente se ha dañado', test: (T) => sano(T) }
      ]
    });
  });

  /* ---------- Reto 4: filtro pasabajos de 1 kHz ---------- */
  EM.defineSim('c30-reto4', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.6, edit: 'full', panels: ['bode', 'scope', 'table'], tdiv: 5e-4, goalTitle: 'Objetivos del reto 4',
      hint: 'Con un resistor y un condensador (y, si quiere, un A.O.) diseñe un filtro pasabajos con frecuencia de corte de 1 kHz (−3 dB), ganancia de continua 0 dB y −17 dB o menos a 10 kHz. La carga RL es de 100 kΩ.',
      spec: { parts: [['FG1', 'FG', 4, 12, 0, { wave: 'sin', amp: 1, f: 1000, rs: 1 }], ['RL', 'R', 44, 14, 1, { r: 100000 }]], wires: [['FG1.1', 'gnd'], ['RL.1', 'gnd']] },
      goals: [
        { label: 'A 1 kHz la ganancia está entre −4 y −2 dB', test: (T) => { const d = db(acGain(T, 1000, 'RL', 0)); return d > -4 && d < -2; } },
        { label: 'A 10 Hz la ganancia es mayor que −0.5 dB (ganancia de continua 0 dB)', test: (T) => db(acGain(T, 10, 'RL', 0)) > -0.5 },
        { label: 'A 10 kHz la ganancia es menor que −17 dB', test: (T) => db(acGain(T, 10000, 'RL', 0)) < -17 },
        { label: 'Ningún componente se ha dañado', test: (T) => sano(T) }
      ]
    });
  });
})();
