/* Capítulo 10 — Sensores resistivos, protecciones y electromecánicos */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, CX = EM.cx, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* 10.1 NTC en divisor */
  EM.defineSim('c10-ntc', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, label: 'Termistor NTC en un divisor' });
    sim.group('Sensor y divisor');
    sim.slider('b', { label: 'Constante β del NTC', min: 3000, max: 4500, step: 50, value: 3950, unit: 'K' });
    sim.slider('rf', { label: 'Resistor fijo R_f', min: 500, max: 100000, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3) });
    sim.slider('vcc', { label: 'Alimentación', min: 3.3, max: 12, step: 0.1, value: 5, unit: 'V' });
    sim.slider('t', { label: 'Temperatura', min: -20, max: 120, step: 1, value: 25, unit: '°C' });
    sim.out('r', 'Resistencia del NTC', { hl: true }); sim.out('v', 'Tensión de salida', { hl: true }); sim.out('s', 'Sensibilidad dV/dT'); sim.out('p', 'Potencia en el NTC / error de autocalentamiento');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const R = (T) => 1e4 * Math.exp(p.b * (1 / (T + 273.15) - 1 / 298.15)), V = (T) => p.vcc * R(T) / (R(T) + p.rf);
      const Ts = M.linspace(-20, 120, 281);
      const h1 = Math.round(h * 0.48);
      const p1 = new EM.Plot(c, { x: 0, y: 0, w, h: h1, xmin: -20, xmax: 120, ymin: 100, ymax: 1e6, ylog: true, ml: 62, mr: 14, mt: 10, mb: 8, ylabel: 'R (Ω)', xfmt: () => '' });
      p1.frame(); p1.xy(Ts, Ts.map(R), { color: '--c1', width: 2.4 }); p1.dot(p.t, R(p.t), { color: '--c2', r: 6 });
      const p2 = new EM.Plot(c, { x: 0, y: h1, w, h: h - h1, xmin: -20, xmax: 120, ymin: 0, ymax: p.vcc * 1.02, ml: 62, mr: 14, mt: 8, mb: 38, xlabel: 'temperatura (°C)', ylabel: 'V_salida (V)' });
      p2.frame(); p2.xy(Ts, Ts.map(V), { color: '--c3', width: 2.4 }); p2.dot(p.t, V(p.t), { color: '--c2', r: 6 });
      const Rn = R(p.t), dv = (V(p.t + 0.5) - V(p.t - 0.5)) * 1000, Pn = Math.pow(p.vcc * Rn / (Rn + p.rf), 2) / Rn;
      sim.set('r', fmt(Rn, 'Ω')); sim.set('v', fmt(V(p.t), 'V')); sim.set('s', EM.fix(dv, 1) + ' mV/K');
      sim.set('p', `${fmt(Pn, 'W', 2)} → ${EM.fix(Pn / 1.5e-3, 2)} K`);
    });
  });

  /* 10.2 LDR */
  EM.defineSim('c10-ldr', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.4, edit: 'values', panels: [],
      spec: CX.ladder({ src: { id: 'V1', t: 'VDC', p: { v: 5 } }, items: [{ id: 'R1', t: 'R', p: { r: 10000 }, mode: 'series' }, { id: 'LD', t: 'LDR', p: { lux: 100 }, mode: 'shunt', tap: 'out' }] }),
      controls: [{ type: 'slider', id: 'lx', label: 'Iluminancia', min: 0.1, max: 10000, value: 100, unit: 'lx', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('LD', 'lux', v) }],
      outs: [
        { id: 'r', label: 'Resistencia de la LDR', fn: (T) => fmt(S.ldr(T.net.part('LD').p.lux, 20000, 0.7), 'Ω') },
        { id: 'v', label: 'Tensión de salida', hl: true, fn: (T) => fmt(T.v('out'), 'V') }
      ]
    });
  });

  /* 10.3 Varistor contra pulsos */
  EM.defineSim('c10-mov', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.5, edit: 'values', panels: ['scope'], tdiv: 2e-5, hint: 'Una línea de 12 V (con 100 µH de inductancia) recibe pulsos de 2 A de 10 µs a 10 kHz.',
      probes: [{ label: 'carga', at: 'carga', color: '#4ae3ff' }],
      spec: CX.ladder({ src: { id: 'V1', t: 'VDC', p: { v: 12 } }, items: [{ id: 'L1', t: 'L', p: { l: 1e-4, kind: 'air', imax: 5 }, mode: 'series' }, { id: 'VR1', t: 'VAR', p: { vn: 18, alpha: 25, ej: 100 }, mode: 'shunt' }, { id: 'RL', t: 'R', p: { r: 120, watt: 5 }, mode: 'shunt', tap: 'carga' }, { id: 'I1', t: 'IDC', p: { i: 2, mode: 'pulse', f: 10000, duty: 0.1 }, mode: 'shunt', rot: 0 }] }),
      controls: [{ type: 'seg', id: 'v', label: 'Varistor', options: [['con', 'Conectado'], ['sin', 'Desconectado']], value: 'con', apply: (T, v) => { const P = T.net.part('VR1'); P.fault = v === 'sin' ? { kind: 'open' } : null; T.net.invalidate(); } }],
      outs: [
        { id: 'pk', label: 'Tensión máxima en la carga', hl: true, fn: (T) => { const s = T.stat('carga'); return s ? fmt(s.mx, 'V') : '—'; } },
        { id: 'pm', label: 'Potencia media en el varistor', fn: (T) => { const r = T.net.rt.VR1; return r && r.pw !== undefined ? fmt(r.pw, 'W') : '—'; } },
        { id: 'e', label: 'Estado de la carga', fn: (T) => (T.net.part('RL').dead ? '<b style="color:var(--warn-ink)">destruida</b>' : 'sana') }
      ]
    });
  });

  /* 10.4 Fusible */
  EM.defineSim('c10-fusible', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.5, edit: 'values', panels: [], hint: 'Fusible de 1 A en serie con una carga variable alimentada por una batería de 12 V (0.02 Ω).',
      spec: CX.ladder({ src: { id: 'B1', t: 'BAT', p: { kind: 'pb', v: 12, rs: 0.02 } }, items: [{ id: 'F1', t: 'FUSE', p: { ir: 1, kind: 'fast' }, mode: 'series' }, { id: 'RL', t: 'R', p: { r: 12, watt: 100 }, mode: 'shunt', tap: 'out' }] }),
      controls: [
        { type: 'seg', id: 'k', label: 'Tipo de fusible', options: [['fast', 'Rápido (F)'], ['slow', 'Retardado (T)']], value: 'fast', apply: (T, v) => T.set('F1', 'kind', v) },
        { type: 'slider', id: 'rl', label: 'Resistencia de carga', min: 0.3, max: 200, value: 12, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, v < 10 ? 2 : 1), apply: (T, v) => T.set('RL', 'r', v) },
        { type: 'button', id: 'fix', label: 'Cambiar fusible', apply: (T) => { T.net.repairAll(); } }
      ],
      outs: [
        { id: 'i', label: 'Corriente prevista', hl: true, fn: (T) => fmt(12.6 / (T.net.part('RL').p.r + 0.14), 'A') },
        { id: 'x', label: 'Múltiplo de la nominal', fn: (T) => EM.fix(12.6 / (T.net.part('RL').p.r + 0.14), 2) + ' ×' },
        { id: 't', label: 'Tiempo de fusión (modelo)', fn: (T) => { const x = 12.6 / (T.net.part('RL').p.r + 0.14), r = x * x, k = T.net.part('F1').p.kind === 'slow' ? 0.25 : 1; return r > 1.3 ? fmt(1 / (2.2 * k * (r - 1)), 's') : 'no se funde'; } },
        { id: 'e', label: 'Estado', fn: (T) => (T.net.part('F1').dead ? '<b style="color:var(--warn-ink)">fundido</b>' : 'sano') }
      ]
    });
  });

  /* 10.5 Relé */
  EM.defineSim('c10-rele', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.1, edit: 'values', panels: [], hint: 'Suba y baje la tensión de la bobina para ver la histéresis de actuación.',
      spec: {
        parts: [['V1', 'VDC', 4, 8, 0, { v: 0 }], ['K1', 'RELAY', 14, 12, 0, { vnom: 12, rc: 400 }], ['R2', 'R', 22, 10, 0, { r: 470 }], ['D1', 'LED', 26, 12, 1, { color: 'verde' }],
          ['N1', 'LBL', 4, 4, 0, { name: 'vcc' }], ['N2', 'LBL', 9, 11, 2, { name: 'vcc' }], ['N3', 'LBL', 9, 13, 2, { name: 'gnd' }], ['N4', 'LBL', 19, 12, 0, { name: 'vcc' }], ['N5', 'LBL', 26, 16, 0, { name: 'gnd' }]],
        wires: [[[4, 6], [4, 4]], ['K1.B1', [9, 11]], ['K1.B2', [9, 13]], ['K1.COM', [19, 12]], ['K1.NA', 'R2.0'], ['R2.1', 'D1.0'], [[26, 14], [26, 16]], ['V1.1', 'gnd']]
      },
      controls: [{ type: 'slider', id: 'v', label: 'Tensión de la bobina', min: 0, max: 15, step: 0.1, value: 0, unit: 'V', apply: (T, v) => T.set('V1', 'v', v) }],
      outs: [
        { id: 'i', label: 'Corriente de la bobina', hl: true, fn: (T) => fmt(T.i('K1'), 'A') },
        { id: 's', label: 'Estado del contacto', fn: (T) => { const r = T.net.rt.K1; return r && r.ref && r.ref.relay && r.ref.relay.on ? '<b>cerrado (atraído)</b>' : 'abierto (reposo)'; } },
        { id: 'l', label: 'Corriente del LED', fn: (T) => fmt(T.i('D1'), 'A') },
        { id: 'th', label: 'Atracción ≈ 70 %, suelta ≈ 20 % de 12 V', fn: () => '8.4 V · 2.4 V' }
      ]
    });
  });
})();
