/* Capítulo 26 — Tiristores, triac, diac y optoacopladores */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const DEG = 180 / Math.PI;

  /* ---------- 26.1 SCR en continua: disparo, enclavamiento y bloqueo ---------- */
  EM.defineSim('c26-scr', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.1, edit: 'values', panels: ['table'], net: { damage: false },
      hint: 'Un SCR conmuta una carga de 12 V. Aplique corriente a la puerta y quítela: el SCR sigue conduciendo (enclavamiento) hasta que se interrumpe la corriente de ánodo. (Los nodos con el mismo nombre están unidos.)',
      spec: {
        parts: [['VS', 'VDC', 2, 12, 0, { v: 12 }], ['SW1', 'SW', 8, 8, 0, { on: true }], ['RL', 'R', 16, 12, 1, { r: 24, watt: 25 }], ['X1', 'SCR', 16, 20, 0, { igt: 0.005, ih: 0.02 }], ['VG', 'VDC', 4, 26, 0, { v: 5 }], ['SW2', 'SW', 10, 26, 0, { on: false }], ['Rg', 'R', 18, 26, 0, { r: 330 }]],
        wires: [['VS.0', '@vs:u'], ['VS.1', 'gnd'], ['SW1.0', '@vs:l'], ['SW1.1', '@load:r'], ['RL.0', '@load:u'], ['RL.1', '@anodo:d'], ['X1.0', '@anodo:u'], ['X1.1', 'gnd'], ['VG.0', '@vg:u'], ['VG.1', 'gnd'], ['SW2.0', '@vg:l'], ['SW2.1', '@g:r'], ['Rg.0', '@g:l'], ['Rg.1', 'X1.2']]
      },
      controls: [
        { type: 'seg', id: 'g', label: 'Puerta (pulsador)', options: [['off', 'Sin corriente de puerta'], ['on', 'Aplicar 5 V a la puerta (13 mA)']], value: 'off', apply: (T, v) => T.set('SW2', 'on', v === 'on') },
        { type: 'seg', id: 's', label: 'Alimentación de la carga', options: [['on', 'Conectada (12 V)'], ['off', 'Interrumpida']], value: 'on', apply: (T, v) => T.set('SW1', 'on', v === 'on') },
        { type: 'slider', id: 'rl', label: 'Resistencia de la carga', min: 5, max: 2000, value: 24, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 0), apply: (T, v) => T.set('RL', 'r', v) }
      ],
      outs: [
        { id: 'st', label: 'Estado del SCR', hl: true, fn: (T) => { const e = T.m('X1'); return e && e.closed ? '<b>CONDUCE</b> (enclavado)' : 'bloqueado'; } },
        { id: 'il', label: 'Corriente en la carga', fn: (T) => { const L = T.net.netInfo.labelNet; return fmt((T.net.v(L.load) - T.net.v(L.anodo)) / T.net.part('RL').p.r, 'A'); } },
        { id: 'va', label: 'Tensión ánodo–cátodo V_AK', fn: (T) => fmt(T.net.v(T.net.netInfo.labelNet.anodo), 'V') },
        { id: 'ih', label: 'Corriente de mantenimiento I_H', fn: (T) => fmt(T.net.part('X1').p.ih, 'A') + ' (si la corriente baja de I_H se bloquea)' },
        { id: 'ig', label: 'Corriente de puerta aplicada', fn: (T) => (T.net.part('SW2').p.on ? fmt((5 - 0.75) / 330, 'A') : '0 A') }
      ]
    });
  });

  /* ---------- 26.2 SCR en CA: control de fase de media onda ---------- */
  const scrCA = (o) => ({
    parts: [['VAC', 'VAC', 2, 14, 0, { amp: o.amp, f: 60, rs: 0.5 }], ['RL', 'R', 12, 10, 1, { r: 20, watt: 50 }], ['X1', 'SCR', 12, 20, 0, { igt: 0.0002, ih: 0.005 }], ['Rv', 'R', 22, 8, 0, { r: o.rv }], ['C1', 'C', 30, 18, 1, { c: 100e-9, kind: 'film' }], ['ZD', 'ZD', 36, 14, 2, { vz: 6.2 }], ['D1', 'D', 42, 14, 0, { model: '1N4148' }], ['Rs', 'R', 50, 14, 0, { r: 330 }], ['D2', 'D', 24, 20, 3, { model: '1N4148' }]],
    wires: [['VAC.0', '@ac:u'], ['VAC.1', 'gnd'], ['RL.0', '@ac:u'], ['RL.1', '@k:d'], ['X1.0', '@k:u'], ['X1.1', 'gnd'], ['Rv.0', '@ac:l'], ['Rv.1', '@x:r'], ['C1.0', '@x:u'], ['C1.1', 'gnd'], ['D2.0', 'gnd'], ['D2.1', '@x:u'], ['ZD.1', '@x:l'], ['ZD.0', 'D1.0'], ['D1.1', 'Rs.0'], ['Rs.1', '@g:r'], ['X1.2', '@g:d']]
  });
  const acStats = (T) => { const c = T.stat('tensión en la carga'); return c; };
  /* ángulo de disparo a partir del valor medio de la tensión en la carga: V̄ = V_pk (1 + cos α)/(2π) */
  const alphaFrom = (vavg, vpk) => { const x = 2 * Math.PI * vavg / vpk - 1; return Math.acos(Math.max(-1, Math.min(1, x))) * DEG; };
  EM.defineSim('c26-fase', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.0, edit: 'values', panels: ['scope'], tdiv: 2e-3, net: { damage: false },
      hint: 'Control de fase de media onda: en el semiciclo positivo la red R_v–C retrasa la tensión de puerta; el SCR se dispara cuando el condensador alcanza el umbral y conduce hasta el fin del semiciclo. (Los nodos con el mismo nombre están unidos.)',
      probes: [{ label: 'red', at: 'ac', color: '#ffd84a' }, { label: 'tensión en la carga', at: 'ac', ref: 'k', color: '#4ae3ff' }, { label: 'condensador', at: 'x', color: '#ff8f5a' }],
      spec: scrCA({ rv: 30000, amp: 34 }),
      controls: [
        { type: 'slider', id: 'rv', label: 'Resistor variable R_v (retardo de disparo)', min: 2000, max: 200000, value: 30000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('Rv', 'r', v) },
        { type: 'slider', id: 'a', label: 'Tensión de la red (pico)', min: 20, max: 60, value: 34, unit: 'V', fmt: (v) => EM.fix(v, 0), apply: (T, v) => T.set('VAC', 'amp', v) }
      ],
      outs: [
        { id: 'al', label: 'Ángulo de disparo α (de la tensión media)', hl: true, fn: (T) => { const c = acStats(T); return c ? EM.fix(alphaFrom(c.mean, T.net.part('VAC').p.amp), 0) + '°' : '—'; } },
        { id: 'vr', label: 'Tensión eficaz en la carga', hl: true, fn: (T) => { const c = acStats(T); return c ? fmt(c.rms, 'V') : '—'; } },
        { id: 'pl', label: 'Potencia en la carga V²/R', fn: (T) => { const c = acStats(T); return c ? fmt(c.rms * c.rms / 20, 'W') : '—'; } },
        { id: 'pt', label: 'Potencia a plena conducción (media onda) V_pk²/(4R)', fn: (T) => fmt(Math.pow(T.net.part('VAC').p.amp, 2) / 80, 'W') }
      ]
    });
  });

  /* ---------- 26.3 Triac y diac: regulador de luz de onda completa ---------- */
  const triacSpec = (o) => ({
    parts: [['VAC', 'VAC', 2, 14, 0, { amp: 170, f: 60, rs: 0.5 }], ['RL', 'R', 12, 10, 1, { r: 144, watt: 150 }], ['TR1', 'TRIAC', 12, 20, 0, { igt: 0.01, ih: 0.02, imax: 8 }], ['Rv', 'R', 22, 8, 0, { r: o.rv }], ['C1', 'C', 30, 16, 1, { c: 100e-9, kind: 'film' }], ['DI', 'DIAC', 36, 14, 0, { vbo: 32 }]],
    wires: [['VAC.0', '@ac:u'], ['VAC.1', 'gnd'], ['RL.0', '@ac:u'], ['RL.1', '@k:d'], ['TR1.0', '@k:u'], ['TR1.1', 'gnd'], ['Rv.0', '@ac:l'], ['Rv.1', '@x:r'], ['C1.0', '@x:u'], ['C1.1', 'gnd'], ['DI.0', '@x:l'], ['DI.1', '@g:r'], ['TR1.2', '@g:d']]
  });
  EM.defineSim('c26-triac', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.0, edit: 'values', panels: ['scope'], tdiv: 2e-3, net: { damage: false },
      hint: 'Regulador de luz (<i>dimmer</i>) de una lámpara de 100 W a 120 V eficaces: R_v y C retrasan la tensión; cuando el condensador llega a 32 V el diac se dispara y activa el triac en ambos semiciclos. (Los nodos con el mismo nombre están unidos.)',
      probes: [{ label: 'red', at: 'ac', color: '#ffd84a' }, { label: 'tensión en la lámpara', at: 'ac', ref: 'k', color: '#4ae3ff' }, { label: 'condensador', at: 'x', color: '#ff8f5a' }],
      spec: triacSpec({ rv: 40000 }),
      controls: [
        { type: 'slider', id: 'rv', label: 'Resistor variable R_v (potenciómetro del regulador)', min: 5000, max: 500000, value: 40000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('Rv', 'r', v) },
        { type: 'slider', id: 'c', label: 'Condensador C', min: 22e-9, max: 470e-9, value: 100e-9, unit: 'F', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('C1', 'c', v) }
      ],
      outs: [
        { id: 'vr', label: 'Tensión eficaz en la lámpara', hl: true, fn: (T) => { const c = T.stat('tensión en la lámpara'); return c ? fmt(c.rms, 'V') : '—'; } },
        { id: 'p', label: 'Potencia en la lámpara V²/R', hl: true, fn: (T) => { const c = T.stat('tensión en la lámpara'); return c ? fmt(c.rms * c.rms / 144, 'W') : '—'; } },
        { id: 'pp', label: 'Potencia a plena conducción', fn: (T) => fmt(120 * 120 / 144, 'W') },
        { id: 'ang', label: 'Ángulo de disparo α (de la tensión eficaz)', fn: (T) => { const c = T.stat('tensión en la lámpara'); if (!c) return '—'; const r = Math.min(1, c.rms / (170 / Math.SQRT2)); let lo = 0, hi = Math.PI; const f = (a) => Math.sqrt((Math.PI - a + Math.sin(2 * a) / 2) / Math.PI); for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (f(mid) > r) lo = mid; else hi = mid; } return EM.fix(lo * DEG, 0) + '°'; } }
      ]
    });
  });

  /* ---------- 26.4 Optoacoplador ---------- */
  const optoSpec = (o) => ({
    parts: [['FG1', 'FG', -6, 12, 0, { wave: 'pulse', amp: 2.5, f: 2000, duty: 0.5, rs: 1 }], ['Rin', 'R', 4, 11, 0, { r: o.rin }], ['U1', 'OPTO', 14, 12, 0, { ctr: o.ctr }], ['VCC', 'VDC', 28, 14, 0, { v: 5 }], ['Rp', 'R', 24, 8, 1, { r: o.rp }]],
    wires: [['FG1.OUT', '@in:r'], ['FG1.GND', 'gnd'], ['Rin.0', '@in:l'], ['Rin.1', 'U1.0'], ['U1.1', 'gnd'], ['VCC.0', '@vcc:u'], ['VCC.1', 'gnd'], ['Rp.0', '@vcc:u'], ['Rp.1', 'U1.2'], ['U1.2', '@out:r'], ['U1.3', 'gnd']]
  });
  EM.defineSim('c26-opto', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.0, edit: 'values', panels: ['scope'], tdiv: 2e-4, net: { damage: false },
      hint: 'El LED infrarrojo del optoacoplador se excita con una señal de 0–5 V a través de R_in; el fototransistor conduce una corriente proporcional (CTR) y baja la tensión del colector. (Los nodos con el mismo nombre están unidos.)',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida (colector)', at: 'out', color: '#4ae3ff' }],
      spec: optoSpec({ rin: 330, ctr: 0.5, rp: 1000 }),
      controls: [
        { type: 'slider', id: 'rin', label: 'Resistor del LED R_in', min: 100, max: 10000, value: 330, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('Rin', 'r', v) },
        { type: 'slider', id: 'ctr', label: 'Relación de transferencia de corriente (CTR)', min: 0.1, max: 3, value: 0.5, unit: '', log: true, fmt: (v) => EM.fix(v, 2), apply: (T, v) => T.set('U1', 'ctr', v) },
        { type: 'slider', id: 'rp', label: 'Resistor de colector R_p (a 5 V)', min: 200, max: 20000, value: 1000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('Rp', 'r', v) }
      ],
      outs: [
        { id: 'if', label: 'Corriente del LED con la entrada alta', hl: true, fn: (T) => fmt((5 - 1.25) / T.net.part('Rin').p.r, 'A') },
        { id: 'ic', label: 'Corriente de colector deseada CTR·I_F', fn: (T) => fmt(T.net.part('U1').p.ctr * (5 - 1.25) / T.net.part('Rin').p.r, 'A') },
        { id: 'is', label: 'Corriente que permite R_p (5 V/R_p)', fn: (T) => fmt(5 / T.net.part('Rp').p.r, 'A') },
        { id: 'vs', label: 'V_salida con la entrada alta (medido)', fn: (T) => { const o = T.stat('salida (colector)'); return o ? fmt(o.mn, 'V') : '—'; } },
        { id: 'es', label: 'Estado del fototransistor', fn: (T) => { const ic = T.net.part('U1').p.ctr * (5 - 1.25) / T.net.part('Rin').p.r, is = 5 / T.net.part('Rp').p.r; return ic > is * 2 ? 'saturación fuerte (interruptor cerrado)' : ic > is ? 'saturación con poco margen' : 'zona activa (la salida no baja del todo)'; } }
      ]
    });
  });
})();
