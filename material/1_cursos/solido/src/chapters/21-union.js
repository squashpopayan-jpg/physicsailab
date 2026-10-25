/* Capítulo 21 — La unión p–n */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss;

  /* 21.2 Poisson–Boltzmann frente a agotamiento */
  EM.defineSim('union-poisson', function (sim) {
    const cv = sim.canvas({ aspect: 1.45 });
    sim.slider('Na', { label: 'Aceptores N_a (lado p)', min: 1e14, max: 1e19, step: 1e14, log: true, value: 1e16, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 2) });
    sim.slider('Nd', { label: 'Donadores N_d (lado n)', min: 1e14, max: 1e19, step: 1e14, log: true, value: 1e16, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 2) });
    sim.slider('V', { label: 'Polarización V', min: -5, max: 0.6, step: 0.01, value: 0, unit: 'V', fmt: (v) => v.toFixed(2) });
    sim.out('vbi', 'V_{bi}', { hl: true });
    sim.out('W', 'Ancho de agotamiento W');
    sim.out('E', 'Campo máximo: numérico / agotamiento');
    let key = '', r = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, T = 300;
      EM.draw.clear(cv);
      const ni = SS.ni('Si', T), q = SS.e, Eg = SS.varshni('Si', T);
      const k = [p.Na, p.Nd, p.V].join('|');
      if (k !== key) { key = k; r = SS.pnPoisson(p.Na, p.Nd, ni, T, 11.7, p.V, { N: 1201 }); }
      const d = r.dep;
      const xr = Math.max(1.6 * d.W, 0.05e-4) * 1e4; /* µm */
      const X = r.x.map((x) => x * 1e4);
      const sel = (arr) => arr.map((v, i) => (Math.abs(X[i]) <= xr ? v : NaN));
      const hw = W / 2, hh = H / 2;
      /* bandas */
      const p1 = new EM.Plot(ctx, { x: 0, y: 0, w: hw, h: hh, xmin: -xr, xmax: xr, ymin: Math.min(...r.psi) * -1 - Eg, ymax: -Math.min(...r.psi.map((v) => -v)) + Eg, ylabel: 'E (eV)', mb: 30, title: 'bandas' });
      const yl = [Math.min(...r.psi.map((v) => -v - Eg / 2)) - 0.1, Math.max(...r.psi.map((v) => -v + Eg / 2)) + 0.1];
      p1.set({ ymin: yl[0], ymax: yl[1] });
      p1.frame();
      p1.xy(X, sel(r.psi.map((v) => -v + Eg / 2)), { color: '--ink', width: 2 });
      p1.xy(X, sel(r.psi.map((v) => -v - Eg / 2)), { color: '--ink', width: 2 });
      p1.xy(X, sel(r.psi.map((v) => -v)), { color: '--ink-3', width: 1, dash: [3, 3] });
      p1.hline(0, { color: '--c2', label: 'E_{Fn}', dash: [6, 3] });
      if (Math.abs(p.V) > 1e-3) p1.hline(-p.V, { color: '--c1', label: 'E_{Fp}', dash: [6, 3], labelRight: true });
      /* carga */
      const rho = r.rho.map((v) => v / q);
      const rmax = Math.max(p.Na, p.Nd) * 1.15;
      const p2 = new EM.Plot(ctx, { x: hw, y: 0, w: hw, h: hh, xmin: -xr, xmax: xr, ymin: -rmax, ymax: rmax, ylabel: 'ρ/e (cm⁻³)', mb: 30, title: 'densidad de carga', yfmt: (v) => EM.sci(v, 1) });
      p2.frame();
      p2.xy(X, sel(rho), { color: '--c5', width: 2, fill: '--c5', fillAlpha: 0.15 });
      p2.xy([-xr, -d.xp * 1e4, -d.xp * 1e4, 0, 0, d.xn * 1e4, d.xn * 1e4, xr], [0, 0, -p.Na, -p.Na, p.Nd, p.Nd, 0, 0], { color: '--ink-3', width: 1.2, dash: [5, 4] });
      /* campo */
      const Emx = Math.max(...r.E.map(Math.abs), d.Emax) * 1.1;
      const p3 = new EM.Plot(ctx, { x: 0, y: hh, w: hw, h: hh, xmin: -xr, xmax: xr, ymin: -Emx / 1e3, ymax: Emx * 0.05 / 1e3, xlabel: 'x (µm)', ylabel: 'E (kV/cm)', title: 'campo eléctrico' });
      p3.frame();
      p3.xy(X, sel(r.E.map((v) => v / 1e3)), { color: '--c1', width: 2.2 });
      p3.xy([-xr, -d.xp * 1e4, 0, d.xn * 1e4, xr], [0, 0, -d.Emax / 1e3, 0, 0], { color: '--ink-3', width: 1.2, dash: [5, 4] });
      /* portadores */
      const p4 = new EM.Plot(ctx, { x: hw, y: hh, w: hw, h: hh, xmin: -xr, xmax: xr, ymin: 1, ymax: 1e20, ylog: true, xlabel: 'x (µm)', ylabel: 'n, p (cm⁻³)', title: 'portadores' });
      p4.frame();
      p4.xy(X, sel(r.n), { color: '--c2', width: 2 });
      p4.xy(X, sel(r.p), { color: '--c1', width: 2 });
      p4.legend([{ label: 'n', color: '--c2' }, { label: 'p', color: '--c1' }], 'tr');
      const i0 = r.x.findIndex((x) => x >= 0);
      sim.set('vbi', EM.fix(d.Vbi, 4) + ' V');
      sim.set('W', EM.fix(d.W * 1e4, 4) + ' µm (x_n = ' + EM.fix(d.xn * 1e4, 4) + ', x_p = ' + EM.fix(d.xp * 1e4, 4) + ')');
      sim.set('E', EM.fix(Math.abs(r.E[i0]) / 1e3, 2) + ' / ' + EM.fix(d.Emax / 1e3, 2) + ' kV/cm');
    });
  });

  /* 21.3 Capacitancia */
  EM.defineSim('cv', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Nd', { label: 'Dopaje del lado n (unión p⁺–n)', min: 1e14, max: 1e18, step: 1e14, log: true, value: 1e16, unit: 'cm⁻³', fmt: (v) => EM.sci(v, 2) });
    sim.out('C0', 'C(0)', { hl: true });
    sim.out('fit', 'Dopaje y V_{bi} de la recta de Mott–Schottky');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const ni = SS.ni('Si', 300), Na = 1e19, eps = 11.7 * SS.eps0 * 1e-2;
      const C = (V) => SS.pnDepletion(Na, p.Nd, ni, 300, 11.7, V).C * 1e9; /* nF/cm² */
      const wl = W * 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: -10, xmax: 0.5, ymin: 0, ymax: C(0.5) * 1.1, xlabel: 'V (V)', ylabel: 'C (nF/cm²)' });
      pl.frame();
      pl.fn(C, { color: '--c1', width: 2.4, to: 0.6 });
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: -10, xmax: 1.5, ymin: 0, ymax: 1 / Math.pow(C(-10), 2) * 1.1, xlabel: 'V (V)', ylabel: '1/C² (cm⁴/nF²)' });
      p2.frame();
      p2.fn((V) => 1 / Math.pow(C(V), 2), { color: '--c2', width: 2.4, to: 0.6 });
      /* ajuste por dos puntos */
      const V1 = -8, V2 = -1, y1 = 1 / Math.pow(C(V1) * 1e-9, 2), y2 = 1 / Math.pow(C(V2) * 1e-9, 2), s = (y2 - y1) / (V2 - V1);
      const Vint = V2 - y2 / s;
      p2.fn((V) => ((y2 + s * (V - V2)) * 1e-18), { color: '--ink-3', width: 1.2, dash: [5, 4] });
      const Nfit = 2 / (SS.e * eps * Math.abs(s));
      sim.set('C0', EM.fix(C(0), 2) + ' nF/cm²');
      sim.set('fit', 'N_d = ' + EM.sci(Nfit, 3) + ' cm⁻³, V_{bi} = ' + EM.fix(Vint, 3) + ' V');
    });
  });

  /* 21.4 Diodo */
  EM.defineSim('diodo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura', min: 250, max: 400, step: 1, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('tau', { label: 'Tiempo de vida', min: 0.01, max: 100, step: 0.01, log: true, value: 1, unit: 'µs', fmt: (v) => EM.sci(v, 2) });
    sim.slider('Rs', { label: 'Resistencia en serie (por cm²)', min: 0, max: 2, step: 0.01, value: 0.3, unit: 'Ω·cm²', fmt: (v) => v.toFixed(2) });
    sim.slider('VB', { label: 'Tensión de ruptura', min: 5, max: 60, step: 1, value: 20, unit: 'V', fmt: (v) => v.toFixed(0) });
    sim.out('J0', 'J₀ (difusión)', { hl: true });
    sim.out('Jgr', 'J₀ de recombinación');
    sim.out('V1', 'Tensión a 1 A/cm²');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, T = p.T;
      EM.draw.clear(cv);
      const ni = SS.ni('Si', T), vt = SS.Vt(T), N = 1e16, tau = p.tau * 1e-6;
      const Dn = SS.einsteinD(SS.mobility(N, 'n'), T), Dp = SS.einsteinD(SS.mobility(N, 'p'), T);
      const J0 = SS.shockleyJ0(ni, N, N, Dn, Dp, Math.sqrt(Dn * tau), Math.sqrt(Dp * tau));
      const Wd = SS.pnDepletion(N, N, ni, T, 11.7, 0).W, Jgr = (SS.e * ni * Wd) / (2 * tau);
      const Jint = (V) => J0 * Math.expm1(V / vt) + Jgr * Math.expm1(V / (2 * vt));
      /* curva paramétrica en la tensión interna */
      const pts = [];
      for (let i = 0; i <= 900; i++) {
        const V = -p.VB * 0.999 + ((0.9 + p.VB * 0.999) * i) / 900;
        let J = Jint(V);
        if (V < 0) J = J / (1 - Math.pow(-V / p.VB, 4));
        pts.push([V + J * p.Rs, J]);
      }
      /* ruptura: la tensión se fija en −V_B y la corriente inversa crece (solo con resistencia en serie) */
      const brk = [];
      for (let i = 0; i <= 60; i++) { const J = -Math.pow(10, -8 + (8 * i) / 60); brk.push([-p.VB + J * Math.max(p.Rs, 0.05), J]); }
      pts.unshift(...brk.reverse());
      const wl = W * 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: wl, h: H, xmin: -p.VB * 1.05, xmax: 1, ymin: -1, ymax: 3, xlabel: 'V (V)', ylabel: 'J (A/cm²)' });
      pl.frame();
      pl.xy(pts.map((q) => q[0]), pts.map((q) => q[1]), { color: '--c1', width: 2.4 });
      const fw = pts.filter((q) => q[1] > 0);
      const p2 = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: 1, ymin: 1e-12, ymax: 1e2, ylog: true, xlabel: 'V (V)', ylabel: 'J (A/cm²)' });
      p2.frame();
      p2.xy(fw.map((q) => q[0]), fw.map((q) => q[1]), { color: '--c1', width: 2.4 });
      p2.fn((V) => J0 * Math.expm1(V / vt), { color: '--c2', width: 1.2, dash: [5, 4] });
      p2.fn((V) => Jgr * Math.expm1(V / (2 * vt)), { color: '--c3', width: 1.2, dash: [5, 4] });
      p2.legend([{ label: 'total', color: '--c1' }, { label: 'difusión (n = 1)', color: '--c2', dash: [5, 4] }, { label: 'recombinación (n = 2)', color: '--c3', dash: [5, 4] }], 'br');
      const V1 = fw.find((q) => q[1] >= 1);
      sim.set('J0', EM.sci(J0, 3) + ' A/cm²');
      sim.set('Jgr', EM.sci(Jgr, 3) + ' A/cm²');
      sim.set('V1', V1 ? EM.fix(V1[0], 3) + ' V' : '> 1 V');
    });
  });
})();
