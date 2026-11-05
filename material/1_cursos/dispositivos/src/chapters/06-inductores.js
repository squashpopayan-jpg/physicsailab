/* Capítulo 6 — Inductores y bobinas */
(function () {
  'use strict';
  const EM = window.EM, S = EM.spice, MOD = S.MOD, CX = EM.cx, M = EM.M;
  const fmt = (v, u, d = 3) => EM.si(v, u, d);
  const TAU = 2 * Math.PI, MU0 = 4e-7 * Math.PI;
  const pickTdiv = (t) => EM.Panels.TDIVS.reduce((b, x) => (Math.abs(Math.log(x / t)) < Math.abs(Math.log(b / t)) ? x : b), 1e-3);

  /* 6.1 Solenoide */
  EM.defineSim('c6-solenoide', function (sim) {
    const cv = sim.canvas({ aspect: 2.1, label: 'Solenoide con núcleo' });
    sim.group('Bobina');
    sim.slider('n', { label: 'Número de vueltas N', min: 10, max: 1000, value: 100, step: 10, unit: '' });
    sim.slider('l', { label: 'Longitud', min: 1, max: 20, step: 0.5, value: 5, unit: 'cm' });
    sim.slider('d', { label: 'Diámetro', min: 2, max: 50, step: 1, value: 10, unit: 'mm' });
    sim.select('mu', { label: 'Núcleo', options: [[1, 'Aire (μr = 1)'], [100, 'Polvo de hierro (μr = 100)'], [1000, 'Ferrita (μr = 1000)'], [5000, 'Ferrita de alta μ (μr = 5000)']], value: 1 });
    sim.out('l', 'Inductancia L', { hl: true }); sim.out('b', 'Inducción por amperio'); sim.out('i', 'Corriente de saturación (B = 0.4 T)'); sim.out('w', 'Energía a 100 mA');
    sim.onDraw(() => {
      const c = cv.ctx, w = cv.w, h = cv.h, p = sim.p, mu = +p.mu;
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      const A = Math.PI * Math.pow(p.d * 1e-3 / 2, 2), l = p.l * 1e-2, L = MU0 * mu * p.n * p.n * A / l;
      const B1 = MU0 * mu * p.n / l, Isat = 0.4 / B1;
      /* dibujo */
      const cl = Math.min(w * 0.62, 100 + p.l * 22), ch = Math.min(h * 0.46, 40 + p.d * 2.2), cx = w / 2, cy = h / 2;
      if (mu > 1) { const g = c.createLinearGradient(0, cy - ch / 2, 0, cy + ch / 2); g.addColorStop(0, '#9ba6b4'); g.addColorStop(1, '#6d7886'); c.fillStyle = g; c.fillRect(cx - cl / 2 - 24, cy - ch * 0.32, cl + 48, ch * 0.64); }
      const turns = Math.min(40, Math.max(6, Math.round(p.n / 10)));
      c.lineWidth = 3;
      for (let k = 0; k < turns; k++) { const x = cx - cl / 2 + (k + 0.5) / turns * cl; c.strokeStyle = '#b87333'; c.beginPath(); c.ellipse(x, cy, 6 + ch * 0.05, ch / 2, 0, 0, TAU); c.stroke(); }
      /* líneas de campo (esquemáticas) */
      c.strokeStyle = EM.alpha('--bfield', 0.7); c.lineWidth = 1.5;
      for (let k = 1; k <= 3; k++) { const r = ch / 2 + 22 * k; c.beginPath(); c.moveTo(cx + cl / 2 + 20, cy); c.bezierCurveTo(cx + cl / 2 + 20 + r * 1.2, cy - r * 1.3, cx - cl / 2 - 20 - r * 1.2, cy - r * 1.3, cx - cl / 2 - 20, cy); c.stroke(); c.beginPath(); c.moveTo(cx + cl / 2 + 20, cy); c.bezierCurveTo(cx + cl / 2 + 20 + r * 1.2, cy + r * 1.3, cx - cl / 2 - 20 - r * 1.2, cy + r * 1.3, cx - cl / 2 - 20, cy); c.stroke(); }
      sim.set('l', fmt(L, 'H')); sim.set('b', fmt(B1, 'T')); sim.set('i', fmt(Isat, 'A')); sim.set('w', fmt(0.5 * L * 0.01, 'J'));
    });
  });

  /* 6.2 Respuesta RL */
  EM.defineSim('c6-rl', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.1, edit: 'values', panels: ['scope'], startZero: true, tdiv: 1e-3,
      probes: [{ label: 'generador', at: 'in', color: '#ffd84a' }, { label: 'corriente (R)', at: 'mid', color: '#4ae3ff' }],
      spec: CX.ladder({ src: { id: 'FG1', t: 'FG', p: { wave: 'square', amp: 2.5, off: 2.5, f: 100 } }, items: [{ id: 'L1', t: 'L', p: { l: 0.1, kind: 'air', imax: 5 }, mode: 'series' }, { id: 'R1', t: 'R', p: { r: 50, watt: 5 }, mode: 'shunt', tap: 'mid' }], extra: { parts: [['Nin', 'LBL', 4, 4, 0, { name: 'in' }]], wires: [[[4, 6], [4, 4]]] } }),
      controls: [
        { type: 'slider', id: 'l', label: 'Inductancia L', min: 1e-3, max: 1, value: 0.1, unit: 'H', log: true, fmt: (v) => EM.si(v, '', 3), apply: (T, v) => { T.set('L1', 'l', v); T.autoRL && T.autoRL(); } },
        { type: 'slider', id: 'r', label: 'Resistencia R', min: 10, max: 1000, value: 50, unit: 'Ω', log: true, fmt: (v) => EM.fix(v, 0), apply: (T, v) => { T.set('R1', 'r', v); T.autoRL && T.autoRL(); } }
      ],
      outs: [
        { id: 'tau', label: 'τ = L / R_total', hl: true, fn: (T) => fmt(T.net.part('L1').p.l / T.rtot(), 's') },
        { id: 'if', label: 'Corriente final V/R_total (5 V)', fn: (T) => fmt(5 / T.rtot(), 'A') },
        { id: 'w', label: 'Energía final ½Li²', fn: (T) => fmt(0.5 * T.net.part('L1').p.l * Math.pow(5 / T.rtot(), 2), 'J') }
      ]
    });
    T.rtot = () => T.net.part('R1').p.r + T.net.part('FG1').p.rs + S.MOD.IND.air.rdc(T.net.part('L1').p.l);
    T.autoRL = () => { const tau = T.net.part('L1').p.l / T.rtot(); T.set('FG1', 'f', 1 / (10 * tau)); T.setTdiv(pickTdiv(tau)); };
    T.autoRL();
  });

  /* 6.3 Bobina conmutada con MOSFET, con y sin diodo de rueda libre */
  EM.defineSim('c6-flyback', function (sim) {
    EM.Taller.mount(sim, {
      aspect: 1.35, edit: 'values', panels: ['scope'], tdiv: 2e-3, hint: 'La bobina de 100 mH (100 Ω de resistencia total) la conmuta un MOSFET que excita el generador.',
      probes: [{ label: 'gate', at: 'FG1.0', color: '#ffd84a' }, { label: 'drenador', at: 'dren', color: '#4ae3ff' }],
      spec: {
        parts: [['V1', 'VDC', 4, 8, 0, { v: 12 }], ['R1', 'R', 12, 8, 1, { r: 96, watt: 5 }], ['L1', 'L', 12, 12, 1, { l: 0.1, kind: 'ferrite', imax: 5 }], ['D1', 'D', 18, 10, 3, { model: '1N4007' }],
          ['M1', 'NMOS', 16, 18, 0, { model: 'IRLZ44N' }], ['FG1', 'FG', 4, 17, 0, { wave: 'square', amp: 2.5, off: 2.5, f: 50 }], ['Nd', 'LBL', 15, 14, 0, { name: 'dren' }]],
        wires: [['V1.0', [4, 6], [18, 6]], ['R1.0', [12, 6]], [[18, 8], [18, 6]], ['R1.1', 'L1.0'], ['L1.1', [12, 14], [18, 14]], [[18, 12], [18, 14]], [[18, 14], [18, 16]],
          [[4, 10], [-1, 10], [-1, 22], [18, 22], [18, 20]], [[-1, 22], [-1, 23]], ['gndat', -1, 23], ['FG1.0', [14, 16], [14, 18]], [[7, 18], [7, 22]], ['FG1.1', [7, 22]]]
      },
      controls: [{ type: 'seg', id: 'dio', label: 'Diodo de rueda libre', options: [['con', 'Con diodo'], ['sin', 'Sin diodo']], value: 'con', apply: (T, v) => { const D = T.net.part('D1'); D.fault = v === 'sin' ? { kind: 'open' } : null; T.net.invalidate(); } }],
      outs: [
        { id: 'vm', label: 'Tensión máxima en el drenador', hl: true, fn: (T) => { const s = T.stat('drenador'); return s ? fmt(s.mx, 'V') : '—'; } },
        { id: 'en', label: 'Energía de la bobina ½LI² (120 mA)', fn: () => fmt(0.5 * 0.1 * 0.12 * 0.12, 'J') }
      ]
    });
  });

  /* 6.4 Saturación */
  EM.defineSim('c6-saturacion', function (sim) {
    const T = EM.Taller.mount(sim, {
      aspect: 2.1, edit: 'values', panels: ['scope'], startZero: true, tdiv: 1e-4,
      probes: [{ label: 'corriente (×10 Ω)', at: 'mid', color: '#4ae3ff' }],
      spec: CX.ladder({ src: { id: 'FG1', t: 'FG', p: { wave: 'square', amp: 5, off: 5, f: 500, rs: 0.1 } }, items: [{ id: 'L1', t: 'L', p: { l: 1e-3, kind: 'ferrite', imax: 0.3 }, mode: 'series' }, { id: 'R1', t: 'R', p: { r: 10, watt: 25 }, mode: 'shunt', tap: 'mid' }] }),
      controls: [{ type: 'slider', id: 'is', label: 'Corriente de saturación I_sat', min: 0.1, max: 2, step: 0.05, value: 0.3, unit: 'A', apply: (T, v) => T.set('L1', 'imax', v) }],
      outs: [
        { id: 'ifin', label: 'Corriente final V/R', fn: (T) => fmt(10 / (T.net.part('R1').p.r + 0.1 + S.MOD.IND.ferrite.rdc(T.net.part('L1').p.l)), 'A') },
        { id: 'le', label: 'Inductancia efectiva ahora', hl: true, fn: (T) => { const m = T.m('L1'); return m && m.lh ? fmt(m.lh, 'H') : '—'; } }
      ]
    });
  });
})();
