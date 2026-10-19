/* Práctica M7 · Máquina de Atwood con encoder */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab, LG = MC.lego;
  const { B, P, TX, BOX } = LG;
  const G = MC.K.gPop;

  {
    const n = 22, col = [];
    for (let k = 0; k < n; k++) col.push(B(0, 4, 1 + 3 * k, 2, 4, k % 2 ? '--lego-yellow' : '--lego-red'));
    const zt = 1 + 3 * n;
    LG.def('atwood', {
      name: 'Máquina de Atwood', rot: 1, aspect: 0.95,
      steps: [
        { note: 'Base de 12×16 con peso. Una sola columna de ladrillos 2×4 en el borde de la mesa.', parts: [P(0, 0, 0, 12, 16, '--lego-dkgray', { name: 'Placa 12×16' })].concat(col) },
        { note: 'Arriba, un ladrillo Technic 1×6 que sobresale; por su agujero extremo pasa el eje de la polea.', parts: [TX(0, 5, zt, 1, 8, '--lego-gray', { name: 'Ladrillo Technic 1×8' })] },
        { note: 'Polea en el eje, del lado del vacío; el disco ranurado en el mismo eje, al otro lado del ladrillo, pasando por la ranura del optointerruptor.', parts: [{ t: 'cylx', x: 1, y: 10, z: zt - 1, w: 1, d: 3, h: 7.5, c: '--lego-gray', hub: '--lego-dkgray', name: 'Polea Technic Ø24 mm' }, { t: 'cylx', x: -0.6, y: 10, z: zt - 2.5, w: 0.3, d: 4, h: 10, c: '--lego-black', hub: '--lego-gray', name: 'Disco ranurado de 20 ranuras' }, BOX(-1.4, 11, zt - 4, 1.4, 1.2, 3, '--pcb-2', { name: 'Optointerruptor H206' })] },
        { note: 'Hilo sobre la polea con un portamasas en cada extremo.', parts: [MC.legoLine([1.5, 10, zt + 2.2], [1.5, 10, 30], '--rope', { lw: 1.5, name: 'Hilo de nailon' }), MC.legoLine([1.5, 13, zt + 2.2], [1.5, 13, 20], '--rope', { lw: 1.5 }), BOX(1, 9.5, 22, 1, 1, 8, '--metal', { name: 'Portamasas con arandelas' }), BOX(1, 12.5, 12, 1, 1, 8, '--metal', { name: 'Portamasas con arandelas' })] }
      ]
    });
  }

  MC.defineSim('m7-atwood', function (sim) {
    sim.cols2('0.7fr 1.4fr');
    const cs = sim.canvas({ aspect: 0.6, label: 'Máquina de Atwood' });
    const cg = sim.canvas({ aspect: 1.1, label: 'Velocidad y aceleración' });
    const tab = MC.results(sim, ['<i>M</i> (kg)', 'Δ<i>m</i> (kg)', '<i>a</i> (m/s²)', '<i>u</i>(<i>a</i>) (m/s²)'], { decimals: [3, 3, 4, 4], title: 'Aceleración contra diferencia de masas' });
    const r = 0.012, ds = (2 * Math.PI * r) / 20;
    let y = 0, v = 0, phi = 0, pulses = [], moving = false, fitA = null;
    sim.group('Masas');
    sim.slider('M', { label: 'Masa total <i>M</i>', min: 0.2, max: 0.6, step: 0.01, value: 0.3, unit: 'kg', fmt: (q) => MC.fix(q, 2), reset: true });
    sim.slider('dm', { label: 'Diferencia Δ<i>m</i>', min: 0, max: 0.08, step: 0.002, value: 0.02, fmt: (q) => MC.fix(q * 1000, 0) + ' g', reset: true });
    sim.group('Polea');
    sim.select('pol', { label: 'Polea', options: [['liv', 'Polea Technic liviana (I/r² ≈ 6 g)'], ['pes', 'Rueda pesada con llanta (I/r² ≈ 30 g)']], value: 'liv', reset: true });
    sim.slider('ff', { label: 'Fricción en el eje (fuerza equivalente)', min: 0, max: 0.06, step: 0.002, value: 0.02, unit: 'N', fmt: (q) => MC.fix(q, 3), reset: true });
    sim.button('Agregar a la tabla', () => { if (fitA) tab.add([sim.p.M, sim.p.dm, fitA.m, fitA.sm]); }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('ath', 'Aceleración teórica');
    sim.out('a', 'Aceleración medida', { hl: true });
    sim.out('np', 'Pulsos registrados');
    sim.out('fit', 'Ajuste de la tabla');
    const Ir2 = () => (sim.p.pol === 'liv' ? 0.006 : 0.03);
    const aTh = () => { const F = sim.p.dm * G - sim.p.ff; return F > sim.p.ff * 0.3 ? F / (sim.p.M + Ir2()) : 0; };
    sim.run({
      h: 1 / 5000, startLabel: 'Soltar',
      reset() { y = 0; v = 0; phi = 0; pulses = []; moving = false; fitA = null; },
      step(h) {
        const a = aTh();
        if (a > 0 && y < 0.5) { v += a * h; y += v * h; moving = true; }
        const ph = Math.floor(y / ds);
        if (ph > phi) { phi = ph; pulses.push(sim.t + M.gauss(0, 3e-6)); }
        if (y >= 0.5 || (sim.t > 1.5 && a === 0)) { compute(); sim.end(); }
      },
      timeFmt: (t) => 't = ' + MC.fix(t, 3) + ' s'
    });
    function compute() {
      if (pulses.length < 4) { fitA = null; return; }
      const tm = [], vv = [];
      for (let i = 1; i < pulses.length; i++) { tm.push((pulses[i] + pulses[i - 1]) / 2); vv.push(ds / (pulses[i] - pulses[i - 1])); }
      fitA = L.fitLine(tm, vv);
      fitA.tm = tm; fitA.v = vv;
    }
    sim.onDraw(() => {
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const px = W / 2, py = H * 0.12, R = W * 0.12;
      D.ceiling(ctx, W * 0.2, 10, W * 0.8);
      D.line(ctx, px, 10, px, py, { color: '--lego-red', width: 6 });
      const ang = y / r;
      D.pulley(ctx, px, py, R, { ang: -ang });
      ctx.save();
      for (let k = 0; k < 20; k++) { const a = -ang + (k * Math.PI) / 10; ctx.fillStyle = MC.col('--lego-black'); ctx.beginPath(); ctx.arc(px + R * 1.25 * Math.cos(a), py - R * 1.25 * Math.sin(a), 2, 0, 7); ctx.fill(); }
      ctx.restore();
      const sc = (H * 0.5) / 0.5;
      const m1 = (sim.p.M + sim.p.dm) / 2, m2 = (sim.p.M - sim.p.dm) / 2;
      const yr = py + H * 0.18 + y * sc, yl = py + H * 0.72 - y * sc;
      D.rope(ctx, [[px + R, py], [px + R, yr]]);
      D.rope(ctx, [[px - R, py], [px - R, yl]]);
      D.block(ctx, px + R, yr + 18, 30, 36, { fill: '--metal', label: MC.fix(m1 * 1000, 0), size: 10 });
      D.block(ctx, px - R, yl + 18, 30, 36, { fill: '--metal', label: MC.fix(m2 * 1000, 0), size: 10 });
      MC.text(ctx, 'g', px + R + 20, yr + 22, { size: 10, color: '--ink-3' });
      D.ground(ctx, 0, H - 8, W, { depth: 6 });
      sim.set('ath', aTh() > 0 ? MC.fix(aTh(), 4) + ' m/s²' : 'no arranca (fricción)');
      sim.set('a', fitA ? L.pm(fitA.m, fitA.sm, 'm/s²') : 'suelte las masas');
      sim.set('np', String(pulses.length));
      const c2 = cg.ctx;
      D.clear(cg);
      const h1 = cg.h * 0.5;
      const tm = fitA ? fitA.tm : [], vv = fitA ? fitA.v : [];
      MC.fitPlot(c2, { x: 0, y: 0, w: cg.w, h: h1 }, tm, vv, { xlabel: ['t', 's'], ylabel: ['v', 'm/s'], title: 'Velocidad del hilo (un punto por ranura)', zeroX: true, zeroY: true, emptyText: 'Suelte las masas' });
      const { f } = MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, tab.col(1), tab.col(2), { xlabel: ['Δm', 'kg'], ylabel: ['a', 'm/s²'], title: 'a contra Δm (masa total fija)', zeroX: true, zeroY: true });
      if (f && tab.rows.length >= 3) {
        const Mef = G / f.m, uM = (Mef * f.sm) / f.m;
        sim.set('fit', `M<sub>ef</sub> = ${L.pm(Mef, uM, 'kg')}<br>I/r² ≈ ${MC.fix((Mef - sim.p.M) * 1000, 1)} g · Δm mínima ≈ ${MC.fix((-f.b / f.m) * 1000, 1)} g`);
      } else sim.set('fit', 'agregue al menos 3 valores de Δm');
    });
  });
})();
