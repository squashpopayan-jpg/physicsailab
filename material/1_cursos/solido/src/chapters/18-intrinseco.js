/* Capítulo 18 — Semiconductores intrínsecos */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, DATA = EM.data;

  /* 18.2 Densidad de estados y portadores */
  EM.defineSim('portadores', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('EF', { label: 'Nivel de Fermi E_F − E_v', min: -0.15, max: 1.27, step: 0.005, value: 0.56, unit: 'eV', fmt: (v) => v.toFixed(3) });
    sim.slider('T', { label: 'Temperatura', min: 100, max: 600, step: 5, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('n', 'n (Fermi–Dirac exacto)', { hl: true });
    sim.out('p', 'p');
    sim.out('np', 'np / n_i²');
    sim.out('bz', 'n con Boltzmann');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, T = p.T;
      EM.draw.clear(cv);
      const Eg = SS.varshni('Si', T), kT = SS.Vt(T), Nc = SS.NcT('Si', T), Nv = SS.NvT('Si', T);
      const n = Nc * SS.fdInt(0.5, (p.EF - Eg) / kT), pp = Nv * SS.fdInt(0.5, -p.EF / kT), ni = SS.ni('Si', T, Eg);
      const wl = W * 0.42;
      /* diagrama de bandas con DOS (horizontal) */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0, xmax: 1, ymin: -0.45, ymax: Eg + 0.45, xticks: [], xlabel: 'g·f normalizada (línea discontinua: g)', ylabel: 'E − E_v (eV)' });
      pl.frame();
      ctx.fillStyle = EM.alpha('--c6', 0.12); ctx.fillRect(pl.ix, pl.Y(Eg), pl.iw, pl.Y(0) - pl.Y(Eg));
      const gs = (E) => (E > Eg ? Math.sqrt(E - Eg) : E < 0 ? Math.sqrt(-E) : 0);
      pl.xy(EM.M.linspace(0, 0.45, 200).map((x) => 1.4 * Math.sqrt(x) * 0.8), EM.M.linspace(Eg, Eg + 0.45, 200), { color: '--c2', width: 1.2, dash: [4, 3] });
      pl.xy(EM.M.linspace(0, 0.45, 200).map((x) => 1.4 * Math.sqrt(x) * 0.8), EM.M.linspace(0, -0.45, 200), { color: '--c1', width: 1.2, dash: [4, 3] });
      /* distribuciones de portadores normalizadas a su máximo (la magnitud está en las lecturas) */
      const Ec = EM.M.linspace(Eg, Eg + 0.45, 300), Evv = EM.M.linspace(-0.45, 0, 300);
      const dn = Ec.map((E) => gs(E) / (1 + Math.exp((E - p.EF) / kT))), dp = Evv.map((E) => gs(E) / (1 + Math.exp((p.EF - E) / kT)));
      const mn = Math.max(...dn) || 1, mp = Math.max(...dp) || 1;
      pl.xy(dn.map((v) => (0.9 * v) / mn), Ec, { color: '--c2', width: 2.4 });
      pl.xy(dp.map((v) => (0.9 * v) / mp), Evv, { color: '--c1', width: 2.4 });
      pl.label(0.5, Eg + 0.3, 'electrones', { size: 11, color: '--c2' });
      pl.label(0.5, -0.3, 'huecos', { size: 11, color: '--c1' });
      pl.hline(Eg, { color: '--ink-3', label: 'E_c', dash: [] });
      pl.hline(0, { color: '--ink-3', label: 'E_v', dash: [] });
      pl.hline(p.EF, { color: '--accent', label: 'E_F', dash: [6, 3], labelRight: true });
      /* f(E) */
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 1e-25, xmax: 1, xlog: true, ymin: -0.45, ymax: Eg + 0.45, xlabel: 'f(E) para electrones (escala log.)', ylabel: '', ml: 30 });
      p2.frame();
      const Es = EM.M.linspace(-0.45, Eg + 0.45, 400);
      p2.xy(Es.map((E) => 1 / (1 + Math.exp((E - p.EF) / kT))), Es, { color: '--c5', width: 2.2 });
      p2.hline(Eg, { color: '--ink-3', dash: [] }); p2.hline(0, { color: '--ink-3', dash: [] });
      sim.set('n', EM.sci(n, 3) + ' cm⁻³');
      sim.set('p', EM.sci(pp, 3) + ' cm⁻³');
      sim.set('np', EM.fix((n * pp) / (ni * ni), 4) + (Math.abs((n * pp) / (ni * ni) - 1) > 0.02 ? ' (degenerado: no vale la ley simple)' : ''));
      sim.set('bz', EM.sci(Nc * Math.exp((p.EF - Eg) / kT), 3) + ' cm⁻³');
    });
  });

  /* 18.3 n_i frente a T */
  EM.defineSim('ni-T', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    const mats = ['InSb', 'Ge', 'Si', 'GaAs', 'SiC', 'GaN'];
    sim.select('m', { label: 'Material para el ajuste', options: mats.map((m) => [m, m]), value: 'Si' });
    sim.slider('T', { label: 'Temperatura de lectura', min: 150, max: 800, step: 5, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('ni', 'n_i a T', { hl: true });
    sim.out('eg', 'Brecha de la pendiente (300–500 K)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1, xmax: 7, ymin: 1e-15, ymax: 1e20, ylog: true, xlabel: '1000/T (K⁻¹)', ylabel: 'n_i (cm⁻³)' });
      pl.frame();
      const cols = ['--c5', '--c3', '--c1', '--c2', '--c4', '--c6'];
      mats.forEach((m, i) => { pl.fn((x) => SS.ni(m, 1000 / x), { color: cols[i], width: m === p.m ? 2.8 : 1.5 }); });
      pl.vline(1000 / p.T, { color: '--accent' });
      pl.legend(mats.map((m, i) => ({ label: m, color: cols[i] })), 'tr');
      const T1 = 300, T2 = 500, s = Math.log(SS.ni(p.m, T2) * Math.pow(T1 / T2, 1.5) / SS.ni(p.m, T1)) / (1 / T1 - 1 / T2);
      sim.set('ni', EM.sci(SS.ni(p.m, p.T), 3) + ' cm⁻³');
      sim.set('eg', EM.fix(2 * SS.kBeV * s, 3) + ' eV (extrapolada a 0 K, incluye la caída de Varshni)');
    });
  });

  /* 18.4 Varshni y conductividad */
  EM.defineSim('varshni', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Material', options: ['Si', 'Ge', 'GaAs', 'InP', 'GaN'].map((m) => [m, m]), value: 'Si' });
    sim.slider('T', { label: 'Temperatura', min: 4, max: 700, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('eg', 'E_g(T)', { hl: true });
    sim.out('de', 'dE_g/dT');
    sim.out('s', 'Conductividad intrínseca');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, d = DATA.semi[p.m];
      EM.draw.clear(cv);
      const wl = W * 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: 0, xmax: 700, ymin: d.v[0] - 0.4, ymax: d.v[0] + 0.03, xlabel: 'T (K)', ylabel: 'E_g (eV)' });
      pl.frame();
      pl.fn((T) => SS.varshni(p.m, T), { color: '--c1', width: 2.4 });
      pl.dot(p.T, SS.varshni(p.m, p.T), { color: '--accent', r: 5 });
      const sig = (T) => SS.e * SS.ni(p.m, T) * (d.mun * Math.pow(T / 300, -1.5) + d.mup * Math.pow(T / 300, -1.5));
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 150, xmax: 700, ymin: 1e-14, ymax: 1e4, ylog: true, xlabel: 'T (K)', ylabel: 'σ intrínseca (S/cm)' });
      p2.frame();
      p2.fn(sig, { color: '--c2', width: 2.4 });
      p2.vline(p.T, { color: '--accent' });
      const h = 0.5;
      sim.set('eg', EM.fix(SS.varshni(p.m, p.T), 4) + ' eV (a 0 K: ' + d.v[0] + ')');
      sim.set('de', EM.fix(((SS.varshni(p.m, p.T + h) - SS.varshni(p.m, p.T - h)) / (2 * h)) * 1000, 3) + ' meV/K');
      sim.set('s', EM.sci(sig(Math.max(150, p.T)), 3) + ' S/cm');
    });
  });
})();
