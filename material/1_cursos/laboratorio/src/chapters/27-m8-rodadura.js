/* Práctica M8 · Rodadura y momento de inercia */
(function () {
  'use strict';
  const MC = window.MC, M = MC.M, D = MC.draw, L = MC.lab;
  const G = MC.K.gPop;
  const OBJ = [
    { id: 'esf', n: 'Esfera maciza', b: 0.4, R: 0.02, col: '--c4' },
    { id: 'dis', n: 'Cilindro macizo', b: 0.5, R: 0.025, col: '--c1' },
    { id: 'hue', n: 'Esfera hueca', b: 2 / 3, R: 0.035, col: '--c5' },
    { id: 'aro', n: 'Aro (tubo de PVC)', b: 1, R: 0.03, col: '--c3' },
    { id: 'tar', n: 'Tarro con celular', b: 0.82, R: 0.085, col: '--c2' }
  ];
  MC.defineSim('m8-rodadura', function (sim) {
    sim.cols2('1.3fr 1fr');
    const cs = sim.canvas({ aspect: 1.5, label: 'Carrera en la rampa' });
    const cg = sim.canvas({ aspect: 1.1, label: 'Medición' });
    const tab = MC.results(sim, ['Cuerpo', 'β teórico', '<i>a</i> (m/s²)', 'β medido'], { decimals: [0, 3, 4, 3], title: 'Factor de inercia de cada cuerpo' });
    const Lr = 1.0, gA = 0.2, gB = 0.8;
    let st = [], hist = null, meas = null;
    sim.group('Rampa');
    sim.slider('th', { label: 'Ángulo θ', min: 2, max: 40, step: 0.5, value: 8, unit: '°', fmt: (q) => MC.fix(q, 1), reset: true });
    sim.slider('mus', { label: 'Fricción estática μ<sub>s</sub> rampa–cuerpo', min: 0.05, max: 0.8, step: 0.01, value: 0.35, fmt: (q) => MC.fix(q, 2), reset: true });
    sim.group('Medición');
    sim.select('obj', { label: 'Cuerpo que se mide', options: OBJ.map((o) => [o.id, o.n]), value: 'tar', reset: true });
    sim.button('Agregar a la tabla', () => { if (meas) { const o = OBJ.find((q) => q.id === sim.p.obj); tab.add([o.n, o.b, meas.a, meas.beta]); } }, { primary: true });
    sim.button('Borrar la última', () => tab.undo());
    sim.out('order', 'Orden de llegada');
    sim.out('a', 'Aceleración medida', { hl: true });
    sim.out('beta', 'β = g sen θ / a − 1');
    const accel = (o) => {
      const th = M.rad(sim.p.th), sn = Math.sin(th), cs2 = Math.cos(th);
      const need = (o.b * Math.tan(th)) / (1 + o.b);
      if (need <= sim.p.mus) return { a: (G * sn) / (1 + o.b) - 0.003 * G * cs2, slip: false };
      const muk = sim.p.mus * 0.8;
      return { a: G * (sn - muk * cs2), slip: true, alpha: (muk * G * cs2) / (o.b * o.R) };
    };
    sim.run({
      h: 1 / 1000, startLabel: 'Soltar todos',
      reset() {
        st = OBJ.map((o) => ({ o, s: 0, v: 0, w: 0, tf: NaN, gates: {} }));
        hist = new MC.History(['w'], { minDt: 0.01, max: 4000 });
        meas = null;
      },
      step(h) {
        let all = true;
        for (const q of st) {
          if (q.s >= Lr) continue;
          all = false;
          const A = accel(q.o);
          q.v += A.a * h; q.s += q.v * h;
          q.w = A.slip ? q.w + A.alpha * h : q.v / q.o.R;
          for (const [gn, xg] of [['A', gA], ['B', gB]]) {
            const near = Math.abs(q.s - xg) < q.o.R;
            if (near && !q.gates[gn + '0']) q.gates[gn + '0'] = sim.t;
            if (!near && q.gates[gn + '0'] && !q.gates[gn]) q.gates[gn] = sim.t - q.gates[gn + '0'];
          }
          if (q.s >= Lr) q.tf = sim.t;
          if (q.o.id === sim.p.obj) hist.push(sim.t, { w: q.w + M.gauss(0, 0.01) });
        }
        if (all) { finish(); sim.end(); }
      },
      timeFmt: (t) => 't = ' + MC.fix(t, 3) + ' s'
    });
    function finish() {
      const q = st.find((z) => z.o.id === sim.p.obj);
      const th = M.rad(sim.p.th);
      let a;
      if (q.o.id === 'tar') {
        const f = L.fitLine(hist.d.t.filter((t) => t > 0.05 && t < q.tf - 0.02), hist.d.w.filter((_, i) => hist.d.t[i] > 0.05 && hist.d.t[i] < q.tf - 0.02));
        a = f ? f.m * q.o.R : NaN;
      } else {
        const d = 2 * q.o.R;
        const v1 = d / (q.gates.A * (1 + M.gauss(0, 0.002))), v2 = d / (q.gates.B * (1 + M.gauss(0, 0.002)));
        a = (v2 * v2 - v1 * v1) / (2 * (gB - gA));
      }
      meas = { a, beta: (G * Math.sin(th)) / a - 1 };
    }
    sim.onDraw(() => {
      const ctx = cs.ctx;
      D.clear(cs);
      const W = cs.w, H = cs.h;
      const th = M.rad(sim.p.th);
      const sc = Math.min((W - 60) / (Lr * Math.cos(th)), (H - 60) / (Lr * Math.sin(th) + 0.2));
      const x0 = 20, y0 = H - 24;
      const top = [x0, y0 - Lr * Math.sin(th) * sc];
      D.ground(ctx, 0, y0, W, { depth: 8 });
      D.poly(ctx, [[x0, y0], [x0, top[1]], [x0 + Lr * Math.cos(th) * sc, y0]], { color: '--ink-2', fill: '--wood', fillAlpha: 0.5, close: true });
      for (const xg of [gA, gB]) { const p = [top[0] + xg * Math.cos(th) * sc, top[1] + xg * Math.sin(th) * sc]; D.line(ctx, p[0], p[1], p[0] - 30 * Math.sin(th), p[1] - 30 * Math.cos(th), { color: '--c2', dash: [3, 3], width: 1.5 }); }
      st.forEach((q, i) => {
        const along = q.s;
        const off = (i - 2) * 0.004;
        const Rpx = Math.max(5, q.o.R * sc * 0.9);
        const cx = top[0] + along * Math.cos(th) * sc + Math.sin(th) * Rpx, cy = top[1] + along * Math.sin(th) * sc - Math.cos(th) * Rpx + off * sc;
        const ang = -(q.s / q.o.R);
        if (q.o.id === 'aro' || q.o.id === 'tar') { D.circle(ctx, cx, cy, Rpx, { color: q.o.col, width: q.o.id === 'aro' ? 3 : 2, fill: q.o.id === 'tar' ? '--metal' : null, fillAlpha: 0.5 }); D.line(ctx, cx, cy, cx + Rpx * Math.cos(ang), cy - Rpx * Math.sin(ang), { color: q.o.col, width: 2 }); }
        else D.ball(ctx, cx, cy, Rpx, { fill: q.o.col, mark: ang, alpha: q.o.id === 'hue' ? 0.85 : 1 });
      });
      const fin = st.filter((q) => isFinite(q.tf)).sort((a, b) => a.tf - b.tf);
      sim.set('order', fin.length ? fin.map((q, i) => `${i + 1}. ${q.o.n} (${MC.fix(q.tf, 3)} s)`).join('<br>') : '—');
      sim.set('a', meas ? MC.fix(meas.a, 4) + ' m/s²' : 'suelte los cuerpos');
      sim.set('beta', meas ? MC.fix(meas.beta, 3) + ` (teórico ${MC.fix(OBJ.find((o) => o.id === sim.p.obj).b, 3)})` : '—');
      const c2 = cg.ctx;
      D.clear(cg);
      const h1 = cg.h * 0.5;
      if (sim.p.obj === 'tar') {
        const P = new MC.Plot(c2, { x: 0, y: 0, w: cg.w, h: h1, xmin: 0, xmax: Math.max(1, hist.d.t.length ? hist.d.t[hist.d.t.length - 1] : 1), ymin: 0, ymax: Math.max(2, ...hist.d.w) * 1.1, xlabel: ['t', 's'], ylabel: ['ω_z', 'rad/s'], mt: 22, title: 'Giroscopio del celular dentro del tarro' });
        P.frame();
        P.xy(hist.d.t, hist.d.w, { color: '--az', width: 1.4 });
      } else {
        MC.text(c2, 'Fotocompuertas en A (20 cm) y B (80 cm):', 14, 26, { size: 12.5, weight: 600, color: '--ink-2' });
        const q = st.find((z) => z.o.id === sim.p.obj);
        MC.text(c2, q && q.gates.A ? `Δt_A = ${MC.fix(q.gates.A * 1000, 2)} ms   Δt_B = ${q.gates.B ? MC.fix(q.gates.B * 1000, 2) + ' ms' : '…'}` : 'suelte los cuerpos', 14, 50, { size: 12.5, mono: true, color: '--ink' });
        MC.text(c2, 'a = (v_B² − v_A²) / (2 · 0.60 m), con v = 2R/Δt', 14, 74, { size: 12, color: '--ink-3' });
      }
      const xs = tab.rows.map((r) => 1 / (1 + r[1])), ys = tab.rows.map((r) => r[2] / (G * Math.sin(M.rad(sim.p.th))));
      MC.fitPlot(c2, { x: 0, y: h1, w: cg.w, h: cg.h - h1 }, xs, ys, { xlabel: ['1/(1+β_{teo})', ''], ylabel: ['a/(g sen θ)', ''], title: 'Medido contra esperado (recta de 45°)', xr: [0.4, 1], yr: [0.4, 1], fit: false, curve: (x) => x });
    });
  });
})();
