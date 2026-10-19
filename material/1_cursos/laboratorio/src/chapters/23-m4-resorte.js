/* Práctica M4 · Oscilador masa–resorte */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab, LG = MC.lego;
  const { B, P, TX, BOX } = LG;
  const G = MC.K.gPop;

  {
    const n = 28, col = [];
    for (let k = 0; k < n; k++) { const c = k % 2 ? '--lego-yellow' : '--lego-red'; col.push(B(6, 1, 1 + 3 * k, 4, 2, c), B(6, 13, 1 + 3 * k, 4, 2, c)); }
    const zt = 1 + 3 * n;
    const spring = [];
    const top = zt, bot = zt - 30, turns = 10;
    for (let i = 0; i < turns * 2; i++) {
      const z1 = top - ((bot - top) * -i) / (turns * 2), z2 = top - ((bot - top) * -(i + 1)) / (turns * 2);
      spring.push(MC.legoLine([7.5, 8 + (i % 2 ? 0.8 : -0.8), z1], [7.5, 8 + (i % 2 ? -0.8 : 0.8), z2], '--metal', { lw: 2.2 }));
    }
    spring[0].name = 'Resorte de tensión (10–40 N/m)';
    LG.def('resorte', {
      name: 'Resorte en la torre', rot: 0, aspect: 0.9,
      steps: [
        { note: 'La torre del péndulo, de 28 ladrillos, con su base de 16×16 y peso encima.', parts: [P(0, 0, 0, 16, 8, '--lego-dkgray'), P(0, 8, 0, 16, 8, '--lego-dkgray')].concat(col) },
        { note: 'Travesaño Technic 1×16; del agujero central cuelga un eje con un gancho.', parts: [TX(7, 0, zt, 1, 16, '--lego-gray', { name: 'Ladrillo Technic 1×16' })] },
        { note: 'El resorte cuelga del gancho. Su extremo inferior sostiene el soporte del celular, vertical.', parts: spring },
        { note: 'Celular vertical con su eje y hacia arriba. Un cojín debajo.', parts: [BOX(7, 3.3, bot - 48, 1.1, 9.4, 48, '--phone', { name: 'Celular en su soporte' }), BOX(4, 3, 1, 8, 10, 3, '--body-e', { name: 'Cojín' })] }
      ]
    });
  }

  MC.defineSim('m4-resorte', function (sim) {
    sim.cols2('0.75fr 1.4fr');
    const cs = sim.canvas({ aspect: 0.6, label: 'Resorte y celular' });
    const cg = sim.canvas({ aspect: 1.1, label: 'Acelerómetro y ajuste' });
    const tab = MC.results(sim, ['<i>m</i> (kg)', '<i>T</i> (s)', '<i>T</i>² (s²)'], { decimals: [4, 4, 5], title: 'Periodo contra masa colgada' });
    const hist = new MC.History(['f'], { minDt: 0, max: 20000 });
    let x = 0, v = 0, cross = [], last = 0, T = NaN, mean = G;
    sim.group('Resorte');
    sim.slider('k', { label: 'Constante <i>k</i> (desconocida en la práctica)', min: 8, max: 60, step: 0.5, value: 24, unit: 'N/m', fmt: (q) => MC.fix(q, 1), reset: true });
    sim.slider('ms', { label: 'Masa del resorte <i>m</i><sub>s</sub>', min: 0, max: 0.08, step: 0.002, value: 0.03, fmt: (q) => MC.fix(q * 1000, 0) + ' g', reset: true });
    sim.group('Masa colgada');
    sim.slider('m0', { label: 'Celular + soporte', min: 0.15, max: 0.3, step: 0.005, value: 0.24, fmt: (q) => MC.fix(q * 1000, 0) + ' g', reset: true });
    sim.slider('n', { label: 'Arandelas de 20 g', min: 0, max: 10, step: 1, value: 0, fmt: (q) => String(Math.round(q)), reset: true });
    sim.slider('A', { label: 'Amplitud inicial', min: 0.5, max: 5, step: 0.1, value: 2, unit: 'cm', fmt: (q) => MC.fix(q, 1), reset: true });
    sim.slider('gam', { label: 'Amortiguamiento γ', min: 0, max: 0.5, step: 0.005, value: 0.04, unit: '1/s', fmt: (q) => MC.fix(q, 3), reset: true });
    sim.button('Agregar a la tabla', () => { if (isFinite(T)) tab.add([mass(), T, T * T]); }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('ext', 'Alargamiento estático <i>mg</i>/<i>k</i>');
    sim.out('T', 'Periodo medido', { hl: true });
    sim.out('Q', 'Factor de calidad <i>Q</i>');
    sim.out('fit', 'Ajuste <i>T</i>² contra <i>m</i>');
    const mass = () => sim.p.m0 + 0.02 * Math.round(sim.p.n);
    sim.run({
      h: 1 / 1000,
      reset() { x = -sim.p.A / 100; v = 0; hist.clear(); cross = []; last = 0; T = NaN; },
      step(h) {
        const meff = mass() + sim.p.ms / 3, w2 = sim.p.k / meff;
        const a = -w2 * x - 2 * sim.p.gam * v;
        v += a * h; x += v * h;
        if (Math.round(sim.t * 1000) % 5 === 0) {
          hist.push(sim.t, { f: G + a + M.gauss(0, 0.012) }, true);
          const n = hist.n;
          if (n > 2) {
            const y1 = hist.d.f[n - 2] - G, y2 = hist.d.f[n - 1] - G;
            if (y1 < 0 && y2 >= 0) { const tc = hist.d.t[n - 2] + 0.005 * (-y1 / (y2 - y1)); if (tc - last > 0.15) { cross.push(tc); last = tc; } }
          }
          if (cross.length >= 2) T = (cross[cross.length - 1] - cross[0]) / (cross.length - 1);
        }
        if (sim.t > 60) sim.end();
      }
    });
    sim.onDraw(() => {
      const m = mass();
      sim.set('ext', MC.fix((m * G / sim.p.k) * 100, 2) + ' cm');
      sim.set('T', isFinite(T) ? MC.fix(T, 4) + ' s' : 'inicie la oscilación');
      const w0 = Math.sqrt(sim.p.k / (m + sim.p.ms / 3));
      sim.set('Q', sim.p.gam > 0 ? MC.fix(w0 / (2 * sim.p.gam), 0) : '∞');
      /* escena */
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      D.ceiling(ctx, W * 0.2, 16, W * 0.8);
      const L0 = H * 0.32, sc = H * 1.2;
      const yEnd = 16 + L0 + (m * G / sim.p.k) * sc * 0.6 + x * sc;
      D.spring(ctx, W / 2, 16, W / 2, yEnd, { n: 14, amp: 10, width: 2, color: '--metal' });
      D.phone(ctx, W / 2, yEnd + 0.155 * sc * 0.4, 0.075 * sc * 0.8, 0.155 * sc * 0.8, { axes: true });
      for (let i = 0; i < Math.round(sim.p.n); i++) D.circle(ctx, W / 2 - 18 + (i % 5) * 9, yEnd + 0.155 * sc * 0.8 + 6 + Math.floor(i / 5) * 8, 4, { fill: '--metal', color: '--ink-3' });
      /* gráficas */
      const c2 = cg.ctx;
      D.clear(cg);
      const h1 = cg.h * 0.45;
      const Tt = hist.d.t, tN = Tt.length ? Tt[Tt.length - 1] : 0;
      const amp = (sim.p.A / 100) * w0 * w0 * 1.2 + 0.2;
      const Pp = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: Math.max(0, tN - 6), xmax: Math.max(6, tN), ymin: G - amp, ymax: G + amp, xlabel: ['t', 's'], ylabel: ['f_y', 'm/s²'], mt: 22, title: 'Acelerómetro, eje y (vertical)' });
      Pp.frame();
      Pp.hline(G, { color: '--ink-3', label: 'g (reposo)' });
      Pp.xy(Tt, hist.d.f, { color: '--ay', width: 1.3 });
      const { f } = MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, tab.col(0), tab.col(2), { xlabel: ['m', 'kg'], ylabel: ['T²', 's²'], title: 'T² contra m', zeroX: true, zeroY: true });
      if (f && tab.rows.length >= 3) {
        const k = (4 * Math.PI * Math.PI) / f.m, uk = (k * f.sm) / f.m, ms = (3 * f.b) / f.m, ums = 3 * Math.hypot(f.sb / f.m, (f.b * f.sm) / (f.m * f.m));
        sim.set('fit', `k = ${L.pm(k, uk, 'N/m')}<br>m<sub>s</sub> = ${L.pm(ms * 1000, ums * 1000, 'g')}`);
      } else sim.set('fit', 'mida al menos 3 masas');
    });
  });
})();
