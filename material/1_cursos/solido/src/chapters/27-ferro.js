/* Capítulo 27 — Ferromagnetismo */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd, L = EM.lin;

  /* 27.3 Campo medio de Weiss */
  EM.defineSim('weiss', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('t', { label: 'Temperatura reducida T/T_C', min: 0.05, max: 1.6, step: 0.005, value: 0.8, fmt: (v) => v.toFixed(3) });
    sim.seg('J', { label: 'J', options: [[0.5, '½'], [3.5, '7/2'], [40, '→ ∞ (clásico)']], value: 0.5 });
    sim.out('m', 'Magnetización espontánea m', { hl: true });
    sim.out('ons', 'Ising 2D exacto (Onsager) a la misma T/T_C');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, J = +p.J, t = p.t;
      EM.draw.clear(cv);
      const wl = W * 0.5, a = (3 * J) / (J + 1);
      /* curva y = B_J(x) y recta y = t x / a */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0, xmax: 4, ymin: 0, ymax: 1.1, xlabel: 'x = (3J/(J+1)) m/t', ylabel: 'm' });
      pl.frame();
      pl.fn((x) => SS.brillouin(J, x), { color: '--c1', width: 2.4 });
      pl.fn((x) => (t * x) / a, { color: '--c2', width: 2 });
      const m = SS.weiss(J, t);
      if (m > 0) pl.dot((a * m) / t, m, { color: '--accent', r: 6 });
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: 1.6, ymin: 0, ymax: 1.1, xlabel: 'T/T_C', ylabel: 'm' });
      p2.frame();
      p2.fn((tt) => SS.weiss(0.5, tt), { color: '--c1', width: 2, n: 200 });
      p2.fn((tt) => SS.weiss(3.5, tt), { color: '--c3', width: 2, n: 200 });
      p2.fn((tt) => SS.weiss(40, tt), { color: '--c5', width: 2, n: 200 });
      p2.fn((tt) => SS.onsagerM(tt * SS.onsagerTc), { color: '--ink-3', width: 1.6, dash: [5, 4], n: 400 });
      p2.fn((tt) => (tt > 1 ? 0.25 * (tt - 1) / 0.6 : NaN), { color: '--c2', width: 1.4, dash: [2, 3] });
      p2.vline(t, { color: '--accent' });
      p2.legend([{ label: 'J = ½', color: '--c1' }, { label: 'J = 7/2', color: '--c3' }, { label: 'J → ∞', color: '--c5' }, { label: 'Ising 2D exacto', color: '--ink-3', dash: [5, 4] }, { label: '1/χ (Curie–Weiss)', color: '--c2', dash: [2, 3] }], 'tr');
      sim.set('m', EM.fix(m, 4));
      sim.set('ons', EM.fix(SS.onsagerM(t * SS.onsagerTc), 4));
    });
  });

  /* 27.4 Ising por Monte Carlo */
  EM.defineSim('ising', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura k_BT/J', min: 0.5, max: 4, step: 0.01, value: 2.0, fmt: (v) => v.toFixed(2) });
    sim.slider('h', { label: 'Campo h/J', min: -0.5, max: 0.5, step: 0.01, value: 0, fmt: (v) => v.toFixed(2) });
    sim.out('m', '|m| promedio', { hl: true });
    sim.out('o', 'Onsager');
    sim.out('e', 'Energía por espín');
    const Lz = 128, N = Lz * Lz, rng = L.rng(17);
    let s = new Int8Array(N);
    const randomize = () => { for (let i = 0; i < N; i++) s[i] = rng() < 0.5 ? 1 : -1; };
    randomize();
    let acc = [], mlog = new Map();
    sim.button('Desordenar', () => { randomize(); acc = []; });
    sim.button('Ordenar', () => { s.fill(1); acc = []; });
    sim.button('Borrar curva', () => { mlog = new Map(); });
    sim.onChange = (id) => { if (id === 'T' || id === 'h') acc = []; };
    sim.animate(() => {
      for (let k = 0; k < 3; k++) SS.isingSweep(s, Lz, 1 / sim.p.T, sim.p.h, rng);
      let t = 0; for (let i = 0; i < N; i++) t += s[i];
      acc.push(Math.abs(t) / N);
      if (acc.length > 400) acc.shift();
      if (acc.length > 60) { const key = Math.round(sim.p.T * 20) / 20; const v = acc.slice(30).reduce((a, b) => a + b, 0) / (acc.length - 30); mlog.set(key, v); }
    });
    const img = new Float32Array(N);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      for (let i = 0; i < N; i++) img[i] = s[i];
      const size = Math.min(H - 10, W * 0.48), r = { x: 5, y: (H - size) / 2, w: size, h: size };
      const c1 = EM.rgb('--c1'), c2 = EM.rgb('--canvas');
      D.paint(ctx, img, Lz, Lz, r, (v) => (v > 0 ? c1 : c2), { smooth: false });
      ctx.strokeStyle = EM.col('--ink-3'); ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
      const x0 = size + 20;
      const pl = new EM.Plot(ctx, { x: x0, y: 0, w: W - x0, h: H, xmin: 0.5, xmax: 4, ymin: 0, ymax: 1.05, xlabel: 'k_BT/J', ylabel: '|m|' });
      pl.frame();
      pl.fn((T) => SS.onsagerM(T), { color: '--ink-3', width: 2, n: 600 });
      pl.vline(SS.onsagerTc, { color: '--ink-3', label: 'T_C = 2.269' });
      for (const [T, v] of mlog) pl.dot(T, v, { color: '--c2', r: 4 });
      pl.vline(p.T, { color: '--accent' });
      let e = 0;
      for (let y = 0; y < Lz; y++) for (let x = 0; x < Lz; x++) { const i = x + y * Lz; e -= s[i] * (s[((x + 1) % Lz) + y * Lz] + s[x + ((y + 1) % Lz) * Lz]) + p.h * s[i]; }
      const mm = acc.length ? acc.slice(Math.min(30, acc.length - 1)).reduce((a, b) => a + b, 0) / Math.max(1, acc.length - Math.min(30, acc.length - 1)) : 0;
      sim.set('m', EM.fix(mm, 3));
      sim.set('o', EM.fix(SS.onsagerM(p.T), 3));
      sim.set('e', EM.fix(e / N, 3) + ' J');
    });
  });
})();
