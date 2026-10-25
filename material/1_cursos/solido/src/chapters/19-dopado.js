/* Capítulo 19 — Semiconductores dopados */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd;

  /* 19.1 Donador hidrogenoide */
  const HOST = { Si: [0.26, 11.7, 5.431], Ge: [0.12, 16.2, 5.658], GaAs: [0.067, 12.9, 5.653] };
  EM.defineSim('donador', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.seg('m', { label: 'Cristal', options: Object.keys(HOST).map((k) => [k, k]), value: 'Si' });
    sim.out('E', 'Energía de enlace hidrogenoide', { hl: true });
    sim.out('a', 'Radio de Bohr efectivo');
    sim.out('N', 'Átomos dentro de una esfera de radio a_d');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [mr, eps, a] = HOST[p.m];
      EM.draw.clear(cv);
      const h = SS.hydrogenic(mr, eps), ad = h.a * 1e10; /* Å */
      const R = Math.max(3.2 * ad, 60);
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -R * 1.7, R * 1.7, -R, R);
      /* densidad 1s */
      const nx = 200, ny = 120, vals = new Float32Array(nx * ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = v.ix(10 + ((i + 0.5) / nx) * (W - 20)), y = v.iy(10 + ((j + 0.5) / ny) * (H - 20)); vals[j * nx + i] = Math.exp((-2 * Math.hypot(x, y)) / ad); }
      D.paint(ctx, vals, nx, ny, { x: 10, y: 10, w: W - 20, h: H - 20 }, (t) => EM.cmap.seq(Math.pow(t, 0.6), '--c2'));
      /* átomos del plano (100): red cuadrada de lado a/2 (proyección fcc) */
      const d = a / 2, step = d * v.sx;
      if (step > 1.6) {
        ctx.fillStyle = EM.alpha('--ink', 0.55);
        for (let x = -R * 1.7; x <= R * 1.7; x += d) for (let y = -R; y <= R; y += d) { ctx.beginPath(); ctx.arc(v.X(x), v.Y(y), Math.max(0.8, Math.min(3, step * 0.18)), 0, 7); ctx.fill(); }
      }
      ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.arc(v.X(0), v.Y(0), ad * v.sx, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      EM.draw.charge(ctx, v.X(0), v.Y(0), 1, { r: 9 });
      EM.text(ctx, 'a_d = ' + EM.fix(ad, 1) + ' Å', v.X(ad * 0.75), v.Y(ad * 0.75), { size: 12.5, color: '--c2', halo: true, weight: 600 });
      const natoms = (8 / Math.pow(a, 3)) * (4 / 3) * Math.PI * Math.pow(ad, 3);
      sim.set('E', EM.fix(h.E, 2) + ' meV (k_BT a 300 K: 25.9 meV)');
      sim.set('a', EM.fix(ad, 1) + ' Å = ' + EM.fix(ad / (Math.sqrt(3) * a / 4), 1) + ' distancias de enlace');
      sim.set('N', EM.sci(natoms, 2));
    });
  });

  /* 19.2 Nivel de Fermi */
  EM.defineSim('nivel-fermi', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('Nd', { label: 'Donadores N_d (P, 45 meV)', min: 1e12, max: 1e20, step: 1e12, log: true, value: 1e16, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 2) });
    sim.slider('Na', { label: 'Aceptores N_a (B, 45 meV)', min: 1e10, max: 1e20, step: 1e10, log: true, value: 1e10, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 2) });
    sim.slider('T', { label: 'Temperatura', min: 20, max: 800, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('EF', 'E_c − E_F', { hl: true });
    sim.out('n', 'n, p');
    sim.out('ion', 'Donadores ionizados');
    sim.out('t', 'Tipo');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const r = SS.neutral('Si', p.T, { Nd: p.Nd, Na: p.Na, Ed: 45, Ea: 45 });
      const Eg = r.Eg;
      const wl = W * 0.48;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0, xmax: 1, ymin: -0.3, ymax: Eg + 0.3, xticks: [], ylabel: 'E − E_v (eV)' });
      pl.frame();
      ctx.fillStyle = EM.alpha('--c2', 0.18); ctx.fillRect(pl.ix, pl.Y(Eg + 0.3), pl.iw, pl.Y(Eg) - pl.Y(Eg + 0.3));
      ctx.fillStyle = EM.alpha('--c1', 0.18); ctx.fillRect(pl.ix, pl.Y(0), pl.iw, pl.Y(-0.3) - pl.Y(0));
      const frac = r.NdI / Math.max(1, p.Nd);
      for (let i = 0; i < 10; i++) {
        const x = 0.08 + i * 0.09;
        ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(pl.X(x), pl.Y(Eg - 0.045)); ctx.lineTo(pl.X(x + 0.06), pl.Y(Eg - 0.045)); ctx.stroke();
        if (i / 10 >= frac) { ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(pl.X(x + 0.03), pl.Y(Eg - 0.045) - 5, 3.5, 0, 7); ctx.fill(); }
      }
      if (p.Na > 1e11) for (let i = 0; i < 10; i++) { const x = 0.08 + i * 0.09; ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(pl.X(x), pl.Y(0.045)); ctx.lineTo(pl.X(x + 0.06), pl.Y(0.045)); ctx.stroke(); }
      pl.hline(Eg, { color: '--ink', dash: [], label: 'E_c' });
      pl.hline(0, { color: '--ink', dash: [], label: 'E_v' });
      pl.hline(Eg / 2 + SS.Ei('Si', p.T), { color: '--ink-3', label: 'E_i', dash: [2, 3], labelRight: true });
      pl.hline(r.EF, { color: '--accent', dash: [6, 3], label: 'E_F', width: 2, labelRight: true });
      /* E_F frente a T */
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: 800, ymin: -0.3, ymax: Eg + 0.3, xlabel: 'T (K)', ylabel: '' , ml: 30 });
      p2.frame();
      const Ts = EM.M.linspace(20, 800, 120);
      p2.xy(Ts, Ts.map((T) => SS.neutral('Si', T, { Nd: p.Nd, Na: p.Na, Ed: 45, Ea: 45 }).EF), { color: '--accent', width: 2.2 });
      p2.xy(Ts, Ts.map((T) => SS.varshni('Si', T)), { color: '--ink', width: 1.2 });
      p2.hline(0, { color: '--ink', dash: [] });
      p2.vline(p.T, { color: '--ink-3' });
      sim.set('EF', EM.fix(Eg - r.EF, 4) + ' eV');
      sim.set('n', EM.sci(r.n, 3) + ', ' + EM.sci(r.p, 3) + ' cm⁻³');
      sim.set('ion', EM.fix(100 * frac, 2) + ' %');
      sim.set('t', r.n > r.p ? (Eg - r.EF < 3 * SS.Vt(p.T) ? 'n degenerado' : 'n') : (r.EF < 3 * SS.Vt(p.T) ? 'p degenerado' : 'p'));
    });
  });

  /* 19.3 n(T) */
  EM.defineSim('n-T', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('Nd', { label: 'Dopaje a resaltar', min: 1e13, max: 1e18, step: 1e13, log: true, value: 1e15, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 2) });
    sim.out('sat', 'Intervalo de saturación (n dentro del 10 % de N_d)', { hl: true });
    let key = '', curves = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const xs = EM.M.linspace(1, 60, 200);
      if (key !== String(p.Nd)) {
        key = String(p.Nd);
        curves = [1e14, 1e16, 1e18, p.Nd].map((Nd) => xs.map((x) => SS.neutral('Si', 1000 / x, { Nd, Ed: 45 }).n));
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1, xmax: 60, ymin: 1e6, ymax: 1e20, ylog: true, xlabel: '1000/T (K⁻¹)', ylabel: 'n (cm⁻³)' });
      pl.frame();
      const cols = ['--c3', '--c5', '--c4', '--c1'];
      curves.forEach((c, i) => pl.xy(xs, c, { color: cols[i], width: i === 3 ? 2.8 : 1.5 }));
      pl.fn((x) => SS.ni('Si', 1000 / x), { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.legend([{ label: '10¹⁴', color: '--c3' }, { label: '10¹⁶', color: '--c5' }, { label: '10¹⁸', color: '--c4' }, { label: EM.sci(p.Nd, 2), color: '--c1' }, { label: 'n_i', color: '--ink-3', dash: [5, 4] }], 'tr');
      const ok = xs.filter((x, i) => Math.abs(curves[3][i] / p.Nd - 1) < 0.1).map((x) => 1000 / x);
      sim.set('sat', ok.length ? 'de ' + EM.fix(Math.min(...ok), 0) + ' K a ' + EM.fix(Math.max(...ok), 0) + ' K' : 'no hay meseta (dopaje degenerado o muy bajo)');
    });
  });
})();
