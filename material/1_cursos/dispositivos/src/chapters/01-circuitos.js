/* Capítulo 1 — Circuitos, leyes y modelos */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD, CX = EM.cx;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);

  /* 1.1 Fuente real con carga */
  EM.defineSim('c1-bateria', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.1, edit: 'values', panels: ['table'], hint: 'La batería de 9 V tiene resistencia interna: la tensión en terminales baja al cargar.',
      spec: CX.ladder({
        src: { id: 'B1', t: 'BAT', p: { kind: 'alk9' } },
        items: [{ id: 'A1', t: 'AMM', mode: 'series' }, { id: 'RL', t: 'R', p: { r: 10, watt: 100 }, mode: 'shunt', tap: 'out' }, { id: 'VM1', t: 'VM', mode: 'shunt' }]
      }),
      controls: [
        { type: 'slider', id: 'rs', label: 'Resistencia interna R_S', min: 0.05, max: 10, value: 1.7, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, v < 1 ? 2 : 1), apply: (T, v) => T.set('B1', 'rs', v) },
        { type: 'slider', id: 'rl', label: 'Resistencia de carga R_L', min: 0.1, max: 1000, value: 10, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, v < 10 ? 2 : 1), apply: (T, v) => T.set('RL', 'r', v) }
      ],
      outs: [
        { id: 'vt', label: 'Tensión en terminales', hl: true, fn: (T) => fmt(T.v('out'), 'V') },
        { id: 'i', label: 'Corriente', fn: (T) => fmt(T.i('RL'), 'A') },
        { id: 'pl', label: 'Potencia en la carga', fn: (T) => fmt(T.v('out') * T.i('RL'), 'W') },
        { id: 'pi', label: 'Potencia perdida en R_S', fn: (T) => fmt(Math.pow(T.i('RL'), 2) * T.net.part('B1').p.rs, 'W') },
        { id: 'eta', label: 'Rendimiento', fn: (T) => { const rs = T.net.part('B1').p.rs, rl = T.net.part('RL').p.r; return EM.fix(100 * rl / (rs + rl), 1) + ' %'; } }
      ]
    });
  });

  /* 1.2 Divisor con instrumento de resistencia finita */
  EM.defineSim('c1-divisor', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.1, edit: 'values', panels: ['table'],
      spec: CX.ladder({
        src: { id: 'V1', t: 'VDC', p: { v: 10 } },
        items: [{ id: 'R1', t: 'R', p: { r: 4700 }, mode: 'series' }, { id: 'R2', t: 'R', p: { r: 10000 }, mode: 'shunt', tap: 'out' }, { id: 'VM1', t: 'VM', p: { rin: 10e6 }, mode: 'shunt' }]
      }),
      controls: [
        { type: 'slider', id: 'r2', label: 'Resistencia R₂', min: 1000, max: 100000, value: 10000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('R2', 'r', v) },
        { type: 'slider', id: 'rin', label: 'Resistencia de entrada del voltímetro', min: 1e4, max: 1e9, value: 10e6, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('VM1', 'rin', v) }
      ],
      outs: [
        { id: 'lec', label: 'Lectura del voltímetro', hl: true, fn: (T) => fmt(T.v('out'), 'V', 4) },
        { id: 'teo', label: 'Fórmula sin carga', fn: (T) => { const r1 = T.net.part('R1').p.r, r2 = T.net.part('R2').p.r; return fmt(10 * r2 / (r1 + r2), 'V', 4); } },
        { id: 'err', label: 'Error por carga del instrumento', fn: (T) => { const r1 = T.net.part('R1').p.r, r2 = T.net.part('R2').p.r, t = 10 * r2 / (r1 + r2); return EM.fix(100 * (T.v('out') - t) / t, 2) + ' %'; } },
        { id: 'i', label: 'Corriente de la fuente', fn: (T) => fmt(T.i('R1'), 'A') }
      ]
    });
  });

  /* 1.3 Análisis nodal */
  EM.defineSim('c1-nodal', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 2.6, edit: 'values', panels: ['table'], hint: 'Fuente de 10 V, R₁ a R₄ y una fuente de corriente en el nodo B.',
      spec: CX.ladder({
        src: { id: 'V1', t: 'VDC', p: { v: 10 } },
        items: [{ id: 'R1', t: 'R', p: { r: 1000 }, mode: 'series' }, { id: 'R2', t: 'R', p: { r: 2000 }, mode: 'shunt', tap: 'A' }, { id: 'R3', t: 'R', p: { r: 3000 }, mode: 'series', tap: 'B' }, { id: 'R4', t: 'R', p: { r: 4000 }, mode: 'shunt' }, { id: 'I1', t: 'IDC', p: { i: 0.002 }, mode: 'shunt', rot: 0 }]
      }),
      controls: [
        { type: 'slider', id: 'r3', label: 'Resistencia R₃', min: 100, max: 100000, value: 3000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => T.set('R3', 'r', v) },
        { type: 'slider', id: 'is', label: 'Fuente de corriente', min: -4, max: 4, step: 0.1, value: 2, unit: 'mA', apply: (T, v) => T.set('I1', 'i', v * 1e-3) }
      ],
      outs: [
        { id: 'va', label: 'V_A medido', hl: true, fn: (T) => fmt(T.v('A'), 'V', 4) },
        { id: 'vb', label: 'V_B medido', hl: true, fn: (T) => fmt(T.v('B'), 'V', 4) },
        { id: 'sol', label: 'Solución de G·v = i', fn: (T) => {
          const r = ['R1', 'R2', 'R3', 'R4'].map((k) => T.net.part(k).p.r), I = T.net.part('I1').p.i;
          const g = r.map((x) => 1 / x);
          const sol = S.solveLinear([[g[0] + g[1] + g[2], -g[2]], [-g[2], g[2] + g[3]]], [10 * g[0], I]);
          return sol ? `V_A = ${EM.fix(sol[0], 4)} V<br>V_B = ${EM.fix(sol[1], 4)} V` : '—';
        } },
        { id: 'kcl', label: 'KCL en A: I₁ − I₂ − I₃', fn: (T) => fmt(T.i('R1') - T.i('R2') - T.i('R3'), 'A', 2) }
      ]
    });
  });

  /* 1.4 Máxima transferencia de potencia */
  EM.defineSim('c1-maxpot', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Potencia y rendimiento frente a R_L' });
    sim.group('Fuente de Thévenin');
    sim.slider('v', { label: 'Tensión V_th', min: 1, max: 20, step: 0.5, value: 4, unit: 'V' });
    sim.slider('r', { label: 'Resistencia R_th', min: 100, max: 10000, step: 100, value: 2000, unit: 'Ω' });
    sim.group('Carga');
    sim.slider('rl', { label: 'Resistencia de carga R_L', min: 50, max: 100000, value: 2000, unit: 'Ω', log: true, fmt: (v) => EM.si(v, '', 3) });
    sim.out('p', 'Potencia en la carga', { hl: true }); sim.out('pm', 'Potencia máxima V²/4R_th'); sim.out('eta', 'Rendimiento'); sim.out('rel', 'R_L / R_th');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 0.01, xmax: 100, xlog: true, ymin: 0, ymax: 1.05, ml: 54, mr: 14, mt: 14, mb: 40, xlabel: 'R_L / R_th', ylabel: 'P / P_máx   ·   η' });
      pl.frame();
      pl.xy(EM.M.linspace(-2, 2, 241).map((e) => Math.pow(10, e)), EM.M.linspace(-2, 2, 241).map((e) => { const x = Math.pow(10, e); return 4 * x / ((1 + x) * (1 + x)); }), { color: '--c1', width: 2.6 });
      pl.xy(EM.M.linspace(-2, 2, 241).map((e) => Math.pow(10, e)), EM.M.linspace(-2, 2, 241).map((e) => { const x = Math.pow(10, e); return x / (1 + x); }), { color: '--c3', width: 2.2, dash: [6, 4] });
      const x = p.rl / p.r, P = p.v * p.v * p.rl / Math.pow(p.r + p.rl, 2), Pm = p.v * p.v / (4 * p.r);
      pl.vline(x, { color: '--ink-3', dash: [3, 4] });
      pl.dot(x, P / Pm, { color: '--c2', r: 6 }); pl.dot(x, x / (1 + x), { color: '--c3', r: 5 });
      pl.legend([{ label: 'potencia en la carga (normalizada)', color: '--c1' }, { label: 'rendimiento', color: '--c3', kind: 'dash' }], 'tl');
      sim.set('p', fmt(P, 'W')); sim.set('pm', fmt(Pm, 'W')); sim.set('eta', EM.fix(100 * x / (1 + x), 1) + ' %'); sim.set('rel', EM.fix(x, 3));
    });
  });

  /* 1.5 Características i(v) y recta de carga */
  EM.defineSim('c1-iv', function (sim) {
    const cv = sim.canvas({ aspect: 1.9, label: 'Característica del dispositivo y recta de carga' });
    const D = MOD.D['1N4007'], L = MOD.LED.rojo, VT = S.VT;
    const vdiode = (I, m) => m.n * VT * Math.log(I / m.Is + 1) + I * m.rs;
    const idiode = (V, m) => { if (V <= 0) return 0; let lo = 0, hi = 3; for (let k = 0; k < 80; k++) { const mid = 0.5 * (lo + hi); if (vdiode(mid, m) < V) lo = mid; else hi = mid; } return 0.5 * (lo + hi); };
    const DEV = {
      r: { name: 'Resistor de 100 Ω', f: (V) => V / 100 },
      lamp: { name: 'Lámpara de 12 V · 5 W', f: (V) => { const a = Math.abs(V); if (a < 1e-9) return 0; const th = Math.pow(a / 12, 2 / 5.2), R = 28.8 * Math.pow(th, 1.2); return Math.sign(V) * a / R; } },
      diode: { name: 'Diodo 1N4007', f: (V) => idiode(V, D) },
      led: { name: 'LED rojo', f: (V) => idiode(V, L) }
    };
    sim.group('Dispositivo');
    sim.select('dev', { label: 'Dispositivo', options: Object.entries(DEV).map(([k, d]) => [k, d.name]), value: 'diode' });
    sim.group('Fuente y resistencia en serie');
    sim.slider('vs', { label: 'Tensión de la fuente V_S', min: 0.5, max: 12, step: 0.1, value: 5, unit: 'V' });
    sim.slider('rs', { label: 'Resistencia en serie R_S', min: 10, max: 1000, value: 330, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 0) });
    sim.out('v', 'Tensión en el dispositivo', { hl: true }); sim.out('i', 'Corriente', { hl: true }); sim.out('rd', 'Resistencia estática v/i'); sim.out('vr', 'Tensión en R_S');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p, dev = DEV[p.dev];
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const vs = p.vs, rs = p.rs;
      /* punto de operación: f(V) − (V_S − V)/R_S = 0 */
      let lo = 0, hi = vs;
      for (let k = 0; k < 80; k++) { const mid = 0.5 * (lo + hi); if (dev.f(mid) - (vs - mid) / rs < 0) lo = mid; else hi = mid; }
      const V = 0.5 * (lo + hi), I = dev.f(V);
      const xmax = Math.max(vs * 1.05, 1), ymax = Math.max(vs / rs * 1.15, 0.001);
      const pl = new EM.Plot(c, { x: 0, y: 0, w, h, xmin: 0, xmax, ymin: 0, ymax: ymax * 1000, ml: 54, mr: 14, mt: 14, mb: 40, xlabel: 'tensión en el dispositivo (V)', ylabel: 'corriente (mA)' });
      pl.frame();
      const xs = EM.M.linspace(0, xmax, 240);
      pl.xy(xs, xs.map((v) => Math.min(dev.f(v) * 1000, ymax * 1000 * 1.2)), { color: '--accent', width: 2.8 });
      pl.xy([0, vs], [vs / rs * 1000, 0], { color: '--c1', width: 2, dash: [6, 4] });
      pl.dot(V, I * 1000, { color: '--c2', r: 6.5 });
      pl.legend([{ label: dev.name, color: '--accent' }, { label: 'recta de carga (V_S − v)/R_S', color: '--c1', kind: 'dash' }], 'tr');
      sim.set('v', fmt(V, 'V')); sim.set('i', fmt(I, 'A')); sim.set('rd', I > 1e-9 ? fmt(V / I, 'Ω') : '∞'); sim.set('vr', fmt(vs - V, 'V'));
    });
  });
})();
