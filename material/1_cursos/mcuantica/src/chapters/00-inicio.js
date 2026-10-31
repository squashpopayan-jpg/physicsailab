/* Portada: un paquete gaussiano contra una barrera (Crank–Nicolson, ħ = m = 1) */
(function () {
  'use strict';
  const EM = window.EM, Q = EM.P.q1d;
  EM.defineSim('home-hero', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    sim.slider('E', { label: 'Energía del paquete E / V₀', min: 0.2, max: 2.2, step: 0.01, value: 0.75, fmt: (v) => EM.fix(v, 2) });
    sim.slider('w', { label: 'Espesor de la barrera (en σ del paquete)', min: 0.3, max: 3, step: 0.05, value: 1, fmt: (v) => EM.fix(v, 2) });
    const N = 700, a = -60, b = 60, h = (b - a) / (N + 1), x = Float64Array.from({ length: N }, (_, i) => a + (i + 1) * h), V0 = 0.5, sg = 4.0;
    let cn, re, im, t = 0, k0 = 0;
    const mk = () => {
      const E = sim.p.E * V0; k0 = Math.sqrt(2 * E); const wd = sim.p.w * sg * 0.5;
      cn = new Q.CrankNicolson(x, (X) => (Math.abs(X) < wd / 2 ? V0 : 0), 0.08);
      [re, im] = Q.gaussPacket(x, -25, sg, k0); t = 0;
    };
    mk();
    sim.resetButton(mk);
    sim.onChange = mk;
    sim.animate(() => { for (let s = 0; s < 6; s++) [re, im] = cn.step(re, im); t += 6 * 0.08; if (t > 140) mk(); });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const wd = sim.p.w * sg * 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: a, xmax: b, ymin: 0, ymax: 0.16, xlabel: 'posición x', ylabel: '|ψ|²', ml: 46, mr: 10 });
      pl.frame(); pl.band(-wd / 2, wd / 2, { color: '--c4', alpha: 0.28 });
      pl.xy(Array.from(x), Array.from(x, (_, i) => re[i] * re[i] + im[i] * im[i]), { color: '--accent', width: 2.4, fill: '--accent', fillAlpha: 0.18 });
      let pt = 0, pr = 0; for (let i = 0; i < N; i++) { const p = (re[i] * re[i] + im[i] * im[i]) * h; if (x[i] > wd / 2) pt += p; else if (x[i] < -wd / 2) pr += p; }
      EM.text(ctx, `t = ${EM.fix(t, 0)}   ·   a la derecha: ${EM.fix(100 * pt, 1)} %   ·   a la izquierda: ${EM.fix(100 * pr, 1)} %`, W / 2, H - 6, { size: 11.5, align: 'center', color: '--ink-3' });
    });
  });
})();
