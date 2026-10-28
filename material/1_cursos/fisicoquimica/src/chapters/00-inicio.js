/* Portada: reacción–difusión de Gray–Scott, el mismo modelo del capítulo 20 */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, O = FQ.osc;
  const PRE = { mit: [0.0367, 0.0649], lab: [0.0545, 0.062], ray: [0.04, 0.06] };
  EM.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.15 });
    sim.seg('pre', { label: 'Receta de Pearson (1993)', options: [['mit', 'Mitosis de manchas'], ['lab', 'Laberinto'], ['ray', 'Rayas']], value: 'mit' });
    const N = 112, gs = new O.GrayScott(N, 0.0367, 0.0649);
    sim.resetButton(() => gs.seed(+Date.now() % 1000 + 1));
    sim.onChange = () => { const q = PRE[sim.p.pre]; gs.F = q[0]; gs.k = q[1]; gs.seed(5); };
    sim.animate(() => { gs.step(24); });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, S = Math.min(W, H * 0.8) - 8, x0 = (W - S) / 2, y0 = 6;
      EM.draw.clear(cv);
      if (!cv._off || cv._off.width !== N) { cv._off = document.createElement('canvas'); cv._off.width = N; cv._off.height = N; }
      const oc = cv._off.getContext('2d'), img = oc.createImageData(N, N), d = img.data, a = EM.rgb('--c3');
      for (let q = 0; q < N * N; q++) { const u = Math.min(1, gs.v[q] * 3.2), o = 4 * q; d[o] = 245 * (1 - u) + a[0] * u * 0.7; d[o + 1] = 245 * (1 - u) + a[1] * u * 0.7; d[o + 2] = 245 * (1 - u) + a[2] * u * 0.7; d[o + 3] = 255; }
      oc.putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(cv._off, x0, y0, S, S); ctx.strokeStyle = EM.col('--axis'); ctx.strokeRect(x0 - 0.5, y0 - 0.5, S + 1, S + 1);
      EM.text(ctx, 'U + 2V → 3V,  V → P   ·   F = ' + gs.F.toFixed(4) + ', k = ' + gs.k.toFixed(4) + '   ·   t = ' + EM.fix(gs.t, 0), W / 2, y0 + S + 12, { size: 11.5, align: 'center', color: '--ink-3', baseline: 'top' });
    });
  });
})();
