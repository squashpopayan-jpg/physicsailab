/* Práctica E7 · Frenado magnético por corrientes de Foucault */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const G = MC.K.gPop, MU0 = 4e-7 * Math.PI;
  const TUBES = { cu: ['Cobre', 5.96e7, '--copper'], al: ['Aluminio', 3.5e7, '--metal'], lat: ['Latón', 1.5e7, '--lego-yellow'], pvc: ['PVC', 0, '--lego-white'] };
  MC.defineSim('e7-foucault', function (sim) {
    sim.cols2('0.5fr 1.5fr');
    const cs = sim.canvas({ aspect: 0.32, label: 'Tubo vertical' });
    const cg = sim.canvas({ aspect: 1.25, label: 'Sensores Hall' });
    const tab = MC.results(sim, ['Tubo', 'Imanes', 'Δ<i>t</i> (s)', '<i>v</i><sub>t</sub> (m/s)', '<i>K</i> (kg/s)'], { decimals: [0, 0, 3, 4, 3], title: 'Velocidad terminal' });
    const Ltube = 0.5, z1 = 0.1, z2 = 0.4;
    const hist = new MC.History(['s1', 's2'], { minDt: 0.001, max: 30000 });
    let z = 0, v = 0, pk = [NaN, NaN], pv = [0, 0], done = false;
    sim.group('Tubo');
    sim.select('tube', { options: Object.keys(TUBES).map((k) => [k, TUBES[k][0]]), value: 'cu', reset: true });
    sim.slider('w', { label: 'Espesor de la pared', min: 0.5, max: 3, step: 0.1, value: 1, unit: 'mm', fmt: (q) => MC.fix(q, 1), reset: true });
    sim.slider('a', { label: 'Radio medio del tubo', min: 7, max: 12, step: 0.5, value: 7.5, unit: 'mm', fmt: (q) => MC.fix(q, 1), reset: true });
    sim.group('Imán');
    sim.seg('n', { label: 'Imanes de 12 × 12 mm', options: [[1, 'Uno'], [2, 'Dos juntos']], value: 1, reset: true });
    sim.button('Agregar a la tabla', () => { if (done && isFinite(pk[0]) && isFinite(pk[1])) { const dt = pk[1] - pk[0]; tab.add([TUBES[sim.p.tube][0], +sim.p.n, dt, (z2 - z1) / dt, (mass() * G) / ((z2 - z1) / dt)]); } }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('K', '<i>K</i> teórico (pared delgada)');
    sim.out('vt', '<i>v</i><sub>t</sub> teórica');
    sim.out('meas', 'Medido: Δ<i>t</i> y <i>v</i>', { hl: true });
    const mass = () => 7500 * Math.PI * 0.006 * 0.006 * 0.012 * +sim.p.n;
    const mom = () => (1.25 / MU0) * Math.PI * 0.006 * 0.006 * 0.012 * +sim.p.n;
    const Kth = () => { const s = TUBES[sim.p.tube][1], w = sim.p.w / 1000, a = sim.p.a / 1000; return (45 / 1024) * (MU0 * MU0 * mom() * mom() * s * w) / Math.pow(a, 4); };
    sim.run({
      h: 1 / 4000, startLabel: 'Soltar',
      reset() { z = -0.01; v = 0; hist.clear(); pk = [NaN, NaN]; pv = [0, 0]; done = false; },
      step(h) {
        const K = z > 0 && z < Ltube ? Kth() : 0;
        v += (G - (K * v) / mass()) * h; z += v * h;
        const sig = (zs) => { const d = Math.hypot(z - zs, 0.012); return (2e-7 * mom() / (d * d * d)) * 1000 * 9.2 + M.gauss(0, 0.6); };
        const s1 = sig(z1), s2 = sig(z2);
        hist.push(sim.t, { s1, s2 });
        if (s1 > pv[0]) { pv[0] = s1; pk[0] = sim.t; }
        if (s2 > pv[1]) { pv[1] = s2; pk[1] = sim.t; }
        if (z > Ltube + 0.05) { done = true; sim.end(); }
        if (sim.t > 40) sim.end();
      },
      timeFmt: (t) => 't = ' + MC.fix(t, 2) + ' s'
    });
    sim.onDraw(() => {
      const K = Kth(), vt = K > 0 ? (mass() * G) / K : Infinity;
      sim.set('K', MC.fix(K, 3) + ' kg/s');
      sim.set('vt', isFinite(vt) ? MC.fix(vt * 100, 2) + ' cm/s' : 'caída libre');
      sim.set('meas', done ? `Δt = ${MC.fix(pk[1] - pk[0], 3)} s · v = ${MC.fix(((z2 - z1) / (pk[1] - pk[0])) * 100, 2)} cm/s` : 'suelte el imán');
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const top = 16, sc = (H - 40) / (Ltube + 0.05);
      const tc = TUBES[sim.p.tube][2];
      ctx.fillStyle = MC.alpha(tc, 0.45); ctx.fillRect(W / 2 - 16, top, 32, Ltube * sc);
      ctx.strokeStyle = MC.col(tc); ctx.lineWidth = 2; ctx.strokeRect(W / 2 - 16, top, 32, Ltube * sc);
      for (const [zs, lab] of [[z1, 'S1'], [z2, 'S2']]) { ctx.fillStyle = MC.col('--chip'); ctx.fillRect(W / 2 + 17, top + zs * sc - 5, 8, 10); MC.text(ctx, lab, W / 2 + 28, top + zs * sc + 4, { size: 11, color: '--ink-2', weight: 700 }); }
      if (z > -0.02 && z < Ltube + 0.04) D.magnet(ctx, W / 2, top + z * sc, 14, 12 * +sim.p.n, -Math.PI / 2, { labels: false });
      D.ground(ctx, 0, H - 6, W, { depth: 5 });
      const c2 = cg.ctx;
      D.clear(cg);
      const h1 = cg.h * 0.55;
      const T = hist.d.t, tN = T.length ? T[T.length - 1] : 1;
      const ymax = Math.max(50, ...hist.d.s1, ...hist.d.s2) * 1.1;
      const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: 0, xmax: Math.max(0.5, tN), ymin: -5, ymax, xlabel: ['t', 's'], ylabel: ['señal', 'mV'], mt: 22, title: 'Señales de los dos sensores Hall' });
      P.frame();
      P.xy(T, hist.d.s1, { color: '--c1', width: 1.4 });
      P.xy(T, hist.d.s2, { color: '--c4', width: 1.4 });
      if (done) { P.vline(pk[0], { color: '--c1', label: 'S1' }); P.vline(pk[1], { color: '--c4', label: 'S2' }); }
      const rows = tab.rows.filter((r) => r[0] !== 'PVC');
      const sig = rows.map((r) => TUBES[Object.keys(TUBES).find((k) => TUBES[k][0] === r[0])][1] / 1e7);
      MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, sig, rows.map((r) => r[4]), { xlabel: ['σ', '10⁷ S/m'], ylabel: ['K', 'kg/s'], title: 'K contra conductividad (mismo espesor e imán)', zeroX: true, zeroY: true, prop: true });
    });
  });
})();
