/* Práctica M3 · El celular como péndulo */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const G = MC.K.gPop;
  const K2 = (0.155 * 0.155 + 0.075 * 0.075) / 12;

  MC.defineSim('m3-pendulo', function (sim) {
    sim.cols2('0.9fr 1.3fr');
    const cs = sim.canvas({ aspect: 0.75, label: 'Péndulo' });
    const cg = sim.canvas({ aspect: 1.05, label: 'Giroscopio y ajuste' });
    const tab = MC.results(sim, ['<i>d</i> (m)', 'θ₀ (°)', '<i>T</i> (s)', '<i>T</i>²<i>d</i> (s²·m)', '<i>d</i>² (m²)'], { decimals: [3, 1, 4, 5, 5], title: 'Periodo contra distancia al eje' });
    const hist = new MC.History(['w'], { minDt: 0, max: 20000 });
    let th = 0, om = 0, cross = [], last = 0, T = NaN;
    sim.group('Montaje');
    sim.slider('d', { label: 'Distancia eje → centro de masa <i>d</i>', min: 0.04, max: 0.4, step: 0.008, value: 0.2, unit: 'm', fmt: (v) => MC.fix(v, 3), reset: true });
    sim.slider('A', { label: 'Amplitud inicial θ₀', min: 2, max: 70, step: 1, value: 10, unit: '°', fmt: (v) => String(Math.round(v)), reset: true });
    sim.slider('gam', { label: 'Amortiguamiento γ', min: 0, max: 0.3, step: 0.005, value: 0.02, unit: '1/s', fmt: (v) => MC.fix(v, 3), reset: true });
    sim.check('simple', { label: 'Comparar con péndulo simple (k = 0)', value: false, reset: true });
    sim.group('Análisis');
    sim.seg('graf', { label: 'Gráfica', options: [['T2d', 'T² contra d'], ['lin', 'T²d contra d²']], value: 'lin' });
    sim.button('Agregar a la tabla', () => { if (isFinite(T)) tab.add([sim.p.d, sim.p.A, T, T * T * sim.p.d, sim.p.d * sim.p.d]); }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('T', 'Periodo medido', { hl: true });
    sim.out('Tth', 'Periodo teórico (amplitud pequeña)');
    sim.out('n', 'Periodos contados');
    sim.out('fit', 'Ajuste');
    const k2 = () => (sim.p.simple ? 0 : K2);
    sim.run({
      h: 1 / 1000, speed: 1, timeScale: 1,
      reset() { th = M.rad(sim.p.A); om = 0; hist.clear(); cross = []; last = 0; T = NaN; },
      step(h) {
        const d = sim.p.d, w0 = Math.sqrt((G * d) / (d * d + k2()));
        const f = (t, y) => [y[1], -w0 * w0 * Math.sin(y[0]) - 2 * sim.p.gam * y[1]];
        const y = M.rk4(f, [th, om], sim.t, h);
        th = y[0]; om = y[1];
        const wr = om + M.gauss(0, 0.003);
        if (Math.round(sim.t * 1000) % 5 === 0 && hist.push(sim.t, { w: wr }, true)) {
          const n = hist.n;
          if (n > 1) {
            const w1 = hist.d.w[n - 2], w2 = hist.d.w[n - 1];
            if (w1 < 0 && w2 >= 0 && Math.abs(th) > M.rad(0.5)) { const tc = hist.d.t[n - 2] + (hist.d.t[n - 1] - hist.d.t[n - 2]) * (-w1 / (w2 - w1)); if (tc - last > 0.2) { cross.push(tc); last = tc; } }
          }
        }
        if (cross.length >= 2) T = (cross[cross.length - 1] - cross[0]) / (cross.length - 1);
        if (sim.t > 40) sim.end();
      }
    });
    sim.onDraw(() => {
      const d = sim.p.d;
      const Tth = 2 * Math.PI * Math.sqrt((d * d + k2()) / (G * d));
      sim.set('T', isFinite(T) ? MC.fix(T, 4) + ' s' : 'inicie la oscilación');
      sim.set('Tth', MC.fix(Tth, 4) + ' s');
      sim.set('n', String(Math.max(0, cross.length - 1)));
      /* escena */
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const sc = Math.min((H * 0.8) / (d + 0.1), (W * 0.42) / Math.max(0.08, (d + 0.08) * Math.sin(Math.max(M.rad(sim.p.A), 0.3))));
      const pv = [W / 2, H * 0.08];
      const u = 0.008 * sc;
      for (let k = 0; k < 6; k++) D.brick2d(ctx, pv[0] - 8 * u, pv[1] + 10 + (k + 1) * 1.2 * u, 2, 3, u, '--lego-red', { studs: false });
      D.brick2d(ctx, pv[0] - 9 * u, pv[1] + 6, 18, 3, u, '--lego-gray', { holes: true, studs: false });
      ctx.save();
      ctx.translate(pv[0], pv[1]);
      ctx.rotate(-th);
      ctx.fillStyle = MC.col('--lego-gray');
      ctx.fillRect(-u * 0.45, -u * 0.5, u * 0.9, d * sc + u);
      ctx.fillStyle = MC.shade(MC.col('--lego-gray'), 0.5);
      for (let k = 0; k * 0.008 <= d; k++) { ctx.beginPath(); ctx.arc(0, k * u, u * 0.22, 0, 7); ctx.fill(); }
      ctx.restore();
      const cx = pv[0] + Math.sin(th) * d * sc, cy = pv[1] + Math.cos(th) * d * sc;
      D.phone(ctx, cx, cy, 0.075 * sc, 0.155 * sc, { ang: th });
      D.circle(ctx, cx, cy, 3, { fill: '--accent', color: 'none' });
      D.circle(ctx, pv[0], pv[1], u * 0.5, { fill: '--lego-dkgray', color: 'none' });
      D.line(ctx, pv[0], pv[1], pv[0], pv[1] + d * sc * 1.1, { color: '--ink-3', dash: [3, 4], width: 1 });
      MC.text(ctx, `d = ${MC.fix(d * 100, 1)} cm`, 10, H - 12, { size: 12, mono: true, color: '--ink-2' });
      /* gráficas */
      const c2 = cg.ctx;
      D.clear(cg);
      const h1 = cg.h * 0.45;
      const Tt = hist.d.t, tN = Tt.length ? Tt[Tt.length - 1] : 0;
      const wm = Math.max(0.5, Math.sqrt(2 * (G * d / (d * d + k2())) * (1 - Math.cos(M.rad(sim.p.A)))) * 1.15);
      const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: Math.max(0, tN - 8), xmax: Math.max(8, tN), ymin: -wm, ymax: wm, xlabel: ['t', 's'], ylabel: ['ω_z', 'rad/s'], mt: 22, title: 'Giroscopio, eje z' });
      P.frame();
      P.xy(Tt, hist.d.w, { color: '--az', width: 1.3 });
      for (const c of cross) P.vline(c, { color: '--accent', width: 1, dash: [2, 3] });
      let xs, ys, xl, yl;
      if (sim.p.graf === 'lin') { xs = tab.col(4); ys = tab.col(3); xl = ['d²', 'm²']; yl = ['T²d', 's²·m']; }
      else { xs = tab.col(0); ys = tab.rows.map((r) => r[2] * r[2]); xl = ['d', 'm']; yl = ['T²', 's²']; }
      const { f } = MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, xs, ys, { xlabel: xl, ylabel: yl, title: sim.p.graf === 'lin' ? 'T²d contra d²: recta' : 'T² contra d: curva cerca del eje', zeroX: true, zeroY: true, fit: sim.p.graf === 'lin' });
      if (f && xs.length >= 3) {
        const g = (4 * Math.PI * Math.PI) / f.m, ug = (g * f.sm) / f.m;
        const kk = f.b > 0 ? Math.sqrt(f.b / f.m) : NaN;
        sim.set('fit', `g = ${L.pm(g, ug, 'm/s²')}<br>k = ${isFinite(kk) ? MC.fix(kk * 100, 2) + ' cm' : '—'} (esperado ${MC.fix(Math.sqrt(k2()) * 100, 2)} cm)`);
      } else sim.set('fit', sim.p.graf === 'lin' ? 'agregue al menos 3 distancias' : 'use «T²d contra d²» para ajustar');
    });
  });
})();
