/* Capítulo 20 — Transporte en semiconductores */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, DATA = EM.data;

  /* 20.1 Movilidad y resistividad */
  EM.defineSim('movilidad', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('N', { label: 'Dopaje N', min: 1e13, max: 1e20, step: 1e13, log: true, value: 1e17, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 2) });
    sim.out('mu', 'µ_n, µ_p a 300 K', { hl: true });
    sim.out('rho', 'ρ tipo n, tipo p');
    sim.out('D', 'D_n, D_p (Einstein)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const wl = W * 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H * 0.6, xmin: 1e13, xmax: 1e20, xlog: true, ymin: 0, ymax: 1500, xlabel: 'N (cm⁻³)', ylabel: 'µ (cm²/V·s)' });
      pl.frame();
      pl.fn((N) => SS.mobility(N, 'n'), { color: '--c1', width: 2.4 });
      pl.fn((N) => SS.mobility(N, 'p'), { color: '--c2', width: 2.4 });
      pl.vline(p.N, { color: '--accent' });
      pl.legend([{ label: 'electrones', color: '--c1' }, { label: 'huecos', color: '--c2' }], 'tr');
      const p3 = new EM.Plot(ctx, { x: 0, y: H * 0.6, w: wl, h: H * 0.4, xmin: 100, xmax: 600, ymin: 0, ymax: 4000, xlabel: 'T (K)', ylabel: 'µ_n (cm²/V·s)' });
      p3.frame();
      for (const [N, c] of [[1e14, '--c3'], [1e17, '--c1'], [1e18, '--c4']]) p3.fn((T) => SS.mobilityT(N, T, 'n'), { color: c, width: 1.8 });
      p3.label(560, 3500, '10¹⁴ · 10¹⁷ · 10¹⁸', { size: 10.5, color: '--ink-3', align: 'right' });
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 1e13, xmax: 1e20, xlog: true, ymin: 1e-4, ymax: 1e3, ylog: true, xlabel: 'N (cm⁻³)', ylabel: 'ρ (Ω·cm)' });
      p2.frame();
      p2.fn((N) => 1 / (SS.e * N * SS.mobility(N, 'n')), { color: '--c1', width: 2.4 });
      p2.fn((N) => 1 / (SS.e * N * SS.mobility(N, 'p')), { color: '--c2', width: 2.4 });
      for (const [t, N, r] of DATA.irvin) p2.dot(N, r, { color: t === 'n' ? '--c1' : '--c2', r: 5.5 });
      p2.vline(p.N, { color: '--accent' });
      const mn = SS.mobility(p.N, 'n'), mp = SS.mobility(p.N, 'p');
      sim.set('mu', EM.fix(mn, 0) + ', ' + EM.fix(mp, 0) + ' cm²/V·s');
      sim.set('rho', EM.sci(1 / (SS.e * p.N * mn), 3) + ', ' + EM.sci(1 / (SS.e * p.N * mp), 3) + ' Ω·cm');
      sim.set('D', EM.fix(SS.einsteinD(mn, 300), 2) + ', ' + EM.fix(SS.einsteinD(mp, 300), 2) + ' cm²/s');
    });
  });

  /* 20.2 Velocidad en campo intenso */
  EM.defineSim('velocidad', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('E', { label: 'Campo eléctrico', min: 0.1, max: 100, step: 0.1, value: 10, unit: 'kV/cm', fmt: (v) => v.toFixed(1) });
    sim.check('log', { label: 'Escala logarítmica', value: false });
    sim.out('si', 'v Si electrones', { hl: true });
    sim.out('ga', 'v GaAs electrones');
    const vSi = (E) => { const v0 = 1417 * E * 1e3, vs = 1.07e7; return v0 / Math.sqrt(1 + Math.pow(v0 / vs, 2)); };
    const vGa = (E) => { const E0 = 4, x = Math.pow(E / E0, 4); return (8500 * E * 1e3 + 1e7 * x) / (1 + x); };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = p.log ? new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.1, xmax: 100, xlog: true, ymin: 1e5, ymax: 5e7, ylog: true, xlabel: 'E (kV/cm)', ylabel: 'v (cm/s)' })
        : new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 50, ymin: 0, ymax: 2.2e7, xlabel: 'E (kV/cm)', ylabel: 'v (cm/s)', yfmt: (v) => EM.sci(v, 1) });
      pl.frame();
      pl.fn(vSi, { color: '--c1', width: 2.4 });
      pl.fn(vGa, { color: '--c2', width: 2.4 });
      pl.hline(1e7, { color: '--ink-3', label: '10⁷ cm/s' });
      pl.vline(p.E, { color: '--accent' });
      pl.legend([{ label: 'Si', color: '--c1' }, { label: 'GaAs (transferencia Γ → L)', color: '--c2' }], 'br');
      sim.set('si', EM.sci(vSi(p.E), 3) + ' cm/s');
      const h = 0.01, dv = (vGa(p.E + h) - vGa(p.E - h)) / (2 * h);
      sim.set('ga', EM.sci(vGa(p.E), 3) + ' cm/s' + (dv < 0 ? ' · resistencia diferencial negativa' : ''));
    });
  });

  /* 20.4 Haynes–Shockley */
  EM.defineSim('haynes-shockley', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('E', { label: 'Campo de arrastre', min: 0.5, max: 10, step: 0.1, value: 4, unit: 'V/cm', fmt: (v) => v.toFixed(1) });
    sim.slider('tau', { label: 'Tiempo de vida τ_p', min: 10, max: 1000, step: 1, value: 200, unit: 'µs', fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: 'Distancia al colector', min: 0.2, max: 1.5, step: 0.01, value: 1, unit: 'cm', fmt: (v) => v.toFixed(2) });
    sim.out('t0', 'Retraso del máximo', { hl: true });
    sim.out('mu', 'µ_p deducida');
    sim.out('D', 'D_p deducida (ancho) y kT/e');
    const mu = 1900, D = SS.einsteinD(1900, 300); /* huecos en germanio */
    let t = 0;
    sim.animate((dt) => { t += dt * 120; if (t > 1.3 * (sim.p.L / (mu * sim.p.E)) * 1e6) t = 0; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const v = mu * p.E, tau = p.tau * 1e-6, td = p.L / v;
      const h1 = H * 0.42;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: h1, xmin: -0.1, xmax: 1.6, ymin: 0, ymax: 1.05, xlabel: '', ylabel: 'Δp (u. arb.)', mb: 16 });
      pl.frame();
      const tt = Math.max(1e-7, t * 1e-6);
      /* altura normalizada al ancho actual: solo decae por recombinación */
      const peak = (x, tt2) => SS.haynes(x, tt2, D, mu, p.E, tau) * Math.sqrt(4 * Math.PI * D * tt2);
      pl.fn((x) => Math.min(1, peak(x, tt)), { color: '--c2', width: 2.2, fill: '--c2', fillAlpha: 0.2, n: 500 });
      pl.vline(0, { color: '--ink-3', label: 'emisor' });
      pl.vline(p.L, { color: '--c1', label: 'colector' });
      /* señal temporal en el colector */
      const p2 = new EM.Plot(ctx, { x: 0, y: h1, w: W, h: H - h1, xmin: 0, xmax: Math.max(50, 2.2 * td * 1e6), ymin: 0, ymax: 1.1, xlabel: 't (µs)', ylabel: 'señal' });
      p2.frame();
      const sig = (ts) => SS.haynes(p.L, ts * 1e-6, D, mu, p.E, tau);
      let mx = 0, tm = 0;
      for (let i = 1; i <= 800; i++) { const ts = (p2.o.xmax * i) / 800, s = sig(ts); if (s > mx) { mx = s; tm = ts; } }
      p2.fn((ts) => sig(ts) / (mx || 1), { color: '--c1', width: 2.2, n: 600 });
      p2.vline(t, { color: '--accent' });
      /* ancho a media altura de la señal */
      let a = null, b = null;
      for (let i = 1; i <= 2000; i++) { const ts = (p2.o.xmax * i) / 2000, s = sig(ts) / mx; if (a === null && s > 0.5) a = ts; if (a !== null && b === null && s < 0.5 && ts > tm) b = ts; }
      const dtw = (b - a) * 1e-6, dx = v * dtw, tmS = tm * 1e-6;
      const Dd = (dx * dx) / (16 * Math.LN2 * tmS);
      sim.set('t0', EM.fix(tm, 1) + ' µs (L/µE = ' + EM.fix(td * 1e6, 1) + ' µs)');
      sim.set('mu', EM.fix(p.L / (tmS * p.E), 0) + ' cm²/V·s (germanio: 1900)');
      sim.set('D', isFinite(Dd) ? EM.fix(Dd, 1) + ' cm²/s · D/µ = ' + EM.fix(Dd / (p.L / (tmS * p.E)), 4) + ' V (kT/e = 0.0259 V)' : '—');
    });
  });
})();
