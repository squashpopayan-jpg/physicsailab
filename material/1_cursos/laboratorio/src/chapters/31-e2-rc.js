/* Práctica E2 · Carga y descarga de un condensador */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const yL = (i) => 0.05 + 0.9 * 0.15 + i * ((0.9 * 0.78) / 14);

  MC.wiring.def('rc', {
    nodes: { a: [0.55, 0.3], b: [0.82, 0.3], c: [0.82, 0.62], g: [0.82, 0.86] }, dots: ['b'],
    parts: [{ type: 'res', a: 'n:a', b: 'n:b', label: 'R' }, { type: 'cap', a: 'n:c', b: 'n:g', label: 'C' }, { type: 'line', a: 'n:b', b: 'n:c' }],
    wires: [
      { a: 'esp:D25', b: 'n:a', c: '--wire-o', note: 'GPIO 25: fuente cuadrada de 0 / 3.3 V', route: [[0.012, yL(7)], [0.012, 0.03], [0.55, 0.03]] },
      { a: 'n:b', b: 'esp:D34', c: '--wire-y', note: 'GPIO 34 mide el voltaje del condensador', route: [[0.7, 0.3], [0.7, 0.975], [0.022, 0.975], [0.022, yL(3)]] },
      { a: 'n:g', b: 'esp:GNDR', c: '--wire-k', note: 'pata negativa del condensador a tierra' }
    ],
    labels: [{ text: '+', fx: 0.85, fy: 0.68, size: 13 }]
  });

  MC.defineSim('e2-rc', function (sim) {
    const cv = sim.canvas({ aspect: 2.4, label: 'Voltaje del condensador' });
    const cl = sim.canvas({ aspect: 3.4, label: 'Linealización de la descarga' });
    const tab = MC.results(sim, ['<i>R</i> (kΩ)', '<i>C</i> nominal (µF)', 'τ (s)', '<i>u</i>(τ) (s)', '<i>C</i> = τ/<i>R</i> (µF)'], { decimals: [1, 0, 4, 4, 2], title: 'Constantes de tiempo medidas' });
    const Creal = {};
    for (const c of [10, 47, 100, 220]) Creal[c] = c * (1 + M.gauss(0, 0.09));
    let data = null, fitD = null;
    sim.group('Componentes');
    sim.select('R', { label: 'Resistencia', options: [[10, '10 kΩ'], [22, '22 kΩ'], [47, '47 kΩ'], [100, '100 kΩ']], value: 47, onInput: () => { data = null; } });
    sim.select('C', { label: 'Condensador (valor impreso)', options: [[10, '10 µF'], [47, '47 µF'], [100, '100 µF'], [220, '220 µF']], value: 100, onInput: () => { data = null; } });
    sim.slider('semi', { label: 'Semiperiodo de la fuente', min: 1, max: 60, step: 1, value: 25, unit: 's', fmt: (q) => String(Math.round(q)), onInput: () => { data = null; } });
    sim.button('Registrar de nuevo', () => { data = null; sim.redraw(); });
    sim.button('Agregar a la tabla', () => { if (fitD) tab.add([+sim.p.R, +sim.p.C, fitD.tau, fitD.utau, (fitD.tau / (+sim.p.R * 1000)) * 1e6]); }, { primary: true });
    sim.out('tn', 'τ nominal = RC');
    sim.out('t37', 'τ leído en 0.368 V₀');
    sim.out('tf', 'τ del ajuste de ln V', { hl: true });
    function gen() {
      const R = +sim.p.R * 1000 * (1 + M.gauss(0, 0.005)), C = Creal[+sim.p.C] * 1e-6, tau = R * C, semi = sim.p.semi, Voh = 3.27;
      const t = [], v = [], s = [];
      let V = 0;
      const dt = 0.005;
      for (let k = 0; k * dt < 2 * 2 * semi; k++) {
        const tt = k * dt, hi = Math.floor(tt / semi) % 2 === 1;
        V += ((hi ? Voh : 0) - V) * (1 - Math.exp(-dt / tau));
        const r = V < 0.12 ? 0.11 + Math.abs(M.gauss(0, 0.004)) : Math.min(3.12, V + M.gauss(0, 0.004));
        if (k % 2 === 0) { t.push(tt); v.push(r); s.push(hi ? 1 : 0); }
      }
      data = { t, v, s, tau };
      /* descarga: segundo flanco de bajada (t = 2·semi) */
      const t0 = 2 * semi;
      const idx = t.map((x, i) => i).filter((i) => t[i] >= t0 && t[i] < t0 + semi && v[i] > 0.15);
      const V0 = v[idx[0]];
      const xs = idx.map((i) => t[i] - t0), ys = idx.map((i) => Math.log(v[i]));
      const f = L.fitLine(xs, ys);
      let t37 = NaN;
      for (const i of idx) if (v[i] <= 0.368 * V0) { t37 = t[i] - t0; break; }
      fitD = f ? { tau: -1 / f.m, utau: f.sm / (f.m * f.m), xs, ys, f, t37, V0 } : null;
    }
    sim.onDraw(() => {
      if (!data) gen();
      sim.set('tn', MC.fix((+sim.p.R * +sim.p.C) / 1000, 3) + ' s');
      sim.set('t37', fitD && isFinite(fitD.t37) ? MC.fix(fitD.t37, 3) + ' s' : 'semiperiodo muy corto');
      sim.set('tf', fitD ? L.pm(fitD.tau, fitD.utau, 's') : '—');
      const ctx = cv.ctx;
      D.clear(cv);
      const T = data.t[data.t.length - 1];
      const P = new MC.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: T, ymin: 0, ymax: 3.5, xlabel: ['t', 's'], ylabel: ['V_C', 'V'], mt: 14 });
      P.frame();
      P.xy(data.t, data.s.map((q) => q * 3.27), { color: '--ink-3', width: 1, dash: [4, 3] });
      P.xy(data.t, data.v, { color: '--c1', width: 1.6 });
      if (fitD) { P.vline(2 * sim.p.semi + fitD.t37, { color: '--accent', label: 'τ' }); P.hline(0.368 * fitD.V0, { color: '--accent', label: '0.368 V₀', labelRight: true }); }
      P.legend([{ label: 'GPIO 25 (fuente)', color: '--ink-3', dash: [4, 3] }, { label: 'V_C medido', color: '--c1' }], 'tr');
      const c2 = cl.ctx;
      D.clear(cl);
      if (fitD) {
        const { P: Q } = MC.fitPlot(c2, { x: 0, y: 0, w: cl.w, h: cl.h }, fitD.xs.filter((_, i) => i % 6 === 0), fitD.ys.filter((_, i) => i % 6 === 0), { xlabel: ['t − t_0', 's'], ylabel: ['ln V_C', ''], title: `Descarga linealizada: pendiente −1/τ (sólo V_C > 0.15 V)` });
        void Q;
      }
    });
  });
})();
