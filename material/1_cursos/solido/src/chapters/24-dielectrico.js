/* Capítulo 24 — Propiedades dieléctricas */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, DATA = EM.data;

  /* 24.1 Contribuciones a ε(ω) */
  EM.defineSim('polarizabilidad', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('dd', { label: 'Contribución de orientación Δε_{or}', min: 0, max: 80, step: 0.5, value: 40, fmt: (v) => v.toFixed(1) });
    sim.slider('di', { label: 'Contribución iónica Δε_{ion}', min: 0, max: 10, step: 0.1, value: 3, fmt: (v) => v.toFixed(1) });
    sim.slider('de', { label: 'Contribución electrónica Δε_{el}', min: 0, max: 5, step: 0.05, value: 1.3, fmt: (v) => v.toFixed(2) });
    sim.out('e0', 'ε estática', { hl: true });
    sim.out('eopt', 'ε en el visible (n²)');
    const tauD = 1e-11, wI = 2 * Math.PI * 1e13, wE = 2 * Math.PI * 2e15;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const eps = (f) => {
        const w = 2 * Math.PI * f;
        const deb = { re: p.dd / (1 + w * w * tauD * tauD), im: (p.dd * w * tauD) / (1 + w * w * tauD * tauD) };
        const li = SS.lorentzEps(w, wI, 1 + p.di, 1, 0.05 * wI), le = SS.lorentzEps(w, wE, 1 + p.de, 1, 0.08 * wE);
        return { re: 1 + deb.re + (li.re - 1) + (le.re - 1), im: deb.im + li.im + le.im };
      };
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 1e6, xmax: 1e17, xlog: true, ymin: -10, ymax: Math.max(15, 1.2 * (1 + p.dd + p.di + p.de)), xlabel: 'frecuencia (Hz)', ylabel: 'ε' });
      pl.frame();
      for (const [f0, f1, lab] of [[1e6, 3e11, 'radio y microondas'], [3e11, 4e14, 'infrarrojo'], [4e14, 7.5e14, 'visible'], [7.5e14, 1e17, 'ultravioleta']]) { pl.label(Math.sqrt(f0 * f1), pl.o.ymax * 0.95, lab, { size: 10.5, color: '--ink-3', align: 'center' }); pl.vline(f1, { color: '--grid-2', dash: [2, 3] }); }
      pl.fn((f) => eps(f).re, { color: '--c1', width: 2.4, n: 1200 });
      pl.fn((f) => eps(f).im, { color: '--c2', width: 2, n: 1200 });
      pl.legend([{ label: "ε′ (real)", color: '--c1' }, { label: "ε″ (absorción)", color: '--c2' }], 'tr');
      sim.set('e0', EM.fix(eps(1e6).re, 2));
      sim.set('eopt', EM.fix(eps(5.5e14).re, 3) + ' (n = ' + EM.fix(Math.sqrt(eps(5.5e14).re), 3) + ')');
    });
  });

  /* 24.2 Reststrahlen */
  EM.defineSim('reststrahlen', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Cristal', options: Object.keys(DATA.lst).map((k) => [k, k]), value: 'NaCl' });
    sim.slider('g', { label: 'Amortiguamiento γ/ω_T', min: 0.001, max: 0.2, step: 0.001, log: true, value: 0.02, fmt: (v) => v.toFixed(3) });
    sim.out('wl', 'ω_L por LST', { hl: true });
    sim.out('band', 'Banda de reststrahlen');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [wT, wL, e0, ei] = DATA.lst[p.m];
      EM.draw.clear(cv);
      const R = (w) => SS.reflect(SS.lorentzEps(w, wT, e0, ei, p.g * wT));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: wL * 1.8, ymin: 0, ymax: 1.05, xlabel: 'número de onda (cm⁻¹)', ylabel: 'reflectividad' });
      pl.frame();
      pl.band(wT, SS.lstWL(wT, e0, ei), { color: '--accent', alpha: 0.1 });
      pl.fn(R, { color: '--c1', width: 2.6, n: 1500 });
      pl.vline(wT, { color: '--c2', label: 'ω_T' });
      pl.vline(wL, { color: '--c3', label: 'ω_L medido', labelY: 30 });
      const wLs = SS.lstWL(wT, e0, ei);
      sim.set('wl', EM.fix(wLs, 1) + ' cm⁻¹ (medido ' + wL + ')');
      sim.set('band', EM.fix(1e4 / wLs, 1) + '–' + EM.fix(1e4 / wT, 1) + ' µm');
    });
  });

  /* 24.3 Polaritones */
  EM.defineSim('polariton', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.select('m', { label: 'Cristal', options: Object.keys(DATA.lst).map((k) => [k, k]), value: 'GaP' });
    sim.out('br', 'Ramas en k → 0', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [wT, , e0, ei] = DATA.lst[p.m];
      EM.draw.clear(cv);
      const wL = SS.lstWL(wT, e0, ei);
      const kmax = 3 * wT * Math.sqrt(e0); /* ck en cm⁻¹ */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: kmax, ymin: 0, ymax: 1.8 * wT, xlabel: 'ck (cm⁻¹)', ylabel: 'ω (cm⁻¹)' });
      pl.frame();
      ctx.save(); ctx.fillStyle = EM.alpha('--accent', 0.1); ctx.fillRect(pl.ix, pl.Y(wL), pl.iw, pl.Y(wT) - pl.Y(wL)); ctx.restore();
      pl.fn((ck) => ck / Math.sqrt(e0), { color: '--ink-3', width: 1.2, dash: [5, 4] });
      pl.fn((ck) => ck / Math.sqrt(ei), { color: '--ink-3', width: 1.2, dash: [2, 3] });
      pl.fn((ck) => SS.polariton(ck, wT, e0, ei)[0], { color: '--c1', width: 2.6 });
      pl.fn((ck) => SS.polariton(ck, wT, e0, ei)[1], { color: '--c2', width: 2.6 });
      pl.hline(wT, { color: '--c1', label: 'ω_T', dash: [4, 4] });
      pl.hline(wL, { color: '--c2', label: 'ω_L', dash: [4, 4] });
      sim.set('br', 'inferior: luz con c/√ε(0); superior: arranca en ω_L = ' + EM.fix(wL, 1) + ' cm⁻¹');
    });
  });

  /* 24.4 Kramers–Kronig */
  EM.defineSim('kramers-kronig', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('g', { label: 'Amortiguamiento γ/ω₀', min: 0.02, max: 0.6, step: 0.01, value: 0.1, fmt: (v) => v.toFixed(2) });
    sim.slider('n', { label: 'Puntos de la cuadratura', min: 200, max: 20000, step: 100, log: true, value: 4000, fmt: (v) => v.toFixed(0) });
    sim.out('err', 'Error máximo |ε₁ numérico − exacto|', { hl: true });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const e = (w) => SS.lorentzEps(w, 1, 5, 2, p.g);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 3, ymin: -6, ymax: 12, xlabel: 'ω/ω₀', ylabel: 'ε' });
      pl.frame();
      pl.fn((w) => e(w).im, { color: '--c2', width: 2, n: 600 });
      pl.fn((w) => e(w).re, { color: '--ink-3', width: 4, alpha: 0.4, n: 600 });
      let err = 0;
      const xs = [], ys = [];
      for (let i = 1; i <= 90; i++) { const w = (3 * i) / 91, v = SS.kkRe(w, (x) => e(x).im, 80, Math.round(p.n), 2); xs.push(w); ys.push(v); err = Math.max(err, Math.abs(v - e(w).re)); }
      pl.xy(xs, ys, { color: '--c1', width: 1.8, dash: [5, 3] });
      for (let i = 0; i < xs.length; i += 6) pl.dot(xs[i], ys[i], { color: '--c1', r: 3 });
      pl.legend([{ label: 'ε₂ (dato)', color: '--c2' }, { label: 'ε₁ exacto', color: '--ink-3' }, { label: 'ε₁ por Kramers–Kronig', color: '--c1', dash: [5, 3] }], 'tr');
      sim.set('err', EM.sci(err, 3) + ' (la cola por encima de 80ω₀ se trunca)');
    });
  });

  /* 24.5 Landau */
  EM.defineSim('landau-ferro', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.slider('T', { label: 'Temperatura T − T₀', min: -2, max: 1.5, step: 0.01, value: -1, fmt: (v) => v.toFixed(2) });
    sim.slider('b', { label: 'Coeficiente b', min: -1, max: 1, step: 0.01, value: 1, fmt: (v) => v.toFixed(2) });
    sim.out('P', 'Polarización de equilibrio', { hl: true });
    sim.out('o', 'Orden de la transición');
    const a = 1, c = 1;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, T = p.T;
      EM.draw.clear(cv);
      const F = (P, E = 0) => 0.5 * a * T * P * P + 0.25 * p.b * Math.pow(P, 4) + (c / 6) * Math.pow(P, 6) - E * P;
      const w3 = W / 3;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: w3, h: H, xmin: -1.8, xmax: 1.8, ymin: -0.6, ymax: 0.8, xlabel: 'P', ylabel: 'F − F₀' });
      pl.frame();
      pl.fn((P) => F(P), { color: '--c1', width: 2.4 });
      const Ps = SS.landauP(T, 0, a, p.b, c);
      pl.dot(Ps, F(Ps), { color: '--accent', r: 5 }); pl.dot(-Ps, F(-Ps), { color: '--accent', r: 5 });
      const p2 = new EM.Plot(ctx, { x: w3, y: 0, w: w3, h: H, xmin: -2, xmax: 1.5, ymin: 0, ymax: 1.6, xlabel: 'T − T₀', ylabel: 'P_s' });
      p2.frame();
      p2.fn((t) => SS.landauP(t, 0, a, p.b, c), { color: '--c2', width: 2.4, n: 500 });
      p2.vline(T, { color: '--accent' });
      /* histéresis: seguir el mínimo local */
      const relax = (P, E) => { for (let i = 0; i < 400; i++) { const g = a * T * P + p.b * Math.pow(P, 3) + c * Math.pow(P, 5) - E; P -= 0.05 * g; } return P; };
      const loop = [];
      let P = 1.5;
      for (let i = 0; i <= 200; i++) { const E = 1 - i / 100; P = relax(P, E); loop.push([E, P]); }
      for (let i = 0; i <= 200; i++) { const E = -1 + i / 100; P = relax(P, E); loop.push([E, P]); }
      const p3 = new EM.Plot(ctx, { x: 2 * w3, y: 0, w: w3, h: H, xmin: -1, xmax: 1, ymin: -1.8, ymax: 1.8, xlabel: 'campo E', ylabel: 'P' });
      p3.frame();
      p3.xy(loop.map((q) => q[0]), loop.map((q) => q[1]), { color: '--c3', width: 2.2 });
      sim.set('P', EM.fix(Ps, 4));
      sim.set('o', p.b >= 0 ? 'segundo orden (continua)' : 'primer orden (salto de P_s)');
    });
  });
})();
