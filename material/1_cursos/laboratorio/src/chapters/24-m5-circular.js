/* Práctica M5 · Movimiento circular y aceleración centrípeta */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab, LG = MC.lego;
  const { B, P, TX, BOX } = LG;

  LG.def('plataforma', {
    name: 'Plataforma giratoria', rot: 0,
    steps: [
      { note: 'Base pesada: placa de 16×16 con ladrillos en los bordes.', parts: [P(0, 0, 0, 16, 16, '--lego-dkgray', { name: 'Placa 16×16' }), B(0, 0, 1, 16, 1, '--lego-blue', { name: 'Ladrillo 1×16' }), B(0, 15, 1, 16, 1, '--lego-blue', { name: 'Ladrillo 1×16' })] },
      { note: 'Plataforma giratoria Technic grande en el centro (o el plato de una centrífuga de ensalada).', parts: [BOX(5, 5, 1, 6, 6, 4, '--lego-black', { name: 'Plataforma giratoria Technic 7×7' })] },
      { note: 'Encima, una placa de 16×16 que gira con la plataforma.', parts: [P(0, 0, 5, 16, 16, '--lego-gray', { name: 'Placa 16×16' })] },
      { note: 'Celular plano a un lado (eje y hacia afuera, a lo largo del radio) y un contrapeso de masa parecida al otro lado.', parts: [BOX(9, 3, 6, 6.5, 9.4, 3, '--phone', { screen: '--screen', name: 'Celular' }), BOX(1, 5, 6, 5, 6, 6, '--lego-tan', { name: 'Contrapeso (≈ 200 g)' }), MC.legoLine([12, 2.8, 9.2], [12, 12.6, 9.2], '--lego-orange', { lw: 3, name: 'Banda elástica' })] }
    ]
  });

  MC.defineSim('m5-circular', function (sim) {
    sim.cols2('1fr 1.3fr');
    const cs = sim.canvas({ aspect: 0.95, label: 'Plataforma vista desde arriba' });
    const cg = sim.canvas({ aspect: 1.05, label: 'Datos' });
    const tab = MC.results(sim, ['Orientación de y', '<i>r</i><sub>c</sub> regla (m)', '<i>r</i><sub>s</sub> ajuste (m)', '<i>u</i>(<i>r</i><sub>s</sub>) (m)'], { decimals: [0, 3, 4, 4], title: 'Radio del sensor en cada orientación' });
    const delta = 0.018 + Math.random() * 0.012, deltaX = (Math.random() - 0.5) * 0.02;
    const hist = new MC.History(['w', 'fy', 'fx'], { minDt: 0, max: 20000 });
    let phi = 0, w = 0, kick = 0, fitR = null;
    sim.group('Montaje');
    sim.slider('rc', { label: 'Distancia eje → centro del celular', min: 0.04, max: 0.14, step: 0.008, value: 0.104, unit: 'm', fmt: (q) => MC.fix(q, 3), reset: true });
    sim.seg('ori', { label: 'Eje y del celular', options: [['out', 'hacia afuera'], ['in', 'hacia adentro']], value: 'out', reset: true });
    sim.group('Giro');
    sim.button('Impulsar', () => { kick = 0.35; sim.play(); }, { primary: true });
    sim.button('Agregar a la tabla', () => { if (fitR) tab.add([sim.p.ori === 'out' ? 'afuera' : 'adentro', sim.p.rc, fitR.m, fitR.sm]); });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('w', 'ω actual');
    sim.out('rs', 'Pendiente (radio del sensor)', { hl: true });
    sim.out('loc', 'Ubicación del sensor');
    const rs = () => (sim.p.ori === 'out' ? sim.p.rc + delta : sim.p.rc - delta);
    sim.run({
      h: 1 / 500,
      reset() { phi = 0; w = 0; kick = 0; hist.clear(); fitR = null; },
      step(h) {
        let alpha = -0.08 * w - 0.12 * Math.sign(w);
        if (kick > 0) { alpha += 18; kick -= h; }
        if (w + alpha * h < 0 && kick <= 0) { alpha = -w / h; }
        w = Math.min(14, w + alpha * h); phi += w * h;
        if (Math.round(sim.t * 500) % 5 === 0) {
          const r = rs();
          const fy = -w * w * r + M.gauss(0, 0.03) + 0.05 * Math.sin(phi * 1);
          const fx = (sim.p.ori === 'out' ? 1 : -1) * alpha * r + w * w * deltaX * 0 + M.gauss(0, 0.03);
          hist.push(sim.t, { w: w + M.gauss(0, 0.002), fy, fx }, true);
        }
        if (sim.t > 120) sim.end();
      },
      timeFmt: (t) => 't = ' + MC.fix(t, 1) + ' s'
    });
    sim.onDraw(() => {
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.44;
      const sc = R / 0.16;
      D.circle(ctx, cx, cy, R, { fill: '--surface-2', color: '--ink-2', width: 2 });
      for (let k = 0; k < 16; k++) { const a = phi + (k * Math.PI) / 8; D.line(ctx, cx + R * 0.94 * Math.cos(a), cy - R * 0.94 * Math.sin(a), cx + R * Math.cos(a), cy - R * Math.sin(a), { color: '--ink-3' }); }
      const pc = [cx + sim.p.rc * sc * Math.cos(phi), cy - sim.p.rc * sc * Math.sin(phi)];
      D.phone(ctx, pc[0], pc[1], 0.075 * sc, 0.155 * sc, { ang: phi - Math.PI / 2 + (sim.p.ori === 'in' ? Math.PI : 0), axes: true });
      const ps = [cx + rs() * sc * Math.cos(phi), cy - rs() * sc * Math.sin(phi)];
      D.circle(ctx, ps[0], ps[1], 4, { fill: '--accent', color: '--canvas', width: 1.5 });
      D.block(ctx, cx - 0.1 * sc * Math.cos(phi), cy + 0.1 * sc * Math.sin(phi), 0.05 * sc, 0.06 * sc, { fill: '--lego-tan', ang: phi });
      D.circle(ctx, cx, cy, 5, { fill: '--ink' });
      MC.text(ctx, '● sensor (oculto en la práctica)', 10, H - 10, { size: 11, color: '--accent' });
      sim.set('w', MC.fix(w, 2) + ' rad/s (' + MC.fix(w / (2 * Math.PI), 2) + ' vueltas/s)');
      /* datos */
      const c2 = cg.ctx;
      D.clear(cg);
      const h1 = cg.h * 0.42;
      const T = hist.d.t, tN = T.length ? T[T.length - 1] : 0;
      const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: Math.max(0, tN - 20), xmax: Math.max(20, tN), ymin: -20, ymax: 15, xlabel: ['t', 's'], ylabel: '', mt: 22, title: 'ω_z (rad/s), f_y y f_x (m/s²)' });
      P.frame();
      P.xy(T, hist.d.w, { color: '--az', width: 1.5 });
      P.xy(T, hist.d.fy, { color: '--ay', width: 1.2 });
      P.xy(T, hist.d.fx, { color: '--ax', width: 1 });
      P.legend([{ label: 'ω_z', color: '--az' }, { label: 'f_y (radial)', color: '--ay' }, { label: 'f_x (tangencial)', color: '--ax' }], 'bl');
      const xs = [], ys = [];
      for (let i = 0; i < T.length; i += 3) if (Math.abs(hist.d.fx[i]) < 1.2 && hist.d.w[i] > 1) { xs.push(hist.d.w[i] ** 2); ys.push(-hist.d.fy[i]); }
      const r = MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, xs, ys, { xlabel: ['ω²', 'rad²/s²'], ylabel: ['−f_y', 'm/s²'], title: 'Aceleración radial contra ω² (sin los impulsos)', zeroX: true, zeroY: true, prop: true });
      fitR = xs.length > 20 ? r.f : null;
      sim.set('rs', fitR ? L.pm(fitR.m, fitR.sm, 'm') : 'impulse la plataforma');
      const out = tab.rows.filter((q) => q[0] === 'afuera'), inn = tab.rows.filter((q) => q[0] === 'adentro');
      if (out.length && inn.length) {
        const r1 = out[out.length - 1][2], r2 = inn[inn.length - 1][2];
        sim.set('loc', `r<sub>c</sub> = ${MC.fix((r1 + r2) / 2 * 100, 2)} cm · δ = ${MC.fix((r1 - r2) / 2 * 100, 2)} cm`);
      } else sim.set('loc', 'mida las dos orientaciones');
    });
  });
})();
