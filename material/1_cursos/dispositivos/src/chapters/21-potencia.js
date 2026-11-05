/* Capítulo 21 — Potencia, disipación y conmutación */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD, CX = EM.cx, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* distorsión armónica total de un canal del osciloscopio (proyección en un número entero de períodos) */
  function thdOf(T, label, f0) {
    const ch = T.channels.find((c) => c.label === label); if (!ch) return NaN;
    const r = T.rings[ch.id]; if (!r || r.count() < T.N) return NaN;
    const dt = T.dt, per = 1 / (f0 * dt), m = Math.floor(T.N / per); if (m < 1) return NaN;
    const Mn = Math.round(m * per), a = r.last(Mn);
    const amp = (k) => { let c = 0, s = 0; for (let i = 0; i < Mn; i++) { const ph = 2 * Math.PI * k * f0 * i * dt; c += a[i] * Math.cos(ph); s += a[i] * Math.sin(ph); } return (2 / Mn) * Math.hypot(c, s); };
    const a1 = amp(1); if (a1 < 1e-6) return NaN;
    let h2 = 0; for (let k = 2; k <= 9; k++) h2 += Math.pow(amp(k), 2);
    return Math.sqrt(h2) / a1;
  }

  /* 21.1 Etapa de salida complementaria en clase B / AB */
  const pushpull = (o) => ({
    parts: [['VP', 'VDC', 30, 8, 0, { v: 12 }], ['VN', 'VDC', 30, 24, 0, { v: 12 }], ['Q1', 'NPN', 18, 8, 0, { model: 'TIP31' }], ['Q2', 'PNP', 18, 22, 0, { model: 'TIP32', flip: true }],
      ['RE1', 'R', 20, 12, 1, { r: 2.2, watt: 5 }], ['RE2', 'R', 20, 18, 1, { r: 2.2, watt: 5 }], ['RL', 'R', 24, 17, 1, { r: o.rl, watt: 50 }],
      ['Rb1', 'R', 14, 6, 1, { r: o.rb }], ['Rb2', 'R', 14, 24, 1, { r: o.rb }], ['D1', 'D', 14, 11, 1, { model: '1N4148' }], ['D2', 'D', 14, 15, 1, { model: '1N4148' }], ['SW1', 'SW', 11, 13, 1, { on: o.classB }],
      ['FG1', 'FG', 4, 10, 0, { wave: 'sin', amp: o.amp, f: 1000, rs: 50 }], ['Cin', 'C', 9, 9, 2, { c: 100e-6, kind: 'elec' }],
      ['Ni', 'LBL', 7, 7, 2, { name: 'in' }], ['No', 'LBL', 22, 13, 0, { name: 'out' }]],
    wires: [[[14, 4], [30, 4]], [[20, 6], [20, 4]], [[30, 6], [30, 4]], [[14, 28], [30, 28]], [[20, 24], [20, 28]], [[30, 26], [30, 28]], [[14, 26], [14, 28]],
      ['Rb1.1', 'D1.0'], ['D1.1', 'D2.0'], ['D2.1', [14, 22], 'Rb2.0'], [[14, 8], [16, 8]], [[14, 22], [16, 22]], ['Q1.2', 'RE1.0'], ['Q2.2', 'RE2.1'], ['RE1.1', 'RE2.0'],
      [[20, 15], [24, 15]], [[22, 15], [22, 13]], ['RL.1', [24, 20]], ['gndat', 24, 20], [[30, 10], [30, 15]], [[30, 22], [30, 15]], [[30, 15], [32, 15]], ['gndat', 32, 15],
      [[11, 11], [11, 9], [14, 9]], [[11, 15], [11, 17], [14, 17]], ['FG1.OUT', [7, 9]], [[7, 9], [7, 7]], ['FG1.GND', [7, 12]], ['gndat', 7, 12]]
  });
  EM.defineSim('c21-clase', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 1.25, edit: 'values', panels: ['scope'], tdiv: 5e-4, net: { thermalSpeed: 20 },
      hint: 'Seguidores de emisor complementarios (TIP31C y TIP32C) que alimentan 8 Ω desde ±12 V. Los dos diodos 1N4148 desplazan las bases 1.4 V para evitar la distorsión de cruce.',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: pushpull({ rl: 8, rb: 1000, amp: 4, classB: false }),
      controls: [
        { type: 'seg', id: 'cl', label: 'Polarización', options: [['ab', 'Clase AB (con diodos)'], ['b', 'Clase B (sin polarización)']], value: 'ab', apply: (T, v) => T.set('SW1', 'on', v === 'b') },
        { type: 'slider', id: 'a', label: 'Amplitud de la señal de entrada', min: 0.2, max: 10, value: 4, unit: 'V', log: true, fmt: (v) => EM.fix(v, 2), apply: (T, v) => T.set('FG1', 'amp', v) },
        { type: 'slider', id: 'rl', label: 'Resistencia de carga R_L', min: 4, max: 100, value: 8, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 1), apply: (T, v) => T.set('RL', 'r', v) }
      ],
      outs: [
        { id: 'vo', label: 'Amplitud de la salida (pico)', hl: true, fn: (T) => { const o = T.stat('salida'); return o ? fmt(o.pp / 2, 'V') : '—'; } },
        { id: 'thd', label: 'Distorsión armónica total (THD)', hl: true, fn: (T) => { const d = thdOf(T, 'salida', 1000); return isNaN(d) ? '—' : EM.fix(d * 100, 2) + ' %'; } },
        { id: 'po', label: 'Potencia en la carga P_o = V_rms²/R_L', fn: (T) => { const o = T.stat('salida'); return o ? fmt(o.rmsAC * o.rmsAC / T.net.part('RL').p.r, 'W') : '—'; } },
        { id: 'ps', label: 'Potencia de la fuente (clase B ideal) 2·V_CC·V_pk/(π·R_L)', fn: (T) => { const o = T.stat('salida'); return o ? fmt(2 * 12 * (o.pp / 2) / (Math.PI * T.net.part('RL').p.r) , 'W') : '—'; } },
        { id: 'eta', label: 'Rendimiento teórico π·V_pk/(4·V_CC)', fn: (T) => { const o = T.stat('salida'); return o ? EM.fix(Math.PI * (o.pp / 2) / (4 * 12) * 100, 0) + ' %' : '—'; } },
        { id: 'iq', label: 'Corriente de reposo de cada transistor', fn: (T) => { const n = EM.Panels.tempNet(T); return fmt(Math.abs(n.iPart(n.part('Q1'))), 'A'); } }
      ]
    });
  });

  /* 21.2 Resistencia térmica y disipadores */
  const DEVS = {
    TIP31C: { n: 'TIP31C (TO-220)', tj: 150, rjc: 3.1, rja: 62.5 }, '2N3055': { n: '2N3055 (TO-3)', tj: 200, rjc: 1.5, rja: 35 },
    IRF540N: { n: 'IRF540N (TO-220)', tj: 175, rjc: 1.15, rja: 62 }, L7805: { n: 'Regulador 7805 (TO-220)', tj: 125, rjc: 5, rja: 65 }, BC547: { n: 'BC547 (TO-92)', tj: 150, rjc: 83, rja: 200 }
  };
  EM.defineSim('c21-calor', function (sim) {
    const cv = sim.canvas({ aspect: 1.7, label: 'Temperatura de la unión frente a la potencia disipada' });
    sim.group('Dispositivo y disipador');
    sim.select('d', { label: 'Dispositivo', options: Object.keys(DEVS).map((k) => [k, DEVS[k].n]), value: 'TIP31C' });
    sim.seg('hs', { label: 'Montaje', options: [['no', 'Sin disipador'], ['si', 'Con disipador']], value: 'si' });
    sim.slider('rsa', { label: 'Resistencia térmica del disipador R_θSA', min: 0.5, max: 40, value: 8, unit: 'K/W', log: true, fmt: (v) => EM.fix(v, 1) });
    sim.select('ins', { label: 'Aislante entre cápsula y disipador', options: [[0.1, 'Ninguno (grasa térmica)'], [0.8, 'Mica con grasa (0.8 K/W)'], [1.5, 'Almohadilla de silicona (1.5 K/W)']], value: 0.8 });
    sim.group('Condiciones');
    sim.slider('P', { label: 'Potencia disipada P', min: 0.1, max: 40, value: 6, unit: 'W', log: true, fmt: (v) => EM.fix(v, 1) });
    sim.slider('Ta', { label: 'Temperatura ambiente', min: 0, max: 70, step: 1, value: 25, unit: '°C' });
    sim.slider('Tg', { label: 'Temperatura de unión objetivo', min: 80, max: 150, step: 5, value: 110, unit: '°C' });
    sim.out('tj', 'Temperatura de la unión T_j', { hl: true }); sim.out('tc', 'Cápsula T_C y disipador T_S'); sim.out('rt', 'Resistencia térmica total R_θJA'); sim.out('pm', 'Potencia máxima admisible a esta T_a', { hl: true }); sim.out('rq', 'R_θSA máxima para la T_j objetivo');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p, d = DEVS[p.d];
      const rth = p.hs === 'no' ? d.rja : d.rjc + +p.ins + p.rsa;
      const Pmax = Math.max(1.6 * (d.tj - p.Ta) / rth, 1.25 * p.P, 1), tjMax = d.tj + 40;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 0, xmax: Pmax, ymin: 0, ymax: tjMax, ml: 60, mr: 14, mt: 14, mb: 40, xlabel: 'P (W)', ylabel: 'T_j (°C)' });
      pl.frame();
      pl.xy([0, Pmax], [d.tj, d.tj], { color: '--c2', width: 2, dash: [8, 4] });
      pl.xy([0, Pmax], [p.Tg, p.Tg], { color: '--c3', width: 1.5, dash: [3, 4] });
      pl.xy([0, Pmax], [p.Ta, p.Ta + Pmax * rth], { color: '--c1', width: 2.8 });
      pl.xy([0, Pmax], [p.Ta, p.Ta + Pmax * d.rja], { color: '--ink-3', width: 1.6 });
      const tj = p.Ta + p.P * rth;
      pl.dot(Math.min(p.P, Pmax), Math.min(tj, tjMax), { color: tj > d.tj ? '--c2' : '--c1', r: 6 }); pl.vline(p.P, { color: '--ink-3', dash: [3, 4] });
      c.font = '12px ' + (EM.FONT_MONO || 'monospace'); c.textAlign = 'left';
      [['--c2', 'T_j máxima del dispositivo'], ['--c3', 'T_j objetivo'], ['--c1', 'su montaje'], ['--ink-3', 'sin disipador']].forEach(([cl, t], i) => { c.fillStyle = EM.col(cl); c.fillRect(74, 24 + i * 18, 14, 4); c.fillStyle = EM.col('--ink-2'); c.fillText(t, 94, 30 + i * 18); });
      const tcase = p.Ta + p.P * (rth - d.rjc), ts = p.hs === 'no' ? tcase : p.Ta + p.P * p.rsa;
      sim.set('tj', EM.fix(tj, 0) + ' °C' + (tj > d.tj ? ' — ¡SUPERA EL LÍMITE!' : ''));
      sim.set('tc', EM.fix(tcase, 0) + ' °C · ' + EM.fix(ts, 0) + ' °C');
      sim.set('rt', EM.fix(rth, 1) + ' K/W'); sim.set('pm', EM.fix((d.tj - p.Ta) / rth, 1) + ' W');
      const rq = (p.Tg - p.Ta) / p.P - d.rjc - +p.ins; sim.set('rq', rq > 0 ? EM.fix(rq, 1) + ' K/W' : 'imposible: ni con disipador infinito');
    });
  });

  /* 21.3 Convertidores conmutados reductor (buck) y elevador (boost) */
  const conv = (kind, o) => {
    const fg = ['FG1', 'FG', -4, 14, 0, { wave: 'pulse', amp: 5, f: 100000, duty: o.d, rs: 1 }];
    const common = (extra) => ({ parts: extra.parts, wires: extra.wires });
    if (kind === 'buck') {
      return common({
        parts: [['VIN', 'VDC', -4, 4, 0, { v: o.vin }], ['M1', 'NMOS', 12, 8, 0, { model: 'IRF540N' }], fg, ['D1', 'D', 16, 14, 3, { model: '1N5819' }], ['L1', 'L', 19, 10, 0, { l: o.l, kind: 'power', imax: 5 }],
          ['C1', 'C', 24, 14, 1, { c: 22e-6, kind: 'elec' }], ['RL', 'R', 28, 14, 1, { r: o.rl, watt: 50 }], ['Ns', 'LBL', 6, 17, 2, { name: 'sw' }], ['No', 'LBL', 26, 8, 0, { name: 'out' }]],
        wires: [[[-4, 2], [14, 2], [14, 6]], [[-4, 6], [-4, 7]], ['gndat', -4, 7], ['FG1.OUT', [-1, 8], [10, 8]], ['FG1.GND', [14, 15], [14, 10]], [[14, 10], [17, 10]], [[16, 10], [16, 12]],
          [[6, 15], [6, 17]], ['L1.1', [28, 10], 'RL.0'], [[24, 10], [24, 12]], [[26, 10], [26, 8]], [[16, 16], [16, 22], [28, 22]], [[24, 16], [24, 22]], [[28, 16], [28, 22]], [[22, 22], [22, 23]], ['gndat', 22, 23]]
      });
    }
    return common({
      parts: [['VIN', 'VDC', 2, 10, 0, { v: o.vin }], ['L1', 'L', 7, 6, 0, { l: o.l, kind: 'power', imax: 5 }], ['M1', 'NMOS', 10, 12, 0, { model: 'IRF540N' }], ['FG1', 'FG', -4, 15, 0, { wave: 'pulse', amp: 5, f: 100000, duty: o.d, rs: 1 }], ['D1', 'D', 15, 6, 0, { model: '1N5819' }],
        ['C1', 'C', 21, 10, 1, { c: 22e-6, kind: 'elec' }], ['RL', 'R', 25, 10, 1, { r: o.rl, watt: 50 }], ['Ns', 'LBL', 14, 8, 0, { name: 'sw' }], ['No', 'LBL', 23, 4, 0, { name: 'out' }]],
      wires: [[[2, 8], [2, 6], [5, 6]], ['L1.1', 'D1.0'], [[12, 6], [12, 10]], [[12, 8], [14, 8]], ['D1.1', [21, 6], [21, 8]], [[21, 6], [25, 6], [25, 8]], [[23, 6], [23, 4]],
        ['FG1.OUT', [-1, 14], [8, 14], [8, 12]], ['FG1.GND', [-1, 22], [2, 22]], ['M1.2', [12, 22]], [[2, 12], [2, 22], [25, 22]], [[21, 12], [21, 22]], [[25, 12], [25, 22]], [[10, 22], [10, 23]], ['gndat', 10, 23]]
    });
  };
  EM.defineSim('c21-conv', function (sim) {
    const cur = () => ({ d: sim.p.d || 0.5, vin: sim.p.vin || 12, rl: sim.p.rl || 5, l: sim.p.l || 47e-6 });
    const kindOf = (T) => (T.net.part('D1').x < 16 ? 'boost' : 'buck');
    const th = (T) => { const p = { vin: T.net.part('VIN').p.v, d: T.net.part('FG1').p.duty, l: T.net.part('L1').p.l, rl: T.net.part('RL').p.r, f: T.net.part('FG1').p.f }, k = kindOf(T); const vo = k === 'buck' ? p.d * p.vin : p.vin / (1 - p.d); const io = vo / p.rl; const dI = k === 'buck' ? (p.vin - vo) * p.d / (p.l * p.f) : p.vin * p.d / (p.l * p.f); const il = k === 'buck' ? io : io / (1 - p.d); return Object.assign(p, { k, vo, io, dI, il, ccm: il > dI / 2 }); };
    const T = EM.Taller.mount(sim, {
      aspect: 1.25, edit: 'values', panels: ['scope'], tdiv: 2e-5, net: { thermalSpeed: 20 },
      hint: 'Convertidor de CC a CC con MOSFET IRF540N excitado a 100 kHz, diodo Schottky 1N5819, bobina de 47 µH y condensador de 22 µF.',
      probes: [{ label: 'nodo de conmutación', at: 'sw', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: conv('buck', { d: 0.5, vin: 12, rl: 5, l: 47e-6 }),
      controls: [
        { type: 'seg', id: 'k', label: 'Topología', options: [['buck', 'Reductor (buck)'], ['boost', 'Elevador (boost)']], value: 'buck', init: false, apply: (T, v) => { T.sim.ctl.rl.set(v === 'boost' ? 50 : 5, true); T.loadSpec(conv(v, cur())); T.fastForward(3e-3); } },
        { type: 'slider', id: 'd', label: 'Ciclo de trabajo D', min: 0.1, max: 0.9, step: 0.01, value: 0.5, unit: '', init: false, apply: (T, v) => T.set('FG1', 'duty', v) },
        { type: 'slider', id: 'vin', label: 'Tensión de entrada', min: 5, max: 24, step: 0.5, value: 12, unit: 'V', init: false, apply: (T, v) => T.set('VIN', 'v', v) },
        { type: 'slider', id: 'rl', label: 'Resistencia de carga R_L', min: 1, max: 50, value: 5, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 1), init: false, apply: (T, v) => T.set('RL', 'r', v) },
        { type: 'slider', id: 'l', label: 'Inductancia L', min: 10e-6, max: 470e-6, value: 47e-6, unit: 'H', log: true, fmt: (v) => EM.si(v, '', 3), init: false, apply: (T, v) => T.set('L1', 'l', v) }
      ],
      outs: [
        { id: 'vo', label: 'Tensión de salida (media medida)', hl: true, fn: (T) => { const o = T.stat('salida'); return o ? fmt(o.mean, 'V') : '—'; } },
        { id: 'vt', label: 'Teórica (CCM): D·V_in  ó  V_in/(1−D)', fn: (T) => fmt(th(T).vo, 'V') },
        { id: 'rip', label: 'Rizado de la salida (pico a pico)', fn: (T) => { const o = T.stat('salida'); return o ? fmt(o.pp, 'V') : '—'; } },
        { id: 'di', label: 'Rizado de corriente en L: ΔI_L', fn: (T) => fmt(th(T).dI, 'A') },
        { id: 'il', label: 'Corriente media en L', fn: (T) => fmt(th(T).il, 'A') },
        { id: 'mo', label: 'Modo de conducción', hl: true, fn: (T) => (th(T).ccm ? 'continuo (CCM)' : 'discontinuo (DCM): la fórmula de CCM no vale') },
        { id: 'et', label: 'Rendimiento (sólo pérdidas de MOSFET y diodo)', fn: (T) => { const t = th(T), pm = (T.net.rt.M1 && T.net.rt.M1.pw) || 0, pd = (T.net.rt.D1 && T.net.rt.D1.pw) || 0, o = T.stat('salida'), po = o ? o.mean * o.mean / t.rl : 0; return po > 0 ? EM.fix(100 * po / (po + pm + pd), 1) + ' %' : '—'; } }
      ]
    });
    T.fastForward(3e-3);
  });
})();
