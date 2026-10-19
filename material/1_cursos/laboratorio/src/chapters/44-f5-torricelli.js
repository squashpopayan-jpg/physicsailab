/* Práctica F5 · Vaciado de un recipiente: Torricelli */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const G = MC.K.gPop;
  MC.defineSim('f5-torricelli', function (sim) {
    sim.cols2('0.7fr 1.4fr');
    const cs = sim.canvas({ aspect: 0.6, label: 'Botella y sensor' });
    const cg = sim.canvas({ aspect: 1.15, label: 'Nivel del agua' });
    const tab = MC.results(sim, ['Orificio (mm)', 'Salida', '<i>k</i> (m<sup>1/2</sup>/s)', '<i>C</i><sub>d</sub> medido', '<i>t</i><sub>v</sub> (s)'], { decimals: [1, 0, 5, 3, 1], title: 'Vaciados medidos' });
    const hist = new MC.History(['d', 'h'], { minDt: 0.2, max: 8000 });
    const dFondo = 0.27;
    let h = 0, fitK = null;
    sim.group('Botella');
    sim.slider('D', { label: 'Diámetro interior', min: 6, max: 12, step: 0.1, value: 9.4, unit: 'cm', fmt: (q) => MC.fix(q, 1), reset: true });
    sim.slider('h0', { label: 'Altura inicial sobre el orificio', min: 5, max: 22, step: 0.5, value: 20, unit: 'cm', fmt: (q) => MC.fix(q, 1), reset: true });
    sim.group('Orificio');
    sim.select('dor', { label: 'Diámetro', options: [[3, '3 mm'], [4.5, '4.5 mm'], [6, '6 mm']], value: 4.5, reset: true });
    sim.select('tipo', { label: 'Tipo de salida', options: [['ori', 'Orificio de borde afilado (C_d ≈ 0.61)'], ['tubo', 'Tubito corto (C_d ≈ 0.80)']], value: 'ori', reset: true });
    sim.button('Agregar a la tabla', () => { if (fitK) tab.add([+sim.p.dor, sim.p.tipo === 'ori' ? 'orificio' : 'tubito', fitK.k, fitK.cd, fitK.tv]); }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('k', 'Pendiente de √h', { hl: true });
    sim.out('cd', '<i>C</i><sub>d</sub> medido');
    sim.out('tv', 'Tiempo de vaciado');
    const Cd0 = () => (sim.p.tipo === 'ori' ? 0.61 : 0.8);
    const ratio = () => Math.pow(sim.p.D * 10 / +sim.p.dor, 2);
    sim.run({
      h: 0.05, speed: 4, timeScale: 3, startLabel: 'Quitar la cinta',
      reset() { h = sim.p.h0 / 100; hist.clear(); fitK = null; },
      step(dt) {
        const t = sim.t;
        if (t > 2 && h > 0.003) { const Cd = Cd0() * (1 - 0.15 * Math.exp(-h / 0.01)); h -= (Cd / ratio()) * Math.sqrt(2 * G * h) * dt; }
        if (h < 0.003) h = Math.max(0.0025, h);
        const d = dFondo - h + M.gauss(0, 0.0015);
        hist.push(t, { d, h: dFondo - d });
        if (h <= 0.0031 && t > 5) { analyze(); sim.end(); }
        if (t > 1500) sim.end();
      },
      timeFmt: (t) => 't = ' + MC.fix(t, 0) + ' s'
    });
    function analyze() {
      const T = hist.d.t, H = hist.d.h;
      const t0 = 2, xs = [], ys = [];
      const hmax = sim.p.h0 / 100;
      for (let i = 0; i < T.length; i++) if (T[i] > t0 + 1 && H[i] < hmax * 0.9 && H[i] > 0.02) { xs.push(T[i]); ys.push(Math.sqrt(Math.max(0, H[i]))); }
      const f = L.fitLine(xs, ys);
      if (!f) return;
      const k = -f.m;
      fitK = { k, cd: k * ratio() * Math.sqrt(2 / G), tv: Math.sqrt(hmax) / k, f, xs, ys };
    }
    sim.onDraw(() => {
      sim.set('k', fitK ? MC.fix(fitK.k, 5) + ' m<sup>1/2</sup>/s' : 'espere el vaciado');
      sim.set('cd', fitK ? MC.fix(fitK.cd, 3) + ` (configurado ${MC.fix(Cd0(), 2)})` : '—');
      sim.set('tv', fitK ? MC.fix(fitK.tv, 1) + ' s' : '—');
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const sc = (H * 0.78) / 0.32, bw = (sim.p.D / 100) * sc;
      const x0 = W / 2 - bw / 2, yb = H - 28;
      const ys = yb - 0.02 * sc - h * sc;
      D.fluid(ctx, x0, ys, bw, yb - ys, {});
      ctx.strokeStyle = MC.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, yb - 0.26 * sc); ctx.lineTo(x0, yb); ctx.lineTo(x0 + bw, yb); ctx.lineTo(x0 + bw, yb - 0.26 * sc); ctx.stroke();
      if (sim.t > 2 && h > 0.003) {
        const v = Math.sqrt(2 * G * h), yo = yb - 0.02 * sc;
        ctx.strokeStyle = MC.col('--water'); ctx.lineWidth = Math.max(1.5, +sim.p.dor * 0.6); ctx.beginPath();
        for (let k = 0; k <= 20; k++) { const tt = k * 0.012; const x = x0 + bw + v * tt * sc, y = yo + 0.5 * G * tt * tt * sc; if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
      }
      const ytop = yb - dFondo * sc - 0.02 * sc;
      ctx.fillStyle = MC.col('--lego-red'); ctx.fillRect(x0 - 16, ytop - 10, bw + 32, 8);
      D.module(ctx, W / 2 - 20, ytop - 2, 40, 14, 'HC-SR04', { fill: '--pcb-2', size: 8 });
      D.dim(ctx, x0 - 22, yb - 0.02 * sc, x0 - 22, ys, `h = ${MC.fix(h * 100, 1)} cm`, { labelOff: -36 });
      D.ground(ctx, 0, yb, W);
      const c2 = cg.ctx;
      D.clear(cg);
      const h1 = cg.h * 0.45;
      const T = hist.d.t;
      const tmax = Math.max(60, T.length ? T[T.length - 1] : 0);
      const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: 0, xmax: tmax, ymin: 0, ymax: 0.25, xlabel: ['t', 's'], ylabel: ['h', 'm'], mt: 22, title: 'Altura del agua sobre el orificio' });
      P.frame();
      P.xy(T, hist.d.h, { color: '--water', width: 1.4 });
      const xs = fitK ? fitK.xs : [], yy = fitK ? fitK.ys : [];
      MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, xs.filter((_, i) => i % 3 === 0), yy.filter((_, i) => i % 3 === 0), { xlabel: ['t', 's'], ylabel: ['√h', 'm^{1/2}'], title: '√h contra t (tramo central)', zeroX: true, zeroY: true, emptyText: 'Quite la cinta y espere el vaciado' });
    });
  });
})();
