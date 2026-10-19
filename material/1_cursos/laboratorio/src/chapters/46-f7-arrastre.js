/* Práctica F7 · Arrastre del aire y velocidad terminal */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const G = MC.K.gPop, RHO = 0.98;
  MC.defineSim('f7-arrastre', function (sim) {
    sim.cols2('0.55fr 1.4fr');
    const cs = sim.canvas({ aspect: 0.42, label: 'Caída sobre el sensor' });
    const cg = sim.canvas({ aspect: 1.2, label: 'Distancia y análisis' });
    const tab = MC.results(sim, ['Filtros <i>n</i>', '<i>v</i><sub>t</sub> (m/s)', '<i>v</i><sub>t</sub>² (m²/s²)'], { decimals: [0, 3, 3], title: 'Velocidades terminales' });
    const hist = new MC.History(['d'], { minDt: 0.05, max: 4000 });
    const m1 = 0.001, A = Math.PI * 0.06 * 0.06, Cd = 1.0 * (1 + M.gauss(0, 0.03));
    let y = 1.8, v = 0, vt = NaN;
    sim.group('Filtros');
    sim.slider('n', { label: 'Filtros apilados', min: 1, max: 6, step: 1, value: 1, fmt: (q) => String(Math.round(q)), reset: true });
    sim.slider('h0', { label: 'Altura de soltado', min: 1, max: 2.2, step: 0.05, value: 1.8, unit: 'm', fmt: (q) => MC.fix(q, 2), reset: true });
    sim.seg('mod', { label: 'Modelo de arrastre (para comparar)', options: [['q', 'Cuadrático (real)'], ['l', 'Lineal (hipotético)']], value: 'q', reset: true });
    sim.button('Agregar a la tabla', () => { if (isFinite(vt)) tab.add([Math.round(sim.p.n), vt, vt * vt]); }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('vt', '<i>v</i><sub>t</sub> medida', { hl: true });
    sim.out('cd', '<i>C</i><sub>D</sub> del ajuste');
    sim.out('ll', 'Pendiente log–log');
    sim.run({
      h: 1 / 500, startLabel: 'Soltar',
      reset() { y = sim.p.h0; v = 0; hist.clear(); vt = NaN; },
      step(h) {
        const m = m1 * Math.round(sim.p.n);
        const Fd = sim.p.mod === 'q' ? 0.5 * Cd * RHO * A * v * v : (m1 * G / 1.33) * v;
        v += (G - Fd / m) * h; y -= v * h;
        if (Math.round(sim.t * 500) % 25 === 0 && y > 0.03) hist.push(sim.t, { d: y + M.gauss(0, 0.003) }, true);
        if (y <= 0.03) { analyze(); sim.end(); }
      },
      timeFmt: (t) => 't = ' + MC.fix(t, 2) + ' s'
    });
    function analyze() {
      const T = hist.d.t, Dd = hist.d.d, xs = [], ys = [];
      for (let i = 0; i < T.length; i++) if (Dd[i] < 1.0 && Dd[i] > 0.1) { xs.push(T[i]); ys.push(Dd[i]); }
      const f = L.fitLine(xs, ys);
      vt = f ? -f.m : NaN;
    }
    sim.onDraw(() => {
      sim.set('vt', isFinite(vt) ? MC.fix(vt, 3) + ' m/s' : 'suelte los filtros');
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const sc = (H - 40) / 2.3, yb = H - 20;
      D.ground(ctx, 0, yb, W);
      D.module(ctx, W / 2 - 18, yb - 12, 36, 12, '', { fill: '--pcb-2' });
      ctx.save(); ctx.strokeStyle = MC.alpha('--c1', 0.3); ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(W / 2, yb - 12); ctx.lineTo(W / 2 - 0.27 * 2.2 * sc, yb - 12 - 2.2 * sc); ctx.moveTo(W / 2, yb - 12); ctx.lineTo(W / 2 + 0.27 * 2.2 * sc, yb - 12 - 2.2 * sc); ctx.stroke(); ctx.restore();
      const yf = yb - 12 - y * sc, n = Math.round(sim.p.n);
      for (let k = 0; k < n; k++) { ctx.fillStyle = MC.col('--lego-tan'); ctx.beginPath(); ctx.moveTo(W / 2 - 30, yf - k * 2); ctx.lineTo(W / 2 + 30, yf - k * 2); ctx.lineTo(W / 2 + 18, yf + 10 - k * 2); ctx.lineTo(W / 2 - 18, yf + 10 - k * 2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = MC.shade(MC.col('--lego-tan'), 0.6); ctx.stroke(); }
      const c2 = cg.ctx;
      D.clear(cg);
      const h1 = cg.h * 0.42;
      const T = hist.d.t;
      const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: 0, xmax: Math.max(1.5, T.length ? T[T.length - 1] : 0), ymin: 0, ymax: 2.3, xlabel: ['t', 's'], ylabel: ['d', 'm'], mt: 22, title: 'Distancia medida por el HC-SR04' });
      P.frame(); P.xy(T, hist.d.d, { color: '--pos', width: 1.4 });
      P.hband(0.1, 1.0, { color: '--accent', alpha: 0.07 });
      const ns = tab.col(0), v2 = tab.col(2);
      const { f } = MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, ns, v2, { xlabel: ['n', 'filtros'], ylabel: ['v_t²', 'm²/s²'], title: 'v_t² contra n', zeroX: true, zeroY: true, prop: true });
      sim.set('cd', f && ns.length >= 2 ? MC.fix((2 * m1 * G) / (RHO * A * f.m), 3) : '—');
      const ll = ns.length >= 2 ? L.fitLine(ns.map(Math.log), tab.col(1).map(Math.log)) : null;
      sim.set('ll', ll ? MC.fix(ll.m, 3) + ' (½ = cuadrático, 1 = lineal)' : '—');
    });
  });
})();
