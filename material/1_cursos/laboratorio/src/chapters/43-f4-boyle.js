/* Práctica F4 · Ley de Boyle con una jeringa */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  MC.defineSim('f4-boyle', function (sim) {
    sim.cols2('0.9fr 1.2fr');
    const cs = sim.canvas({ aspect: 1.05, label: 'Jeringa y sensor' });
    const cg = sim.canvas({ aspect: 0.9, label: 'Datos' });
    const tab = MC.results(sim, ['<i>V</i><sub>j</sub> (mL)', '<i>p</i> (hPa)', '<i>T</i> (°C)', '1/<i>p</i> (1/hPa)'], { decimals: [1, 2, 2, 7], title: 'Puntos de equilibrio' });
    const Vm = 6 + Math.random() * 6, Troom = 293.15;
    const hist = new MC.History(['p', 'T'], { minDt: 0.05, max: 6000 });
    let V = 30, T = Troom, nRT0 = 0;
    const n = (82200 * (30 + Vm) * 1e-6) / (8.314 * Troom);
    sim.group('Émbolo');
    sim.slider('Vj', { label: 'Lectura de la jeringa', min: 18, max: 60, step: 0.5, value: 30, unit: 'mL', fmt: (q) => MC.fix(q, 1) });
    sim.seg('vel', { label: 'Al mover el émbolo', options: [['lento', 'Despacio (isotérmico)'], ['rapido', 'De golpe (adiabático)']], value: 'lento' });
    sim.button('Agregar el punto actual', () => { const p = read(); tab.add([sim.p.Vj, p, T - 273.15, 1 / p]); }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('p', 'Presión', { hl: true });
    sim.out('T', 'Temperatura del aire');
    sim.out('eq', 'Estado');
    sim.out('res', 'Ajuste de 1/p contra V');
    const read = () => { const p = (n * 8.314 * T) / ((V + Vm) * 1e-6) / 100; return Math.min(1100, p + M.gauss(0, 0.012)); };
    sim.run({
      h: 0.02, autoplay: true, speeds: false,
      reset() { V = sim.p.Vj; T = Troom; hist.clear(); },
      step(h) {
        const target = sim.p.Vj;
        if (Math.abs(target - V) > 1e-6) {
          const rate = sim.p.vel === 'rapido' ? 200 : 2.5;   /* mL/s */
          const dV = Math.sign(target - V) * Math.min(Math.abs(target - V), rate * h);
          const Vn = V + dV;
          T *= Math.pow((V + Vm) / (Vn + Vm), 0.4 * (sim.p.vel === 'rapido' ? 1 : 0.05));
          V = Vn;
        }
        T += (Troom - T) * (1 - Math.exp(-h / 7));
        hist.push(sim.t, { p: read(), T: T - 273.15 });
        void nRT0;
      },
      timeFmt: (t) => 't = ' + MC.fix(t, 0) + ' s'
    });
    sim.onDraw(() => {
      const p = read();
      sim.set('p', MC.fix(p, 2) + ' hPa' + (p >= 1099.9 ? ' (¡saturado!)' : ''));
      sim.set('T', MC.fix(T - 273.15, 2) + ' °C');
      sim.set('eq', Math.abs(T - Troom) < 0.05 && Math.abs(V - sim.p.Vj) < 0.01 ? 'en equilibrio' : 'cambiando… espere');
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const y = H * 0.45, x0 = W * 0.24, s = (W * 0.56) / 70;
      ctx.fillStyle = MC.alpha('--glass', 0.6); ctx.fillRect(x0, y - 18, 64 * s, 36);
      ctx.strokeStyle = MC.col('--ink-2'); ctx.lineWidth = 1.5; ctx.strokeRect(x0, y - 18, 64 * s, 36);
      for (let k = 0; k <= 60; k += 10) { D.line(ctx, x0 + (4 + k) * s, y - 18, x0 + (4 + k) * s, y - 10, { color: '--ink-3' }); MC.text(ctx, String(k), x0 + (4 + k) * s, y - 22, { size: 9.5, align: 'center', mono: true, color: '--ink-3' }); }
      const xp = x0 + (4 + V) * s;
      ctx.fillStyle = MC.alpha('--c4', 0.15 + 0.3 * Math.max(0, (T - Troom) / 15)); ctx.fillRect(x0, y - 17, xp - x0, 34);
      ctx.fillStyle = MC.col('--lego-dkgray'); ctx.fillRect(xp, y - 17, 8, 34); ctx.fillRect(xp + 8, y - 4, W * 0.9 - xp, 8);
      D.line(ctx, x0, y, x0 - 30, y, { color: '--ink-3', width: 4 });
      D.module(ctx, x0 - 70, y - 26, 40, 52, 'BMP280', { fill: '--pcb-2', size: 8 });
      MC.text(ctx, `V muerto ≈ ? (manguera + frasco)`, x0 - 70, y + 44, { size: 11, color: '--ink-3' });
      MC.text(ctx, `V_j = ${MC.fix(V, 1)} mL`, xp, y + 38, { size: 12, mono: true, align: 'center', color: '--ink' });
      const c2 = cg.ctx;
      D.clear(cg);
      const h1 = cg.h * 0.4;
      const Tt = hist.d.t, tN = Tt.length ? Tt[Tt.length - 1] : 0;
      const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: Math.max(0, tN - 40), xmax: Math.max(40, tN), ymin: 400, ymax: 1150, xlabel: ['t', 's'], ylabel: ['p', 'hPa'], mt: 22, title: 'Presión en el tiempo' });
      P.frame();
      P.hline(1100, { color: '--warn-ink', label: 'límite del BMP280', labelRight: true });
      P.xy(Tt, hist.d.p, { color: '--c1', width: 1.5 });
      const { f } = MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, tab.col(0), tab.col(3), { xlabel: ['V_j', 'mL'], ylabel: ['1/p', '1/hPa'], title: '1/p contra V_j: recta con intercepto', zeroX: true, zeroY: true });
      sim.set('res', f && tab.rows.length >= 3 ? `V<sub>m</sub> = ${MC.fix(f.b / f.m, 2)} mL (real ${MC.fix(Vm, 2)})<br>C = pV = ${MC.fix(1 / f.m, 0)} hPa·mL` : 'agregue al menos 3 puntos en equilibrio');
    });
  });
})();
