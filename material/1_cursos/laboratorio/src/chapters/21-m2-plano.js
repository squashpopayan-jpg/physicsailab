/* Práctica M2 · Plano inclinado con un carrito LEGO */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab, LG = MC.lego;
  const { B, P, TX, BOX } = LG;
  const G = MC.K.gPop;
  const wheel = (x, y, z, o = {}) => Object.assign({ t: 'cyl', x, y, z, w: 3.75, d: 1.5, h: 9.4, c: '--lego-black', hub: '--lego-gray', name: 'Rueda con neumático Ø30 mm' }, o);

  LG.def('carrito', {
    name: 'Carrito con bandeja', rot: 0,
    steps: [
      { note: 'Dos ladrillos Technic 1×12 forman los largueros; sus agujeros sostienen los ejes.', parts: [TX(0, 0, 3, 12, 1, '--lego-gray', { name: 'Ladrillo Technic 1×12' }), TX(0, 5, 3, 12, 1, '--lego-gray', { name: 'Ladrillo Technic 1×12' })] },
      { note: 'Una placa de 6×12 los une por encima y forma el chasis.', parts: [P(0, 0, 6, 12, 6, '--lego-dkgray')] },
      { note: 'Ejes Technic de 8 en los agujeros 2 y 10; deje medio módulo de holgura para que las ruedas no rocen.', parts: [MC.legoLine([2, -1.6, 4.7], [2, 7.6, 4.7], '--lego-dkgray', { lw: 4, name: 'Eje Technic 8' }), MC.legoLine([10, -1.6, 4.7], [10, 7.6, 4.7], '--lego-dkgray', { lw: 4, name: 'Eje Technic 8' })] },
      { note: 'Cuatro ruedas iguales. Gire cada una con el dedo: deben dar varias vueltas solas.', parts: [wheel(0.125, -1.6, 0), wheel(8.125, -1.6, 0), wheel(0.125, 6.1, 0), wheel(8.125, 6.1, 0)] },
      { note: 'Encima va el soporte del celular (capítulo 9), con el eje y del celular a lo largo del carrito.', parts: [B(0, 0, 7, 12, 1, '--lego-red', { name: 'Ladrillo 1×12' }), B(0, 5, 7, 12, 1, '--lego-red', { name: 'Ladrillo 1×12' }), BOX(-4, 0.6, 10, 20, 4.8, 3, '--phone', { screen: '--screen', name: 'Celular (en su soporte)' })] }
    ]
  });

  MC.defineSim('m2-plano', function (sim) {
    sim.cols2('1.15fr 1fr');
    const cs = sim.canvas({ aspect: 1.25, label: 'Rampa y carrito' });
    const cg = sim.canvas({ aspect: 0.95, label: 'Señal y ajuste' });
    const tab = MC.results(sim, ['Torre (ladrillos)', 'sen θ', '<i>a</i> (m/s²)', '<i>u</i>(<i>a</i>) (m/s²)'], { decimals: [0, 3, 4, 4], title: 'Aceleración contra sen θ' });
    const hist = new MC.History(['fy', 'x'], { minDt: 0, max: 6000 });
    let s = 0, v = 0, phase = 'rest', tRel = 0, lastA = null;
    const Lr = 0.24, travel = 0.20;
    sim.group('Rampa');
    sim.slider('N', { label: 'Altura de la torre', min: 1, max: 10, step: 1, value: 4, unit: 'ladrillos', fmt: (v2) => String(Math.round(v2)), reset: true });
    sim.group('Carrito');
    sim.slider('m', { label: 'Masa del carrito con el celular', min: 0.2, max: 0.6, step: 0.01, value: 0.31, unit: 'kg', fmt: (v2) => MC.fix(v2, 2), reset: true });
    sim.select('rueda', { label: 'Ruedas', options: [['peq', 'Ruedas Ø30 mm livianas (21 g)'], ['gra', 'Ruedas Ø56 mm pesadas (80 g)']], value: 'peq', reset: true });
    sim.slider('mur', { label: 'Resistencia a la rodadura μ<sub>r</sub>', min: 0, max: 0.03, step: 0.001, value: 0.006, fmt: (v2) => MC.fix(v2, 3), reset: true });
    sim.group('Sensor');
    sim.seg('sen', { options: [['cel', 'Acelerómetro'], ['ultra', 'Ultrasonido']], value: 'cel' });
    sim.button('Agregar a la tabla', () => { if (lastA) tab.add([Math.round(sim.p.N), sinTh(), lastA.a, lastA.u]); }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('sin', 'sen θ = 0.04 × torre');
    sim.out('a', 'Aceleración medida', { hl: true });
    sim.out('ath', 'Aceleración teórica');
    sim.out('fit', 'Ajuste de la tabla');
    const sinTh = () => Math.min(0.99, (9.6 * Math.round(sim.p.N)) / 240);
    const kI = () => (sim.p.rueda === 'peq' ? 0.5 * 0.021 : 0.5 * 0.080) / sim.p.m;
    const aTh = () => { const sn = sinTh(), cs2 = Math.sqrt(1 - sn * sn); return Math.max(0, (G * sn - sim.p.mur * G * cs2) / (1 + kI())); };
    sim.run({
      h: 1 / 400, speed: 1, startLabel: 'Soltar',
      reset() { s = 0; v = 0; phase = 'rest'; tRel = 1.0; hist.clear(); lastA = null; },
      step(h) {
        const t = sim.t;
        const sn = sinTh();
        let a = 0;
        if (t >= tRel && s < travel) { phase = 'roll'; a = aTh(); v += a * h; s += v * h; }
        else if (s >= travel) { phase = 'stop'; }
        const fy = (phase === 'roll' ? G * sn - a : phase === 'stop' ? G * sn + (v > 0 ? 25 * Math.exp(-(t - (tStop || t)) / 0.02) : 0) : G * sn) + M.gauss(0, 0.012) + (phase === 'roll' ? 0.03 * Math.sin(2 * Math.PI * 23 * t) : 0);
        if (phase === 'stop' && tStop === null) tStop = t;
        hist.push(t, { fy, x: 0.05 + (Lr - 0.02 - s) + M.gauss(0, 0.002) }, true);
        if (phase === 'stop' && t - tStop > 0.6) { compute(); sim.end(); }
      }
    });
    let tStop = null;
    const _reset = sim.reset.bind(sim);
    sim.reset = (silent) => { tStop = null; _reset(silent); };
    sim.reset(true);
    function compute() {
      const T = hist.d.t, F = hist.d.fy, X = hist.d.x;
      if (sim.p.sen === 'cel') {
        const r = [], w = [];
        for (let i = 0; i < T.length; i++) { if (T[i] < tRel - 0.05) r.push(F[i]); else if (T[i] > tRel + 0.1 && T[i] < (tStop || 1e9) - 0.02) w.push(F[i]); }
        const a = M.mean(r) - M.mean(w), u = Math.hypot(M.std(r) / Math.sqrt(r.length), M.std(w) / Math.sqrt(w.length));
        lastA = { a, u, r: M.mean(r), w: M.mean(w) };
      } else {
        const ts = [], xs = [];
        for (let i = 0; i < T.length; i += 8) if (T[i] > tRel + 0.02 && T[i] < (tStop || 1e9) - 0.02) { ts.push(T[i]); xs.push(X[i]); }
        const f = L.fitPoly(ts, xs, 2);
        lastA = f ? { a: -2 * f.a[2], u: 2 * f.sa[2] } : null;
      }
    }
    sim.onDraw(() => {
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const sn = sinTh(), th = Math.asin(sn);
      sim.set('sin', MC.fix(sn, 3) + ` (θ = ${MC.fix(M.deg(th), 2)}°)`);
      sim.set('ath', MC.fix(aTh(), 4) + ' m/s²');
      sim.set('a', lastA ? L.pm(lastA.a, lastA.u, 'm/s²') : 'suelte el carrito');
      /* escena */
      const sc = (W - 60) / (Lr * Math.cos(th) + 0.05);
      const x0 = 24, y0 = H - 30;
      D.ground(ctx, 0, y0, W, { depth: 8 });
      const u = 0.008 * sc;
      const tx = x0 + Lr * Math.cos(th) * sc;
      const n = Math.round(sim.p.N);
      for (let k = 0; k < n; k++) D.brick2d(ctx, tx - u, y0 - k * 9.6 * (sc / 1000), 4, 3, u, k % 2 ? '--lego-azure' : '--lego-blue', { studs: false });
      ctx.save();
      ctx.strokeStyle = MC.col('--lego-gray'); ctx.lineWidth = Math.max(3, u * 0.9);
      ctx.beginPath(); ctx.moveTo(x0, y0 - 2); ctx.lineTo(tx, y0 - Lr * sn * sc - 2); ctx.stroke();
      ctx.restore();
      D.brick2d(ctx, x0 - u, y0, 1, 3, u, '--lego-yellow', { studs: false });
      D.angle(ctx, x0, y0, 40, 0, th, { label: 'θ' });
      /* carrito: posición s medida desde arriba */
      const along = Lr - 0.03 - s;
      const cx = x0 + along * Math.cos(th) * sc, cy = y0 - along * sn * sc - 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-th);
      const cw = 0.096 * sc, chh = 0.03 * sc, rw = (sim.p.rueda === 'peq' ? 0.015 : 0.028) * sc;
      ctx.fillStyle = MC.col('--lego-dkgray'); ctx.fillRect(-cw / 2, -rw - chh, cw, chh);
      ctx.fillStyle = MC.col('--phone'); ctx.fillRect(-cw * 0.8, -rw - chh - 0.009 * sc, cw * 1.6, 0.009 * sc);
      for (const wx of [-cw * 0.33, cw * 0.33]) { D.circle(ctx, wx, -rw, rw, { fill: '--tire', color: 'none' }); D.circle(ctx, wx, -rw, rw * 0.5, { fill: '--metal', color: 'none' }); }
      D.vec(ctx, 0, -rw - chh - 20, -Math.min(60, aTh() * 25) * (phase === 'roll' ? 1 : 0), 0, { color: '--acc', label: phase === 'roll' ? 'a' : '', width: 2 });
      ctx.restore();
      if (sim.p.sen === 'ultra') { ctx.fillStyle = MC.col('--pcb-2'); ctx.fillRect(x0 - 26, y0 - 26, 14, 22); MC.text(ctx, 'HC-SR04', x0 - 30, y0 - 32, { size: 10, color: '--ink-3' }); }
      /* gráficas */
      const c2 = cg.ctx;
      D.clear(cg);
      const h1 = cg.h * 0.5;
      const T = hist.d.t;
      const tmax = Math.max(2.5, T.length ? T[T.length - 1] : 0);
      if (sim.p.sen === 'cel') {
        const Pp = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: 0, xmax: tmax, ymin: -0.5, ymax: Math.max(1.5, G * sn * 1.3), xlabel: ['t', 's'], ylabel: ['f_y', 'm/s²'], mt: 22, title: 'Acelerómetro, eje y (hacia arriba de la rampa)' });
        Pp.frame();
        Pp.xy(T, hist.d.fy, { color: '--ay', width: 1.1 });
        if (lastA) { Pp.hline(lastA.r, { color: '--ink-3', label: 'quieto: g sen θ' }); Pp.hline(lastA.w, { color: '--accent', label: 'bajando', below: true }); }
      } else {
        const Pp = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: 0, xmax: tmax, ymin: 0, ymax: 0.3, xlabel: ['t', 's'], ylabel: ['x', 'm'], mt: 22, title: 'HC-SR04: distancia al carrito' });
        Pp.frame();
        Pp.xy(T, hist.d.x, { color: '--pos', width: 1.1 });
      }
      const xs = tab.col(1), ys = tab.col(2);
      const { f } = MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, xs, ys, { xlabel: ['sen θ', ''], ylabel: ['a', 'm/s²'], title: 'a contra sen θ', zeroX: true, zeroY: true, curve: (x) => G * x });
      sim.set('fit', f && xs.length >= 2 ? `g<sub>ef</sub> = ${L.pm(f.m, f.sm, 'm/s²')} · b = ${L.pm(f.b, f.sb)}` : 'agregue al menos 2 alturas');
    });
  });
})();
