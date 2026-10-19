/* Práctica E6 · Inducción de Faraday */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const G = MC.K.gPop, MU0 = 4e-7 * Math.PI;
  const yL = (i) => 0.05 + 0.9 * 0.15 + i * ((0.9 * 0.78) / 14);

  MC.wiring.def('faraday', {
    nodes: { t: [0.62, 0.1], m: [0.62, 0.48], g: [0.62, 0.86], c1: [0.62, 0.48], c2: [0.86, 0.48], o: [0.86, 0.72] }, dots: ['m'],
    parts: [{ type: 'res', a: 'n:t', b: 'n:m', label: '10 kΩ' }, { type: 'res', a: 'n:m', b: 'n:g', label: '10 kΩ' }, { type: 'coil', a: 'n:c1', b: 'n:c2', label: 'bobina' }],
    wires: [
      { a: 'esp:3V3', b: 'n:t', c: '--wire-r', note: '3.3 V al divisor', route: [[0.44, 0.887], [0.44, 0.1]] },
      { a: 'n:g', b: 'esp:GNDR', c: '--wire-k', note: 'tierra del divisor' },
      { a: 'n:c2', b: 'n:o', c: '--wire-y', note: 'el otro extremo de la bobina…', sag: 0 },
      { a: 'n:o', b: 'esp:D34', c: '--wire-y', note: '…va al GPIO 34: V = 1.65 V + fem', route: [[0.86, 0.975], [0.012, 0.975], [0.012, yL(3)]] }
    ],
    labels: [{ text: '1.65 V', fx: 0.66, fy: 0.44, size: 11, mono: true, color: '--accent' }]
  });

  MC.defineSim('e6-faraday', function (sim) {
    sim.cols2('0.55fr 1.5fr');
    const cs = sim.canvas({ aspect: 0.42, label: 'Tubo, bobina e imán' });
    const cg = sim.canvas({ aspect: 1.15, label: 'Fem y análisis' });
    const tab = MC.results(sim, ['<i>h</i> (cm)', '√<i>h</i> (cm<sup>1/2</sup>)', 'ℰ₁ máx (mV)', 'ℰ₂ máx (mV)', 'Área 1 (mV·ms)', 'Área 2 (mV·ms)'], { decimals: [1, 3, 0, 0, 1, 1], title: 'Pulsos medidos' });
    const mom = 0.75, a = 0.011, ell = 0.01;
    let tr = null;
    sim.group('Caída');
    sim.slider('h', { label: 'Altura sobre la bobina', min: 1, max: 30, step: 0.5, value: 10, unit: 'cm', fmt: (q) => MC.fix(q, 1), onInput: () => { tr = null; } });
    sim.slider('N', { label: 'Vueltas de la bobina', min: 50, max: 500, step: 10, value: 150, fmt: (q) => String(Math.round(q)), onInput: () => { tr = null; } });
    sim.select('fs', { label: 'Frecuencia de muestreo', options: [[10000, '10 kHz'], [2000, '2 kHz'], [500, '500 Hz']], value: 10000, onInput: () => { tr = null; } });
    sim.button('Soltar de nuevo', () => { tr = null; sim.redraw(); });
    sim.button('Agregar a la tabla', () => { if (tr) tab.add([sim.p.h, Math.sqrt(sim.p.h), Math.abs(tr.p1), Math.abs(tr.p2), Math.abs(tr.A1), Math.abs(tr.A2)]); }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('v', 'Rapidez al llegar a la bobina');
    sim.out('pk', 'Picos ℰ₁ y ℰ₂', { hl: true });
    sim.out('ar', 'Áreas (∫ℰ dt)');
    const flux = (z) => { let s = 0; const n = 9; for (let k = 0; k < n; k++) { const zz = z + ((k + 0.5) / n - 0.5) * ell; s += (MU0 * mom * a * a) / (2 * Math.pow(a * a + zz * zz, 1.5)); } return s / n; };
    function gen() {
      const h = sim.p.h / 100, N = sim.p.N, fs = +sim.p.fs;
      const z0 = -h;
      const tc = Math.sqrt((2 * h) / G);
      const t = [], e = [];
      const t0 = tc - 0.03, t1 = tc + 0.06;
      const dt = 1 / fs;
      for (let tt = t0; tt < t1; tt += dt) {
        const z = z0 + 0.5 * G * tt * tt, v = G * tt;
        const dz = 1e-5;
        const dPhi = (flux(z + dz) - flux(z - dz)) / (2 * dz);
        let em = -N * dPhi * v * 1000;
        em = M.clamp(em + M.gauss(0, 1.2), -1600, 1600);
        em = Math.round(em / 0.8) * 0.8;
        t.push((tt - tc) * 1000); e.push(em);
      }
      let p1 = 0, p2 = 0, A1 = 0, A2 = 0;
      for (let i = 1; i < e.length; i++) { const da = 0.5 * (e[i] + e[i - 1]) * (t[i] - t[i - 1]); if (t[i] < 0) { A1 += da; if (Math.abs(e[i]) > Math.abs(p1)) p1 = e[i]; } else { A2 += da; if (Math.abs(e[i]) > Math.abs(p2)) p2 = e[i]; } }
      tr = { t, e, p1, p2, A1, A2, v: Math.sqrt(2 * G * h) };
    }
    sim.onDraw(() => {
      if (!tr) gen();
      sim.set('v', MC.fix(tr.v, 3) + ' m/s');
      sim.set('pk', `${MC.fix(tr.p1, 0)} mV y ${MC.fix(tr.p2, 0)} mV` + (Math.max(Math.abs(tr.p1), Math.abs(tr.p2)) >= 1599 ? ' (¡saturado!)' : ''));
      sim.set('ar', `${MC.fix(tr.A1, 1)} y ${MC.fix(tr.A2, 1)} mV·ms`);
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const tx = W / 2, top = 20, sc = (H - 50) / 0.4;
      ctx.fillStyle = MC.alpha('--metal', 0.35); ctx.fillRect(tx - 14, top, 28, 0.4 * sc);
      ctx.strokeStyle = MC.col('--ink-3'); ctx.strokeRect(tx - 14, top, 28, 0.4 * sc);
      const yc = top + 0.32 * sc;
      D.coilSide(ctx, tx, yc, 40, 0.01 * sc * 2, 8);
      const ym = yc - (sim.p.h / 100) * sc;
      D.magnet(ctx, tx, ym, 16, 16, -Math.PI / 2, { labels: false });
      D.dim(ctx, tx + 30, ym, tx + 30, yc, `h = ${MC.fix(sim.p.h, 1)} cm`, { labelOff: 30 });
      MC.text(ctx, 'N', tx, ym + 12, { size: 9, align: 'center', color: '#fff', weight: 700 });
      const c2 = cg.ctx;
      D.clear(cg);
      const h1 = cg.h * 0.55;
      const ym2 = Math.max(200, ...tr.e.map(Math.abs)) * 1.15;
      const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: -30, xmax: 60, ymin: -ym2, ymax: ym2, xlabel: ['t', 'ms'], ylabel: ['ℰ', 'mV'], mt: 22, title: `Fem registrada a ${sim.p.fs} Hz (t = 0 cuando el imán está en la bobina)` });
      P.frame();
      P.xy(tr.t, tr.e, { color: '--c1', width: 1.4, fill: '--c1', fillAlpha: 0.15, base: 0 });
      if (+sim.p.fs <= 2000) P.scatter(tr.t, tr.e, { color: '--c1', r: 2.5 });
      P.hline(1600, { color: '--warn-ink', label: 'límite del ADC', labelRight: true });
      P.hline(-1600, { color: '--warn-ink' });
      MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, tab.col(1), tab.col(3), { xlabel: ['√h', 'cm^{1/2}'], ylabel: ['ℰ_{2,max}', 'mV'], title: 'Pico de salida contra √h', zeroX: true, zeroY: true });
    });
  });
})();
