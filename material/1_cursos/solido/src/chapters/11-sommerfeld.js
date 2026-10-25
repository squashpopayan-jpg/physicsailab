/* Capítulo 11 — El gas de Fermi */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd, DATA = EM.data;
  const PI = Math.PI;

  /* 11.1 Llenado del disco de Fermi */
  EM.defineSim('esfera-fermi', function (sim) {
    const cv = sim.canvas({ aspect: 1.35 });
    sim.slider('N', { label: 'Número de electrones N', min: 2, max: 1200, step: 2, value: 300, fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura k_BT/E_F', min: 0, max: 0.3, step: 0.005, value: 0, fmt: (v) => v.toFixed(3) });
    sim.out('kf', 'k_F contado (unidades de 2π/L)', { hl: true });
    sim.out('th', 'Fórmula √(N/2π)');
    const M = 26, pts = [];
    for (let i = -M; i <= M; i++) for (let j = -M; j <= M; j++) pts.push([i, j, i * i + j * j]);
    pts.sort((a, b) => a[2] - b[2]);
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, N = Math.round(p.N);
      EM.draw.clear(cv);
      const nocc = N / 2, kF2 = pts[Math.max(0, Math.ceil(nocc) - 1)][2];
      const kF = Math.sqrt(N / (2 * PI)); /* área π kF² = N/2 */
      const R = Math.min(M, Math.max(6, kF * 1.6));
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -R, R, -R, R);
      for (let q = 0; q < pts.length; q++) {
        const [i, j, k2] = pts[q];
        if (Math.abs(i) > R || Math.abs(j) > R) continue;
        let occ;
        if (p.T > 0) { const E = k2 / (kF * kF), f = 1 / (Math.exp((E - 1) / p.T) + 1); occ = f; } else occ = q < nocc ? 1 : 0;
        ctx.fillStyle = occ > 0.02 ? EM.alpha('--c1', 0.2 + 0.8 * occ) : EM.alpha('--ink-3', 0.35);
        ctx.beginPath(); ctx.arc(v.X(i), v.Y(j), occ > 0.02 ? 3.6 : 1.6, 0, 7); ctx.fill();
      }
      ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(v.X(0), v.Y(0), kF * v.sx, 0, 7); ctx.stroke();
      EM.text(ctx, 'k_x', v.X(R) - 18, v.Y(0) - 6, { size: 13, italic: true, color: '--ink-2' });
      EM.text(ctx, 'k_y', v.X(0) + 6, v.Y(R) + 14, { size: 13, italic: true, color: '--ink-2' });
      sim.set('kf', EM.fix(Math.sqrt(kF2), 3) + ' (último estado ocupado)');
      sim.set('th', EM.fix(kF, 3));
    });
  });

  /* 11.3 Fermi–Dirac */
  EM.defineSim('fermi-dirac', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('n', { label: 'Densidad n', min: 1e24, max: 2e29, step: 1e24, log: true, value: 8.47e28, unit: 'm⁻³', fmt: (v) => EM.sci(v, 3) });
    sim.slider('T', { label: 'Temperatura', min: 1, max: 2e5, step: 1, log: true, value: 3e4, unit: 'K', fmt: (v) => EM.sci(v, 3) });
    sim.out('ef', 'E_F y T_F', { hl: true });
    sim.out('mu', 'Potencial químico μ(T)');
    sim.out('som', 'Sommerfeld E_F[1 − (π²/12)(T/T_F)²]');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const fg = SS.fermiGas(p.n), EF = fg.EFeV, kT = SS.kBeV * p.T, mu = SS.muFree(p.n, p.T) / SS.e;
      const Emax = Math.max(2 * EF, mu + 8 * kT, 6 * kT);
      const h1 = H * 0.42;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: h1, xmin: 0, xmax: Emax, ymin: 0, ymax: 1.1, ylabel: 'f(E)', mb: 18 });
      pl.frame();
      pl.band(mu - 2 * kT, mu + 2 * kT, { color: '--accent', alpha: 0.1 });
      pl.fn((E) => 1 / (Math.exp((E - mu) / kT) + 1), { color: '--c1', width: 2.4, n: 500 });
      pl.vline(mu, { color: '--c2', label: 'μ' });
      if (EF < Emax) pl.vline(EF, { color: '--ink-3', label: 'E_F', labelY: 30 });
      const g = (E) => Math.sqrt(Math.max(0, E));
      let gmax = 0;
      for (let i = 1; i <= 200; i++) { const E = (Emax * i) / 200; gmax = Math.max(gmax, g(E) / (Math.exp((E - mu) / kT) + 1)); }
      const p2 = new EM.Plot(ctx, { x: 0, y: h1, w: W, h: H - h1, xmin: 0, xmax: Emax, ymin: 0, ymax: Math.max(gmax, Math.sqrt(EF)) * 1.15, xlabel: 'E (eV)', ylabel: 'g(E) f(E) (u. arb.)' });
      p2.frame();
      p2.fn(g, { color: '--ink-3', width: 1.2, dash: [4, 4], n: 300 });
      p2.fn((E) => g(E) / (Math.exp((E - mu) / kT) + 1), { color: '--c1', width: 2.4, n: 500, fill: '--c1', fillAlpha: 0.15 });
      sim.set('ef', EM.fix(EF, 3) + ' eV · ' + EM.sci(fg.TF, 3) + ' K (T/T_F = ' + EM.sci(p.T / fg.TF, 2) + ')');
      sim.set('mu', EM.fix(mu, 4) + ' eV');
      sim.set('som', p.T / fg.TF < 0.3 ? EM.fix(EF * (1 - (PI * PI / 12) * Math.pow(p.T / fg.TF, 2)), 4) + ' eV' : 'no válida (T no es ≪ T_F)');
    });
  });

  /* 11.4 Calor específico electrónico */
  EM.defineSim('calor-electronico', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('n', { label: 'Densidad n', min: 1e22, max: 2e29, step: 1e22, log: true, value: 8.47e28, unit: 'm⁻³', fmt: (v) => EM.sci(v, 3) });
    sim.out('tf', 'T_F', { hl: true });
    sim.out('c300', 'C/(nk_B) a 300 K');
    sim.out('frac', 'Fracción del valor clásico a 300 K');
    let key = '', curve = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const fg = SS.fermiGas(p.n);
      if (key !== String(p.n)) {
        key = String(p.n); curve = [];
        for (let lt = -3; lt <= 1.3; lt += 0.05) { const t = Math.pow(10, lt), T = t * fg.TF; curve.push([t, SS.cFree(p.n, T) / (p.n * SS.kB)]); }
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1e-3, xmax: 20, xlog: true, ymin: 0, ymax: 1.7, xlabel: 'T/T_F', ylabel: 'C/(n k_B)' });
      pl.frame();
      pl.xy(curve.map((q) => q[0]), curve.map((q) => q[1]), { color: '--c1', width: 2.6 });
      pl.fn((t) => ((PI * PI) / 2) * t, { color: '--c2', width: 1.5, dash: [5, 4] });
      pl.hline(1.5, { color: '--ink-3', label: 'clásico 3/2', labelRight: true });
      pl.vline(300 / fg.TF, { color: '--accent', label: '300 K' });
      pl.legend([{ label: 'Fermi–Dirac exacto', color: '--c1' }, { label: 'Sommerfeld (π²/2)T/T_F', color: '--c2', dash: [5, 4] }], 'br');
      const c = SS.cFree(p.n, 300) / (p.n * SS.kB);
      sim.set('tf', EM.sci(fg.TF, 3) + ' K');
      sim.set('c300', EM.sci(c, 3));
      sim.set('frac', EM.fix((100 * c) / 1.5, 3) + ' %');
    });
  });

  /* 11.5 Emisión termoiónica */
  EM.defineSim('termoionica', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Metal', options: Object.keys(DATA.work).map((k) => [k, k + ' (W = ' + DATA.work[k] + ' eV)']), value: 'W' });
    sim.slider('T', { label: 'Temperatura', min: 500, max: 3200, step: 10, value: 2500, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('J', 'Densidad de corriente', { hl: true });
    sim.out('fr', 'Electrones con E > E_F + W (fracción)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, w = DATA.work[p.m];
      EM.draw.clear(cv);
      const wl = W * 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 500, xmax: 3200, ymin: 1e-12, ymax: 1e4, ylog: true, xlabel: 'T (K)', ylabel: 'J (A/cm²)' });
      pl.frame();
      for (const [m, c] of [['Cs', '--c5'], ['Cu', '--c4'], ['W', '--c1'], ['Pt', '--c3']]) pl.fn((T) => SS.richardson(T, DATA.work[m]) / 1e4, { color: c, width: m === p.m ? 2.8 : 1.4 });
      if (!['Cs', 'Cu', 'W', 'Pt'].includes(p.m)) pl.fn((T) => SS.richardson(T, w) / 1e4, { color: '--c2', width: 2.8 });
      pl.vline(p.T, { color: '--accent' });
      pl.legend([{ label: 'Cs', color: '--c5' }, { label: 'Cu', color: '--c4' }, { label: 'W', color: '--c1' }, { label: 'Pt', color: '--c3' }], 'br');
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 3, xmax: 20, ymin: -120, ymax: 5, xlabel: '10⁴/T (K⁻¹)', ylabel: 'ln(J/T²) (J en A/cm²)' });
      p2.frame();
      p2.fn((x) => Math.log(SS.richardson(1e4 / x, w) / 1e4 / Math.pow(1e4 / x, 2)), { color: '--c1', width: 2.4 });
      p2.label(4, -100, 'pendiente −W/k_B = −' + EM.fix(w / SS.kBeV, 0) + ' K', { size: 11.5, color: '--c1' });
      const J = SS.richardson(p.T, w) / 1e4;
      sim.set('J', EM.sci(J, 3) + ' A/cm²');
      sim.set('fr', EM.sci(Math.exp(-w / (SS.kBeV * p.T)), 3) + ' (factor de Boltzmann)');
    });
  });
})();
