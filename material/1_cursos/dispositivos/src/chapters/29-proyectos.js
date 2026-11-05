/* Capítulo 29 — Proyectos de laboratorio */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const L = (T) => T.net.netInfo.labelNet;

  /* ---------- Proyecto: termómetro con NTC ---------- */
  EM.defineSim('c29-termometro', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.2, edit: 'values', panels: ['table', 'sweep'], net: { damage: false },
      hint: 'NTC de 10 kΩ (B = 3950 K) en divisor con 10 kΩ, y un seguidor con A.O. TL081 que lo aísla de la entrada del instrumento. (Los nodos con la misma etiqueta están unidos.)',
      spec: {
        parts: [['VS', 'VDC', 2, 12, 0, { v: 5 }], ['NT', 'NTC', 10, 8, 1, { r25: 10000, beta: 3950, T: 25 }], ['R1', 'R', 10, 16, 1, { r: 10000 }], ['U1', 'OA', 22, 12, 0, { model: 'TL081' }], ['RC', 'R', 32, 12, 1, { r: 10000 }]],
        wires: [['VS.0', '@vs:u'], ['VS.1', 'gnd'], ['NT.0', '@vs:u'], ['NT.1', '@n:r'], ['R1.0', '@n:u'], ['R1.1', 'gnd'], ['U1.0', '@n:l'], ['U1.1', '@o:l'], ['U1.2', '@o:r'], ['RC.0', '@o:u'], ['RC.1', 'gnd']]
      },
      controls: [
        { type: 'slider', id: 'T', label: 'Temperatura del sensor', min: -10, max: 110, step: 1, value: 25, unit: '°C', apply: (T, v) => T.set('NT', 'T', v) }
      ],
      outs: [
        { id: 'r', label: 'Resistencia del NTC', fn: (T) => fmt(S.ntc(T.net.part('NT').p.T, 10000, 3950), 'Ω') },
        { id: 'v', label: 'Tensión del divisor V = 5·10 k/(10 k + R_NTC)', hl: true, fn: (T) => fmt(T.net.v(L(T).n), 'V') },
        { id: 'vo', label: 'Salida del seguidor', fn: (T) => fmt(T.net.v(L(T).o), 'V') },
        { id: 'te', label: 'Temperatura estimada (ecuación de Steinhart)', hl: true, fn: (T) => { const v = T.net.v(L(T).o), r = 10000 * (5 - v) / Math.max(v, 1e-6), t = 1 / (1 / 298.15 + Math.log(r / 10000) / 3950) - 273.15; return EM.fix(t, 1) + ' °C'; } },
        { id: 'sens', label: 'Sensibilidad local dV/dT', fn: (T) => { const t = T.net.part('NT').p.T, f = (x) => 5 * 10000 / (10000 + S.ntc(x, 10000, 3950)); return fmt((f(t + 0.5) - f(t - 0.5)) * 1000, 'V/°C'); } }
      ]
    });
  });

  /* ---------- Proyecto: interruptor crepuscular ---------- */
  EM.defineSim('c29-crepuscular', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.2, edit: 'values', panels: ['table'], net: { damage: false },
      hint: 'LDR en divisor con 10 kΩ; un comparador LM393 con histéresis enciende el LED cuando oscurece. Mueva la iluminación hacia abajo y hacia arriba: el LED se enciende y se apaga con umbrales distintos. (Los nodos con la misma etiqueta están unidos.)',
      spec: {
        parts: [['VS', 'VDC', 2, 12, 0, { v: 5 }], ['LD', 'LDR', 10, 8, 1, { lux: 100, r10: 20000, gamma: 0.7 }], ['R1', 'R', 10, 16, 1, { r: 10000 }], ['U1', 'CMP', 24, 12, 0, {}], ['Ra', 'R', 18, 22, 1, { r: 10000 }], ['Rb', 'R', 18, 28, 1, { r: 10000 }], ['Rh', 'R', 32, 20, 0, { r: 220000 }], ['Rp', 'R', 36, 8, 1, { r: 4700 }], ['Rl', 'R', 42, 8, 1, { r: 330 }], ['D1', 'LED', 42, 16, 1, { color: 'verde' }]],
        wires: [['VS.0', '@vs:u'], ['VS.1', 'gnd'], ['LD.0', '@vs:u'], ['LD.1', '@s:r'], ['R1.0', '@s:u'], ['R1.1', 'gnd'], ['U1.0', '@s:l'], ['U1.1', '@ref:l'], ['Ra.0', '@vs:u'], ['Ra.1', '@ref:u'], ['Rb.0', '@ref:u'], ['Rb.1', 'gnd'], ['U1.2', '@q:r'], ['Rh.0', '@q:l'], ['Rh.1', '@s:r'], ['Rp.0', '@vs:u'], ['Rp.1', '@q:u'], ['Rl.0', '@vs:u'], ['Rl.1', 'D1.0'], ['D1.1', '@q:u']]
      },
      controls: [
        { type: 'slider', id: 'lux', label: 'Iluminación sobre el LDR', min: 0.5, max: 1000, value: 100, unit: 'lx', log: true, fmt: (v) => EM.fix(v, 1), apply: (T, v) => T.set('LD', 'lux', v) }
      ],
      outs: [
        { id: 'r', label: 'Resistencia del LDR', fn: (T) => fmt(S.ldr(T.net.part('LD').p.lux, 20000, 0.7), 'Ω') },
        { id: 's', label: 'Tensión del sensor V_s', hl: true, fn: (T) => fmt(T.net.v(L(T).s), 'V') },
        { id: 'ref', label: 'Tensión de referencia V_ref', fn: (T) => fmt(T.net.v(L(T).ref), 'V') },
        { id: 'q', label: 'Salida del comparador (colector abierto)', fn: (T) => fmt(T.net.v(L(T).q), 'V') },
        { id: 'led', label: 'LED', hl: true, fn: (T) => (T.net.v(L(T).q) < 1 ? '<b>ENCENDIDO</b> (oscuro)' : 'apagado (con luz)') }
      ]
    });
  });

  /* ---------- Proyecto: regulador de potencia PWM con 555 y MOSFET ---------- */
  const pwm555 = (o) => ({
    parts: [['VS', 'VDC', 2, 12, 0, { v: 12 }], ['IC', 'T555', 14, 12, 0, {}], ['R1', 'R', 26, 8, 1, { r: 1000 }], ['D1', 'D', 26, 16, 1, { model: '1N4148' }], ['RA', 'R', 26, 22, 1, { r: 100000 * o.x }], ['RB', 'R', 26, 30, 1, { r: 100000 * (1 - o.x) }], ['D2', 'D', 26, 38, 1, { model: '1N4148' }], ['Ct', 'C', 34, 22, 1, { c: 10e-9, kind: 'film' }], ['Cc', 'C', 6, 18, 1, { c: 10e-9, kind: 'ceramic' }],
      ['M1', 'NMOS', 50, 18, 0, { model: 'IRLZ44N' }], ['RL', 'R', 50, 10, 1, { r: 24, watt: 25 }]],
    wires: [['VS.0', '@vcc:u'], ['VS.1', 'gnd'], ['IC.VCC', '@vcc:u'], ['IC.GND', 'gnd'], ['IC.RESET', '@vcc:l'], ['IC.TRIG', '@t:l'], ['IC.THR', '@t:l'], ['IC.CTRL', '@ctl:l'], ['Cc.0', '@ctl:u'], ['Cc.1', 'gnd'], ['IC.OUT', '@out:r'], ['IC.DIS', '@dis:r'],
      ['R1.0', '@vcc:u'], ['R1.1', '@dis:d'], ['D1.0', '@dis:u'], ['D1.1', '@a:d'], ['RA.0', '@a:u'], ['RA.1', '@t:d'], ['RB.0', '@t:u'], ['RB.1', '@b:d'], ['D2.0', '@b:u'], ['D2.1', '@dis:d'], ['Ct.0', '@t:u'], ['Ct.1', 'gnd'], ['M1.1', '@out:l'], ['M1.2', 'gnd'], ['M1.0', '@d:u'], ['RL.0', '@vcc:u'], ['RL.1', '@d:d']]
  });
  EM.defineSim('c29-pwm555', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.0, edit: 'values', panels: ['scope'], tdiv: 5e-4, net: { damage: false },
      hint: 'Regulador de potencia: un 555 genera un PWM de frecuencia casi fija y ciclo de trabajo ajustable con el potenciómetro (100 kΩ repartido entre R_A y R_B, con dos diodos); un MOSFET de nivel lógico conmuta una carga de 24 Ω desde 12 V. (Los nodos con la misma etiqueta están unidos.)',
      probes: [{ label: 'salida del 555', at: 'out', color: '#ffd84a' }, { label: 'drenador (tensión en la carga: 12 V − V_d)', at: 'd', color: '#4ae3ff' }],
      spec: pwm555({ x: 0.5 }),
      controls: [
        { type: 'slider', id: 'x', label: 'Posición del potenciómetro (fracción de R_A)', min: 0.05, max: 0.95, step: 0.01, value: 0.5, unit: '', fmt: (v) => EM.fix(v * 100, 0) + ' %', apply: (T, v) => { T.set('RA', 'r', 100000 * v); T.set('RB', 'r', 100000 * (1 - v)); } }
      ],
      outs: [
        { id: 'd', label: 'Ciclo de trabajo de la salida del 555 (medido)', hl: true, fn: (T) => { const o = T.stat('salida del 555'); return o && !isNaN(o.duty) ? EM.fix(o.duty * 100, 1) + ' %' : '—'; } },
        { id: 'dt', label: 'Teórico (R₁ + R_A)/(R₁ + R_A + R_B)', fn: (T) => { const a = T.net.part('RA').p.r, b = T.net.part('RB').p.r, r1 = T.net.part('R1').p.r; return EM.fix(100 * (r1 + a) / (r1 + a + b), 1) + ' %'; } },
        { id: 'f', label: 'Frecuencia medida', fn: (T) => { const o = T.stat('salida del 555'); return o && o.f ? fmt(o.f, 'Hz') : '—'; } },
        { id: 'v', label: 'Tensión media en la carga', hl: true, fn: (T) => { const o = T.stat('drenador (tensión en la carga: 12 V − V_d)'); return o ? fmt(12 - o.mean, 'V') : '—'; } },
        { id: 'p', label: 'Potencia media en la carga', fn: (T) => { const o = T.stat('drenador (tensión en la carga: 12 V − V_d)'); if (!o) return '—'; const vl = 12 - o.mean; return fmt((144 - 2 * 12 * o.mean + o.rms * o.rms) / 24, 'W'); } }
      ]
    });
  });
})();
