/* Capítulo 18 — Amplificadores con BJT */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD, CX = EM.cx;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const par = (a, b) => (a * b) / (a + b);
  const VT = 0.02585;

  /* parámetros de pequeña señal del transistor Q1 en su punto de reposo y de la red de polarización */
  /* punto de operación en continua (sin señal), con memoria mientras no cambien los valores */
  function dcOp(T) {
    const k = JSON.stringify(T.net.doc.parts.map((q) => q.p)) + T.net.cfg.Ta;
    if (!T._dc || T._dc.k !== k) T._dc = { k, n: EM.Panels.tempNet(T) };
    return T._dc.n;
  }
  const icDC = (T, id) => { const n = dcOp(T); return n.iPart(n.part(id || 'Q1')); };
  function ss(T) {
    const n = T.net, p = (id) => n.part(id).p;
    const ic = Math.max(icDC(T), 1e-9), bf = MOD.BJT[p('Q1').model].bf;
    const gm = ic / VT, rpi = bf / gm;
    return { ic, bf, gm, rpi, re: VT / ic, rb: par(p('R1').r, p('R2').r), RE: p('RE').r, RC: n.part('RC') ? p('RC').r : 0, RL: p('RL').r, rs: p('FG1').rs };
  }
  /* distorsión armónica total de la señal de salida: proyección sobre los armónicos 1..9 en un número entero de períodos */
  function thdOut(T) {
    const ch = T.channels.find((c) => c.label === 'salida'); if (!ch) return NaN;
    const r = T.rings[ch.id]; if (!r || r.count() < T.N) return NaN;
    const f0 = T.net.part('FG1').p.f, dt = T.dt, per = 1 / (f0 * dt), m = Math.floor(T.N / per); if (m < 1) return NaN;
    const M = Math.round(m * per), a = r.last(M), amp = (k) => { let c = 0, s = 0; for (let i = 0; i < M; i++) { const ph = 2 * Math.PI * k * f0 * i * dt; c += a[i] * Math.cos(ph); s += a[i] * Math.sin(ph); } return (2 / M) * Math.hypot(c, s); };
    const a1 = amp(1); if (a1 < 1e-6) return NaN;
    let h2 = 0; for (let k = 2; k <= 9; k++) h2 += Math.pow(amp(k), 2);
    return Math.sqrt(h2) / a1;
  }
  const gainMeas = (T) => { const o = T.stat('salida'), i = T.stat('entrada'); return o && i && i.pp > 1e-6 ? o.pp / i.pp : NaN; };

  /* 18.1 Emisor común */
  EM.defineSim('c18-ce', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 1.15, edit: 'values', panels: ['scope', 'bode'], tdiv: 5e-4, autoBode: false,
      hint: 'Generador de 1 kHz → C_in → divisor R₁/R₂ → base. Salida: colector → C_out → carga R_L. El condensador C_E puentea a R_E.',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: CX.amp({ mode: 'ce', amp: 0.005 }),
      controls: [
        { type: 'seg', id: 'ce', label: 'Condensador de desacoplo C_E', options: [['con', 'Con C_E (100 µF)'], ['sin', 'Sin C_E']], value: 'con', apply: (T, v) => T.set('CE', 'c', v === 'con' ? 100e-6 : 1e-15) },
        { type: 'slider', id: 'a', label: 'Amplitud de la señal de entrada', min: 0.001, max: 0.1, value: 0.005, unit: 'V', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('FG1', 'amp', v) },
        { type: 'slider', id: 'rl', label: 'Resistor de carga R_L', min: 500, max: 100000, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('RL', 'r', v) }
      ],
      outs: [
        { id: 'av', label: 'Ganancia medida V_sal / V_ent', hl: true, fn: (T) => { const g = gainMeas(T); return isNaN(g) ? '—' : EM.fix(g, 1) + ' (' + EM.fix(20 * Math.log10(g), 1) + ' dB)'; } },
        { id: 'avt', label: 'Ganancia teórica', fn: (T) => { const s = ss(T), by = T.net.part('CE').p.c > 1e-6, RCL = par(s.RC, s.RL); const rinb = by ? s.rpi : s.rpi + (s.bf + 1) * s.RE; const rin = par(s.rb, rinb); const av = by ? s.gm * RCL : s.bf * RCL / rinb; return EM.fix(av * rin / (rin + s.rs), 1); } },
        { id: 'ic', label: 'Corriente de reposo I_C', fn: (T) => fmt(icDC(T), 'A') },
        { id: 'gm', label: 'g_m = I_C/V_T y r_π', fn: (T) => { const s = ss(T); return fmt(s.gm, 'S') + ' · ' + fmt(s.rpi, 'Ω'); } },
        { id: 'rin', label: 'Resistencia de entrada (teórica)', fn: (T) => { const s = ss(T), by = T.net.part('CE').p.c > 1e-6; return fmt(par(s.rb, by ? s.rpi : s.rpi + (s.bf + 1) * s.RE), 'Ω'); } },
        { id: 'vo', label: 'Salida (pico a pico)', fn: (T) => { const o = T.stat('salida'); return o ? fmt(o.pp, 'V') : '—'; } }
      ]
    });
    T.setBode(10, 1e7);
  });

  /* 18.2 Colector común (seguidor de emisor) */
  EM.defineSim('c18-cc', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 1.15, edit: 'values', panels: ['scope', 'bode'], tdiv: 5e-4, autoBode: false,
      hint: 'La salida se toma del emisor. En el panel «Bode» elija «Impedancia vista en el nodo» con la salida «out» para medir la resistencia de salida.',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: CX.amp({ mode: 'cc', amp: 0.5, rl: 1000 }),
      controls: [
        { type: 'slider', id: 'a', label: 'Amplitud de la señal de entrada', min: 0.05, max: 2, value: 0.5, unit: 'V', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('FG1', 'amp', v) },
        { type: 'slider', id: 'rl', label: 'Resistor de carga R_L', min: 50, max: 100000, value: 1000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('RL', 'r', v) },
        { type: 'slider', id: 'rs', label: 'Resistencia interna de la fuente R_s', min: 50, max: 20000, value: 50, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('FG1', 'rs', v) }
      ],
      outs: [
        { id: 'av', label: 'Ganancia medida V_sal / V_ent', hl: true, fn: (T) => { const g = gainMeas(T); return isNaN(g) ? '—' : EM.fix(g, 3); } },
        { id: 'avt', label: 'Ganancia teórica (β+1)R\'/(r_π+(β+1)R\')', fn: (T) => { const s = ss(T), R = par(s.RE, s.RL), rinb = s.rpi + (s.bf + 1) * R, rin = par(s.rb, rinb); return EM.fix((s.bf + 1) * R / rinb * rin / (rin + s.rs), 3); } },
        { id: 'rin', label: 'Resistencia de entrada (teórica)', fn: (T) => { const s = ss(T); return fmt(par(s.rb, s.rpi + (s.bf + 1) * par(s.RE, s.RL)), 'Ω'); } },
        { id: 'rout', label: 'Resistencia de salida (teórica, sin R_L)', hl: true, fn: (T) => { const s = ss(T), rsp = par(s.rs, s.rb); return fmt(par(s.RE, (s.rpi + rsp) / (s.bf + 1)), 'Ω'); } },
        { id: 'ic', label: 'Corriente de reposo I_C', fn: (T) => fmt(icDC(T), 'A') }
      ]
    });
    T.setBode(10, 1e7);
  });

  /* 18.3 Ancho de banda y efecto Miller */
  EM.defineSim('c18-bw', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 1.15, edit: 'values', panels: ['bode'], autoBode: true, net: { par: true },
      hint: 'Mismo amplificador con las capacitancias parásitas del transistor activadas (C_be y C_bc). Cambie la resistencia de la fuente y observe cómo se mueve la frecuencia de corte superior.',
      spec: CX.amp({ mode: 'ce', amp: 0.005 }),
      controls: [
        { type: 'slider', id: 'rs', label: 'Resistencia interna de la fuente R_s', min: 50, max: 100000, value: 50, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('FG1', 'rs', v) },
        { type: 'slider', id: 'rc', label: 'Resistor de colector R_C', min: 470, max: 3900, value: 3300, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('RC', 'r', v) },
        { type: 'select', id: 'q', label: 'Transistor', options: [['2N3904', '2N3904 (C_bc = 3.5 pF)'], ['BC547', 'BC547 (C_bc = 4.5 pF)'], ['2N2222', '2N2222A']], value: '2N3904', apply: (T, v) => T.set('Q1', 'model', v) }
      ],
      outs: [
        { id: 'am', label: 'Ganancia en banda (V/V)', fn: (T) => { const s = ss(T), RCL = par(s.RC, s.RL), rin = par(s.rb, s.rpi); return EM.fix(s.gm * RCL * rin / (rin + s.rs), 1); } },
        { id: 'cm', label: 'Capacitancia de entrada de Miller', hl: true, fn: (T) => { const s = ss(T), m = MOD.BJT[T.net.part('Q1').p.model], RCL = par(s.RC, s.RL); return fmt(m.cbe + m.cbc * (1 + s.gm * RCL), 'F'); } },
        { id: 'fh', label: 'f_H teórica ≈ 1/(2π R_eq C_in)', hl: true, fn: (T) => { const s = ss(T), m = MOD.BJT[T.net.part('Q1').p.model], RCL = par(s.RC, s.RL); const cin = m.cbe + m.cbc * (1 + s.gm * RCL), req = par(par(s.rs, s.rb), s.rpi); return fmt(1 / (2 * Math.PI * req * cin), 'Hz'); } },
        { id: 'gbw', label: 'Producto ganancia × ancho de banda', fn: (T) => { const s = ss(T), m = MOD.BJT[T.net.part('Q1').p.model], RCL = par(s.RC, s.RL); const cin = m.cbe + m.cbc * (1 + s.gm * RCL), rin = par(s.rb, s.rpi), req = par(par(s.rs, s.rb), s.rpi); const a = s.gm * RCL * rin / (rin + s.rs), fh = 1 / (2 * Math.PI * req * cin); return fmt(a * fh, 'Hz'); } }
      ]
    });
    T.setBode(100, 1e9);
  });

  /* 18.4 Distorsión */
  EM.defineSim('c18-dist', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 1.15, edit: 'values', panels: ['scope'], tdiv: 5e-4,
      hint: 'Aumente la amplitud de la señal y compare con y sin C_E. El modo «Espectro» del osciloscopio muestra los armónicos que aparecen.',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida', at: 'out', color: '#4ae3ff' }],
      spec: CX.amp({ mode: 'ce', amp: 0.01 }),
      controls: [
        { type: 'seg', id: 'ce', label: 'Realimentación de emisor', options: [['con', 'Con C_E (sin realim.)'], ['sin', 'Sin C_E (con R_E)']], value: 'con', apply: (T, v) => T.set('CE', 'c', v === 'con' ? 100e-6 : 1e-15) },
        { type: 'slider', id: 'a', label: 'Amplitud de la señal de entrada', min: 0.002, max: 0.5, value: 0.01, unit: 'V', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('FG1', 'amp', v) }
      ],
      outs: [
        { id: 'av', label: 'Ganancia medida', hl: true, fn: (T) => { const g = gainMeas(T); return isNaN(g) ? '—' : EM.fix(g, 1); } },
        { id: 'vo', label: 'Salida pico a pico', fn: (T) => { const o = T.stat('salida'); return o ? fmt(o.pp, 'V') : '—'; } },
        { id: 'asym', label: 'Asimetría (máx / mín respecto a la media)', fn: (T) => { const o = T.stat('salida'); if (!o || o.pp < 1e-4) return '—'; return EM.fix((o.mx - o.mean) / Math.max(1e-9, o.mean - o.mn), 2); } },
        { id: 'thd', label: 'Distorsión armónica total (THD, armónicos 2 a 9)', hl: true, fn: (T) => { const d = thdOut(T); return isNaN(d) ? '—' : EM.fix(d * 100, 2) + ' %'; } }
      ]
    });
  });

  /* 18.5 Par diferencial */
  const diffSpec = (o) => ({
    parts: [['VP', 'VDC', 28, 6, 0, { v: o.v }], ['VN', 'VDC', 28, 18, 0, { v: o.v }], ['Q1', 'NPN', 8, 12, 0, { model: '2N3904' }], ['Q2', 'NPN', 20, 12, 0, { model: '2N3904' }],
      ['RC1', 'R', 10, 6, 1, { r: o.rc, watt: 1 }], ['RC2', 'R', 22, 6, 1, { r: o.rc, watt: 1 }], ['RT', 'R', 14, 18, 1, { r: o.rt, watt: 1 }],
      ['FG1', 'FG', -4, 14, 0, { wave: 'sin', amp: o.amp, f: 1000, rs: 50 }], ['RB1', 'R', 3, 12, 0, { r: 100 }], ['RB2', 'R', 15, 12, 0, { r: 100 }],
      ['N1', 'LBL', 8, 9, 2, { name: 'o1' }], ['N2', 'LBL', 24, 9, 0, { name: 'o2' }], ['Ni', 'LBL', 0, 10, 0, { name: 'in' }]],
    wires: [[[10, 4], [28, 4]], [[28, 8], [28, 12]], [[28, 16], [28, 12]], [[28, 12], [30, 12]], ['gndat', 30, 12],
      [[28, 20], [28, 24], [14, 24]], ['RT.1', [14, 24]], ['RC1.1', 'Q1.C'], ['RC2.1', 'Q2.C'], [[10, 9], [8, 9]], [[22, 9], [24, 9]],
      ['Q1.E', [10, 16], 'RT.0'], ['Q2.E', [22, 16], [14, 16]], ['RB1.1', 'Q1.B'], ['RB2.1', 'Q2.B'],
      o.cm ? ['RB2.0', [13, 2], [0, 2], [0, 10]] : ['RB2.0', [13, 13]], o.cm ? [[13, 2], [13, 2]] : ['gndat', 13, 13],
      ['FG1.OUT', [-1, 12], 'RB1.0'], [[0, 12], [0, 10]], ['FG1.GND', [-1, 16]], ['gndat', -1, 16]]
  });
  EM.defineSim('c18-diff', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 1.15, edit: 'values', panels: ['scope'], tdiv: 5e-4,
      hint: 'Dos transistores con emisores unidos a una resistencia de cola. La señal entra por Q₁ (Q₂ a tierra) y la salida diferencial es V(o1) − V(o2).',
      probes: [{ label: 'entrada', at: 'in', color: '#ffd84a' }, { label: 'salida 1', at: 'o1', color: '#4ae3ff' }, { label: 'salida 2', at: 'o2', color: '#ff8f5a' }, { label: 'diferencial', at: 'o1', ref: 'o2', color: '#9fd9a4' }],
      spec: diffSpec({ v: 6, rc: 4700, rt: 4700, amp: 0.02 }),
      controls: [
        { type: 'seg', id: 'm', label: 'Entrada', options: [['dif', 'Diferencial (Q₂ a tierra)'], ['com', 'Modo común (ambas bases)']], value: 'dif', init: false, apply: (T, v) => { T.loadSpec(diffSpec({ v: 6, rc: 4700, rt: 4700, amp: 0.02, cm: v === 'com' })); T.set('RT', 'r', T.sim.p.rt); T.set('FG1', 'amp', T.sim.p.a); } },
        { type: 'slider', id: 'rt', label: 'Resistor de cola R_T', min: 470, max: 100000, value: 4700, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('RT', 'r', v) },
        { type: 'slider', id: 'a', label: 'Amplitud de la señal', min: 0.001, max: 0.2, value: 0.02, unit: 'V', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('FG1', 'amp', v) }
      ],
      outs: [
        { id: 'ic', label: 'Corriente de reposo de cada transistor', fn: (T) => fmt(icDC(T), 'A') },
        { id: 'ad', label: 'Ganancia diferencial medida', hl: true, fn: (T) => { const o = T.stat('diferencial'), i = T.stat('entrada'); return o && i && i.pp > 1e-5 ? EM.fix(o.pp / i.pp, 1) : '—'; } },
        { id: 'a1', label: 'Ganancia a una sola salida V(o1)/V(in)', fn: (T) => { const o = T.stat('salida 1'), i = T.stat('entrada'); return o && i && i.pp > 1e-5 ? EM.fix(o.pp / i.pp, 2) : '—'; } },
        { id: 'acm', label: 'Teórica en modo común R_C/(2R_T)', fn: (T) => EM.fix(T.net.part('RC1').p.r / (2 * T.net.part('RT').p.r), 2) },
        { id: 'adt', label: 'Teórica diferencial g_m·R_C', fn: (T) => { const ic = Math.max(icDC(T), 1e-9); return EM.fix(ic / VT * T.net.part('RC1').p.r, 1); } }
      ]
    });
  });
})();
